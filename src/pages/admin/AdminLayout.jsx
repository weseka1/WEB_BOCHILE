import { useEffect, useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { supabase, hasSupabase } from '../../lib/supabase'
import AdminLogin from './AdminLogin'
import '../../styles/admin.css'

// iconos minimalistas (línea, 1.6px) — estética premium consistente
const I = {
  props: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" /></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
  web: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>,
}

// Shell del panel + guard de sesión (Supabase Auth). Sin sesión → login.
export default function AdminLayout() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasSupabase) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!hasSupabase) {
    return (
      <div className="adm-shell"><div className="adm-gate">
        <h1>Panel Bochile</h1>
        <p className="adm-muted">Falta configurar Supabase. Cargá <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> y reiniciá.</p>
      </div></div>
    )
  }
  if (!ready) return <div className="adm-shell"><div className="adm-gate"><div className="adm-spin" /></div></div>
  if (!session) return <AdminLogin />

  const email = session.user?.email || ''
  const name = email.split('@')[0]
  const link = ({ isActive }) => 'adm-navlink' + (isActive ? ' on' : '')

  return (
    <div className="adm-app">
      <aside className="adm-side">
        <div className="adm-side-head">
          <span className="adm-logo">B</span>
          <div className="adm-side-brand"><strong>Bochile</strong><small>Real Estate · Panel</small></div>
        </div>

        <nav className="adm-nav">
          <span className="adm-nav-label">Gestión</span>
          <NavLink to="/admin" end className={link}><i>{I.props}</i> Propiedades</NavLink>
          <NavLink to="/admin/destacadas" className={link}><i>{I.star}</i> Destacadas</NavLink>
          <NavLink to="/admin/nueva" className={link}><i>{I.plus}</i> Nueva propiedad</NavLink>
        </nav>

        <div className="adm-side-foot">
          <a className="adm-navlink subtle" href="/" target="_blank" rel="noopener"><i>{I.web}</i> Ver la web</a>
          <div className="adm-user">
            <span className="adm-avatar">{name.slice(0, 1).toUpperCase()}</span>
            <div className="adm-user-info"><strong>{name}</strong><small>{email}</small></div>
            <button onClick={() => supabase.auth.signOut()} className="adm-logout" title="Cerrar sesión" aria-label="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="adm-content"><Outlet context={{ session }} /></main>
    </div>
  )
}

export const useAdmin = () => useOutletContext()
