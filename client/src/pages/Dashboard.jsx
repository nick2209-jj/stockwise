import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip,
  XAxis, YAxis,
} from "recharts";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import api, { apiError } from "../api.js";
import { money } from "../data.js";

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Dashboard({ products, orders, movements = [], isAdmin = false, lowStockThreshold = 5, user }) {
  const [salesPeriod, setSalesPeriod] = useState("week");
  const [chartReport, setChartReport] = useState(null);
  const [chartError, setChartError] = useState("");
  const [chartLoading, setChartLoading] = useState(false);
  const lowStock = products.filter((product) => product.stock < lowStockThreshold);
  const statuses = ["Pending", "Confirmed", "Shipped", "Cancelled"];
  const counts = chartReport?.statusCounts || Object.fromEntries(statuses.map((status) => [status, orders.filter((order) => order.status === status).length]));
  const revenue = orders.filter((order) => order.status !== "Cancelled").reduce((sum, order) => sum + Number(order.amount), 0);
  const statusTotal = statuses.reduce((sum, status) => sum + (counts[status] || 0), 0);
  const periodRevenue = chartReport?.summary.totalRevenue ?? revenue;
  const statusColors = { Pending: "#f4bb6a", Confirmed: "#7565df", Shipped: "#55b7a0", Cancelled: "#b9b9c8" };
  const now = new Date();
  const endDateForPeriod = localDateString(now);
  const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (salesPeriod === "week") periodStart.setDate(periodStart.getDate() - 6);
  if (salesPeriod === "month") periodStart.setDate(1);
  if (salesPeriod === "year") periodStart.setMonth(0, 1);
  const startDateForPeriod = localDateString(periodStart);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    setChartLoading(true);
    setChartError("");
    setChartReport(null);
    api.get("/reports", {
      params: {
        startDate: startDateForPeriod,
        endDate: endDateForPeriod,
        granularity: salesPeriod === "year" ? "month" : "day",
      },
    }).then(({ data }) => {
      if (active) setChartReport(data);
    }).catch((error) => {
      if (active) setChartError(apiError(error));
    }).finally(() => {
      if (active) setChartLoading(false);
    });
    return () => { active = false; };
  }, [isAdmin, salesPeriod, startDateForPeriod, endDateForPeriod]);

  const chartData = useMemo(() => {
    if (!chartReport || !startDateForPeriod || !endDateForPeriod) return [];
    const valuesByDate = new Map(chartReport.trend.map((point) => [point._id, point]));
    const points = [];
    const cursor = new Date(`${startDateForPeriod}T00:00:00`);
    const end = new Date(`${endDateForPeriod}T00:00:00`);
    while (cursor <= end) {
      const dateKey = salesPeriod === "year"
        ? `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
        : localDateString(cursor);
      const point = valuesByDate.get(dateKey);
      points.push({ _id: dateKey, revenue: point?.revenue || 0, orders: point?.orders || 0 });
      if (salesPeriod === "year") cursor.setMonth(cursor.getMonth() + 1);
      else cursor.setDate(cursor.getDate() + 1);
    }
    return points;
  }, [chartReport, salesPeriod, startDateForPeriod, endDateForPeriod]);

  const chartDateLabel = (value, period = salesPeriod) => {
    if (!value) return "";
    const date = new Date(`${value}${value.length === 7 ? "-01" : ""}T00:00:00`);
    if (period === "year") return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    return date.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });
  };

  const salesTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return <div className="dashboard-chart-tooltip"><strong>{chartDateLabel(label)}</strong><span>{money(point.revenue)}</span><small>{point.orders} {point.orders === 1 ? "order" : "orders"}</small></div>;
  };

  const statusTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    const percent = statusTotal ? (value / statusTotal) * 100 : 0;
    return <div className="dashboard-chart-tooltip"><strong>{name}</strong><span>{value} {value === 1 ? "order" : "orders"} ({percent.toFixed(1)}%)</span></div>;
  };

  const activeDot = (props) => {
    const { cx, cy } = props;
    if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
    return <g className="chart-active-dot"><circle cx={cx} cy={cy} r="10" fill="#7565df" fillOpacity=".18" /><circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#7565df" strokeWidth="3" /></g>;
  };
  const statusData = statuses.map((name) => ({ name, value: counts[name] || 0, fill: statusColors[name] }));

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div><h1>Good morning, {user?.name?.trim().split(/\s+/)[0] || "there"} <span className="wave">✳</span></h1><p>Here’s what’s happening with your store today.</p></div><div className="heading-actions"><Link className="button button-light" to={isAdmin ? "/admin/reports" : "/products"}><span>↧</span> {isAdmin ? "View reports" : "Browse products"}</Link><Link className="button button-primary" to={isAdmin ? "/admin/orders" : "/cart"}><span>＋</span> {isAdmin ? "View orders" : "Go to cart"}</Link></div></div>
    <div className="stats-grid">
      <StatCard label="Total products" value={products.length} icon="▦" color="purple" trend="↗ 8.2%" />
      <StatCard label="Low stock items" value={lowStock.length} icon="⌁" color="orange" foot={`Below ${lowStockThreshold} units`} />
      <StatCard label="Total orders" value={orders.length} icon="▤" color="blue" trend="↗ 12.5%" />
      <StatCard label="Revenue" value={money(revenue)} icon="₹" color="green" trend="↗ 6.4%" />
    </div>
    <div className="dashboard-grid">
      <article className="panel sales-panel">
        <div className="panel-heading"><div><h2>Sales overview</h2><p>Revenue performance over time</p></div><select className="select-control" aria-label="Sales period" value={salesPeriod} onChange={(event) => setSalesPeriod(event.target.value)}><option value="week">This week</option><option value="month">This month</option><option value="year">This year</option></select></div>
        <div className="chart-summary"><strong>{money(periodRevenue)}</strong><span className="muted">{salesPeriod === "week" ? "This week" : salesPeriod === "month" ? "This month" : "This year"}</span></div>
        {chartError ? <div className="empty-state">{chartError}</div> : <div className="dashboard-sales-chart" aria-label="Interactive sales revenue and order count chart">
          {chartLoading && <div className="chart-loading">Updating chart…</div>}
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 14, right: 12, left: 4, bottom: 3 }}>
            <defs><linearGradient id="dashboardSalesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7565df" stopOpacity=".25" /><stop offset="95%" stopColor="#7565df" stopOpacity=".02" /></linearGradient></defs>
            <CartesianGrid stroke="#eeeef3" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="_id" tick={{ fill: "#9899a8", fontSize: 11 }} tickFormatter={(value) => {
              if (salesPeriod === "year") return new Date(`${value}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
              if (salesPeriod === "week") return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
              return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric" });
            }} tickLine={false} axisLine={false} minTickGap={18} />
            <YAxis domain={[0, "auto"]} tick={{ fill: "#9899a8", fontSize: 11 }} tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} tickLine={false} axisLine={false} width={64} />
            <Tooltip content={salesTooltip} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7565df" strokeWidth={3} fill="url(#dashboardSalesFill)" dot={false} activeDot={activeDot} isAnimationActive />
          </AreaChart></ResponsiveContainer>
          {!chartLoading && !chartData.some((point) => point.revenue > 0) && <div className="chart-empty">No orders in this period.</div>}
        </div>}
      </article>
      <article className="panel status-panel"><div className="panel-heading"><div><h2>Order status</h2><p>Hover over a segment to see its share</p></div></div>
        <div className="dashboard-status-chart">
          <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2} stroke="#fff" strokeWidth={2} isAnimationActive>
            {statusData.map((entry) => <Cell key={entry.name} fill={entry.fill} className="status-chart-cell" />)}
          </Pie><Tooltip content={statusTooltip} /></PieChart></ResponsiveContainer>
          <div className="dashboard-donut-center"><strong>{statusTotal}</strong><span>Total orders</span></div>
        </div>
        <div className="status-legend">{statusData.map(({ name, value, fill }) => <div key={name}><span className="legend-label"><i className="dot" style={{ background: fill }} />{name}</span><strong>{value}</strong></div>)}</div>
      </article>
    </div>
    <div className="dashboard-grid lower-grid">
      <article className="panel table-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>Your latest customer orders</p></div><Link className="text-link" to={isAdmin ? "/admin/orders" : "/my-orders"}>View all orders <span>→</span></Link></div><div className="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{orders.slice(0, 5).map((order) => <tr key={order.id}><td className="order-id">#{order.id}</td><td><span className="customer-cell"><span className="customer-avatar">{order.initials || order.customer.slice(0, 2).toUpperCase()}</span>{order.customer}</span></td><td className="date-cell">{order.date}</td><td className="amount-cell">{money(order.amount)}</td><td><StatusBadge status={order.status} /></td></tr>)}</tbody></table></div></article>
      <article className="panel low-stock-panel"><div className="panel-heading"><div><h2>Low stock alert</h2><p>Products that need restocking</p></div><span className="alert-count">{lowStock.length}</span></div><div className="low-stock-list">{lowStock.length ? lowStock.slice(0, 4).map((product) => <div className="low-stock-item" key={product.id}><span className="product-thumb">{product.icon}</span><span className="low-product-copy"><strong>{product.name}</strong><span>{product.sku}</span></span><span className="stock-left">{product.stock} left</span></div>) : <div className="empty-state">All products are well stocked.</div>}</div><Link className="restock-button" to={isAdmin ? "/admin/inventory" : "/products"}>Manage inventory <span>→</span></Link></article>
    </div>
    {isAdmin && <article className="panel table-panel audit-panel"><div className="panel-heading"><div><h2>Recent stock adjustments</h2><p>Latest inventory activity across your catalog</p></div><Link className="text-link" to="/admin/inventory">View inventory log <span>→</span></Link></div><div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>CHANGE</th><th>REASON</th><th>UPDATED BY</th><th>DATE</th></tr></thead><tbody>{movements.slice(0, 5).map((movement) => <tr key={movement.id}><td>{movement.productName || products.find((item) => item.id === movement.productId)?.name || "Product"}</td><td className={`movement-quantity ${movement.quantity > 0 ? "in" : "out"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td>{movement.reason}</td><td>{movement.user}</td><td className="date-cell">{movement.date}</td></tr>)}</tbody></table></div></article>}
  </section>;
}
