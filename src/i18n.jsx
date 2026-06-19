import { createContext, useContext, useState } from 'react'

export const DICT = {
  es: {
    nav: { comprar: 'Comprar', alquilar: 'Alquilar', tasaciones: 'Tasaciones', empresas: 'Empresas', inversion: 'Vaca Muerta', nosotros: 'Nosotros', contacto: 'Contacto', wa: 'WhatsApp' },
    hero: {
      eyebrow: 'Real Estate en Bahía Blanca · desde 1970',
      headline: 'El lugar correcto, desde 1970.',
      sub: 'Compra, venta y alquiler en Bahía Blanca y la región, con el asesoramiento de siempre.',
      ctaProps: 'Ver propiedades',
      ctaTasa: 'Solicitar tasación',
    },
    svc: {
      title1: 'Estamos para', title2: 'asesorarlo.',
      sub: 'Comprar, vender o alquilar de acuerdo a sus necesidades. Más de 50 años de experiencia en Bahía Blanca avalan nuestra trayectoria.',
      items: [
        { t: 'Venta', d: 'Compre o venda con un asesor que lo acompaña en cada paso.', cta: 'Ver propiedades', to: '/propiedades?op=sale' },
        { t: 'Alquiler', d: 'Encuentre el lugar que busca, con la confianza de siempre.', cta: 'Ver alquileres', to: '/propiedades?op=rent' },
        { t: 'Tasaciones', d: 'Sepa cuánto vale su propiedad, con una tasación profesional.', cta: 'Pedir tasación', to: '#tasacion' },
        { t: 'Atención personalizada', d: 'Lo atendemos directo, por WhatsApp o en Caronti 360.', cta: 'Escribirnos', to: 'wa' },
      ],
    },
    props: { kicker: 'Selección exclusiva', title1: 'Propiedades', title2: 'destacadas', sub: 'Las propiedades más exclusivas de nuestra cartera en Bahía Blanca y la región.', star: 'Propiedad estrella', exclusive: 'Exclusiva', viewprop: 'Ver propiedad', photos: 'fotos', hint: 'Ver detalle', consultar: 'Consultar', viewall: 'Ver todas las propiedades' },
    cat: { kicker: 'Catálogo', title: 'Propiedades', sub: 'Encuentre su próxima propiedad en Bahía Blanca y la región. Filtre por operación, tipo, ubicación y presupuesto.', op: 'Operación', sale: 'Comprar', rent: 'Alquilar', type: 'Tipo', alltypes: 'Todos los tipos', beds: 'Dormitorios', bedsOpts: [{ v: 'mono', l: 'Monoambiente' }, { v: '1', l: '1 dormitorio' }, { v: '2', l: '2 dormitorios' }, { v: '3', l: '3 dormitorios' }, { v: '4', l: '4 o más' }], zone: 'Zona', allzones: 'Toda la región', region: 'Región', allregions: 'Toda la región', city: 'Ciudad', allcities: 'Todas las ciudades', pozo: 'En pozo', credito: 'Apto crédito', creditoMsg: 'Hola, busco propiedades aptas para crédito hipotecario. ¿Qué opciones tienen disponibles?', price: 'Presupuesto', anyprice: 'Sin límite', upto: 'Hasta', over: 'Más de', search: 'Buscar por nombre, calle o zona…', results: 'propiedades', none: 'No encontramos propiedades con esos filtros. Pruebe ampliar la búsqueda o escríbanos por WhatsApp y la conseguimos.', rentEmpty: 'Estamos renovando nuestra cartera de alquileres.', rentEmptySub: 'Contamos con unidades que aún no publicamos online. Escríbanos por WhatsApp y le ayudamos a encontrar lo que busca — o le avisamos apenas ingresen nuevas.', rentNoMatch: 'No encontramos alquileres con esos filtros.', rentNoMatchSub: 'Pruebe ampliar la búsqueda, o escríbanos por WhatsApp y le avisamos apenas ingrese una unidad que encaje con lo que busca.', noPhoto: 'Fotos a pedido', more: 'Ver más', back: 'Volver al inicio', consultar: 'Consultar' },
    detail: { back: 'Volver al catálogo', photos: 'fotos', description: 'Descripción', features: 'Características', consultar: 'Consultar por WhatsApp', note: 'Lo atiende un asesor de Bochile, sin compromiso.', area: 'Superficie total', beds: 'Dormitorios', amb: 'Ambientes', baths: 'Baños', type: 'Tipo', allphotos: 'Todas las fotos', videoTour: 'Recorrido en video', notfound: 'No encontramos esa propiedad.', location: 'Ubicación', maps: 'Abrir en Maps', streetview: 'Street View', directions: 'Cómo llegar', mapnote: 'Ubicación aproximada según la zona publicada.' },
    camila: { online: 'EN LÍNEA' },
    waMenu: { title: 'Estamos para ayudarlo', sub: 'Elija el área y un asesor lo atiende por WhatsApp.', ventas: 'Ventas', alquileres: 'Alquileres', tasaciones: 'Tasaciones', galpones: 'Galpones y pedidos especiales', vacamuerta: 'Vaca Muerta', general: 'Consulta general', open: 'Abrir WhatsApp', close: 'Cerrar' },
    marca: { quote: 'Más de 50 años encontrando el lugar correcto en Bahía Blanca.', sub: 'Desde 1970 acompañamos a cada familia con la misma confianza de siempre. La experiencia avala nuestra trayectoria.', tag: 'Desde 1970 · Bahía Blanca' },
    nosotros: {
      kicker: 'Sobre nosotros',
      title1: 'Más de 50 años', title2: 'de confianza.',
      sub: 'Desde 1970 acompañamos a las familias de Bahía Blanca y la región a encontrar el lugar correcto.',
      story: [
        'Bochile nació en Bahía Blanca en 1970 y desde entonces creció de la mano de la ciudad: cada barrio, cada zona y cada familia que confió en nosotros forma parte de nuestra historia.',
        'Conocemos el mercado local como pocos. Esa experiencia —más de 50 años comprando, vendiendo y tasando— es la que ponemos al servicio de cada persona que nos elige.',
        'Trabajamos como siempre lo hicimos: de cerca, con la palabra por delante y con la tranquilidad de saber que del otro lado hay alguien que conoce el oficio.',
      ],
      since: 'Caronti 360, Bahía Blanca · desde 1970',
      teamHead: 'Las personas detrás de Bochile',
      teamNote: 'El equipo que lo acompaña en cada operación.',
      why: [
        { t: '50 años de trayectoria', d: 'Más de 50 años operando en Bahía Blanca nos respalda. La experiencia no se improvisa.' },
        { t: 'Conocemos la zona', d: 'Bahía Blanca y la región, barrio por barrio. Sabemos dónde está el valor real.' },
        { t: 'Atención personalizada', d: 'Lo atiende una persona, no un formulario. De principio a fin.' },
        { t: 'Confianza, siempre', d: 'La misma palabra desde 1970. Generaciones de familias ya encontraron su lugar con nosotros.' },
      ],
    },
    empresas: {
      kicker: 'Empresas',
      title1: 'Soluciones para', title2: 'su empresa.',
      sub: 'Depósitos, galpones, oficinas y locales en Bahía Blanca y la región. ¿Necesita algo puntual o una búsqueda a medida? Lo gestionamos con la cercanía de siempre.',
      cta: 'Contacto comercial',
      waMsg: 'Hola Bochile, escribo en nombre de una empresa. Estamos buscando un espacio (depósito / galpón / oficina / local). ¿Podemos coordinar?',
      cats: [
        { t: 'Galpones y depósitos', d: 'Logística, almacenamiento e industria.', to: '/propiedades?type=Galpón' },
        { t: 'Oficinas', d: 'Espacios de trabajo en la ciudad.', to: '/propiedades?type=Oficina' },
        { t: 'Locales comerciales', d: 'Puntos a la calle y en zonas clave.', to: '/propiedades?type=Local' },
        { t: 'Pedidos especiales', d: 'Búsquedas a medida que no están publicadas.', to: '' },
      ],
    },
    inversion: {
      kicker: 'Inversión en Neuquén',
      title1: 'Vaca', title2: 'Muerta.',
      sub: 'Venta de lotes, departamentos y fideicomisos en Vaca Muerta, una de las zonas de mayor crecimiento del país. Lo coordinamos con un asesor de Bochile.',
      cta: 'Consultar por Vaca Muerta',
      waMsg: 'Hola, quiero consultar por inversiones en Vaca Muerta (lotes, departamentos, fideicomisos).',
      cats: [
        { t: 'Lotes', d: 'Lotes en venta en Añelo y la zona de Vaca Muerta.', wa: 'Hola, quiero consultar por LOTES en Vaca Muerta (Añelo, Neuquén).' },
        { t: 'Departamentos', d: 'Unidades para invertir o rentar en el corazón de la actividad.', wa: 'Hola, quiero consultar por DEPARTAMENTOS en Vaca Muerta (Neuquén).' },
        { t: 'Fideicomisos', d: 'Súmese a proyectos de construcción con respaldo y escala. Lo coordina un asesor especializado.', wa: 'Hola, quiero consultar por FIDEICOMISOS en Vaca Muerta.' },
      ],
    },
    tasa: { badge: 'Tasación profesional', title1: '¿Cuánto vale', title2: 'su propiedad?', sub: 'La coordinamos por WhatsApp, rápido y sin vueltas. Más de 50 años captando propiedades en Bahía Blanca nos respalda.', perks: ['Respuesta en menos de 24 horas', 'Atención sin compromiso', 'El mejor precio del mercado'], formhead: 'Empiece acá ↓', submit: 'Quiero mi tasación', note: 'Lo atiende un asesor de Bochile, sin compromiso.', f: { nombre: 'Su nombre', tel: 'WhatsApp', tipo: 'Tipo de propiedad', zona: 'Zona o dirección aproximada', opts: ['Casa', 'Departamento', 'Terreno', 'Local / Oficina', 'Otro'] } },
    contact: { title1: 'Su próxima propiedad', title2: 'empieza con un mensaje.', cta: 'Escríbanos por WhatsApp', address: 'Caronti 360, 8000 Bahía Blanca', phones: ['(291) 453-7816', '(291) 451-7040', '(291) 452-9622'], email: 'info@bochile.com', hours: 'Lunes a Viernes · 9 a 16 h' },
    footer: { rights: '© 2026 Bochile Real Estate · Desde 1970 en Bahía Blanca.', made: 'Sitio por WESEKA.IA' },
  },
  en: {
    nav: { comprar: 'Buy', alquilar: 'Rent', tasaciones: 'Valuation', empresas: 'Business', inversion: 'Vaca Muerta', nosotros: 'About', contacto: 'Contact', wa: 'WhatsApp' },
    hero: {
      eyebrow: 'Real estate in Bahía Blanca · since 1970',
      headline: 'The right place, since 1970.',
      sub: 'Buying, selling and renting across Bahía Blanca and the region, with the guidance you’ve always trusted.',
      ctaProps: 'View properties',
      ctaTasa: 'Request valuation',
    },
    svc: {
      title1: 'Here to', title2: 'advise you.',
      sub: 'Buy, sell or rent — tailored to your needs. Over 50 years of experience in Bahía Blanca backs our track record.',
      items: [
        { t: 'Sales', d: 'Buy or sell with an advisor guiding you every step.', cta: 'View properties', to: '/propiedades?op=sale' },
        { t: 'Rentals', d: 'Find the place you’re after, with the trust of always.', cta: 'View rentals', to: '/propiedades?op=rent' },
        { t: 'Valuations', d: 'Know what your property is worth, with a professional valuation.', cta: 'Request valuation', to: '#tasacion' },
        { t: 'Personal service', d: 'We assist you directly — on WhatsApp or at Caronti 360.', cta: 'Message us', to: 'wa' },
      ],
    },
    props: { kicker: 'Exclusive selection', title1: 'Featured', title2: 'properties', sub: 'The most exclusive listings in our portfolio across Bahía Blanca and the region.', star: 'Flagship listing', exclusive: 'Exclusive', viewprop: 'View property', photos: 'photos', hint: 'View detail', consultar: 'Enquire', viewall: 'View all properties' },
    cat: { kicker: 'Catalogue', title: 'Properties', sub: 'Find your next property in Bahía Blanca and the region. Filter by listing, type, location and budget.', op: 'Listing', sale: 'Buy', rent: 'Rent', type: 'Type', alltypes: 'All types', beds: 'Bedrooms', bedsOpts: [{ v: 'mono', l: 'Studio' }, { v: '1', l: '1 bedroom' }, { v: '2', l: '2 bedrooms' }, { v: '3', l: '3 bedrooms' }, { v: '4', l: '4 or more' }], zone: 'Area', allzones: 'All regions', region: 'Region', allregions: 'All regions', city: 'City', allcities: 'All cities', pozo: 'Off-plan', credito: 'Mortgage-ready', creditoMsg: 'Hi, I’m looking for mortgage-ready properties. What options do you have available?', price: 'Budget', anyprice: 'Any', upto: 'Up to', over: 'Over', search: 'Search by name, street or area…', results: 'properties', none: 'No properties match these filters. Try widening your search or message us on WhatsApp and we’ll find it.', rentEmpty: 'We’re refreshing our rental portfolio.', rentEmptySub: 'We have units not yet listed online. Message us on WhatsApp and we’ll help you find what you’re after — or let you know as soon as new ones come in.', rentNoMatch: 'No rentals match those filters.', rentNoMatchSub: 'Try widening your search, or message us on WhatsApp and we’ll let you know as soon as a unit that fits comes in.', noPhoto: 'Photos on request', more: 'See more', back: 'Back home', consultar: 'Enquire' },
    detail: { back: 'Back to catalogue', photos: 'photos', description: 'Description', features: 'Features', consultar: 'Enquire on WhatsApp', note: 'A Bochile advisor will assist you, no obligation.', area: 'Total area', beds: 'Bedrooms', amb: 'Rooms', baths: 'Bathrooms', type: 'Type', allphotos: 'All photos', videoTour: 'Video tour', notfound: 'We couldn’t find that property.', location: 'Location', maps: 'Open in Maps', streetview: 'Street View', directions: 'Directions', mapnote: 'Approximate location based on the published area.' },
    camila: { online: 'ONLINE' },
    waMenu: { title: 'We’re here to help', sub: 'Choose an area and an advisor will assist you on WhatsApp.', ventas: 'Sales', alquileres: 'Rentals', tasaciones: 'Valuations', galpones: 'Warehouses & special requests', vacamuerta: 'Vaca Muerta', general: 'General enquiry', open: 'Open WhatsApp', close: 'Close' },
    marca: { quote: 'Over 50 years finding the right place in Bahía Blanca.', sub: 'Since 1970 we’ve guided every family with the same trust as always. Experience backs our track record.', tag: 'Since 1970 · Bahía Blanca' },
    nosotros: {
      kicker: 'About us',
      title1: 'Over 50 years', title2: 'of trust.',
      sub: 'Since 1970 we’ve helped families across Bahía Blanca and the region find the right place.',
      story: [
        'Bochile was founded in Bahía Blanca in 1970 and has grown alongside the city ever since: every neighbourhood, every area and every family that trusted us is part of our story.',
        'We know the local market like few others. That experience —over 50 years buying, selling and valuing— is what we put at the service of everyone who chooses us.',
        'We work the way we always have: up close, with our word first, and the peace of mind of dealing with people who know the trade.',
      ],
      since: 'Caronti 360, Bahía Blanca · since 1970',
      teamHead: 'The people behind Bochile',
      teamNote: 'The team that guides you through every deal.',
      why: [
        { t: '50 years of experience', d: 'Over 50 years operating in Bahía Blanca backs us. Experience can’t be improvised.' },
        { t: 'We know the area', d: 'Bahía Blanca and the region, block by block. We know where the real value is.' },
        { t: 'Personal service', d: 'A person assists you, not a form — from start to finish.' },
        { t: 'Trust, always', d: 'The same word since 1970. Generations of families have found their place with us.' },
      ],
    },
    empresas: {
      kicker: 'Business',
      title1: 'Solutions for', title2: 'your company.',
      sub: 'Warehouses, sheds, offices and retail across Bahía Blanca and the region. Need something specific or a tailored search? We handle it with the closeness of always.',
      cta: 'Business enquiries',
      waMsg: 'Hi Bochile, I’m writing on behalf of a company. We’re looking for a space (warehouse / shed / office / retail). Can we arrange a chat?',
      cats: [
        { t: 'Warehouses & sheds', d: 'Logistics, storage and industry.', to: '/propiedades?type=Galpón' },
        { t: 'Offices', d: 'Workspaces across the city.', to: '/propiedades?type=Oficina' },
        { t: 'Retail spaces', d: 'Street-front and key-area locations.', to: '/propiedades?type=Local' },
        { t: 'Special requests', d: 'Tailored searches not listed online.', to: '' },
      ],
    },
    inversion: {
      kicker: 'Investment in Neuquén',
      title1: 'Vaca', title2: 'Muerta.',
      sub: 'Lots, apartments and construction trusts (fideicomisos) in Vaca Muerta, one of Argentina’s fastest-growing areas. Coordinated with a Bochile advisor.',
      cta: 'Ask about Vaca Muerta',
      waMsg: 'Hi, I’d like to ask about investments in Vaca Muerta (lots, apartments, fideicomisos).',
      cats: [
        { t: 'Lots', d: 'Lots for sale in Añelo and the Vaca Muerta area.', wa: 'Hi, I’d like to ask about LOTS in Vaca Muerta (Añelo, Neuquén).' },
        { t: 'Apartments', d: 'Units to invest in or rent at the heart of the action.', wa: 'Hi, I’d like to ask about APARTMENTS in Vaca Muerta (Neuquén).' },
        { t: 'Trusts (fideicomisos)', d: 'Join construction projects with backing and scale. Coordinated with a specialist advisor.', wa: 'Hi, I’d like to ask about construction TRUSTS (fideicomisos) in Vaca Muerta.' },
      ],
    },
    tasa: { badge: 'Professional valuation', title1: 'What is your', title2: 'property worth?', sub: 'We arrange everything on WhatsApp, quick and simple. Over 50 years listing properties in Bahía Blanca backs us.', perks: ['Reply in under 24 hours', 'No-obligation service', 'The best price on the market'], formhead: 'Start here ↓', submit: 'Request my valuation', note: 'A Bochile advisor will assist you, no obligation.', f: { nombre: 'Your name', tel: 'WhatsApp', tipo: 'Property type', zona: 'Area or approximate address', opts: ['House', 'Apartment', 'Land', 'Retail / Office', 'Other'] } },
    contact: { title1: 'Your next property', title2: 'starts with a message.', cta: 'Message us on WhatsApp', address: 'Caronti 360, 8000 Bahía Blanca', phones: ['(291) 453-7816', '(291) 451-7040', '(291) 452-9622'], email: 'info@bochile.com', hours: 'Monday to Friday · 9 to 16 h' },
    footer: { rights: '© 2026 Bochile Real Estate · Since 1970 in Bahía Blanca.', made: 'Site by WESEKA.IA' },
  },
}

const LangCtx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState('es')
  const t = DICT[lang]
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>
}

export const useLang = () => useContext(LangCtx)
