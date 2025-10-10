import pfp from '../../assets/pfp.JPG'






function About() {
  return (
    <div className="flex justify-center p-8">
      <div className="flex items-center gap-8 bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-6xl pt-[20vh] mx-[15%] ">
        {/* Left side - Image */}
        <div className="flex-shrink-0">
          <img 
            src={pfp} 
            alt='Profile Picture' 
            className="h-[20rem] w-[20rem] rounded-full object-cover border-8 border-yellow-400 object-right "
          />
        </div>
        
        {/* Right side - Intro */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-4 ">About Me</h1>
          <p className="text-white text-lg leading-relaxed">
            Welcome to my about page! Here you can add your introduction, 
            background, skills, or any other information you'd like to share. 
            This text will appear to the right of your profile picture.
          </p>
          <p className="text-white text-lg leading-relaxed mt-4">
            You can add multiple paragraphs, lists, or any other content here 
            to tell your story!
          </p>
        </div>
      </div>
    </div>
  )
}
export default About