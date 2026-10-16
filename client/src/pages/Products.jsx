import { useMemo, useState } from "react";
import Modal from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { money, productStatus } from "../data.js";

const blankProduct = { name: "", sku: "", category: "", price: "", stock: "", description: "" };

export default function Products({ products, saveProduct, deleteProduct, toast }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankProduct);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const categories = [...new Set(products.map((product) => product.category))].sort();
  const filtered = useMemo(() => products.filter((product) => {
    const query = `${product.name} ${product.sku}`.toLowerCase().includes(search.trim().toLowerCase());
    const categoryMatch = !category || product.category === category;
    const stockMatch = !stockFilter || (stockFilter === "low" ? product.stock > 0 && product.stock < 10 : stockFilter === "out" ? product.stock <= 0 : product.stock >= 10);
    return query && categoryMatch && stockMatch;
  }), [products, search, category, stockFilter]);

  function openForm(product = null) {
    setEditing(product);
    setForm(product ? { ...product } : blankProduct);
    setError("");
    setFormOpen(true);
  }

  function submit(event) {
    event.preventDefault();
    const result = saveProduct({ ...form, price: Number(form.price), stock: Number(form.stock) });
    if (result) return setError(result);
    setFormOpen(false);
    toast(editing ? "Product updated." : "Product added.");
  }

  function removeProduct() {
    const result = deleteProduct(deleteTarget.id);
    if (result) return setError(result);
    setDeleteTarget(null);
    toast("Product deleted.");
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">CATALOG</div><h1>Products</h1><p>Manage your products and keep your catalog up to date.</p></div><button className="button button-primary" onClick={() => openForm()}><span>＋</span> Add product</button></div>
    <div className="panel list-panel"><div className="list-toolbar"><div className="search-box"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or SKU..." aria-label="Search products" /></div><div className="filter-group"><select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select className="select-control" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="">Any stock status</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div></div>
      <div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th /></tr></thead><tbody id="productsBody">{filtered.length ? filtered.map((product) => { const [label] = productStatus(product); const stockClass = product.stock <= 0 ? "out" : product.stock < 10 ? "low" : ""; return <tr key={product.id}><td><span className="product-cell"><span className="product-thumb">{product.icon}</span><span className="product-copy"><strong>{product.name}</strong><span>{product.description}</span></span></span></td><td className="sku-cell">{product.sku}</td><td>{product.category}</td><td className="price-cell">{money(product.price)}</td><td className={`stock-cell ${stockClass}`}>{product.stock} units</td><td><StatusBadge status={label} /></td><td><button className="row-menu" onClick={() => openForm(product)} aria-label={`Edit ${product.name}`}>✎</button><button className="row-menu delete-row" onClick={() => { setDeleteTarget(product); setError(""); }} aria-label={`Delete ${product.name}`}>×</button></td></tr>; }) : <tr><td colSpan="7"><div className="empty-state">No products match your search.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>{filtered.length} product{filtered.length === 1 ? "" : "s"}</span><div><button className="pagination-button" disabled>←</button><button className="pagination-button current">1</button><button className="pagination-button" disabled>→</button></div></div>
    </div>
    {formOpen && <Modal title={editing ? "Edit product" : "Add a product"} eyebrow="PRODUCT CATALOG" onClose={() => setFormOpen(false)}><form onSubmit={submit}><div className="form-grid">
      <div className="form-field full"><label>Product name *</label><input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
      <div className="form-field"><label>SKU *</label><input required maxLength="32" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></div>
      <div className="form-field"><label>Category *</label><input required maxLength="40" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
      <div className="form-field"><label>Price ($) *</label><input type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
      <div className="form-field"><label>Stock quantity *</label><input type="number" min="0" step="1" required value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></div>
      <div className="form-field full"><label>Description</label><textarea maxLength="180" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions full"><button type="button" className="button button-light" onClick={() => setFormOpen(false)}>Cancel</button><button className="button button-primary">{editing ? "Save changes" : "Add product"}</button></div>
    </div></form></Modal>}
    {deleteTarget && <Modal title="Delete this product?" eyebrow="PRODUCT CATALOG" onClose={() => setDeleteTarget(null)}><div className="quantity-preview">This will remove <strong>{deleteTarget.name}</strong> from your catalog. Its movement history will remain available.</div>{error && <div className="form-error">{error}</div>}<div className="form-actions"><button className="button button-light" onClick={() => setDeleteTarget(null)}>Keep product</button><button className="button button-primary delete-confirm" onClick={removeProduct}>Delete product</button></div></Modal>}
  </section>;
}
