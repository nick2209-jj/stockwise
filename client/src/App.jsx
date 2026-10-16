import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Orders from "./pages/Orders.jsx";
import Customers from "./pages/Customers.jsx";
import Settings from "./pages/Settings.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import CustomerProducts from "./pages/CustomerProducts.jsx";
import Cart from "./pages/Cart.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import api, { apiError, normalizeMovement, normalizeOrder, normalizeProduct } from "./api.js";

const Reports = lazy(() => import("./pages/Reports.jsx"));

function AppLayout({ user, notify, toastMessage, productCount, children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const admin = user?.role === "Admin";
  const section = location.pathname.split("/").filter(Boolean).at(-1) || "dashboard";
  const title = section.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  useEffect(() => { document.title = `${title} — Stockwise`; }, [title]);
  const links = admin
    ? [["Dashboard", "/admin/dashboard", "◫"], ["Products", "/admin/products", "▦"], ["Inventory", "/admin/inventory", "↗"], ["Orders", "/admin/orders", "▤"]]
    : [["Products", "/products", "▦"], ["Cart", "/cart", "▤"], ["My orders", "/my-orders", "↗"]];
  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <NavLink className="brand" to={admin ? "/admin/dashboard" : "/products"} aria-label="Stockwise home"><span className="brand-mark"><span /><span /><span /><span /></span><span>stockwise</span></NavLink>
      <div className="workspace-label">{admin ? "ADMIN WORKSPACE" : "SHOP"}</div>
      <nav className="main-nav" aria-label="Main navigation">{links.map(([label, path, icon]) => <NavLink key={path} to={path} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-icon">{icon}</span>{label}{label === "Products" && admin && <span className="nav-count">{productCount}</span>}</NavLink>)}
        {admin && <><NavLink to="/admin/customers" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-icon">♙</span>Customers</NavLink><NavLink to="/admin/reports" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span className="nav-icon">▥</span>Reports</NavLink></>}
      </nav>
      <div className="sidebar-bottom">
        {admin && <NavLink className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} to="/admin/settings"><span className="nav-icon">⚙</span>Settings</NavLink>}
        <div className="help-card"><div className="help-icon">✦</div><strong>Need a hand?</strong><p>Our team is here to help you out.</p><button onClick={() => notify("Help center is coming soon.")}>Visit help center <span>↗</span></button></div>
        <div className="profile"><div className="avatar">{user?.name?.slice(0, 2).toUpperCase() || "U"}</div><div className="profile-copy"><strong>{user?.name}</strong><span>{user?.role}</span></div><button className="profile-more" aria-label="Sign out" title="Sign out" onClick={() => window.dispatchEvent(new Event("ioms:logout"))}>···</button></div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{title}</strong></div><div className="topbar-actions"><div className="date-chip"><span>◷</span><span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span><span className="chevron">⌄</span></div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You’re all caught up.")}>♧<i /></button><div className="top-avatar">{user?.name?.slice(0, 2).toUpperCase() || "U"}</div><button className="signout-button" onClick={() => window.dispatchEvent(new Event("ioms:logout"))}>Sign out</button></div></header>
      <div className="content">{children}</div>
    </main>
    {toastMessage && <div className="toast-region"><div className="toast">{toastMessage}</div></div>}
  </div>;
}

function RequireAuth({ user, ready, children }) {
  const location = useLocation();
  if (!ready) return <main className="auth-shell"><p>Loading your account…</p></main>;
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function RequireAdmin({ user, children }) {
  return user?.role === "Admin" ? children : <Navigate to="/products" replace />;
}

function RequireCustomer({ user, children }) {
  return user?.role === "Customer" ? children : <Navigate to="/admin/dashboard" replace />;
}

function HomeRedirect({ user, ready }) {
  if (!ready) return <main className="auth-shell"><p>Checking your session…</p></main>;
  return <Navigate to={user?.role === "Admin" ? "/admin/dashboard" : user ? "/products" : "/login"} replace />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [cart, setCartState] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("ioms_cart") || "{}"); }
    catch (error) { console.error("Unable to read shopping cart.", error); return {}; }
  });
  const [toastMessage, setToastMessage] = useState("");
  const notify = useCallback((message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3000);
  }, []);

  const refreshProducts = useCallback(async () => {
    const { data } = await api.get("/products");
    setProducts(data.map(normalizeProduct));
  }, []);

  const refreshAccountData = useCallback(async (activeUser) => {
    const requests = [api.get("/orders/mine")];
    if (activeUser.role === "Admin") requests.push(api.get("/inventory/movements"), api.get("/settings"));
    try {
      const [orderResponse, movementResponse, settingsResponse] = await Promise.all(requests);
      setOrders(orderResponse.data.map(normalizeOrder));
      if (movementResponse) setMovements(movementResponse.data.map(normalizeMovement));
      if (settingsResponse) setLowStockThreshold(settingsResponse.data.preferences.lowStockThreshold);
    } catch (error) {
      notify(apiError(error));
    }
  }, [notify]);

  useEffect(() => {
    api.get("/products").then(({ data }) => setProducts(data.map(normalizeProduct))).catch((error) => notify(`Could not load catalog: ${apiError(error)}`));
  }, [notify]);

  useEffect(() => {
    localStorage.removeItem("ioms_token");
    const token = sessionStorage.getItem("ioms_token");
    if (!token) { setAuthReady(true); return; }
    api.get("/auth/me").then(({ data }) => {
      setUser(data.user);
      return refreshProducts().then(() => refreshAccountData(data.user));
    }).catch((error) => {
      sessionStorage.removeItem("ioms_token");
      if (error.response?.status !== 401) notify(apiError(error));
    }).finally(() => setAuthReady(true));
  }, [notify, refreshProducts, refreshAccountData]);

  useEffect(() => {
    if (user) refreshAccountData(user);
  }, [user, refreshAccountData]);

  const setCart = (nextCart) => {
    setCartState(nextCart);
    try { sessionStorage.setItem("ioms_cart", JSON.stringify(nextCart)); }
    catch (error) { console.error("Unable to save cart.", error); notify("Cart could not be saved in this browser."); }
  };

  function authenticated(data) {
    sessionStorage.setItem("ioms_token", data.token);
    setUser(data.user);
    setAuthReady(true);
  }

  const logout = useCallback(() => {
    sessionStorage.removeItem("ioms_token");
    setUser(null);
    setOrders([]);
    setMovements([]);
    window.history.replaceState(null, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
  useEffect(() => {
    window.addEventListener("ioms:logout", logout);
    return () => window.removeEventListener("ioms:logout", logout);
  }, [logout]);

  async function saveProduct(product) {
    try {
      const body = new FormData();
      body.append("name", product.name);
      body.append("sku", product.sku);
      body.append("description", product.description || "");
      body.append("category", product.category);
      body.append("price", String(Number(product.price)));
      body.append("imageUrl", product.imageUrl || "");
      if (product.imageFile) body.append("image", product.imageFile);
      if (product.id) await api.put(`/products/${product.id}`, body, { headers: { "Content-Type": "multipart/form-data" } });
      else {
        body.append("stockQuantity", String(Number(product.stock)));
        await api.post("/products", body, { headers: { "Content-Type": "multipart/form-data" } });
      }
      await refreshProducts();
      return "";
    } catch (error) { return apiError(error); }
  }

  async function deleteProduct(id) {
    try {
      await api.delete(`/products/${id}`);
      await refreshProducts();
      return "";
    } catch (error) { return apiError(error); }
  }

  async function adjustStock({ productId, quantity, reason, type }) {
    try {
      await api.post("/inventory/adjustments", { productId, quantity, reason, type: type === "in" ? "INCREASE" : "DECREASE" });
      await Promise.all([refreshProducts(), refreshAccountData(user)]);
      return "";
    } catch (error) { return apiError(error); }
  }

  async function createOrder({ customer, contact, lines, shippingAddress }) {
    try {
      await api.post("/orders", {
        customerName: customer || user.name,
        customerContact: contact || user.email,
        shippingAddress: shippingAddress || user.address || "Not provided",
        items: lines.map((line) => ({ productId: line.productId, quantity: Number(line.quantity) })),
      });
      await Promise.all([refreshProducts(), refreshAccountData(user)]);
      return "";
    } catch (error) { return apiError(error); }
  }

  async function changeOrderStatus(orderId, status) {
    try {
      if (status === "Cancelled") await api.patch(`/orders/${orderId}/status`, { status });
      else await api.patch(`/orders/${orderId}/status`, { status });
      await Promise.all([refreshProducts(), refreshAccountData(user)]);
      return "";
    } catch (error) { return apiError(error); }
  }

  async function cancelMyOrder(orderId) {
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await Promise.all([refreshProducts(), refreshAccountData(user)]);
      return "";
    } catch (error) { return apiError(error); }
  }

  const pageData = { products, orders, movements, toast: notify, saveProduct, deleteProduct, adjustStock, createOrder, changeOrderStatus, lowStockThreshold, user };
  const protectedPage = (element) => <RequireAuth user={user} ready={authReady}>{element}</RequireAuth>;
  const adminPage = (element) => protectedPage(<RequireAdmin user={user}>{element}</RequireAdmin>);

  return <Routes>
    <Route path="/login" element={<AuthPage mode="login" user={user} onAuthenticated={authenticated} />} />
    <Route path="/register" element={<AuthPage mode="register" user={user} onAuthenticated={authenticated} />} />
    <Route path="/" element={<HomeRedirect user={user} ready={authReady} />} />
    <Route path="/products" element={protectedPage(<RequireCustomer user={user}><AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><CustomerProducts products={products} addToCart={(product) => setCart({ ...cart, [product.id]: Math.min(product.stock, (cart[product.id] || 0) + 1) })} toast={notify} /></AppLayout></RequireCustomer>)} />
    <Route path="/cart" element={protectedPage(<RequireCustomer user={user}><AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Cart products={products} cart={cart} setCart={setCart} checkout={({ shippingAddress, items }) => createOrder({ shippingAddress, lines: items, customer: user?.name, contact: user?.email })} toast={notify} /></AppLayout></RequireCustomer>)} />
    <Route path="/my-orders" element={protectedPage(<RequireCustomer user={user}><AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><MyOrders orders={orders} cancelOrder={cancelMyOrder} toast={notify} /></AppLayout></RequireCustomer>)} />
    <Route path="/admin/dashboard" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Dashboard {...pageData} isAdmin /></AppLayout>)} />
    <Route path="/admin/products" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Products {...pageData} /></AppLayout>)} />
    <Route path="/admin/inventory" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Inventory {...pageData} /></AppLayout>)} />
    <Route path="/admin/orders" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Orders {...pageData} isAdmin /></AppLayout>)} />
    <Route path="/admin/customers" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Customers {...pageData} /></AppLayout>)} />
    <Route path="/admin/reports" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Suspense fallback={<div className="panel report-loading">Loading analytics…</div>}><Reports /></Suspense></AppLayout>)} />
    <Route path="/admin/settings" element={adminPage(<AppLayout user={user} notify={notify} toastMessage={toastMessage} productCount={products.length}><Settings user={user} onProfileUpdated={setUser} onPreferencesUpdated={setLowStockThreshold} /></AppLayout>)} />
    <Route path="/customers" element={<Navigate to="/admin/customers" replace />} />
    <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
    <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
