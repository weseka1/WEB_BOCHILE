import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LangProvider } from './i18n'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import CamilaBot from './components/CamilaBot'
import WhatsAppMenu from './components/WhatsAppMenu'
import Home from './pages/Home'
import Propiedades from './pages/Propiedades'
import PropertyDetail from './pages/PropertyDetail'

// Panel admin: lazy → no infla el bundle de la web pública.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminProperties = lazy(() => import('./pages/admin/AdminProperties'))
const PropertyForm = lazy(() => import('./pages/admin/PropertyForm'))

gsap.registerPlugin(ScrollTrigger)
const QA = typeof location !== 'undefined' && location.search.includes('qa')

function RouteFx({ lenisRef }) {
  const loc = useLocation()
  useEffect(() => {
    if (loc.hash) {
      const el = document.querySelector(loc.hash)
      if (el) { setTimeout(() => lenisRef.current?.scrollTo(el, { offset: -70 }), 200); return }
    }
    lenisRef.current?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    if (QA) gsap.set('.reveal', { opacity: 1, y: 0 })
    const b = ScrollTrigger.batch('.reveal', {
      start: 'top 90%',
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, overwrite: true }),
    })
    const t = setTimeout(() => ScrollTrigger.refresh(), 360)
    return () => { b.forEach((s) => s.kill()); clearTimeout(t) }
  }, [loc.pathname])

  // Scroll por hash AUNQUE ya estés en la misma página (Tasaciones/Contacto desde la home).
  useEffect(() => {
    if (!loc.hash) return
    let tries = 0
    const tick = () => {
      const el = document.querySelector(loc.hash)
      if (el && lenisRef.current) lenisRef.current.scrollTo(el, { offset: -70 })
      else if (tries++ < 25) id = setTimeout(tick, 80)
    }
    let id = setTimeout(tick, 80)
    return () => clearTimeout(id)
  }, [loc.hash, loc.key])
  return null
}

function AppInner() {
  const lenisRef = useRef(null)
  const loc = useLocation()
  const isAdmin = loc.pathname.startsWith('/admin')

  // Smooth scroll (Lenis) + atajos de ancla: SOLO en la web pública, nunca en el panel.
  useEffect(() => {
    if (isAdmin) return
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(raf); lenis.destroy(); lenisRef.current = null }
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) return
    const click = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const id = a.getAttribute('href')
      if (id.length > 1) {
        const el = document.querySelector(id)
        if (el) { e.preventDefault(); lenisRef.current?.scrollTo(el, { offset: -70 }) }
      }
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [isAdmin])

  return (
    <>
      {!isAdmin && <Cursor />}
      {!isAdmin && <Nav />}
      {!isAdmin && <RouteFx lenisRef={lenisRef} />}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home lenisRef={lenisRef} />} />
          <Route path="/propiedades" element={<Propiedades />} />
          <Route path="/propiedad/:slug" element={<PropertyDetail />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminProperties />} />
            <Route path="nueva" element={<PropertyForm />} />
            <Route path=":id" element={<PropertyForm />} />
          </Route>
        </Routes>
      </Suspense>
      {!isAdmin && <CamilaBot />}
      {!isAdmin && <WhatsAppMenu />}
    </>
  )
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </LangProvider>
  )
}
