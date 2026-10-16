import { useEffect, useState } from "react";
import { Navigate, Route, Routes, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Orders from "./pages/Orders.jsx";
import Customers from "./pages/Customers.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import { starterMovements, starterOrders, starterProducts, timeString, todayString } from "./data.js";

function load(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Could not load ${key} from browser storage.`, error);
    return fallback;
  }
}

function AppLayout({ productCount, notify, toastMessage, children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const page = location.pathname.split("/")[1] || "dashboard";
  useEffect(() => {
    document.title = `${page[0].toUpperCase() + page.slice(1)} — Stockwise`;
  }, [page]);
  const links = [
    ["dashboard", "/", "◫", "Dashboard"],
    ["products", "/products", "▦", "Products"],
    ["inventory", "/inventory", "↗", "Inventory"],
    ["orders", "/orders", "▤", "Orders"],
    ["customers", "/customers", "♙", "Customers"],
    ["reports", "/reports", "▥", "Reports"],
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`} id="sidebar">
        <NavLink className="brand" to="/" aria-label="Stockwise home"><span className="brand-mark"><span /><span /><span /><span /></span><span>stockwise</span></NavLink>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map(([key, path, icon, label]) => <NavLink key={key} to={path} end={key === "dashboard"} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-icon">{icon}</span>{label}{key === "products" && <span className="nav-count">{productCount}</span>}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/settings"><span className="nav-icon">⚙</span>Settings</NavLink>
          <div className="help-card"><div className="help-icon">✦</div><strong>Need a hand?</strong><p>Our team is here to help you out.</p><button onClick={() => notify("Help center is coming soon.")}>Visit help center <span>↗</span></button></div>
          <div className="profile"><div className="avatar">JD</div><div className="profile-copy"><strong>Jamie Diaz</strong><span>Store owner</span></div><button className="profile-more" aria-label="Profile options">···</button></div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{page[0].toUpperCase() + page.slice(1)}</strong></div><div className="topbar-actions"><div className="date-chip"><span>◷</span><span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span className="chevron">⌄</span></div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You’re all caught up.")}>♧<i /></button><div className="top-avatar">JD</div></div></header>
        <div className="content">{children}</div>
      </main>
      {toastMessage && <div className="toast-region"><div className="toast">{toastMessage}</div></div>}
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState(() => load("stockwise-products", starterProducts));
  const [orders, setOrders] = useState(() => load("stockwise-orders", starterOrders));
  const [movements, setMovements] = useState(() => load("stockwise-movements", starterMovements));
  const [toastMessage, setToastMessage] = useState("");
  const toast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3000);
  };

  useEffect(() => {
    try {
      localStorage.setItem("stockwise-products", JSON.stringify(products));
      localStorage.setItem("stockwise-orders", JSON.stringify(orders));
      localStorage.setItem("stockwise-movements", JSON.stringify(movements));
    } catch (error) {
      console.error("Could not persist demo data in browser storage.", error);
      toast("Changes could not be saved in this browser.");
    }
  }, [products, orders, movements]);

  function saveProduct(product) {
    const duplicate = products.some((item) => item.sku.toLowerCase() === product.sku.toLowerCase() && item.id !== product.id);
    if (duplicate) return "That SKU is already in use.";
    if (product.id) {
      const previous = products.find((item) => item.id === product.id);
      if (previous && Number(previous.stock) !== Number(product.stock)) {
        const delta = Number(product.stock) - Number(previous.stock);
        setMovements((items) => [{ id: crypto.randomUUID(), productId: product.id, quantity: delta, reason: "Product details updated", user: "Jamie Diaz", date: `${todayString()} · ${timeString()}` }, ...items]);
      }
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, ...product } : item));
    } else {
      setProducts((items) => [{ ...product, id: crypto.randomUUID(), icon: "📦" }, ...items]);
    }
    return "";
  }

  function deleteProduct(id) {
    const reserved = orders.some((order) => order.status === "Confirmed" && order.stockDeducted && (order.lineItems || []).some((item) => item.productId === id));
    if (reserved) return "This product is linked to a confirmed order. Cancel or ship that order before deleting it.";
    setProducts((items) => items.filter((item) => item.id !== id));
    return "";
  }

  function adjustStock({ productId, quantity, reason, type }) {
    const product = products.find((item) => item.id === productId);
    const delta = type === "in" ? quantity : -quantity;
    if (!product || !Number.isInteger(quantity) || quantity < 1) return "Enter a valid quantity.";
    if (product.stock + delta < 0) return `Only ${product.stock} units are available. Stock cannot go below zero.`;
    setProducts((items) => items.map((item) => item.id === productId ? { ...item, stock: item.stock + delta } : item));
    setMovements((items) => [{ id: crypto.randomUUID(), productId, quantity: delta, reason, user: "Jamie Diaz", date: `${todayString()} · ${timeString()}` }, ...items]);
    return "";
  }

  function createOrder({ customer, contact, lines }) {
    const quantities = new Map();
    lines.forEach((line) => quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity));
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const lineItems = lines.map((line) => {
      const product = products.find((item) => item.id === line.productId);
      return { productId: product.id, quantity: line.quantity, price: Number(product.price) };
    });
    const order = {
      id: orderId,
      customer,
      initials: customer.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      contact,
      date: todayString(),
      amount: lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: "Pending",
      items: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      lineItems,
      stockDeducted: false,
    };
    setOrders((items) => [order, ...items]);
    return "";
  }

  function changeOrderStatus(orderId, status) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return "Order not found.";
    const lines = order.lineItems || [];
    if (status === "Confirmed" && order.status === "Pending" && lines.length) {
      for (const line of lines) {
        const product = products.find((item) => item.id === line.productId);
        const totalForProduct = lines.filter((item) => item.productId === line.productId).reduce((sum, item) => sum + item.quantity, 0);
        if (!product || product.stock < totalForProduct) return `Not enough stock to confirm. ${product?.name || "Product"} has ${product?.stock || 0} available.`;
      }
      const totals = new Map();
      lines.forEach((line) => totals.set(line.productId, (totals.get(line.productId) || 0) + line.quantity));
      setProducts((items) => items.map((product) => totals.has(product.id) ? { ...product, stock: product.stock - totals.get(product.id) } : product));
      setMovements((items) => [...totals].map(([productId, quantity]) => ({ id: crypto.randomUUID(), productId, quantity: -quantity, reason: `Order ${orderId}`, user: "Jamie Diaz", date: `${todayString()} · ${timeString()}` })).concat(items));
    }
    if (status === "Cancelled" && order.status === "Confirmed" && order.stockDeducted && lines.length) {
      const totals = new Map();
      lines.forEach((line) => totals.set(line.productId, (totals.get(line.productId) || 0) + line.quantity));
      setProducts((items) => items.map((product) => totals.has(product.id) ? { ...product, stock: product.stock + totals.get(product.id) } : product));
      setMovements((items) => [...totals].map(([productId, quantity]) => ({ id: crypto.randomUUID(), productId, quantity, reason: `Cancellation of ${orderId}`, user: "Jamie Diaz", date: `${todayString()} · ${timeString()}` })).concat(items));
    }
    setOrders((items) => items.map((item) => item.id === orderId ? { ...item, status, stockDeducted: status === "Confirmed" && (item.stockDeducted || lines.length > 0) } : item));
    return "";
  }

  const pageData = { products, orders, movements, toast, saveProduct, deleteProduct, adjustStock, createOrder, changeOrderStatus };
  return (
    <AppLayout productCount={products.length} notify={toast} toastMessage={toastMessage}>
      <Routes>
        <Route path="/" element={<Dashboard {...pageData} />} />
        <Route path="/products" element={<Products {...pageData} />} />
        <Route path="/inventory" element={<Inventory {...pageData} />} />
        <Route path="/orders" element={<Orders {...pageData} />} />
        <Route path="/customers" element={<Customers {...pageData} />} />
        <Route path="/reports" element={<Reports {...pageData} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
