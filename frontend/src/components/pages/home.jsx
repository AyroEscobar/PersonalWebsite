// Home Page - Single scroll page with all sections

import Hero from '../sections/Hero'
import About from '../sections/About'
import Roles from '../sections/Roles'
import Skills from '../sections/Skills'
import Projects from '../sections/Projects'
import HackathonPreview from '../sections/HackathonPreview'
import Testimonials from '../sections/Testimonials'
import Contact from '../sections/Contact'

function Home() {
  return (
    <div className="relative">
      <Hero />
      <About />
      <Roles />
      <Skills />
      <Projects />
      <HackathonPreview />
      <Testimonials />
      <Contact />
    </div>
  )
}

export default Home