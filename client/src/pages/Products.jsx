import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../components/Modal.jsx";
import ProductImage from "../components/ProductImage.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { money, productStatus } from "../data.js";

const fallbackImageUrl = "https://via.placeholder.com/150?text=No+Image";
const blankProduct = { name: "", sku: "", category: "", price: "", stock: "", description: "", imageUrl: fallbackImageUrl, imageFile: null };

function isGoogleImageSearchPage(value) {
  try {
    const url = new URL(value);
    return /(^|\.)google\.[a-z.]+$/i.test(url.hostname) && (/\/imgres\/?$/i.test(url.pathname) || /\/search\/?$/i.test(url.pathname));
  } catch {
    return false;
  }
}

export default function Products({ products, saveProduct, deleteProduct, toast, lowStockThreshold = 5 }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankProduct);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const previewObjectUrl = useRef("");
  const imageInput = useRef(null);
  const categories = [...new Set(products.map((product) => product.category))].sort();
  const filtered = useMemo(() => products.filter((product) => {
    const query = `${product.name} ${product.sku}`.toLowerCase().includes(search.trim().toLowerCase());
    const categoryMatch = !category || product.category === category;
    const stockMatch = !stockFilter || (stockFilter === "low" ? product.stock > 0 && product.stock < lowStockThreshold : stockFilter === "out" ? product.stock <= 0 : product.stock >= lowStockThreshold);
    return query && categoryMatch && stockMatch;
  }), [products, search, category, stockFilter, lowStockThreshold]);

  function clearImagePreview() {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = "";
    setImagePreview("");
  }

  useEffect(() => () => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
  }, []);

  function openForm(product = null) {
    clearImagePreview();
    setImageLoadError(false);
    setEditing(product);
    setForm(product ? { ...product, imageUrl: product.imageUrl || fallbackImageUrl, imageFile: null } : { ...blankProduct });
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    clearImagePreview();
    setFormOpen(false);
  }

  function selectImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      event.target.value = "";
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setError("Image must be 5 MB or smaller.");
      return;
    }
    clearImagePreview();
    const objectUrl = URL.createObjectURL(file);
    previewObjectUrl.current = objectUrl;
    setImagePreview(objectUrl);
    setForm((current) => ({ ...current, imageFile: file }));
  }

  function updateImageUrl(value) {
    clearImagePreview();
    setImageLoadError(false);
    setForm((current) => ({ ...current, imageUrl: value, imageFile: null }));
    if (imageInput.current) imageInput.current.value = "";
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.imageFile && isGoogleImageSearchPage(form.imageUrl)) {
      setError("That is a Google Images results page, not an image file URL. Upload the image or paste its direct image address.");
      return;
    }
    const result = await saveProduct({ ...form, price: Number(form.price), stock: Number(form.stock) });
    if (result) return setError(result);
    closeForm();
    toast(editing ? "Product updated." : "Product added.");
  }

  async function removeProduct() {
    const result = await deleteProduct(deleteTarget.id);
    if (result) return setError(result);
    setDeleteTarget(null);
    toast("Product deleted.");
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">CATALOG</div><h1>Products</h1><p>Manage your products and keep your catalog up to date.</p></div><button className="button button-primary" onClick={() => openForm()}><span>＋</span> Add product</button></div>
    <div className="panel list-panel"><div className="list-toolbar"><div className="search-box"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or SKU..." aria-label="Search products" /></div><div className="filter-group"><select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select><select className="select-control" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}><option value="">Any stock status</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div></div>
      <div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th /></tr></thead><tbody id="productsBody">{filtered.length ? filtered.map((product) => { const [label] = productStatus(product, lowStockThreshold); const stockClass = product.stock <= 0 ? "out" : product.stock < lowStockThreshold ? "low" : ""; return <tr key={product.id}><td><span className="product-cell"><ProductImage className="product-thumb product-thumb-image" src={product.imageUrl || fallbackImageUrl} alt={product.name} /><span className="product-copy"><strong>{product.name}</strong><span>{product.description}</span></span></span></td><td className="sku-cell">{product.sku}</td><td>{product.category}</td><td className="price-cell">{money(product.price)}</td><td className={`stock-cell ${stockClass}`}>{product.stock} units</td><td><StatusBadge status={label} /></td><td><button className="row-menu" onClick={() => openForm(product)} aria-label={`Edit ${product.name}`}>✎</button><button className="row-menu delete-row" onClick={() => { setDeleteTarget(product); setError(""); }} aria-label={`Delete ${product.name}`}>×</button></td></tr>; }) : <tr><td colSpan="7"><div className="empty-state">No products match your search.</div></td></tr>}</tbody></table></div>
      <div className="table-footer"><span>{filtered.length} product{filtered.length === 1 ? "" : "s"}</span><div><button className="pagination-button" disabled>←</button><button className="pagination-button current">1</button><button className="pagination-button" disabled>→</button></div></div>
    </div>
    {formOpen && <Modal title={editing ? "Edit product" : "Add a product"} eyebrow="PRODUCT CATALOG" onClose={closeForm}><form onSubmit={submit}><div className="form-grid">
      <div className="form-field full"><label>Product name *</label><input required maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
      <div className="form-field"><label>SKU *</label><input required maxLength="32" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></div>
      <div className="form-field"><label>Category *</label><input required maxLength="40" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
      <div className="form-field"><label>Price (₹) *</label><input type="number" min="0" step="0.01" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
      <div className="form-field"><label>Stock quantity *</label><input type="number" min="0" step="1" required disabled={Boolean(editing)} value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />{editing && <small className="field-help">Use Inventory to adjust existing stock.</small>}</div>
      <div className="form-field full"><label>Description</label><textarea maxLength="180" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
      <div className="form-field full"><label htmlFor="productImageFile">Upload image</label><input ref={imageInput} id="productImageFile" type="file" accept="image/*" onChange={selectImage} /><small className="field-help">JPEG, PNG, WebP, or GIF · up to 5 MB</small></div>
      <div className="form-field full"><label htmlFor="productImageUrl">Or paste a direct image URL</label><input id="productImageUrl" type="url" maxLength="2048" placeholder="https://example.com/product-image.jpg" value={form.imageUrl} onChange={(event) => updateImageUrl(event.target.value)} /><small className="field-help">Use the direct image address, not a Google Images search/result page.</small></div>
      <div className="image-preview-field full"><span>Image preview</span><ProductImage className="image-preview" src={imagePreview || form.imageUrl || fallbackImageUrl} alt="Product preview" onError={() => setImageLoadError(true)} />{imageLoadError && <small className="image-load-error">This address did not load as an image. Use a direct image URL or upload a file.</small>}</div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions full"><button type="button" className="button button-light" onClick={closeForm}>Cancel</button><button className="button button-primary">{editing ? "Save changes" : "Add product"}</button></div>
    </div></form></Modal>}
    {deleteTarget && <Modal title="Delete this product?" eyebrow="PRODUCT CATALOG" onClose={() => setDeleteTarget(null)}><div className="quantity-preview">This will remove <strong>{deleteTarget.name}</strong> from your catalog. Its movement history will remain available.</div>{error && <div className="form-error">{error}</div>}<div className="form-actions"><button className="button button-light" onClick={() => setDeleteTarget(null)}>Keep product</button><button className="button button-primary delete-confirm" onClick={removeProduct}>Delete product</button></div></Modal>}
  </section>;
}
