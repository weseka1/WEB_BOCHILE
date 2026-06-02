import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { camilaReply } from '../lib/camila'
import { PROPERTIES, fmtPrice, wa } from '../data/properties'
import { useLang } from '../i18n'

const byId = (id) => PROPERTIES.find((p) => p.id === id)

export default function CamilaBot() {
  const { lang, t } = useLang()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef(null)

  const greet = () => camilaReply('hola', lang)

  useEffect(() => {
    const openIt = () => setOpen(true)
    window.addEventListener('open-camila', openIt)
    return () => window.removeEventListener('open-camila', openIt)
  }, [])

  useEffect(() => {
    if (open && msgs.length === 0) {
      const g = greet()
      setMsgs([{ who: 'them', text: g.text, quick: g.chips }])
    }
  }, [open])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  const send = (text) => {
    const v = (text ?? input).trim()
    if (!v) return
    setInput('')
    setMsgs((m) => [...m, { who: 'me', text: v }])
    setTyping(true)
    setTimeout(() => {
      const r = camilaReply(v, lang)
      setTyping(false)
      setMsgs((m) => [...m, { who: 'them', text: r.text, props: r.props, quick: r.chips, wa: r.wa, goto: r.goto }])
      if (r.goto) document.querySelector(r.goto)?.scrollIntoView({ behavior: 'smooth' })
    }, 750)
  }

  return (
    <>
      {!open && (
        <button className="cb-fab" data-cursor onClick={() => setOpen(true)} aria-label="Abrir Camila">
          <span className="av">C</span>
          <span className="tx">Camila<small>{lang === 'en' ? 'Online' : 'En línea'}</small></span>
        </button>
      )}

      {open && (
        <div className="cb-panel">
          <div className="cb-head">
            <span className="av">C</span>
            <div>
              <div className="nm">Camila · Bochile</div>
              <div className="st"><i />{t.camila.online}</div>
            </div>
            <button className="cb-x" data-cursor onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
          </div>

          <div className="cb-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'contents' }}>
                <div className={'cb-msg ' + m.who}>{m.text}</div>
                {m.props && (
                  <div className="cb-cards">
                    {m.props.map((id) => {
                      const p = byId(id); if (!p) return null
                      return (
                        <Link className="cb-card" key={id} data-cursor to={`/propiedad/${p.slug}`} onClick={() => setOpen(false)}>
                          <img src={p.img} alt="" referrerPolicy="no-referrer" />
                          <div><div className="cn">{p.title}</div><div className="cp">{fmtPrice(p)} · {p.location}</div></div>
                          <span className="go">→</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
                {m.wa && (
                  <a className="cb-card" data-cursor target="_blank" rel="noopener" href={wa('Hola Camila, quiero que me avises cuando entre algo 🙌')}>
                    <span className="av" style={{ width: 40, height: 40, borderRadius: 10 }}>✓</span>
                    <div><div className="cn">{lang === 'en' ? 'Notify me on WhatsApp' : 'Avisarme por WhatsApp'}</div><div className="cp">{lang === 'en' ? 'Tap to continue' : 'Tocá para seguir'}</div></div>
                    <span className="go">→</span>
                  </a>
                )}
                {m.quick && (
                  <div className="cb-quick">
                    {m.quick.map((c) => <button key={c} data-cursor onClick={() => send(c)}>{c}</button>)}
                  </div>
                )}
              </div>
            ))}
            {typing && <div className="cb-msg them"><div className="cb-typing"><i /><i /><i /></div></div>}
          </div>

          <div className="cb-foot">
            <input value={input} onChange={(e) => setInput(e.target.value)} data-cursor
              placeholder={lang === 'en' ? 'Type your message…' : 'Escribí tu mensaje…'}
              onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button data-cursor onClick={() => send()} aria-label="Enviar">
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
