import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { supabase, hasSupabase } from '../../lib/supabase'
import AdminLogin from './AdminLogin'
import '../../styles/admin.css'

// Shell del panel + guard de sesión (Supabase Auth). Sin sesión → muestra el login.
// Cualquier usuario logueado (dueño / vendedor) puede gestionar el catálogo.
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
        <p className="adm-muted">Falta configurar Supabase. Cargá <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en el <code>.env</code> y reiniciá.</p>
      </div></div>
    )
  }

  if (!ready) return <div className="adm-shell"><div className="adm-gate"><div className="adm-spin" /></div></div>

  if (!session) return <AdminLogin />

  const logout = () => supabase.auth.signOut()

  return (
    <div className="adm-shell">
      <header className="adm-top">
        <div className="adm-brand">
          <span className="adm-logo">B</span>
          <div>
            <strong>Bochile · Panel</strong>
            <small>Gestión de propiedades</small>
          </div>
        </div>
        <nav className="adm-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'on' : ''}>Propiedades</NavLink>
          <NavLink to="/admin/nueva" className={({ isActive }) => isActive ? 'on' : ''}>+ Nueva</NavLink>
          <Link to="/" target="_blank" rel="noopener">Ver web ↗</Link>
        </nav>
        <div className="adm-user">
          <span title={session.user?.email}>{session.user?.email}</span>
          <button onClick={logout} className="adm-btn ghost sm">Salir</button>
        </div>
      </header>
      <main className="adm-main">
        <Outlet context={{ session }} />
      </main>
    </div>
  )
}

export const useAdmin = () => useOutletContext()
