import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fromRow, fmtPrice } from '../../data/properties'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function AdminProperties() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [vis, setVis] = useState('all')   // all | pub | hidden
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
    .filter((p) => (vis === 'all' ? true : vis === 'pub' ? p.published : !p.published))
    .filter((p) => (q ? norm(`${p.title} ${p.address} ${p.zone} ${p.type} ${p.id}`).includes(norm(q)) : true)),
    [rows, q, vis])

  const togglePub = async (p) => {
    setBusyId(p.id)
    const { error } = await supabase.from('properties').update({ published: !p.published }).eq('id', p.id)
    if (error) setErr(error.message)
    else setRows((rs) => rs.map((r) => (r.id === p.id ? { ...r, published: !r.published } : r)))
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

  const remove = async (p) => {
    if (!confirm(`¿Eliminar definitivamente "${p.title}"?\n\nSi solo querés sacarla de la web, usá "Bajar" (queda guardada).`)) return
    setBusyId(p.id)
    const { error } = await supabase.from('properties').delete().eq('id', p.id)
    if (error) setErr(error.message)
    else setRows((rs) => rs.filter((r) => r.id !== p.id))
    setBusyId(null)
  }

  const counts = useMemo(() => ({
    total: rows.length,
    pub: rows.filter((p) => p.published).length,
    hidden: rows.filter((p) => !p.published).length,
  }), [rows])

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h2>Propiedades</h2>
          <p className="adm-muted">{counts.total} en total · {counts.pub} publicadas · {counts.hidden} bajadas</p>
        </div>
        <Link to="/admin/nueva" className="adm-btn primary">+ Nueva propiedad</Link>
      </div>

      <div className="adm-toolbar">
        <input className="adm-search" placeholder="Buscar por título, dirección, zona, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="adm-seg">
          <button className={vis === 'all' ? 'on' : ''} onClick={() => setVis('all')}>Todas</button>
          <button className={vis === 'pub' ? 'on' : ''} onClick={() => setVis('pub')}>Publicadas</button>
          <button className={vis === 'hidden' ? 'on' : ''} onClick={() => setVis('hidden')}>Bajadas</button>
        </div>
      </div>

      {err && <div className="adm-err">{err}</div>}

      {loading ? (
        <div className="adm-loading"><div className="adm-spin" /> Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="adm-empty">No hay propiedades para ese filtro.</div>
      ) : (
        <div className="adm-table">
          <div className="adm-tr adm-th">
            <span>Foto</span><span>Propiedad</span><span>Tipo</span><span>Precio</span><span>Estado</span><span>Acciones</span>
          </div>
          {filtered.map((p) => (
            <div className={'adm-tr' + (p.published ? '' : ' is-hidden')} key={p.id}>
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
                  <em className="fl">{p.images.length} fotos</em>
                </span>
              </span>
              <span>{p.type}<br /><small className="adm-muted">{p.op === 'rent' ? 'Alquiler' : 'Venta'}</small></span>
              <span>{fmtPrice(p)}</span>
              <span>
                <button className={'adm-pub' + (p.published ? ' on' : '')} disabled={busyId === p.id} onClick={() => togglePub(p)}
                  title={p.published ? 'Publicada — click para bajar' : 'Bajada — click para publicar'}>
                  <i /> {p.published ? 'Publicada' : 'Bajada'}
                </button>
              </span>
              <span className="adm-actions">
                <button className={'adm-btn sm star' + (p.featured ? ' on' : '')} disabled={busyId === p.id}
                  onClick={() => toggleFeat(p)} title={p.featured ? 'Quitar de destacadas' : 'Marcar como destacada'}>
                  {p.featured ? '★' : '☆'}
                </button>
                <Link to={`/admin/${p.id}`} className="adm-btn sm">Editar</Link>
                <button className="adm-btn sm danger" disabled={busyId === p.id} onClick={() => remove(p)}>Eliminar</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
