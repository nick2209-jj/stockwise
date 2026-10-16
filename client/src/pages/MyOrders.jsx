import { useState } from "react";
import StatusBadge from "../components/StatusBadge.jsx";
import { money } from "../data.js";

export default function MyOrders({ orders, cancelOrder, toast }) {
  const [busyId, setBusyId] = useState("");
  async function cancel(order) {
    setBusyId(order.id);
    const message = await cancelOrder(order.id);
    setBusyId("");
    toast(message || "Order cancelled and stock restored.");
  }
  return <section className="page-view active"><div className="page-heading"><div><div className="eyebrow">ORDER HISTORY</div><h1>My orders</h1><p>Review your recent orders and status.</p></div></div>
    <article className="panel list-panel"><div className="table-scroll"><table><thead><tr><th>ORDER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th /></tr></thead><tbody>{orders.length ? orders.map((order) => <tr key={order.id}><td className="order-id">#{order.id}</td><td className="date-cell">{order.date}</td><td>{order.items} item{order.items === 1 ? "" : "s"}</td><td className="amount-cell">{money(order.amount)}</td><td><StatusBadge status={order.status} /></td><td>{order.status === "Pending" && <button className="button button-light small-button" disabled={busyId === order.id} onClick={() => cancel(order)}>{busyId === order.id ? "Cancelling…" : "Cancel order"}</button>}</td></tr>) : <tr><td colSpan="6"><div className="empty-state">No orders yet.</div></td></tr>}</tbody></table></div></article>
  </section>;
}
