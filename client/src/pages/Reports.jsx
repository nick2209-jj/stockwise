import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import api, { apiError } from "../api.js";
import { money } from "../data.js";
import StatCard from "../components/StatCard.jsx";

const toLocalIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayIso = () => toLocalIso(new Date());
const monthStart = (date) => toLocalIso(new Date(date.getFullYear(), date.getMonth(), 1));
const COLORS = ["#7565df", "#f4bb6a", "#55b7a0", "#b9b9c8"];
const statusNames = ["Pending", "Confirmed", "Shipped", "Cancelled"];

function getQuickRange(period) {
  const today = new Date();
  if (period === "today") return { startDate: todayIso(), endDate: todayIso() };
  if (period === "thisMonth") return { startDate: monthStart(today), endDate: todayIso() };
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return {
    startDate: monthStart(lastMonth),
    endDate: toLocalIso(new Date(today.getFullYear(), today.getMonth(), 0)),
  };
}

export default function Reports() {
  const initialRange = getQuickRange("thisMonth");
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [report, setReport] = useState(null);
  const [storeName, setStoreName] = useState("Stockwise");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const validDateRange = Boolean(startDate && endDate && startDate <= endDate);
  const dateValidationMessage = !startDate || !endDate
    ? "Select both a start date and an end date."
    : startDate > endDate
      ? "Start date must be on or before end date."
      : "";

  useEffect(() => {
    if (!validDateRange) {
      setReport(null);
      setLoading(false);
      setError("");
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError("");
    setReport(null);
    const days = (new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000 + 1;
    Promise.all([
      api.get("/reports", { params: { startDate, endDate, granularity: days > 90 ? "month" : "day" } }),
      api.get("/settings"),
    ]).then(([reportResponse, settingsResponse]) => {
      if (!active) return;
      setReport(reportResponse.data);
      setStoreName(settingsResponse.data.preferences.storeName || "Stockwise");
    }).catch((requestError) => {
      if (active) setError(apiError(requestError));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [startDate, endDate, validDateRange]);

  const statusData = useMemo(() => statusNames.map((name) => ({ name, value: report?.statusCounts?.[name] || 0 })), [report]);
  const dailyPeriod = startDate && endDate && (new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000 < 90;
  const chartDate = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return dailyPeriod ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : value;
  };

  async function exportReport() {
    if (!report || !validDateRange) return;
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Stockwise";
      workbook.created = new Date();
      const sheet = workbook.addWorksheet("Orders", { views: [{ state: "frozen", ySplit: 6 }] });
      sheet.columns = [
        { header: "Order ID", key: "id", width: 28 },
        { header: "Customer Name", key: "customerName", width: 26 },
        { header: "Contact Email", key: "contactEmail", width: 32 },
        { header: "Order Date", key: "orderDate", width: 22 },
        { header: "Total Items", key: "totalItems", width: 14 },
        { header: "Total Amount (₹)", key: "totalAmount", width: 20 },
        { header: "Status", key: "status", width: 16 },
      ];
      sheet.mergeCells("A1:G1");
      sheet.getCell("A1").value = storeName;
      sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FF352A77" } };
      sheet.mergeCells("A2:G2");
      sheet.getCell("A2").value = `Export Date: ${new Date().toLocaleString("en-IN")}`;
      sheet.mergeCells("A3:G3");
      sheet.getCell("A3").value = `Selected Date Range: ${startDate} to ${endDate}`;
      sheet.mergeCells("A4:B4");
      sheet.getCell("A4").value = `Total Orders: ${report.summary.totalOrders}`;
      sheet.mergeCells("C4:D4");
      sheet.getCell("C4").value = `Total Quantity Sold: ${report.summary.totalQuantitySold}`;
      sheet.mergeCells("E4:G4");
      sheet.getCell("E4").value = `Total Revenue: ₹${Number(report.summary.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      sheet.getRow(6).values = sheet.columns.map((column) => column.header);
      sheet.getRow(6).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7061DC" } };
      for (const order of report.orders) {
        sheet.addRow({
          ...order,
          orderDate: new Date(order.orderDate).toLocaleString("en-IN"),
          totalAmount: order.totalAmount,
        });
      }
      sheet.getColumn("totalAmount").numFmt = '"₹"#,##0.00';
      sheet.autoFilter = { from: "A6", to: `G${Math.max(6, sheet.rowCount)}` };
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stockwise-report-${startDate}-to-${endDate}.xlsx`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (exportError) {
      setError(`Could not export report: ${apiError(exportError)}`);
    } finally {
      setExporting(false);
    }
  }

  function quickPick(period) {
    const range = getQuickRange(period);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">INSIGHTS</div><h1>Reports &amp; analytics</h1><p>Track sales, order trends, and inventory value.</p></div><button className="button button-primary" disabled={!report || !validDateRange || exporting} onClick={exportReport}><span>↧</span>{exporting ? "Preparing…" : "Export Excel"}</button></div>
    <article className="panel report-filters">
      <div className="report-date-fields"><label>Start date<input type="date" required value={startDate} max={todayIso()} onChange={(event) => setStartDate(event.target.value)} /></label><label>End date<input type="date" required value={endDate} max={todayIso()} onChange={(event) => setEndDate(event.target.value)} /></label></div>
      <div className="report-quick-picks"><button className="button button-light" onClick={() => quickPick("today")}>Today</button><button className="button button-light" onClick={() => quickPick("thisMonth")}>This month</button><button className="button button-light" onClick={() => quickPick("lastMonth")}>Last month</button></div>
    </article>
    {dateValidationMessage && <div className="form-error report-error" role="alert">{dateValidationMessage}</div>}
    {error && <div className="form-error report-error">{error}</div>}
    {loading && <div className="panel report-loading">Loading report data…</div>}
    {!loading && report && <>
      <div className="stats-grid report-summary">
        <StatCard label="Total orders" value={report.summary.totalOrders} icon="▤" color="purple" />
        <StatCard label="Quantity sold" value={report.summary.totalQuantitySold} icon="▦" color="blue" />
        <StatCard label="Total revenue" value={money(report.summary.totalRevenue)} icon="₹" color="green" />
        <StatCard label="Inventory value" value={money(report.inventoryByCategory.reduce((sum, category) => sum + category.inventoryValue, 0))} icon="⌑" color="orange" />
      </div>
      <div className="dashboard-grid analytics-grid">
        <article className="panel analytics-panel"><div className="panel-heading"><div><h2>Sales revenue trend</h2><p>Cancelled orders are excluded from revenue</p></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={report.trend}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="_id" tickFormatter={chartDate} minTickGap={22} /><YAxis tickFormatter={(value) => `₹${value}`} /><Tooltip labelFormatter={chartDate} formatter={(value) => [money(value), "Revenue"]} /><Line type="monotone" dataKey="revenue" stroke="#7565df" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></article>
        <article className="panel analytics-panel"><div className="panel-heading"><div><h2>Order status</h2><p>Order counts in selected period</p></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={3}>{statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></article>
      </div>
      <div className="dashboard-grid analytics-grid">
        <article className="panel analytics-panel"><div className="panel-heading"><div><h2>Top-selling products</h2><p>Ranked by units sold · excludes cancelled orders</p></div></div><div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>QUANTITY</th><th>REVENUE</th></tr></thead><tbody>{report.topProducts.map((product) => <tr key={product._id}><td>{product.productName}</td><td>{product.quantity}</td><td className="price-cell">{money(product.revenue)}</td></tr>)}{!report.topProducts.length && <tr><td colSpan="3">No sales in this date range.</td></tr>}</tbody></table></div></article>
        <article className="panel analytics-panel"><div className="panel-heading"><div><h2>Inventory valuation</h2><p>Current stock value by category</p></div></div><div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={report.inventoryByCategory} layout="vertical" margin={{ left: 12, right: 14 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tickFormatter={(value) => `₹${value}`} /><YAxis type="category" dataKey="_id" width={85} /><Tooltip formatter={(value) => [money(value), "Stock value"]} /><Bar dataKey="inventoryValue" fill="#7565df" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer></div></article>
      </div>
    </>}
  </section>;
}
