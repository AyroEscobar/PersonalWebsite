import pfp from '../../assets/pfp.JPG'
import { FaJava, FaPython, FaReact, FaJs,  } from 'react-icons/fa'
import { SiCplusplus, SiTailwindcss, SiPostgresql, SiSupabase, SiFirebase } from 'react-icons/si'






function About() {
  return (
   

   <div>
    <div className="flex justify-center p-8 px-3 pt-[20vh] mx-[10%]">
      <div className="flex items-center gap-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-6xl">
        {/* Left side - Image */}
        <div className="flex-shrink-0">
          <img 
            src={pfp} 
            alt='Profile Picture' 
            className="h-[15rem] w-[15rem] rounded-full object-cover border-8 border-[#0B0B42] object-right "
          />
        </div>
        
        {/* Right side - Intro */}
        <div className="flex-1 pd-2 space-y-4">
          <h1 className="text-4xl font-bold text-white mb-4  ">Hola!</h1>
          <p className="text-white text-lg leading-relaxed">
            I'm a software engineer and CS student at UT Dallas who's passionate 
            about building cool stuff and helping others do the same. 
          </p>
          <p className='text-white text-lg leading-relaxed'>
          I'm a big believer 
            that the best way to learn is to teach, which is why I spend so much time
             mentoring, whether that's at hackathons as an MLH Coach, helping 
             classmates through tricky concepts, or just pair programming with 
             someone on their project.
          </p>
          <p className='text-white text-lg leading-relaxed'>
          I love that lightbulb moment when things 
             finally click, both for me and the people I'm working with. Always 
             learning, always sharing.
          </p>
        </div>
      </div>

     
    </div>
    
    {/* Skills Section */}
    <div className="flex justify-center p-8 mx-[8%]">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-6xl w-full ">
        {/* Skills Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Skills & Technologies</h2>
          <p className="text-white/80 text-lg">Here are some technologies I work with</p>
        </div>
        
        {/* Skills Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <FaJava className="text-3xl mb-2 text-orange-500" />
            <span className="text-white font-medium text-sm">Java</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <FaPython className="text-3xl mb-2 text-blue-400" />
            <span className="text-white font-medium text-sm">Python</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <SiCplusplus className="text-3xl mb-2 text-blue-600" />
            <span className="text-white font-medium text-sm">C++</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <FaReact className="text-3xl mb-2 text-cyan-400" />
            <span className="text-white font-medium text-sm">React</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <SiTailwindcss className="text-3xl mb-2 text-teal-400" />
            <span className="text-white font-medium text-sm">Tailwind CSS</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <SiPostgresql className="text-3xl mb-2 text-blue-700" />
            <span className="text-white font-medium text-sm">PostgreSQL</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <SiSupabase className="text-3xl mb-2 text-green-400" />
            <span className="text-white font-medium text-sm">Supabase</span>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <FaJs className="text-3xl mb-2 text-yellow-400" />
            <span className="text-white font-medium text-sm">JavaScript</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 transition duration-300">
            <SiFirebase className="text-3xl mb-2 text-yellow-400" />
            <span className="text-white font-medium text-sm">Firebase</span>
          </div>
          
        </div>
      </div>
    </div>
  </div>


      

      

  
  )
}
export default About