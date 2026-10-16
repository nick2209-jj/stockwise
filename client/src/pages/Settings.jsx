import { Link } from "react-router-dom";

export default function Settings() {
  return <section className="page-view active placeholder-page"><div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p>Manage your workspace and preferences.</p></div></div><article className="panel coming-soon"><span className="coming-icon">⚙</span><h2>Workspace settings</h2><p>Your workspace settings will be available here.</p><Link className="button button-light" to="/">Back to dashboard</Link></article></section>;
}
