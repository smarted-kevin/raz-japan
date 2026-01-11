import { 
  Award, BarChart3, BookOpen, BookText, 
  CheckCircle2, Globe, Headphones, Heart, 
  Laptop, Mail, MessageSquare, PenTool, 
  Phone, Smartphone, Sparkles, Star, Trophy, UserPlus 
} from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { HeroBanner } from "~/components/ui/hero-banner";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

// Banner image from Convex storage
const BANNER_STORAGE_ID = "kg29gdjrjf06330bwdnjmfm37x7y7exm";

export default function HomePage() {

  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Account",
      description: "Sign up in seconds with your email. No credit card required to start your free trial.",
      step: "Step 1",
    },
    {
      icon: Sparkles,
      title: "Set Up Your Child's Profile",
      description:
        "Tell us about your child's reading level and interests. Our system will personalize their learning journey.",
      step: "Step 2",
    },
    {
      icon: BookOpen,
      title: "Start Reading Together",
      description:
        "Access thousands of leveled books instantly. Your child can read, listen, and complete fun quizzes.",
      step: "Step 3",
    },
    {
      icon: Trophy,
      title: "Track Progress & Celebrate",
      description: "Watch your child's reading skills grow with detailed progress reports and achievement badges.",
      step: "Step 4",
    },
  ]

  const features = [
    {
      icon: BookText,
      title: "Leveled Reading Library",
      description: "Access over 3,000 books across 29 reading levels, from beginner to advanced readers.",
    },
    {
      icon: Headphones,
      title: "Audio Support",
      description: "Every book includes professional narration to help with pronunciation and comprehension.",
    },
    {
      icon: PenTool,
      title: "Interactive Quizzes",
      description: "Fun comprehension quizzes after each book to reinforce learning and understanding.",
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description: "Detailed reports show reading growth, time spent, and books completed over time.",
    },
    {
      icon: Globe,
      title: "Bilingual Support",
      description: "Books available in both English and Japanese to support language learning goals.",
    },
    {
      icon: Heart,
      title: "Personalized Learning",
      description: "Adaptive technology adjusts to your child's pace and recommends perfect-fit books.",
    },
  ]

  const highlights = [
    {
      icon: BookOpen,
      stat: "3,000+",
      label: "Books Available",
      description: "A vast library of leveled readers for every skill level",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Laptop,
      stat: "Any Device",
      label: "PC, Tablet & Mobile",
      description: "Read seamlessly on desktop, tablet, or smartphone",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Trophy,
      stat: "50+",
      label: "Badges & Rewards",
      description: "Fun achievements that motivate kids to keep reading",
      color: "from-amber-500 to-orange-500",
    },
  ]

  const badges = [
    { name: "Super Saver", description: "Collect 4000 stars" },
    { name: "First Book", description: "Read your first book" },
    { name: "Treasure Hunter", description: "Collect 8000 stars" },
    { name: "Super Reader", description: "Read 5 days in a row" },
    { name: "Quiz Whiz", description: "Complete 5 perfect quizzes" },
    { name: "Level Up", description: "Complete a reading level" },
  ]

  return (
    <main className="overflow-x-hidden">
      <PublicNavBar/>
      
      {/* Hero Section with Banner */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>Unlock the joy of reading for your child</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Where Every Child Becomes a{" "}
                <span className="text-yellow-300">Confident Reader</span>
              </h1>

              <p className="text-lg md:text-xl text-blue-100 max-w-lg">
                Access over 3,000 interactive books on any device. Watch your child grow with fun badges, rewards, and an easy-to-use dashboard designed for parents.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold shadow-lg shadow-yellow-400/30">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Right Content - Banner Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                <HeroBanner
                  storageId={BANNER_STORAGE_ID}
                  alt="Kids reading app showing dashboard with badges, books on tablet and phone, and interactive reading room"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">10,000+</p>
                    <p className="text-sm text-gray-500">Happy Families</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Child Needs to Love Reading
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete reading platform designed for children and trusted by parents worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10" 
                       style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
                  <Card className="border-2 hover:border-blue-200 transition-all hover:shadow-xl h-full">
                    <CardContent className="p-8 text-center">
                      <div className={`mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-gray-900 mb-1">{item.stat}</div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">{item.label}</div>
                      <p className="text-gray-500">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Read Anywhere Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                {/* Device mockups representation */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-2 shadow-2xl">
                    <div className="bg-blue-600 rounded-xl aspect-video flex items-center justify-center">
                      <div className="text-center text-white">
                        <Laptop className="h-12 w-12 mx-auto mb-2 opacity-80" />
                        <p className="text-sm font-medium">Desktop</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-1.5 shadow-xl">
                      <div className="bg-purple-500 rounded-lg aspect-[3/4] flex items-center justify-center">
                        <div className="text-center text-white">
                          <BookOpen className="h-6 w-6 mx-auto mb-1 opacity-80" />
                          <p className="text-xs font-medium">Tablet</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-1 shadow-xl mx-2">
                      <div className="bg-green-500 rounded-lg aspect-[9/16] flex items-center justify-center">
                        <div className="text-center text-white">
                          <Smartphone className="h-4 w-4 mx-auto mb-1 opacity-80" />
                          <p className="text-[10px] font-medium">Mobile</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                <Globe className="h-4 w-4" />
                <span>Read Anywhere</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                3,000+ Books at Your Fingertips, On Any Device
              </h2>
              
              <p className="text-lg text-gray-600">
                Whether at home on the computer, traveling with a tablet, or waiting with a smartphone - your child&apos;s entire reading library travels with them. Progress syncs automatically across all devices.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Seamless sync across PC, tablet, and mobile",
                  "Offline reading mode for travel",
                  "Pick up exactly where you left off",
                  "Works on any modern browser - no app required"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="bg-blue-600 hover:bg-blue-700">
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Our Library
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
                <BarChart3 className="h-4 w-4" />
                <span>Parent Dashboard</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Easy-to-Use Dashboard for Busy Parents
              </h2>
              
              <p className="text-lg text-gray-600">
                Stay connected to your child&apos;s reading journey without the complexity. Our intuitive dashboard gives you instant insights and complete control.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Reading Time", desc: "Track daily & weekly progress" },
                  { title: "Books Completed", desc: "See finished books at a glance" },
                  { title: "Quiz Scores", desc: "Monitor comprehension levels" },
                  { title: "Level Progress", desc: "Watch skills grow over time" },
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              
              <Button className="bg-purple-600 hover:bg-purple-700">
                <BarChart3 className="mr-2 h-5 w-5" />
                See Dashboard Demo
              </Button>
            </div>
            
            <div className="relative">
              {/* Dashboard Preview Card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 shadow-2xl">
                <div className="bg-white rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Weekly Overview</h3>
                    <span className="text-xs text-gray-500">This Week</span>
                  </div>
                  
                  {/* Mini Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-xs text-gray-500">Books Read</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">4.2h</div>
                      <div className="text-xs text-gray-500">Time Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">95%</div>
                      <div className="text-xs text-gray-500">Quiz Avg</div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Level Progress</span>
                      <span className="font-medium text-gray-900">Level K → L</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">Recent Activity</p>
                    <div className="space-y-2">
                      {[
                        { book: "Amazing Antarctica", status: "Completed", color: "text-green-600" },
                        { book: "Best Friends Q and U", status: "In Progress", color: "text-blue-600" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.book}</span>
                          <span className={`${item.color} font-medium`}>{item.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating notification */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-gray-100 hidden md:block">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900">New Badge Earned!</p>
                    <p className="text-xs text-gray-500">Super Reader 🏆</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges & Motivation Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 mb-4">
              <Award className="h-4 w-4" />
              <span>Gamified Learning</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Badges & Rewards That Motivate
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Turn reading into an adventure! Children earn exciting badges and rewards as they progress, making them eager to read more every day.
            </p>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {badges.map((badge, index) => (
              <div key={index} className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow border border-amber-100">
                <div className="h-16 w-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{badge.name}</h4>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </div>
            ))}
          </div>

          {/* Motivation Features */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Star,
                title: "Stars Collection",
                description: "Kids earn stars for every book read and quiz completed. Watch their collection grow!",
                color: "from-yellow-400 to-amber-500",
              },
              {
                icon: Trophy,
                title: "Achievement Badges",
                description: "50+ unique badges to unlock for reading streaks, quiz scores, and level completions.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: Award,
                title: "Level Progression",
                description: "Visual level-up system shows children their reading skills improving over time.",
                color: "from-orange-500 to-red-500",
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={index} className="border-2 border-amber-200 bg-white">
                  <CardContent className="p-6">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="bg-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Getting Started is Easy
            </h2>
            <p className="mb-12 text-pretty text-lg text-gray-600">
              Join thousands of families who are building confident readers. Get started in just 4 simple steps.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={index} className="relative overflow-hidden border-2 transition-all hover:shadow-lg hover:border-blue-200">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="about" className="bg-gray-50 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
              About Raz-Japan
            </h2>
            <p className="mb-12 text-pretty text-lg text-gray-600 leading-relaxed">
              Raz-Japan combines proven reading pedagogy with engaging technology to create a comprehensive literacy program. Our platform adapts to each child&apos;s unique learning style, making reading practice enjoyable and effective.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-2 transition-all hover:border-blue-200 hover:shadow-md bg-white">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                      <Icon className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center md:p-12">
            <h3 className="mb-4 text-balance text-2xl font-bold text-white md:text-3xl">
              Built by Educators, Loved by Families
            </h3>
            <p className="mx-auto mb-6 max-w-2xl text-pretty text-blue-100 leading-relaxed">
              Developed in collaboration with reading specialists and teachers, Raz-Japan is grounded in research-based literacy instruction. Our mission is to make every child a confident, enthusiastic reader.
            </p>
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold">
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Get in Touch
            </h2>
            <p className="mb-12 text-pretty text-lg text-gray-600">
              Have questions? Our friendly support team is here to help you and your family succeed.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <Card className="border-2 text-center transition-all hover:border-blue-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">Email Us</h3>
                <p className="mb-4 text-sm text-gray-500">Get a response within 24 hours</p>
                <Button variant="outline" size="sm" className="w-full">
                  support@raz-japan.com
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 text-center transition-all hover:border-purple-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">Live Chat</h3>
                <p className="mb-4 text-sm text-gray-500">Chat with our team instantly</p>
                <Button variant="outline" size="sm" className="w-full">
                  Start Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 text-center transition-all hover:border-green-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">Call Us</h3>
                <p className="mb-4 text-sm text-gray-500">Mon-Fri, 9am-6pm JST</p>
                <Button variant="outline" size="sm" className="w-full">
                  +81-3-1234-5678
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-900 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Raz-Japan</span>
              </Link>
              <p className="mb-4 max-w-md text-sm text-gray-400 leading-relaxed">
                Empowering children to become confident, enthusiastic readers through personalized, engaging literacy experiences.
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-bold">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#getting-started" className="text-gray-400 transition-colors hover:text-white">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-gray-400 transition-colors hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-gray-400 transition-colors hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-bold">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2026 Raz-Japan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
