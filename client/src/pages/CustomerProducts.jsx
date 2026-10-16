import { useMemo, useState } from "react";
import ProductImage from "../components/ProductImage.jsx";
import { money } from "../data.js";

const fallbackImageUrl = "https://via.placeholder.com/150?text=No+Image";

export default function CustomerProducts({ products, addToCart, toast }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const categories = [...new Set(products.map((item) => item.category))].sort();
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()) && (!category || product.category === category)), [products, search, category]);
  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">SHOP</div><h1>Product catalog</h1><p>Browse our products and current availability.</p></div></div>
    <div className="list-toolbar catalog-toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." aria-label="Search products" /></div><select className="select-control" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></div>
    <div className="catalog-grid">{filtered.map((product) => <article className="panel catalog-card" key={product.id}><div className="catalog-image"><ProductImage src={product.imageUrl || fallbackImageUrl} alt={product.name} /></div><div className="eyebrow">{product.category}</div><h2>{product.name}</h2><p>{product.description}</p><div className="catalog-card-bottom"><strong>{money(product.price)}</strong><span className={product.stock > 0 ? "available" : "unavailable"}>{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</span></div><button className="button button-primary" disabled={product.stock <= 0} onClick={() => { addToCart(product); toast("Added to cart."); }}>Add to cart</button></article>)}</div>
    {!filtered.length && <div className="panel empty-state">No products found.</div>}
  </section>;
}
