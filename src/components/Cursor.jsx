import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  useEffect(() => {
    if (!window.matchMedia('(hover:hover)').matches) return
    const move = (e) => {
      gsap.to(dot.current, { x: e.clientX, y: e.clientY, duration: 0.12 })
      gsap.to(ring.current, { x: e.clientX, y: e.clientY, duration: 0.5, ease: 'power3.out' })
    }
    const over = (e) => {
      if (e.target.closest('a,button,[data-cursor]')) ring.current?.classList.add('hover')
    }
    const out = (e) => {
      if (e.target.closest('a,button,[data-cursor]')) ring.current?.classList.remove('hover')
    }
    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
    }
  }, [])
  return (
    <>
      <div className="cursor" ref={dot} />
      <div className="cursor-ring" ref={ring} />
    </>
  )
}
