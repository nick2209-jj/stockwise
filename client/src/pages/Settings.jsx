import { useEffect, useState } from "react";
import api, { apiError } from "../api.js";

export default function Settings({ user, onProfileUpdated, onPreferencesUpdated }) {
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", currentPassword: "", newPassword: "" });
  const [preferences, setPreferences] = useState({ storeName: "Stockwise", currency: "INR", lowStockThreshold: 5 });
  const [system, setSystem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState("");
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    api.get("/settings")
      .then(({ data }) => {
        setPreferences(data.preferences);
        setSystem(data.system);
      })
      .catch((error) => setPreferencesError(apiError(error)))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setSavingProfile(true);
    try {
      const body = { name: profile.name, email: profile.email };
      if (profile.newPassword) {
        body.currentPassword = profile.currentPassword;
        body.newPassword = profile.newPassword;
      }
      const { data } = await api.patch("/settings/profile", body);
      onProfileUpdated(data.user);
      setProfile({ ...profile, name: data.user.name, email: data.user.email, currentPassword: "", newPassword: "" });
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileError(apiError(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePreferences(event) {
    event.preventDefault();
    setPreferencesError("");
    setPreferencesMessage("");
    setSavingPreferences(true);
    try {
      const { data } = await api.put("/settings/preferences", { ...preferences, lowStockThreshold: Number(preferences.lowStockThreshold) });
      setPreferences(data.preferences);
      onPreferencesUpdated(data.preferences.lowStockThreshold);
      setPreferencesMessage("Store preferences saved.");
    } catch (error) {
      setPreferencesError(apiError(error));
    } finally {
      setSavingPreferences(false);
    }
  }

  return <section className="page-view active">
    <div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Workspace settings</h1><p>Manage your admin profile, store preferences, and system status.</p></div></div>
    <div className="settings-grid">
      <article className="panel settings-panel"><div className="settings-panel-heading"><h2>Admin profile</h2><p>Update the name and email used for your admin account.</p></div>
        <form onSubmit={saveProfile} className="settings-form">
          <div className="form-field"><label htmlFor="settingsName">Name</label><input id="settingsName" required maxLength="80" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="settingsEmail">Email</label><input id="settingsEmail" type="email" required value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></div>
          <div className="settings-password-section"><strong>Change password</strong><span>Leave blank to keep your current password.</span></div>
          <div className="form-field"><label htmlFor="currentPassword">Current password</label><input id="currentPassword" type="password" autoComplete="current-password" value={profile.currentPassword} onChange={(event) => setProfile({ ...profile, currentPassword: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="newPassword">New password</label><input id="newPassword" type="password" minLength="8" autoComplete="new-password" value={profile.newPassword} onChange={(event) => setProfile({ ...profile, newPassword: event.target.value })} /></div>
          {profileError && <div className="form-error">{profileError}</div>}{profileMessage && <div className="form-success">{profileMessage}</div>}
          <button className="button button-primary" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"}</button>
        </form>
      </article>
      <article className="panel settings-panel"><div className="settings-panel-heading"><h2>Store preferences</h2><p>Choose the store label and inventory alert threshold.</p></div>
        <form onSubmit={savePreferences} className="settings-form">
          <div className="form-field"><label htmlFor="storeName">Store name</label><input id="storeName" required maxLength="80" value={preferences.storeName} onChange={(event) => setPreferences({ ...preferences, storeName: event.target.value })} /></div>
          <div className="form-field"><label htmlFor="currency">Default currency</label><select id="currency" value={preferences.currency} onChange={(event) => setPreferences({ ...preferences, currency: event.target.value })}><option value="INR">₹ Indian Rupee (INR)</option></select></div>
          <div className="form-field"><label htmlFor="lowStockThreshold">Low-stock warning threshold (units)</label><input id="lowStockThreshold" type="number" min="0" max="100000" step="1" required value={preferences.lowStockThreshold} onChange={(event) => setPreferences({ ...preferences, lowStockThreshold: event.target.value })} /></div>
          {preferencesError && <div className="form-error">{preferencesError}</div>}{preferencesMessage && <div className="form-success">{preferencesMessage}</div>}
          <button className="button button-primary" disabled={savingPreferences || loading}>{savingPreferences ? "Saving…" : "Save preferences"}</button>
        </form>
      </article>
      <article className="panel settings-panel system-summary-panel"><div className="settings-panel-heading"><h2>System summary</h2><p>Current database connection and workspace records.</p></div>
        {loading ? <div className="empty-state">Loading system status…</div> : <><div className="system-status"><span className={`system-status-dot ${system?.database === "Connected" ? "connected" : ""}`} />Database {system?.database || "Unknown"}</div><div className="system-metrics"><div><span>Active users</span><strong>{system?.activeUsers ?? "—"}</strong></div><div><span>Products</span><strong>{system?.totalProducts ?? "—"}</strong></div><div><span>Orders</span><strong>{system?.totalOrders ?? "—"}</strong></div></div></>}
        <p className="settings-note">Data seeding is run from the server command line with <code>npm run seed</code>. No destructive reset action is exposed in the workspace.</p>
      </article>
    </div>
  </section>;
}
