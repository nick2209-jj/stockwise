import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import api, { apiError } from "../api.js";

export default function AuthPage({ mode, user, onAuthenticated }) {
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", address: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.role === "Admin" ? "/admin/dashboard" : "/products"} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post(`/auth/${isRegister ? "register" : "login"}`, isRegister
        ? { name: form.name, address: form.address, email: form.email, password: form.password }
        : { email: form.email, password: form.password });
      if (isRegister && data.user.role !== "Customer") {
        setError("Public registration is only available for customer accounts.");
        return;
      }
      onAuthenticated(data);
      navigate(data.user.role === "Admin" ? "/admin/dashboard" : "/products", { replace: true });
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell"><section className="auth-card">
    <Link className="brand auth-brand" to="/"><span className="brand-mark"><span /><span /><span /><span /></span><span>stockwise</span></Link>
    <div className="eyebrow">{isRegister ? "CUSTOMER ACCOUNT" : "WELCOME BACK"}</div>
    <h1>{isRegister ? "Create your account" : "Sign in to Stockwise"}</h1>
    <p>{isRegister ? "Register as a customer to browse and order products." : "Sign in with your customer or admin account."}</p>
    <form onSubmit={submit} className="auth-form">
      {isRegister && <>
        <div className="form-field"><label htmlFor="authName">Full name</label><input id="authName" required maxLength="80" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
        <div className="form-field"><label htmlFor="authAddress">Address</label><input id="authAddress" autoComplete="street-address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
      </>}
      <div className="form-field"><label htmlFor="authEmail">Email</label><input id="authEmail" type="email" required autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
      <div className="form-field"><label htmlFor="authPassword">Password</label><input id="authPassword" type="password" required minLength="8" autoComplete={isRegister ? "new-password" : "current-password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
      {error && <div className="form-error">{error}</div>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button>
    </form>
    <div className="auth-switch">{isRegister ? "Already have an account?" : "New customer?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></div>
    <small className="auth-admin-note">Admin accounts are created securely by the database seeder.</small>
  </section></main>;
}
