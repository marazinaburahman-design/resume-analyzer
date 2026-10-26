import React, { useState } from 'react';
import { BrainCircuit, ShieldCheck, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { loginAccount, registerAccount } from '../lib/api.js';

export default function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = mode === 'register'
        ? await registerAccount({ name, email, password })
        : await loginAccount({ email, password });
      onAuthenticated(response.user);
    } catch (err) {
      setError(err.message || 'Could not sign you in. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
  }

  return (
    <main className="auth-shell">
      <header className="topbar auth-topbar">
        <a href="#top" className="brand" aria-label="Resume Lab home">
          <span className="brand-mark"><BrainCircuit size={20} /></span>
          <span className="brand-name">resume<span>lab</span></span>
        </a>
        <span className="privacy-note"><ShieldCheck size={15} /> Private workspace</span>
      </header>
      <section className="auth-card" id="top">
        <div className="auth-mark"><LockKeyhole size={20} /></div>
        <p className="section-kicker">{mode === 'register' ? 'Create your workspace' : 'Welcome back'}</p>
        <h1>{mode === 'register' ? 'Your next step starts here.' : 'Sign in to your workspace.'}</h1>
        <p className="auth-description">Your reviews are tied to your account, so only you can access your saved results.</p>
        <div className="auth-tabs" role="tablist" aria-label="Account action">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Create account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <label className="auth-field"><span>Full name</span><input autoComplete="name" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={80} required placeholder="Your name" /></label>}
          <label className="auth-field"><span>Email address</span><input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required placeholder="you@example.com" /></label>
          <label className="auth-field"><span>Password</span><input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} minLength={mode === 'register' ? 8 : 1} maxLength={72} required placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="analyze-button auth-submit" type="submit" disabled={busy}>
            <span>{busy ? 'Please wait…' : mode === 'register' ? 'Create my account' : 'Sign in securely'}</span>
            <ArrowUpRight size={17} />
          </button>
        </form>
        <p className="auth-security"><ShieldCheck size={14} /> Passwords are hashed. Your session uses a secure, HttpOnly cookie.</p>
      </section>
    </main>
  );
}
