import { Link } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { money } from "../data.js";

export default function Dashboard({ products, orders }) {
  const lowStock = products.filter((product) => product.stock < 10);
  const statuses = ["Pending", "Confirmed", "Shipped", "Cancelled"];
  const counts = Object.fromEntries(statuses.map((status) => [status, orders.filter((order) => order.status === status).length]));
  const revenue = orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.amount), 0);
  const total = Math.max(orders.length, 1);
  const pct = (count) => `${count / total * 100}%`;

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div><h1>Good morning, Jamie <span className="wave">✳</span></h1><p>Here’s what’s happening with your store today.</p></div><div className="heading-actions"><Link className="button button-light" to="/reports"><span>↧</span> Export report</Link><Link className="button button-primary" to="/orders"><span>＋</span> New order</Link></div></div>
    <div className="stats-grid">
      <StatCard label="Total products" value={products.length} icon="▦" color="purple" trend="↗ 8.2%" />
      <StatCard label="Low stock items" value={lowStock.length} icon="⌁" color="orange" foot="Below 10 units" />
      <StatCard label="Total orders" value={orders.length} icon="▤" color="blue" trend="↗ 12.5%" />
      <StatCard label="Revenue" value={money(revenue)} icon="$" color="green" trend="↗ 6.4%" />
    </div>
    <div className="dashboard-grid">
      <article className="panel sales-panel">
        <div className="panel-heading"><div><h2>Sales overview</h2><p>Track your revenue over time</p></div><select className="select-control" aria-label="Sales period"><option>This week</option><option>This month</option><option>This year</option></select></div>
        <div className="chart-summary"><strong>{money(revenue)}</strong><span className="trend-up">↗ 8.2%</span><span className="muted">vs. previous period</span></div>
        <div className="chart-wrap"><div className="chart-y-labels"><span>$4k</span><span>$3k</span><span>$2k</span><span>$1k</span><span>$0</span></div><div className="chart-plot"><div className="grid-lines"><i /><i /><i /><i /><i /></div><svg className="sales-chart" viewBox="0 0 700 190" preserveAspectRatio="none" aria-label="Sales trend chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7565e8" stopOpacity=".2" /><stop offset="100%" stopColor="#7565e8" stopOpacity="0" /></linearGradient></defs><path className="chart-area" d="M0 146 C32 137 38 111 75 121 S113 139 150 107 S190 97 225 113 S266 98 300 84 S338 107 375 81 S411 76 450 87 S486 55 525 68 S565 46 600 59 S646 26 700 17 L700 190 L0 190 Z" /><path className="chart-line" d="M0 146 C32 137 38 111 75 121 S113 139 150 107 S190 97 225 113 S266 98 300 84 S338 107 375 81 S411 76 450 87 S486 55 525 68 S565 46 600 59 S646 26 700 17" /><circle cx="525" cy="68" r="5" className="chart-point" /></svg><div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div>
      </article>
      <article className="panel status-panel"><div className="panel-heading"><div><h2>Order status</h2><p>Keep an eye on your orders</p></div><button className="more-button" aria-label="More options">···</button></div><div className="order-donut" style={{ background: `conic-gradient(#7565df 0 ${pct(counts.Confirmed)},#55b7a0 ${pct(counts.Confirmed)} ${pct(counts.Confirmed + counts.Shipped)},#f4bb6a ${pct(counts.Confirmed + counts.Shipped)} ${pct(counts.Confirmed + counts.Shipped + counts.Pending)},#e9e9f1 ${pct(counts.Confirmed + counts.Shipped + counts.Pending)} 100%)` }}><div className="donut-center"><strong>{orders.length}</strong><span>Total orders</span></div></div><div className="status-legend">{statuses.map((status) => <div key={status}><span className="legend-label"><i className={`dot ${status.toLowerCase()}`} />{status}</span><strong>{counts[status]}</strong></div>)}</div></article>
    </div>
    <div className="dashboard-grid lower-grid">
      <article className="panel table-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>Your latest customer orders</p></div><Link className="text-link" to="/orders">View all orders <span>→</span></Link></div><div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{orders.slice(0, 5).map((order) => <tr key={order.id}><td className="order-id">#{order.id}</td><td><span className="customer-cell"><span className="customer-avatar">{order.initials || order.customer.slice(0, 2).toUpperCase()}</span>{order.customer}</span></td><td className="date-cell">{order.date}</td><td className="amount-cell">{money(order.amount)}</td><td><StatusBadge status={order.status} /></td></tr>)}</tbody></table></div></article>
      <article className="panel low-stock-panel"><div className="panel-heading"><div><h2>Low stock alert</h2><p>Products that need restocking</p></div><span className="alert-count">{lowStock.length}</span></div><div className="low-stock-list">{lowStock.length ? lowStock.slice(0, 4).map((product) => <div className="low-stock-item" key={product.id}><span className="product-thumb">{product.icon}</span><span className="low-product-copy"><strong>{product.name}</strong><span>{product.sku}</span></span><span className="stock-left">{product.stock} left</span></div>) : <div className="empty-state">All products are well stocked.</div>}</div><Link className="restock-button" to="/inventory">Manage inventory <span>→</span></Link></article>
    </div>
  </section>;
}
