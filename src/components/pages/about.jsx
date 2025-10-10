import pfp from '../../assets/pfp.JPG'






function About() {
  return (
    <div className="flex justify-center p-8 px-3 pt-[20vh]">
      <div className="flex items-center gap-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-6xl  mx-[15%] ">
        {/* Left side - Image */}
        <div className="flex-shrink-0">
          <img 
            src={pfp} 
            alt='Profile Picture' 
            className="h-[15rem] w-[15rem] rounded-full object-cover border-8 border-[#0B0B42] object-right "
          />
        </div>
        
        {/* Right side - Intro */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-4 ">Hola!</h1>
          <p className="text-white text-lg leading-relaxed">
            I'm a software engineer and CS student at UT Dallas who's passionate 
            about building cool stuff and helping others do the same. I'm a big believer 
            that the best way to learn is to teach, which is why I spend so much time
             mentoring, whether that's at hackathons as an MLH Coach, helping 
             classmates through tricky concepts, or just pair programming with 
             someone on their project. I love that lightbulb moment when things 
             finally click, both for me and the people I'm working with. Always 
             learning, always sharing.
          </p>
         
        </div>
      </div>
    </div>
  )
}
export default About