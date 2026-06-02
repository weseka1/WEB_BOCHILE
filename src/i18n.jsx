import { createContext, useContext, useState } from 'react'

export const DICT = {
  es: {
    nav: { comprar: 'Comprar', alquilar: 'Alquilar', tasaciones: 'Tasaciones', contacto: 'Contacto', wa: 'WhatsApp' },
    hero: {
      eyebrow: 'Inmobiliaria en Bahía Blanca · desde 1970',
      headline: 'El lugar correcto, desde 1970.',
      sub: 'Compra, venta y alquiler en Bahía Blanca y la región, con el asesoramiento de la inmobiliaria de siempre.',
      ctaProps: 'Ver propiedades',
      ctaTasa: 'Tasación sin cargo',
    },
    svc: {
      title1: 'Estamos para', title2: 'asesorarlo.',
      sub: 'Comprar, vender o alquilar de acuerdo a sus necesidades. Medio siglo de experiencia en Bahía Blanca avalan nuestra trayectoria.',
      items: [
        { t: 'Venta', d: 'Compre o venda con un asesor que lo acompaña en cada paso.', cta: 'Ver propiedades', to: '/propiedades?op=sale' },
        { t: 'Alquiler', d: 'Encuentre el lugar que busca, con la confianza de siempre.', cta: 'Ver alquileres', to: '/propiedades?op=rent' },
        { t: 'Tasaciones', d: 'Sepa cuánto vale su propiedad. Profesional y sin cargo.', cta: 'Pedir tasación', to: '#tasacion' },
        { t: 'Atención personalizada', d: 'Lo atendemos directo, por WhatsApp o en Caronti 360.', cta: 'Escribirnos', to: 'wa' },
      ],
    },
    props: { title1: 'Propiedades', title2: 'destacadas', sub: 'Una selección de propiedades en venta en Bahía Blanca y la región.', hint: 'Ver detalle', consultar: 'Consultar', viewall: 'Ver todas las propiedades' },
    cat: { kicker: 'Catálogo', title: 'Propiedades', sub: 'Encuentre su próxima propiedad en Bahía Blanca y la región. Filtre por operación, tipo, zona y presupuesto.', op: 'Operación', sale: 'Comprar', rent: 'Alquilar', type: 'Tipo', alltypes: 'Todos los tipos', zone: 'Zona', allzones: 'Toda la región', price: 'Presupuesto', anyprice: 'Sin límite', upto: 'Hasta', over: 'Más de', search: 'Buscar por nombre, calle o zona…', results: 'propiedades', none: 'No encontramos propiedades con esos filtros. Pruebe ampliar la búsqueda o escríbanos por WhatsApp y la conseguimos.', rentEmpty: 'Estamos renovando nuestra cartera de alquileres.', rentEmptySub: 'Contamos con unidades que aún no publicamos online. Escríbanos por WhatsApp y le ayudamos a encontrar lo que busca — o le avisamos apenas ingresen nuevas.', more: 'Ver más', back: 'Volver al inicio', consultar: 'Consultar' },
    detail: { back: 'Volver al catálogo', photos: 'fotos', description: 'Descripción', features: 'Características', consultar: 'Consultar por WhatsApp', note: 'Lo atiende un asesor de Bochile, sin compromiso.', area: 'Superficie', beds: 'Dormitorios', amb: 'Ambientes', baths: 'Baños', type: 'Tipo', allphotos: 'Todas las fotos', notfound: 'No encontramos esa propiedad.', location: 'Ubicación', maps: 'Abrir en Maps', streetview: 'Street View', directions: 'Cómo llegar', mapnote: 'Ubicación aproximada según la zona publicada.' },
    camila: { online: 'EN LÍNEA' },
    marca: { quote: 'Medio siglo encontrando el lugar correcto en Bahía Blanca.', sub: 'Desde 1970 acompañamos a cada familia con la misma confianza de siempre. La experiencia avala nuestra trayectoria.', tag: 'Desde 1970 · Bahía Blanca' },
    tasa: { badge: 'Tasación 100% sin cargo', title1: '¿Cuánto vale', title2: 'su propiedad?', sub: 'La tasamos gratis y coordinamos todo por WhatsApp. Medio siglo captando propiedades en Bahía Blanca nos respalda.', perks: ['Respuesta en menos de 24 horas', 'Sin compromiso ni costo', 'El mejor precio del mercado'], formhead: 'Empiece acá ↓', submit: 'Quiero mi tasación gratis', note: 'Lo atiende un asesor de Bochile, sin compromiso.', f: { nombre: 'Su nombre', tel: 'WhatsApp', tipo: 'Tipo de propiedad', zona: 'Zona o dirección aproximada', opts: ['Casa', 'Departamento', 'Terreno', 'Local / Oficina', 'Otro'] } },
    contact: { title1: 'Su próxima propiedad', title2: 'empieza con un mensaje.', cta: 'Escríbanos por WhatsApp', address: 'Caronti 360, 8000 Bahía Blanca', phones: ['(291) 453-7816', '(291) 451-7040', '(291) 452-9622'], email: 'info@bochile.com', hours: 'Lunes a Viernes · 9 a 16 h' },
    footer: { rights: '© 2026 Inmobiliaria Bochile · Desde 1970 en Bahía Blanca.', made: 'Sitio por WESEKA.IA' },
  },
  en: {
    nav: { comprar: 'Buy', alquilar: 'Rent', tasaciones: 'Valuation', contacto: 'Contact', wa: 'WhatsApp' },
    hero: {
      eyebrow: 'Real estate in Bahía Blanca · since 1970',
      headline: 'The right place, since 1970.',
      sub: 'Buying, selling and renting across Bahía Blanca and the region, with the guidance of the agency you’ve always trusted.',
      ctaProps: 'View properties',
      ctaTasa: 'Free valuation',
    },
    svc: {
      title1: 'Here to', title2: 'advise you.',
      sub: 'Buy, sell or rent — tailored to your needs. Half a century of experience in Bahía Blanca backs our track record.',
      items: [
        { t: 'Sales', d: 'Buy or sell with an advisor guiding you every step.', cta: 'View properties', to: '/propiedades?op=sale' },
        { t: 'Rentals', d: 'Find the place you’re after, with the trust of always.', cta: 'View rentals', to: '/propiedades?op=rent' },
        { t: 'Valuations', d: 'Know what your property is worth. Professional, free.', cta: 'Request valuation', to: '#tasacion' },
        { t: 'Personal service', d: 'We assist you directly — on WhatsApp or at Caronti 360.', cta: 'Message us', to: 'wa' },
      ],
    },
    props: { title1: 'Featured', title2: 'properties', sub: 'A selection of properties for sale in Bahía Blanca and the region.', hint: 'View detail', consultar: 'Enquire', viewall: 'View all properties' },
    cat: { kicker: 'Catalogue', title: 'Properties', sub: 'Find your next property in Bahía Blanca and the region. Filter by listing, type, area and budget.', op: 'Listing', sale: 'Buy', rent: 'Rent', type: 'Type', alltypes: 'All types', zone: 'Area', allzones: 'All regions', price: 'Budget', anyprice: 'Any', upto: 'Up to', over: 'Over', search: 'Search by name, street or area…', results: 'properties', none: 'No properties match these filters. Try widening your search or message us on WhatsApp and we’ll find it.', rentEmpty: 'We’re refreshing our rental portfolio.', rentEmptySub: 'We have units not yet listed online. Message us on WhatsApp and we’ll help you find what you’re after — or let you know as soon as new ones come in.', more: 'See more', back: 'Back home', consultar: 'Enquire' },
    detail: { back: 'Back to catalogue', photos: 'photos', description: 'Description', features: 'Features', consultar: 'Enquire on WhatsApp', note: 'A Bochile advisor will assist you, no obligation.', area: 'Area', beds: 'Bedrooms', amb: 'Rooms', baths: 'Bathrooms', type: 'Type', allphotos: 'All photos', notfound: 'We couldn’t find that property.', location: 'Location', maps: 'Open in Maps', streetview: 'Street View', directions: 'Directions', mapnote: 'Approximate location based on the published area.' },
    camila: { online: 'ONLINE' },
    marca: { quote: 'Half a century finding the right place in Bahía Blanca.', sub: 'Since 1970 we’ve guided every family with the same trust as always. Experience backs our track record.', tag: 'Since 1970 · Bahía Blanca' },
    tasa: { badge: '100% free valuation', title1: 'What is your', title2: 'property worth?', sub: 'We value it for free and arrange everything on WhatsApp. Half a century listing properties in Bahía Blanca backs us.', perks: ['Reply in under 24 hours', 'No cost, no commitment', 'The best price on the market'], formhead: 'Start here ↓', submit: 'Get my free valuation', note: 'A Bochile advisor will assist you, no obligation.', f: { nombre: 'Your name', tel: 'WhatsApp', tipo: 'Property type', zona: 'Area or approximate address', opts: ['House', 'Apartment', 'Land', 'Retail / Office', 'Other'] } },
    contact: { title1: 'Your next property', title2: 'starts with a message.', cta: 'Message us on WhatsApp', address: 'Caronti 360, 8000 Bahía Blanca', phones: ['(291) 453-7816', '(291) 451-7040', '(291) 452-9622'], email: 'info@bochile.com', hours: 'Monday to Friday · 9 to 16 h' },
    footer: { rights: '© 2026 Inmobiliaria Bochile · Since 1970 in Bahía Blanca.', made: 'Site by WESEKA.IA' },
  },
}

const LangCtx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState('es')
  const t = DICT[lang]
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
