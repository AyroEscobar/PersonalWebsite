// Home Page, single scroll page with all sections

import Hero from '../sections/Hero'
import Currently from '../sections/Currently'
import About from '../sections/About'
import Roles from '../sections/Roles'
import Skills from '../sections/Skills'
import Projects from '../sections/Projects'
import Testimonials from '../sections/Testimonials'
import Contact from '../sections/Contact'
import Footer from '../sections/Footer'

function Home() {
  return (
    <div className="relative">
      <Hero />
      <Currently />
      <About />
      <Roles />
      <Skills />
      <Projects />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  )
}

export default Home
