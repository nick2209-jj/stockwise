import { Link } from "react-router-dom";
import { money } from "../data.js";

function downloadOrders(orders) {
  const csv = ["Order,Customer,Contact,Date,Items,Amount,Status", ...orders.map((order) => [order.id, order.customer, order.contact, order.date, order.items, order.amount, order.status].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "stockwise-orders.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports({ orders, products }) {
  const revenue = orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.amount), 0);
  const value = products.reduce((sum, product) => sum + Number(product.price) * Number(product.stock), 0);
  return <section className="page-view active placeholder-page"><div className="page-heading"><div><div className="eyebrow">INSIGHTS</div><h1>Reports</h1><p>Understand your sales and inventory performance.</p></div><button className="button button-light" onClick={() => downloadOrders(orders)}><span>↧</span> Export CSV</button></div>
    <div className="stats-grid"><article className="stat-card simple-stat"><div className="stat-top"><span>Sales revenue</span><span className="stat-icon green">$</span></div><div className="stat-value">{money(revenue)}</div><div className="stat-foot"><span>Excluding cancelled orders</span></div></article><article className="stat-card simple-stat"><div className="stat-top"><span>Inventory value</span><span className="stat-icon purple">▦</span></div><div className="stat-value">{money(value)}</div><div className="stat-foot"><span>Current products at listed price</span></div></article></div>
    <article className="panel coming-soon"><span className="coming-icon">▥</span><h2>Your business at a glance</h2><p>Sales and inventory reports will be available here.</p><Link className="button button-primary" to="/">Back to dashboard</Link></article>
  </section>;
}
