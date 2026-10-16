import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../data.js";

export default function Cart({ products, cart, setCart, checkout, toast }) {
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState("");
  const [error, setError] = useState("");
  const items = Object.entries(cart).map(([productId, quantity]) => ({ product: products.find((entry) => entry.id === productId), productId, quantity })).filter((line) => line.product);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  async function submit(event) {
    event.preventDefault();
    setError("");
    const message = await checkout({ shippingAddress, items });
    if (message) return setError(message);
    setCart({});
    toast("Order placed successfully.");
    navigate("/my-orders");
  }

  return <section className="page-view active"><div className="page-heading"><div><div className="eyebrow">YOUR CART</div><h1>Cart &amp; checkout</h1><p>Review your items and enter a shipping address.</p></div></div>
    {!items.length ? <article className="panel coming-soon"><span className="coming-icon">▤</span><h2>Your cart is empty</h2><p>Add products to your cart before checkout.</p><Link className="button button-primary" to="/products">Browse products</Link></article> :
      <div className="checkout-grid"><article className="panel cart-list">{items.map(({ product, productId, quantity }) => <div className="cart-item" key={productId}><span className="product-thumb">{product.icon || "📦"}</span><div className="cart-item-info"><strong>{product.name}</strong><span>{money(product.price)} · {product.stock} in stock</span></div><input aria-label={`Quantity for ${product.name}`} type="number" min="1" max={product.stock} value={quantity} onChange={(event) => setCart({ ...cart, [productId]: Math.min(product.stock, Math.max(1, Number(event.target.value))) })} /><strong>{money(product.price * quantity)}</strong><button className="row-menu delete-row" aria-label={`Remove ${product.name}`} onClick={() => { const next = { ...cart }; delete next[productId]; setCart(next); }}>×</button></div>)}</article>
        <form className="panel checkout-form" onSubmit={submit}><h2>Shipping details</h2><div className="form-field"><label htmlFor="shippingAddress">Shipping address *</label><textarea id="shippingAddress" required value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} /></div><div className="checkout-total"><span>Order total</span><strong>{money(total)}</strong></div>{error && <div className="form-error">{error}</div>}<button className="button button-primary">Place order</button></form></div>}
  </section>;
}
