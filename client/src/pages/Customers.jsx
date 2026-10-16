import { Link } from "react-router-dom";

export default function Customers() {
  return <section className="page-view active placeholder-page"><div className="page-heading"><div><div className="eyebrow">RELATIONSHIPS</div><h1>Customers</h1><p>Get to know the people behind your orders.</p></div></div><article className="panel coming-soon"><span className="coming-icon">♙</span><h2>Customer directory</h2><p>Customer profiles and order history will show up here as you grow.</p><Link className="button button-light" to="/orders">Browse orders</Link></article></section>;
}
