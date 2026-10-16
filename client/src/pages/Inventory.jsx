import { useState } from "react";
import Modal from "../components/Modal.jsx";
import StatCard from "../components/StatCard.jsx";
import { money } from "../data.js";

export default function Inventory({ products, movements, adjustStock, toast, lowStockThreshold = 5 }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: products[0]?.id || "", type: "in", quantity: "", reason: "" });
  const [error, setError] = useState("");
  const lowStock = products.filter((product) => product.stock < lowStockThreshold).length;
  const stockCount = products.reduce((sum, product) => sum + Number(product.stock), 0);
  const stockValue = products.reduce((sum, product) => sum + Number(product.price) * Number(product.stock), 0);

  async function submit(event) {
    event.preventDefault();
    const message = await adjustStock({ ...form, quantity: Number(form.quantity) });
    if (message) return setError(message);
    setOpen(false);
    setForm({ productId: products[0]?.id || "", type: "in", quantity: "", reason: "" });
    toast("Stock adjustment saved.");
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">STOCK CONTROL</div><h1>Inventory</h1><p>Monitor stock levels and keep a record of every movement.</p></div><button className="button button-primary" onClick={() => { setError(""); setOpen(true); }}><span>＋</span> Adjust stock</button></div>
    <div className="stats-grid inventory-stats"><StatCard label="Units in stock" value={stockCount} icon="▦" color="purple" /><StatCard label="Low stock" value={lowStock} icon="⌁" color="orange" foot={`Products below ${lowStockThreshold} units`} /><StatCard label="Stock movements" value={movements.length} icon="↗" color="blue" foot="Recorded adjustments" /><StatCard label="Inventory value" value={money(stockValue)} icon="₹" color="green" foot="Based on current stock" /></div>
    <article className="panel list-panel movement-panel"><div className="panel-heading"><div><h2>Movement history</h2><p>A complete log of your inventory changes</p></div><span className="button button-light small-button">All activity⌄</span></div><div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>TYPE</th><th>QUANTITY</th><th>REASON</th><th>UPDATED BY</th><th>DATE</th></tr></thead><tbody>{movements.map((movement) => { const product = products.find((item) => item.id === movement.productId); const direction = movement.quantity > 0 ? "in" : "out"; return <tr key={movement.id}><td><span className="product-cell"><span className="product-thumb">{product?.icon || "▦"}</span><span className="product-copy"><strong>{product?.name || "Removed product"}</strong><span>{product?.sku || ""}</span></span></span></td><td><span className={`movement-type ${direction}`}>{movement.quantity > 0 ? "↙ Stock in" : "↗ Stock out"}</span></td><td className={`movement-quantity ${direction}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity} units</td><td className="movement-reason">{movement.reason}</td><td className="movement-user">{movement.user}</td><td className="date-cell">{movement.date}</td></tr>; })}</tbody></table></div>{!movements.length && <div className="empty-state">No stock movements yet. Adjust stock to see activity here.</div>}</article>
    {open && <Modal title="Adjust stock" eyebrow="INVENTORY" onClose={() => setOpen(false)}><form onSubmit={submit}><div className="form-grid">
      <div className="form-field full"><label>Product *</label><select required value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.stock} in stock</option>)}</select></div>
      <div className="form-field"><label>Adjustment *</label><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="in">Stock in</option><option value="out">Stock out</option></select></div>
      <div className="form-field"><label>Quantity *</label><input type="number" min="1" step="1" required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></div>
      <div className="form-field full"><label>Reason *</label><select required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}><option value="">Select a reason</option><option>Restock</option><option>Damaged</option><option>Customer Return</option><option>Audit</option></select></div>
      {error && <div className="form-error">{error}</div>}<div className="form-actions full"><button type="button" className="button button-light" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary">Save adjustment</button></div>
    </div></form></Modal>}
  </section>;
}
