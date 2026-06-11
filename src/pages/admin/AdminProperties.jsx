import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fromRow, fmtPrice } from '../../data/properties'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Estados de publicación tipo portal (ZonaProp / MercadoLibre). Solo "published" se ve en la web.
const STATUS = {
  published: { label: 'Publicada', short: 'Publicada', cls: 'st-pub' },
  paused: { label: 'Pausada', short: 'Pausada', cls: 'st-pause' },
  finished: { label: 'Finalizada', short: 'Finalizada', cls: 'st-fin' },
  draft: { label: 'Borrador', short: 'Borrador', cls: 'st-draft' },
}
const EDIT_STATES = ['published', 'paused', 'finished', 'draft']
const stOf = (p) => (p.status && STATUS[p.status] ? p.status : (p.published ? 'published' : 'draft'))

export default function AdminProperties() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [view, setView] = useState('all')   // all | published | paused | finished | draft | trash
  const [op, setOp] = useState('all')        // all | sale | rent | featured
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) setErr(error.message)
    setRows((data || []).map(fromRow))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => rows
    .filter((p) => (op === 'all' ? true : op === 'featured' ? p.featured : p.op === op))
    .filter((p) => (view === 'all' ? p.status !== 'trash' : p.status === view))
    .filter((p) => (q ? norm(`${p.title} ${p.address} ${p.zone} ${p.type} ${p.id}`).includes(norm(q)) : true)),
    [rows, q, view, op])

  // Cambiar de estado (incluye mandar a papelera con 'trash'). El trigger sincroniza published.
  const setStatus = async (p, status) => {
    setBusyId(p.id)
    const { error } = await supabase.from('properties').update({ status }).eq('id', p.id)
    if (error) setErr(error.message)
    else setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, status, published: status === 'published' } : r)))
    setBusyId(null)
  }

  const toggleFeat = async (p) => {
    setBusyId(p.id)
    const nextRank = p.featured ? null : (Math.max(-1, ...rows.filter((r) => r.featured).map((r) => r.featuredRank ?? 0)) + 1)
    const { error } = await supabase.from('properties').update({ featured: !p.featured, featured_rank: nextRank }).eq('id', p.id)
    if (error) setErr(error.message)
    else setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, featured: !r.featured, featuredRank: nextRank } : r)))
    setBusyId(null)
  }

  // Borrado DEFINITIVO (solo desde la papelera).
  const removeForever = async (p) => {
    if (!confirm(`¿Borrar DEFINITIVAMENTE "${p.title}"?\n\nEsto no se puede deshacer.`)) return
    setBusyId(p.id)
    const { error } = await supabase.from('properties').delete().eq('id', p.id)
    if (error) setErr(error.message)
    else setRows((rs) => rs.filter((r) => r.id !== p.id))
    setBusyId(null)
  }

  const counts = useMemo(() => {
    const c = { all: 0, published: 0, paused: 0, finished: 0, draft: 0, trash: 0 }
    for (const p of rows) { const s = stOf(p); c[s] = (c[s] || 0) + 1; if (s !== 'trash') c.all += 1 }
    return c
  }, [rows])

  const opCounts = useMemo(() => {
    const c = { all: 0, sale: 0, rent: 0, featured: 0 }
    for (const p of rows) { if (stOf(p) === 'trash') continue; c.all += 1; c[p.op] = (c[p.op] || 0) + 1; if (p.featured) c.featured += 1 }
    return c
  }, [rows])

  const OP_TABS = [
    { k: 'all', label: 'Todas' },
    { k: 'sale', label: 'Venta' },
    { k: 'rent', label: 'Alquiler' },
    { k: 'featured', label: '★ Destacadas' },
  ]

  const TABS = [
    { k: 'all', label: 'Todas' },
    { k: 'published', label: 'Publicadas' },
    { k: 'paused', label: 'Pausadas' },
    { k: 'finished', label: 'Finalizadas' },
    { k: 'draft', label: 'Borradores' },
    { k: 'trash', label: '🗑 Papelera' },
  ]
  const inTrash = view === 'trash'

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h2>Propiedades</h2>
          <p className="adm-muted">{opCounts.sale} en venta · {opCounts.rent} en alquiler · {opCounts.featured} destacadas · {counts.draft} borradores · {counts.trash} en papelera</p>
        </div>
        <Link to="/admin/nueva" className="adm-btn primary">+ Nueva propiedad</Link>
      </div>

      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Buscar por título, dirección, zona, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="adm-filters">
          <div className="adm-filtergroup">
            <span className="adm-filterlabel">Operación</span>
            <div className="adm-seg">
              {OP_TABS.map((t) => (
                <button key={t.k} className={op === t.k ? 'on' : ''} onClick={() => setOp(t.k)}>
                  {t.label}{opCounts[t.k] ? <em className="adm-seg-n">{opCounts[t.k]}</em> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="adm-filtergroup">
            <span className="adm-filterlabel">Estado</span>
            <div className="adm-seg adm-seg-wrap">
              {TABS.map((t) => (
                <button key={t.k} className={view === t.k ? 'on' : ''} onClick={() => setView(t.k)}>
                  {t.label}{counts[t.k] ? <em className="adm-seg-n">{counts[t.k]}</em> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {err && <div className="adm-err">{err}</div>}

      {loading ? (
        <div className="adm-loading"><div className="adm-spin" /> Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">{inTrash ? 'La papelera está vacía.' : 'No hay propiedades para ese filtro.'}</div>
      ) : (
        <div className="adm-table">
          <div className="adm-tr adm-th">
            <span>Foto</span><span>Propiedad</span><span>Tipo</span><span>Precio</span><span>Estado</span><span>Acciones</span>
          </div>
          {filtered.map((p) => {
            const st = stOf(p)
            return (
              <div className={'adm-tr' + (st !== 'published' ? ' is-hidden' : '')} key={p.id}>
                <span className="adm-thumb">
                  {p.img ? <img src={p.img} alt="" referrerPolicy="no-referrer" /> : <div className="adm-noimg" />}
                  {p.videos?.length > 0 && <i className="adm-badge-vid" title="Tiene video">▶</i>}
                </span>
                <span className="adm-cell-main">
                  <strong>{p.title}</strong>
                  <small>◦ {p.location}{p.address ? ' · ' + p.address : ''} · #{p.id}</small>
                  <span className="adm-flags">
                    {p.featured && <em className="fl gold">Destacada</em>}
                    {p.exclusive && <em className="fl">Exclusiva</em>}
                    {p.pozo && <em className="fl green">En pozo</em>}
                    {p.aptoCredito && <em className="fl green">Apto crédito</em>}
                    <em className="fl">{p.images.length} fotos</em>
                  </span>
                </span>
                <span>{p.type}<br /><small className="adm-muted">{p.op === 'rent' ? 'Alquiler' : 'Venta'}</small></span>
                <span>{fmtPrice(p)}</span>
                <span>
                  {inTrash ? (
                    <span className="adm-status-badge st-trash">🗑 En papelera</span>
                  ) : (
                    <select className={'adm-status ' + (STATUS[st]?.cls || '')} value={st} disabled={busyId === p.id}
                      onChange={(e) => setStatus(p, e.target.value)} title="Cambiar estado de publicación">
                      {EDIT_STATES.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
                    </select>
                  )}
                </span>
                <span className="adm-actions">
                  {inTrash ? (
                    <>
                      <button className="adm-btn sm" disabled={busyId === p.id} onClick={() => setStatus(p, 'draft')} title="Restaurar como borrador">↩ Restaurar</button>
                      <button className="adm-btn sm danger" disabled={busyId === p.id} onClick={() => removeForever(p)}>Borrar definitivo</button>
                    </>
                  ) : (
                    <>
                      <button className={'adm-btn sm star' + (p.featured ? ' on' : '')} disabled={busyId === p.id}
                        onClick={() => toggleFeat(p)} title={p.featured ? 'Quitar de destacadas' : 'Marcar como destacada'}>
                        {p.featured ? '★' : '☆'}
                      </button>
                      <Link to={`/admin/${p.id}`} className="adm-btn sm">Editar</Link>
                      <button className="adm-btn sm danger" disabled={busyId === p.id} onClick={() => setStatus(p, 'trash')} title="Mover a la papelera (recuperable)">🗑</button>
                    </>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
