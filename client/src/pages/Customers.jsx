import { useEffect, useMemo, useState } from "react";
import api, { apiError, normalizeOrder } from "../api.js";
import { money } from "../data.js";
import StatusBadge from "../components/StatusBadge.jsx";

const displayDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/customers")
      .then(({ data }) => setCustomers(data))
      .catch((requestError) => setError(apiError(requestError)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => `${customer.name} ${customer.email}`.toLowerCase().includes(query));
  }, [customers, search]);

  async function openCustomer(customer) {
    setSelected(customer);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/customers/${customer.id}/orders`);
      setHistory(data.map(normalizeOrder));
    } catch (requestError) {
      setHistoryError(apiError(requestError));
    } finally {
      setHistoryLoading(false);
    }
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">RELATIONSHIPS</div><h1>Customers</h1><p>Customer accounts and their order history.</p></div></div>
    <article className="panel list-panel">
      <div className="list-toolbar"><div className="search-box"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer name or email..." aria-label="Search customers" /></div><span className="customer-result-count">{filtered.length} customers</span></div>
      {error && <div className="form-error customer-error">{error}</div>}
      <div className="table-scroll"><table><thead><tr><th>CUSTOMER NAME</th><th>EMAIL</th><th>TOTAL ORDERS</th><th>LIFETIME SPENT</th><th>LAST ORDER DATE</th></tr></thead><tbody>
        {filtered.map((customer) => <tr key={customer.id} className="customer-row" tabIndex="0" onClick={() => openCustomer(customer)} onKeyDown={(event) => { if (event.key === "Enter") openCustomer(customer); }}>
          <td className="customer-name-cell">{customer.name}</td><td>{customer.email}</td><td>{customer.totalOrders}</td><td className="price-cell">{money(customer.lifetimeSpent)}</td><td>{displayDate(customer.lastOrderDate)}</td>
        </tr>)}
        {!loading && !filtered.length && <tr><td colSpan="5"><div className="empty-state">{search ? "No customers match your search." : "No customer accounts found."}</div></td></tr>}
        {loading && <tr><td colSpan="5"><div className="empty-state">Loading customers…</div></td></tr>}
      </tbody></table></div>
    </article>
    {selected && <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
      <aside className="customer-drawer" aria-label={`Order history for ${selected.name}`}>
        <div className="drawer-heading"><div><div className="eyebrow">CUSTOMER HISTORY</div><h2>{selected.name}</h2><p>{selected.email}</p></div><button className="modal-close" aria-label="Close customer details" onClick={() => setSelected(null)}>×</button></div>
        <div className="drawer-summary"><div><span>Total orders</span><strong>{selected.totalOrders}</strong></div><div><span>Lifetime spent</span><strong>{money(selected.lifetimeSpent)}</strong></div></div>
        <h3>Orders</h3>
        {historyError && <div className="form-error">{historyError}</div>}
        {historyLoading ? <div className="empty-state">Loading order history…</div> : history.length ? <div className="drawer-orders">{history.map((order) => <article className="drawer-order" key={order.id}><div className="drawer-order-top"><strong>Order #{String(order.id).slice(-8)}</strong><StatusBadge status={order.status} /></div><span>{order.date} · {order.items} items</span><strong>{money(order.amount)}</strong></article>)}</div> : !historyError && <div className="empty-state">This customer has no orders yet.</div>}
      </aside>
    </div>}
  </section>;
}
