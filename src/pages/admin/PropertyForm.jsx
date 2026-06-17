import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, MEDIA_BUCKET } from '../../lib/supabase'
import { useAdmin } from './AdminLayout'

const TYPE_OPTS = ['Casa', 'Departamento', 'PH', 'Dúplex', 'Lote / Terreno', 'Local', 'Oficina', 'Galpón', 'Campo', 'Cochera', 'Otros']

const slugify = (s) => (s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'propiedad'
const genId = () => (globalThis.crypto?.randomUUID?.() || 'p' + Date.now().toString(36))
const numOrNull = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : null }
const intOrNull = (v) => { const n = parseInt(String(v ?? ''), 10); return Number.isFinite(n) ? n : null }

// Precio en formato argentino: el PUNTO es separador de miles ("580.000" = 580000),
// la COMA es decimal. Tolera "$", "ARS"/"USD", espacios y letras. Vacío => null (= "Consultar").
// (No usar parseFloat directo: "580.000" daría 580 y "13.000.000" daría 13.)
const parsePriceAR = (v) => {
  let s = String(v ?? '').trim()
  if (!s) return null
  s = s.replace(/[^\d.,-]/g, '')           // saca $, ARS/USD, espacios, etc.
  if (!s) return null
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')   // coma = decimal → puntos son miles
  else s = s.replace(/\./g, '')            // sin coma: el punto es separador de miles → sacarlo
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
// Vista previa de cómo va a figurar el precio (mismo formato que la web).
const previewPrice = (v, currency) => {
  const n = parsePriceAR(v)
  if (n == null) return 'Consultar'
  return currency === 'ARS' ? `$ ${n.toLocaleString('es-AR')} ARS` : `US$ ${n.toLocaleString('es-AR')}`
}

const EMPTY = {
  id: '', slug: '', op: 'sale', type_label: 'Casa', title: '', description: '',
  price: '', currency: 'USD', city: 'Bahía Blanca', barrio: '', zone: '', address: '',
  area: '', area_total: '', beds: '', baths: '', features: '',
  images: [], videos: [], pozo: false, apto_credito: false, featured: false, featured_rank: '', exclusive: false,
  published: true, status: 'published', url: '',
}

export default function PropertyForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const nav = useNavigate()
  const { session } = useAdmin()
  const [f, setF] = useState(EMPTY)
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [up, setUp] = useState('')   // texto de "subiendo…"
  const imgInput = useRef(null)
  const dragImg = useRef(null)        // índice de la foto que se está arrastrando
  const [dragOver, setDragOver] = useState(-1)

  useEffect(() => {
    if (!editing) return
    ;(async () => {
      const { data, error } = await supabase.from('properties').select('*').eq('id', id).single()
      if (error) { setErr(error.message); setLoading(false); return }
      setF({
        ...EMPTY, ...data,
        price: data.price ?? '', area: data.area ?? '', area_total: data.area_total ?? '',
        beds: data.beds ?? '', baths: data.baths ?? '', featured_rank: data.featured_rank ?? '',
        features: Array.isArray(data.features) ? data.features.join(', ') : '',
        images: Array.isArray(data.images) ? data.images : [],
        videos: Array.isArray(data.videos) ? data.videos : [],
      })
      setLoading(false)
    })()
  }, [id, editing])

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }))
  // Evita que la rueda del mouse cambie el valor de los campos numéricos al scrollear (bug del input type=number).
  const noWheel = (e) => e.currentTarget.blur()

  // ── subida a Supabase Storage ──────────────────────────────────────────────
  const upload = async (file, kind) => {
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const path = `${kind}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false })
    if (error) throw error
    return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl
  }

  const addImages = async (files) => {
    setErr(''); setUp(`Subiendo ${files.length} foto(s)…`)
    try {
      const urls = []
      for (const file of files) urls.push(await upload(file, 'images'))
      setF((s) => ({ ...s, images: [...s.images, ...urls] }))
    } catch (e) { setErr('Error subiendo fotos: ' + e.message) }
    setUp('')
  }
  const removeImage = (i) => setF((s) => ({ ...s, images: s.images.filter((_, k) => k !== i) }))
  const makeMain = (i) => setF((s) => { const im = [...s.images]; const [x] = im.splice(i, 1); return { ...s, images: [x, ...im] } })
  // Reordenar la galería: el orden del array ES el orden en la web; images[0] = portada.
  const moveImage = (from, to) => setF((s) => {
    if (to < 0 || to >= s.images.length || from === to) return s
    const im = [...s.images]; const [x] = im.splice(from, 1); im.splice(to, 0, x)
    return { ...s, images: im }
  })

  const addVideo = async (file) => {
    setErr(''); setUp('Subiendo video…')
    try {
      const src = await upload(file, 'videos')
      setF((s) => ({ ...s, videos: [...s.videos, { label: '', src, poster: '' }] }))
    } catch (e) { setErr('Error subiendo video: ' + e.message) }
    setUp('')
  }
  const setVideo = (i, patch) => setF((s) => ({ ...s, videos: s.videos.map((v, k) => (k === i ? { ...v, ...patch } : v)) }))
  const removeVideo = (i) => setF((s) => ({ ...s, videos: s.videos.filter((_, k) => k !== i) }))
  const addPoster = async (i, file) => {
    setUp('Subiendo poster…')
    try { setVideo(i, { poster: await upload(file, 'posters') }) }
    catch (e) { setErr('Error subiendo poster: ' + e.message) }
    setUp('')
  }

  // ── guardar ────────────────────────────────────────────────────────────────
  const save = async (e) => {
    e.preventDefault()
    if (!f.title.trim()) { setErr('El título es obligatorio.'); return }
    setSaving(true); setErr('')
    const images = f.images
    const payload = {
      id: f.id || genId(),
      slug: (f.slug || slugify(f.title || f.address)).trim(),
      op: f.op,
      type: f.type_label,
      type_label: f.type_label,
      badge: f.type_label,
      title: f.title.trim(),
      description: f.description || null,
      price: parsePriceAR(f.price),
      price_text: parsePriceAR(f.price) == null ? 'Consultar' : '',
      currency: f.currency,
      city: f.city || null,
      barrio: f.barrio || null,
      zone: f.zone || f.barrio || f.city || null,
      address: f.address || null,
      location: f.location || f.city || null,
      area: numOrNull(f.area),
      area_total: numOrNull(f.area_total),
      beds: intOrNull(f.beds),
      baths: intOrNull(f.baths),
      features: f.features ? f.features.split(',').map((x) => x.trim()).filter(Boolean) : [],
      images,
      main_image: images[0] || null,
      videos: f.videos.filter((v) => v.src),
      pozo: !!f.pozo,
      apto_credito: !!f.apto_credito,
      featured: !!f.featured,
      featured_rank: f.featured ? (intOrNull(f.featured_rank) ?? 50) : null,
      exclusive: !!f.exclusive,
      status: f.status || 'published',
      published: (f.status || 'published') === 'published',   // el trigger igual lo sincroniza
      url: f.url || null,
    }
    if (!editing) payload.created_by = session?.user?.id || null

    let { error } = await supabase.from('properties').upsert(payload, { onConflict: 'id' })
    // slug duplicado → reintento con sufijo
    if (error && /duplicate|unique/i.test(error.message) && !editing) {
      payload.slug = `${payload.slug}-${Date.now().toString(36).slice(-4)}`
      ;({ error } = await supabase.from('properties').upsert(payload, { onConflict: 'id' }))
    }
    setSaving(false)
    if (error) { setErr(error.message); return }
    nav('/admin')
  }

  if (loading) return <div className="adm-page"><div className="adm-loading"><div className="adm-spin" /> Cargando…</div></div>

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h2>{editing ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
          <p className="adm-muted">{editing ? `#${f.id}` : 'Cargá los datos y subí fotos / videos.'}</p>
        </div>
        <button type="button" className="adm-btn ghost" onClick={() => nav('/admin')}>← Volver</button>
      </div>

      {err && <div className="adm-err">{err}</div>}

      <form className="adm-form-grid" onSubmit={save}>
        {/* ── Datos principales ── */}
        <section className="adm-card">
          <h3>Datos</h3>
          <label>Título *<input value={f.title} onChange={set('title')} placeholder="Ej: Casa en Barrio Patagonia" required /></label>
          <div className="adm-row">
            <label>Operación
              <select value={f.op} onChange={(e) => setF((s) => ({ ...s, op: e.target.value, currency: e.target.value === 'rent' ? 'ARS' : 'USD' }))}>
                <option value="sale">Venta</option><option value="rent">Alquiler</option>
              </select>
            </label>
            <label>Tipo
              <input list="types" value={f.type_label} onChange={set('type_label')} />
              <datalist id="types">{TYPE_OPTS.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
          </div>
          <div className="adm-row">
            <label>Precio
              <input type="text" inputMode="decimal" value={f.price} onChange={set('price')} placeholder="Ej: 580.000  ·  vacío = Consultar" />
            </label>
            <label>Moneda
              <div className="adm-seg adm-cur-seg" role="group" aria-label="Moneda del precio">
                <button type="button" className={f.currency === 'USD' ? 'on' : ''} onClick={() => setF((s) => ({ ...s, currency: 'USD' }))}>US$ Dólares</button>
                <button type="button" className={f.currency === 'ARS' ? 'on' : ''} onClick={() => setF((s) => ({ ...s, currency: 'ARS' }))}>$ Pesos</button>
              </div>
            </label>
          </div>
          <small className="adm-hint adm-price-preview">Va a figurar en la web: <b>{previewPrice(f.price, f.currency)}</b></small>
          <label>Descripción<textarea rows={6} value={f.description} onChange={set('description')} /></label>
          <label>Características (separadas por coma)
            <input value={f.features} onChange={set('features')} placeholder="pileta, garage, parrilla, jardín" />
          </label>
        </section>

        {/* ── Ubicación + specs ── */}
        <section className="adm-card">
          <h3>Ubicación y medidas</h3>
          <div className="adm-row">
            <label>Ciudad<input value={f.city} onChange={set('city')} /></label>
            <label>Barrio<input value={f.barrio} onChange={set('barrio')} /></label>
          </div>
          <div className="adm-row">
            <label>Zona (filtro)<input value={f.zone} onChange={set('zone')} placeholder="Default: barrio o ciudad" /></label>
            <label>Dirección<input value={f.address} onChange={set('address')} /></label>
          </div>
          <div className="adm-row">
            <label>Sup. cubierta (m²)<input type="number" inputMode="decimal" value={f.area} onChange={set('area')} onWheel={noWheel} /></label>
            <label>Sup. total (m²)<input type="number" inputMode="decimal" value={f.area_total} onChange={set('area_total')} onWheel={noWheel} /></label>
          </div>
          <div className="adm-row">
            <label>Dormitorios / amb.<input type="number" inputMode="numeric" value={f.beds} onChange={set('beds')} onWheel={noWheel} /></label>
            <label>Baños<input type="number" inputMode="numeric" value={f.baths} onChange={set('baths')} onWheel={noWheel} /></label>
          </div>
          <label>Slug (URL)<input value={f.slug} onChange={set('slug')} placeholder={slugify(f.title || f.address)} /></label>
        </section>

        {/* ── Fotos ── */}
        <section className="adm-card adm-col-2">
          <h3>Fotos <small className="adm-muted">· arrastrá para ordenar · la 1ª es la portada</small></h3>
          <div className="adm-drop" onClick={() => imgInput.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addImages([...e.dataTransfer.files].filter((x) => x.type.startsWith('image/'))) }}>
            <input ref={imgInput} type="file" accept="image/*" multiple hidden
              onChange={(e) => { addImages([...e.target.files]); e.target.value = '' }} />
            Arrastrá fotos acá o <u>elegí archivos</u>
          </div>
          {f.images.length > 0 && (
            <div className="adm-thumbs">
              {f.images.map((src, i) => (
                <div className={'adm-thumb-item' + (i === 0 ? ' is-main' : '') + (dragOver === i ? ' is-dragover' : '')} key={src + i}
                  draggable
                  onDragStart={() => { dragImg.current = i }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(i) }}
                  onDragLeave={() => setDragOver((d) => (d === i ? -1 : d))}
                  onDrop={(e) => { e.preventDefault(); if (dragImg.current != null) moveImage(dragImg.current, i); dragImg.current = null; setDragOver(-1) }}
                  onDragEnd={() => { dragImg.current = null; setDragOver(-1) }}>
                  <img src={src} alt="" referrerPolicy="no-referrer" draggable={false} />
                  {i === 0 && <span className="adm-main-tag">Portada</span>}
                  <div className="adm-thumb-acts">
                    {i !== 0 && <button type="button" onClick={() => moveImage(i, i - 1)} title="Mover antes">◀</button>}
                    {i !== f.images.length - 1 && <button type="button" onClick={() => moveImage(i, i + 1)} title="Mover después">▶</button>}
                    {i !== 0 && <button type="button" onClick={() => makeMain(i)} title="Hacer portada">★</button>}
                    <button type="button" onClick={() => removeImage(i)} title="Quitar">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Videos ── */}
        <section className="adm-card adm-col-2">
          <h3>Recorridos en video</h3>
          <label className="adm-upbtn">
            + Subir video (.mp4)
            <input type="file" accept="video/*" hidden onChange={(e) => { if (e.target.files[0]) addVideo(e.target.files[0]); e.target.value = '' }} />
          </label>
          {f.videos.map((v, i) => (
            <div className="adm-video-row" key={v.src + i}>
              <video src={v.src} muted preload="metadata" />
              <div className="adm-video-fields">
                <input placeholder="Etiqueta (Ej: Exterior)" value={v.label || ''} onChange={(e) => setVideo(i, { label: e.target.value })} />
                <label className="adm-upbtn sm">
                  {v.poster ? 'Cambiar poster' : 'Subir poster (opcional)'}
                  <input type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files[0]) addPoster(i, e.target.files[0]); e.target.value = '' }} />
                </label>
                {v.poster && <img className="adm-poster" src={v.poster} alt="" referrerPolicy="no-referrer" />}
              </div>
              <button type="button" className="adm-btn sm danger" onClick={() => removeVideo(i)}>Quitar</button>
            </div>
          ))}
        </section>

        {/* ── Publicación ── */}
        <section className="adm-card adm-col-2">
          <h3>Publicación</h3>
          <label className="adm-field-status">Estado de publicación
            <select value={f.status} onChange={set('status')}>
              <option value="published">🟢 Publicada — visible en la web</option>
              <option value="paused">🟡 Pausada — fuera de la web (temporal)</option>
              <option value="finished">⚪ Finalizada — alquilada/vendida (archivo)</option>
              <option value="draft">🔵 Borrador — en preparación</option>
            </select>
          </label>
          <div className="adm-checks">
            <label className="adm-check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Destacada <span className="adm-hint">aparece en la home</span></label>
            <label className="adm-check"><input type="checkbox" checked={f.pozo} onChange={set('pozo')} /> En pozo <span className="adm-hint">preventa / construcción</span></label>
            <label className="adm-check"><input type="checkbox" checked={f.apto_credito} onChange={set('apto_credito')} /> Apto crédito <span className="adm-hint">califica para crédito hipotecario</span></label>
          </div>
          {f.featured && (
            <div className="adm-feat-hint">
              Para elegir el <b>orden</b> de las destacadas y cuál es la <b>estrella</b> (la card grande), usá la sección <b>⭐ Destacadas</b> del menú de arriba — se ve mucho más fácil ahí.
            </div>
          )}
        </section>

        <div className="adm-form-foot adm-col-2">
          {up && <span className="adm-uploading"><span className="adm-spin sm" /> {up}</span>}
          <button type="button" className="adm-btn ghost" onClick={() => nav('/admin')}>Cancelar</button>
          <button className="adm-btn primary" disabled={saving || !!up}>{saving ? 'Guardando…' : (editing ? 'Guardar cambios' : 'Crear propiedad')}</button>
        </div>
      </form>
    </div>
  )
}
