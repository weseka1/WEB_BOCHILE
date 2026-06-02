import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { wa } from '../data/properties'
import { useLang } from '../i18n'

const WaIcon = () => (
  <svg viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.601 5.391l-.998 3.648 3.896-.738zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
)

export default function Nav() {
  const { lang, setLang, t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 80)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  // cerrar el menú mobile al navegar
  useEffect(() => { setOpen(false) }, [loc.pathname, loc.search, loc.hash])

  // bloquear el scroll del fondo con el drawer abierto + cerrar con Escape
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc) }
  }, [open])

  const waMsg = lang === 'en' ? 'Hi Camila, I come from the Bochile website 🙌' : 'Hola Camila, vengo de la web de Bochile 🙌'

  const LINKS = (
    <>
      <Link to="/propiedades?op=sale" data-cursor onClick={() => setOpen(false)}>{t.nav.comprar}</Link>
      <Link to="/propiedades?op=rent" data-cursor onClick={() => setOpen(false)}>{t.nav.alquilar}</Link>
      <Link to="/#tasacion" data-cursor onClick={() => setOpen(false)}>{t.nav.tasaciones}</Link>
      <Link to="/#contacto" data-cursor onClick={() => setOpen(false)}>{t.nav.contacto}</Link>
    </>
  )

  return (
    <nav className={'nav' + (scrolled ? ' scrolled' : '') + (open ? ' nav-open' : '')}>
      <div className="nav-in">
        <Link to="/" className="logo" data-cursor onClick={() => setOpen(false)}>
          <svg viewBox="0 0 22 28"><rect x="0" y="9" width="4.5" height="19" /><rect x="8.75" y="0" width="4.5" height="28" /><rect x="17.5" y="5" width="4.5" height="23" /></svg>
          BOCHILE <small>Real Estate</small>
        </Link>
        <div className="menu">{LINKS}</div>
        <div className="nav-right">
          <div className="lang">
            <button className={lang === 'es' ? 'on' : ''} data-cursor onClick={() => setLang('es')}>ES</button>
            <button className={lang === 'en' ? 'on' : ''} data-cursor onClick={() => setLang('en')}>EN</button>
          </div>
          <a className="pill green" data-cursor target="_blank" rel="noopener" href={wa(waMsg)}>
            <WaIcon /> <span className="pill-label">{t.nav.wa}</span>
          </a>
          <button className={'burger' + (open ? ' is-open' : '')} data-cursor
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      {/* Menú mobile (drawer) */}
      <div className={'nav-drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <nav className="nav-drawer-links">{LINKS}</nav>
        <div className="nav-drawer-foot">
          <div className="lang">
            <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          <a className="pill green" target="_blank" rel="noopener" href={wa(waMsg)} onClick={() => setOpen(false)}>
            <WaIcon /> {t.nav.wa}
          </a>
        </div>
      </div>
      <div className={'nav-scrim' + (open ? ' open' : '')} onClick={() => setOpen(false)} />
    </nav>
  )
}
