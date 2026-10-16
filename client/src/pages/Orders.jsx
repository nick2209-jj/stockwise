import { useMemo, useState } from "react";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { money } from "../data.js";

export default function Orders({ orders, products, createOrder, changeOrderStatus, toast, isAdmin = false }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customer, setCustomer] = useState("");
  const [contact, setContact] = useState("");
  const [lines, setLines] = useState([{ productId: products.find((item) => item.stock > 0)?.id || "", quantity: 1 }]);
  const [error, setError] = useState("");
  const statuses = ["Pending", "Confirmed", "Shipped", "Cancelled"];
  const counts = Object.fromEntries(statuses.map((status) => [status, orders.filter((order) => order.status === status).length]));
  const filtered = useMemo(() => orders.filter((order) => `${order.id} ${order.customer} ${order.contact}`.toLowerCase().includes(search.trim().toLowerCase()) && (!statusFilter || order.status === statusFilter)), [orders, search, statusFilter]);
  const total = lines.reduce((sum, line) => sum + Number(products.find((product) => product.id === line.productId)?.price || 0) * Number(line.quantity || 0), 0);

  async function submit(event) {
    event.preventDefault();
    const result = await createOrder({ customer: customer.trim(), contact: contact.trim(), lines: lines.map((line) => ({ ...line, quantity: Number(line.quantity) })) });
    if (result) return setError(result);
    setShowCreate(false);
    setCustomer(""); setContact("");
    setLines([{ productId: products.find((item) => item.stock > 0)?.id || "", quantity: 1 }]);
    toast("Order created.");
  }

  async function updateStatus(order, nextStatus) {
    const result = await changeOrderStatus(order.id, nextStatus);
    if (result) return toast(result);
    toast(`Order ${order.id} updated.`);
  }

  function openCreate() {
    setError("");
    setLines([{ productId: products.find((item) => item.stock > 0)?.id || "", quantity: 1 }]);
    setShowCreate(true);
  }

  function lineItems(order) {
    return order.lineItems || [];
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">SALES</div><h1>Orders</h1><p>Manage customer orders and keep fulfilment moving.</p></div>{!isAdmin && <button className="button button-primary" onClick={openCreate}><span>＋</span> Create order</button>}</div>
    <div className="stats-grid order-stats"><StatCard label="All orders" value={orders.length} icon="▤" color="blue" /><StatCard label="Pending" value={counts.Pending} icon="◷" color="orange" foot="Awaiting confirmation" /><StatCard label="Confirmed" value={counts.Confirmed} icon="✓" color="purple" foot="Ready to fulfil" /><StatCard label="Shipped" value={counts.Shipped} icon="↗" color="green" foot="Successfully delivered" /></div>
    <article className="panel list-panel"><div className="list-toolbar"><div className="search-box"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders or customers..." aria-label="Search orders" /></div><div className="filter-group"><select className="select-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div></div>
      <div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>AMOUNT</th><th>STATUS</th><th /></tr></thead><tbody>{filtered.length ? filtered.map((order) => { const choices = order.status === "Pending" ? ["Pending", "Confirmed", "Cancelled"] : order.status === "Confirmed" ? ["Confirmed", "Shipped", "Cancelled"] : [order.status]; return <tr key={order.id}><td className="order-id">#{order.id}</td><td><span className="customer-cell"><span className="customer-avatar">{order.initials || order.customer.slice(0, 2).toUpperCase()}</span>{order.customer}</span></td><td className="date-cell">{order.date}</td><td>{order.items} item{order.items === 1 ? "" : "s"}</td><td className="amount-cell">{money(order.amount)}</td><td><select className="select-control" value={order.status} onChange={(event) => updateStatus(order, event.target.value)} aria-label={`Status for ${order.id}`}>{choices.map((value) => <option key={value}>{value}</option>)}</select></td><td><button className="row-menu" onClick={() => setSelectedOrder(order)} aria-label={`View ${order.id}`}>···</button></td></tr>; }) : <tr><td colSpan="7"><div className="empty-state">No orders match your search.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>{filtered.length} order{filtered.length === 1 ? "" : "s"}</span><div><button className="pagination-button" disabled>←</button><button className="pagination-button current">1</button><button className="pagination-button" disabled>→</button></div></div>
    </article>
    {showCreate && !isAdmin && <Modal title="Create an order" eyebrow="CUSTOMER ORDER" onClose={() => setShowCreate(false)}><form onSubmit={submit}><div className="form-grid">
      <div className="form-field"><label>Customer name *</label><input required maxLength="60" value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="e.g. Olivia Rhye" /></div>
      <div className="form-field"><label>Email or phone *</label><input required maxLength="80" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="Customer contact" /></div>
      <div className="form-field full"><label>Order items *</label><div className="order-lines">{lines.map((line, index) => <div className="order-line" key={index}><select className="select-control" value={line.productId} required onChange={(event) => setLines((items) => items.map((item, i) => i === index ? { ...item, productId: event.target.value } : item))}>{products.filter((product) => product.stock > 0).map((product) => <option key={product.id} value={product.id}>{product.name} · {money(product.price)}</option>)}</select><input className="order-line-quantity" aria-label="Item quantity" type="number" min="1" step="1" required value={line.quantity} onChange={(event) => setLines((items) => items.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} /><button className="remove-line-button" type="button" aria-label="Remove item" onClick={() => lines.length > 1 && setLines((items) => items.filter((_, i) => i !== index))}>×</button></div>)}</div><button className="add-line-button" type="button" onClick={() => setLines((items) => [...items, { productId: products.find((item) => item.stock > 0)?.id || "", quantity: 1 }])}>＋ Add another item</button></div>
      <div className="quantity-preview">Estimated total: {money(total)} · total is calculated from current product prices</div>
      {error && <div className="form-error">{error}</div>}<div className="form-actions full"><button type="button" className="button button-light" onClick={() => setShowCreate(false)}>Cancel</button><button className="button button-primary">Create order</button></div>
    </div></form></Modal>}
    {selectedOrder && <Modal title={`Order #${selectedOrder.id}`} eyebrow="ORDER DETAILS" onClose={() => setSelectedOrder(null)}><div className="order-detail-grid"><div><span>Customer</span><strong>{selectedOrder.customer}</strong></div><div><span>Contact</span><strong>{selectedOrder.contact}</strong></div><div><span>Order date</span><strong>{selectedOrder.date}</strong></div><div><span>Status</span><strong><StatusBadge status={selectedOrder.status} /></strong></div></div>{lineItems(selectedOrder).length ? lineItems(selectedOrder).map((line) => <div className="order-detail-item" key={line.productId}><span>{products.find((product) => product.id === line.productId)?.name || "Removed product"} <small>× {line.quantity}</small></span><strong>{money(line.price * line.quantity)}</strong></div>) : <div className="order-detail-item"><span>Item detail is unavailable for this sample order.</span></div>}<div className="order-detail-total"><span>Order total</span><strong>{money(selectedOrder.amount)}</strong></div><div className="form-actions"><button className="button button-light" onClick={() => setSelectedOrder(null)}>Close</button></div></Modal>}
  </section>;
}
