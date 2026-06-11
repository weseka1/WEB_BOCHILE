import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { fromRow, fmtPrice } from '../../data/properties'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const MAX = 7   // la home muestra hasta 7 destacadas

export default function AdminFeatured() {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  const load = async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('properties').select('*')
    if (error) setErr(error.message)
    setAll((data || []).map(fromRow))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const feats = useMemo(
    () => all.filter((p) => p.featured).sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999)),
    [all],
  )
  const pool = useMemo(() => all
    .filter((p) => !p.featured && p.published)
    .filter((p) => (q ? norm(`${p.title} ${p.address} ${p.zone} ${p.id}`).includes(norm(q)) : true))
    .slice(0, 24), [all, q])

  // Reescribe los rangos 0..n-1 según el orden recibido.
  const writeRanks = (ids) => Promise.all(ids.map((id, i) =>
    supabase.from('properties').update({ featured: true, featured_rank: i }).eq('id', id)))

  // Aplica en el estado local: los de `ordered` quedan featured con su nuevo rank.
  const applyLocal = (ordered) => setAll((prev) => prev.map((p) => {
    const i = ordered.findIndex((o) => o.id === p.id)
    return i >= 0 ? { ...p, featured: true, featuredRank: i } : p
  }))

  const move = async (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= feats.length || busy) return
    const arr = [...feats]; [arr[i], arr[j]] = [arr[j], arr[i]]
    setBusy(true); setErr(''); applyLocal(arr)
    try { await writeRanks(arr.map((p) => p.id)) } catch (e) { setErr(e.message); await load() }
    setBusy(false)
  }

  const remove = async (p) => {
    if (busy) return
    setBusy(true); setErr('')
    const remaining = feats.filter((x) => x.id !== p.id)
    setAll((prev) => prev.map((x) => (x.id === p.id ? { ...x, featured: false, featuredRank: null } : x)))
    applyLocal(remaining)
    try {
      await supabase.from('properties').update({ featured: false, featured_rank: null }).eq('id', p.id)
      await writeRanks(remaining.map((x) => x.id))
    } catch (e) { setErr(e.message); await load() }
    setBusy(false)
  }

  const add = async (p) => {
    if (busy) return
    setBusy(true); setErr('')
    const order = [...feats, p]
    applyLocal(order)
    try { await writeRanks(order.map((x) => x.id)) } catch (e) { setErr(e.message); await load() }
    setBusy(false)
  }

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h2>Destacadas de la home</h2>
          <p className="adm-muted">Son las propiedades que aparecen en la sección <b>Destacadas</b> de la página de inicio.</p>
        </div>
        {busy && <span className="adm-uploading"><span className="adm-spin sm" /> Guardando…</span>}
      </div>

      <div className="adm-explainer">
        <span>⭐</span>
        <div>
          La <b>#1</b> es la <b>estrella</b> (la card grande de arriba) y es la <b>única que reproduce su 🎬 video</b> si tiene uno cargado. El resto aparecen como tarjetas con foto, en este orden.
          Se muestran <b>hasta {MAX}</b>. {feats.length < MAX && <>Si marcás menos de {MAX}, los lugares que faltan se completan solos con las más caras.</>}
        </div>
      </div>

      {err && <div className="adm-err">{err}</div>}

      {loading ? (
        <div className="adm-loading"><div className="adm-spin" /> Cargando…</div>
      ) : (
        <>
          {feats.length > MAX && (
            <div className="adm-warn">Tenés <b>{feats.length}</b> marcadas, pero la home muestra solo las primeras <b>{MAX}</b>. Quitá algunas o reordená para elegir cuáles.</div>
          )}

          <div className="adm-feat-list">
            {feats.length === 0 && <div className="adm-empty">No hay destacadas. Agregá abajo. 👇</div>}
            {feats.map((p, i) => (
              <div className={'adm-feat-item' + (i === 0 ? ' is-star' : '') + (i >= MAX ? ' is-over' : '')} key={p.id}>
                <div className="adm-feat-num">{i === 0 ? <span className="star">⭐</span> : i + 1}</div>
                <div className="adm-feat-thumb">{p.img ? <img src={p.img} alt="" referrerPolicy="no-referrer" /> : <div className="adm-noimg" />}</div>
                <div className="adm-feat-info">
                  <strong>{i === 0 && <em className="adm-star-tag">Estrella</em>} {p.title}</strong>
                  <small>{fmtPrice(p)} · {p.location}{p.videos?.length ? ' · 🎬 video' : ''}{!p.published ? ' · ⚠️ bajada (no se ve)' : ''}</small>
                </div>
                <div className="adm-feat-move">
                  <button disabled={i === 0 || busy} onClick={() => move(i, -1)} title="Subir">↑</button>
                  <button disabled={i === feats.length - 1 || busy} onClick={() => move(i, 1)} title="Bajar">↓</button>
                </div>
                <div className="adm-feat-acts">
                  <Link to={`/admin/${p.id}`} className="adm-btn sm">Editar</Link>
                  <button className="adm-btn sm danger" disabled={busy} onClick={() => remove(p)}>Quitar</button>
                </div>
              </div>
            ))}
          </div>

          <div className="adm-add-feat">
            <h3>Agregar a destacadas</h3>
            <input className="adm-search" placeholder="Buscar una propiedad para destacar…" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="adm-pool">
              {pool.length === 0 && <div className="adm-muted" style={{ padding: '10px 2px' }}>{q ? 'Sin resultados.' : 'Escribí para buscar una propiedad publicada.'}</div>}
              {pool.map((p) => (
                <div className="adm-pool-item" key={p.id}>
                  <div className="adm-feat-thumb sm">{p.img ? <img src={p.img} alt="" referrerPolicy="no-referrer" /> : <div className="adm-noimg" />}</div>
                  <div className="adm-feat-info">
                    <strong>{p.title}</strong>
                    <small>{fmtPrice(p)} · {p.location}</small>
                  </div>
                  <button className="adm-btn sm" disabled={busy} onClick={() => add(p)}>★ Destacar</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
