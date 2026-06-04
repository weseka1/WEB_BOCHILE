import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Login del equipo (dueños / vendedores). Las cuentas se crean a mano en
// Supabase → Authentication → Users (no hay registro público).
// Dominio interno: el equipo escribe solo su usuario (ej: "camipomerich") y
// completamos el email. Si ya escriben un email con @, se respeta tal cual.
const DOMAIN = '@bochile.com'
const toEmail = (v) => { const s = v.trim(); return s.includes('@') ? s : s + DOMAIN }

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(email), password: pass })
    setBusy(false)
    if (error) setErr(error.message === 'Invalid login credentials' ? 'Usuario o contraseña incorrectos.' : error.message)
    // onAuthStateChange en AdminLayout detecta la sesión y entra solo.
  }

  return (
    <div className="adm-shell">
      <div className="adm-gate">
        <span className="adm-logo big">B</span>
        <h1>Panel Bochile</h1>
        <p className="adm-muted">Ingresá para cargar, editar y publicar propiedades.</p>
        <form className="adm-form" onSubmit={submit}>
          <label>Usuario
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="tu usuario" required />
          </label>
          <label>Contraseña
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required />
          </label>
          {err && <div className="adm-err">{err}</div>}
          <button className="adm-btn primary" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
        </form>
      </div>
    </div>
  )
}
