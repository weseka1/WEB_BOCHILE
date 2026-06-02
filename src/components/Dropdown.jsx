import { useEffect, useRef, useState } from 'react'

// Select custom (moderno): botón + panel animado, click-afuera, teclado.
export default function Dropdown({ value, onChange, options, placeholder, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [])

  return (
    <div className={'dd' + (open ? ' open' : '') + (className ? ' ' + className : '')} ref={ref}>
      <button type="button" className={'dd-btn' + (current ? '' : ' placeholder')} data-cursor onClick={() => setOpen((o) => !o)}>
        <span>{current ? current.label : placeholder}</span>
        <span className="car" />
      </button>
      {open && (
        <div className="dd-panel" role="listbox">
          {options.map((o) => (
            <div key={o.value} className={'dd-opt' + (o.value === value ? ' on' : '')} role="option"
              aria-selected={o.value === value} data-cursor
              onClick={() => { onChange(o.value); setOpen(false) }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
