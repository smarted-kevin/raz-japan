import { BarChart3, BookOpen, BookText, Globe, Headphones, Heart, Mail, MessageSquare, PenTool, Phone, Sparkles, Trophy, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

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
      description: "Access over 1,000 books across 29 reading levels, from beginner to advanced readers.",
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

  return (
    <main className="">
      <PublicNavBar/>
      <section className="relative overflow-hidden bg-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/50 px-4 py-2 text-sm font-medium text-accent-foreground">
              <Sparkles className="h-4 w-4" />
              <span>{"Unlock the joy of reading for your child"}</span>
            </div>

            <h1 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
              {"Where Every Child Becomes a Confident Reader"}
            </h1>

            <p className="mb-8 text-pretty text-lg text-muted-foreground md:text-xl">
              {
                "Raz-Japan is an interactive online reading platform designed to help children develop strong literacy skills through engaging stories, personalized learning paths, and fun activities."
              }
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto">
                <BookOpen className="mr-2 h-5 w-5" />
                {"Start Reading Today"}
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                {"Watch Demo"}
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span>{"1000+ Books"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-secondary" />
                <span>{"29 Reading Levels"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span>{"Trusted by 10,000+ Families"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="getting-started" className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {"Getting Started is Easy"}
            </h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground">
              {"Join thousands of families who are building confident readers. Get started in just 4 simple steps."}
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={index} className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="rounded-full bg-accent/50 px-3 py-1 text-xs font-semibold text-accent-foreground">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-card-foreground">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
      <section id="about" className="bg-background py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {"About Raz-Japan"}
            </h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground leading-relaxed">
              {
                "Raz-Japan combines proven reading pedagogy with engaging technology to create a comprehensive literacy program. Our platform adapts to each child's unique learning style, making reading practice enjoyable and effective."
              }
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-2 transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-card-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-16 rounded-2xl bg-primary p-8 text-center md:p-12">
            <h3 className="mb-4 text-balance text-2xl font-bold text-primary-foreground md:text-3xl">
              {"Built by Educators, Loved by Families"}
            </h3>
            <p className="mx-auto mb-6 max-w-2xl text-pretty text-primary-foreground/90 leading-relaxed">
              {
                "Developed in collaboration with reading specialists and teachers, Raz-Japan is grounded in research-based literacy instruction. Our mission is to make every child a confident, enthusiastic reader."
              }
            </p>
          </div>
        </div>
      </section>
      <section id="contact" className="bg-muted/30 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              {"Get in Touch"}
            </h2>
            <p className="mb-12 text-pretty text-lg text-muted-foreground">
              {"Have questions? Our friendly support team is here to help you and your family succeed."}
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <Card className="border-2 text-center transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-bold text-card-foreground">Email Us</h3>
                <p className="mb-4 text-sm text-muted-foreground">{"Get a response within 24 hours"}</p>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  {"support@raz-japan.com"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 text-center transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mb-2 font-bold text-card-foreground">Live Chat</h3>
                <p className="mb-4 text-sm text-muted-foreground">{"Chat with our team instantly"}</p>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  {"Start Chat"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 text-center transition-all hover:border-primary/50 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 font-bold text-card-foreground">Call Us</h3>
                <p className="mb-4 text-sm text-muted-foreground">{"Mon-Fri, 9am-6pm JST"}</p>
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  {"+81-3-1234-5678"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">Raz-Japan</span>
              </Link>
              <p className="mb-4 max-w-md text-sm text-muted-foreground leading-relaxed">
                {
                  "Empowering children to become confident, enthusiastic readers through personalized, engaging literacy experiences."
                }
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-bold text-foreground">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#getting-started" className="text-muted-foreground transition-colors hover:text-primary">
                    Getting Started
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-muted-foreground transition-colors hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-muted-foreground transition-colors hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-bold text-foreground">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>{"© 2025 Raz-Japan. All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
