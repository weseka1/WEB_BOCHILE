import HeroEnter from '../components/HeroEnter'
import Servicios from '../components/Servicios'
import FeaturedProps from '../components/FeaturedProps'
import Marca from '../components/Marca'
import Tasacion from '../components/Tasacion'
import Empresas from '../components/Empresas'
import InversionEnergia from '../components/InversionEnergia'
import Nosotros from '../components/Nosotros'
import Contacto from '../components/Contacto'

export default function Home({ lenisRef }) {
  return (
    <>
      <HeroEnter lenisRef={lenisRef} />
      <FeaturedProps />
      <Marca />
      <Tasacion />
      <Servicios />
      <Empresas />
      <InversionEnergia />
      <Nosotros />
      <Contacto />
    </>
  )
}
