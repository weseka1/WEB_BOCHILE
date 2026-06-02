import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLang } from '../i18n'

export default function Trayectoria() {
  const { t } = useLang()
  const num = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: num.current, start: 'top 78%', once: true,
        onEnter: () => gsap.to({ v: 0 }, {
          v: 56, duration: 2, ease: 'power2.out',
          onUpdate: function () { if (num.current) num.current.childNodes[0].textContent = Math.round(this.targets()[0].v) },
        }),
      })
    })
    return () => ctx.revert()
  }, [])
  return (
    <section className="section trj">
      <div className="wrap trj-grid">
        <div>
          <div className="sec-index reveal" style={{ marginBottom: 18 }}>[ {t.tray.index} ]</div>
          <div className="trj-num" ref={num}>0<span>+</span>
            <small>{t.tray.label}</small>
          </div>
        </div>
        <div className="trj-rows">
          {t.tray.rows.map(([k, v]) => (
            <div className="r reveal" key={k}><span>{k}</span><b>{v}</b></div>
          ))}
        </div>
      </div>
    </section>
  )
}
