import {
  Award,
  BarChart3,
  BookOpen,
  BookText,
  CheckCircle2,
  Globe,
  Headphones,
  Heart,
  Laptop,
  Mail,
  MessageSquare,
  PenTool,
  Phone,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ConvexImage } from "~/components/ui/convex-image";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

// Banner image from Convex storage
const BANNER_STORAGE_ID = "kg29gdjrjf06330bwdnjmfm37x7y7exm";
const DASHBOARD_STORAGE_ID = "kg2678ax28zp8vm25w9s2nymk57yyyxq";

export default async function HomePage() {
  const t = await getTranslations("Landing");

  const steps = [
    {
      icon: UserPlus,
      title: t("step_create_account"),
      description: t("step_create_account_desc"),
      step: t("step_1"),
    },
    {
      icon: Sparkles,
      title: t("step_add_student"),
      description: t("step_add_student_desc"),
      step: t("step_2"),
    },
    {
      icon: BookOpen,
      title: t("step_get_credentials"),
      description: t("step_get_credentials_desc"),
      step: t("step_3"),
    },
    {
      icon: Trophy,
      title: t("step_start_reading"),
      description: t("step_start_reading_desc"),
      step: t("step_4"),
    },
  ];

  const features = [
    {
      icon: BookText,
      title: t("feature_leveled"),
      description: t("feature_leveled_desc"),
    },
    {
      icon: Headphones,
      title: t("feature_audio"),
      description: t("feature_audio_desc"),
    },
    {
      icon: PenTool,
      title: t("feature_quizzes"),
      description: t("feature_quizzes_desc"),
    },
    {
      icon: BarChart3,
      title: t("feature_progress"),
      description: t("feature_progress_desc"),
    },
    {
      icon: Globe,
      title: t("feature_bilingual"),
      description: t("feature_bilingual_desc"),
    },
    {
      icon: Heart,
      title: t("feature_personalized"),
      description: t("feature_personalized_desc"),
    },
  ];

  const highlights = [
    {
      icon: BookOpen,
      stat: t("books_stat"),
      label: t("books_label"),
      description: t("books_description"),
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Laptop,
      stat: t("device_stat"),
      label: t("device_label"),
      description: t("device_description"),
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Trophy,
      stat: t("badges_stat"),
      label: t("badges_label"),
      description: t("badges_description"),
      color: "from-amber-500 to-orange-500",
    },
  ];

  const badges = [
    { name: t("badge_super_saver"), description: t("badge_super_saver_desc") },
    { name: t("badge_first_book"), description: t("badge_first_book_desc") },
    { name: t("badge_treasure_hunter"), description: t("badge_treasure_hunter_desc") },
    { name: t("badge_super_reader"), description: t("badge_super_reader_desc") },
    { name: t("badge_quiz_whiz"), description: t("badge_quiz_whiz_desc") },
    { name: t("badge_level_up"), description: t("badge_level_up_desc") },
  ];

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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t("hero_title")}{" "}
                <span className="text-yellow-300">{t("hero_title_highlight")}</span>
              </h1>

              <p className="text-lg md:text-xl text-blue-100 max-w-lg">
                {t("hero_subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold shadow-lg shadow-yellow-400/30">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t("start_free_trial")}
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  {t("watch_demo")}
                </Button>
              </div>
            </div>

            {/* Right Content - Banner Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                <ConvexImage
                  storageId={BANNER_STORAGE_ID}
                  alt={t("banner_alt")}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                  placeholderClassName="bg-gradient-to-br from-blue-400 to-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("highlights_title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("highlights_subtitle")}
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
                <div className="relative">
              {/* Dashboard Preview Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                <ConvexImage
                  storageId={DASHBOARD_STORAGE_ID}
                  alt={t("dashboard_alt")}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                  placeholderClassName="bg-gradient-to-br from-blue-400 to-indigo-500"
                />
              </div>
            </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
                <Globe className="h-4 w-4" />
                <span>{t("read_anywhere")}</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {t("read_anywhere_title")}
              </h2>
              
              <p className="text-lg text-gray-600">
                {t("read_anywhere_description")}
              </p>
              
              <ul className="space-y-4">
                {[
                  t("sync_feature"),
                  t("offline_feature"),
                  t("resume_feature"),
                  t("browser_feature"),
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <Button className="bg-blue-600 hover:bg-blue-700">
                <BookOpen className="mr-2 h-5 w-5" />
                {t("browse_library")}
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Badges & Motivation Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("badges_section_title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("badges_section_subtitle")}
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
                title: t("stars_title"),
                description: t("stars_description"),
                color: "from-yellow-400 to-amber-500",
              },
              {
                icon: Trophy,
                title: t("achievement_title"),
                description: t("achievement_description"),
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: Award,
                title: t("level_title"),
                description: t("level_description"),
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
              {t("getting_started_title")}
            </h2>
            <p className="mb-12 text-pretty text-lg text-gray-600">
              {t("getting_started_subtitle")}
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
              {t("about_title")}
            </h2>
            <p className="mb-12 text-pretty text-lg text-gray-600 leading-relaxed">
              {t("about_subtitle")}
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
              {t("built_by_educators")}
            </h3>
            <p className="mx-auto mb-6 max-w-2xl text-pretty text-blue-100 leading-relaxed">
              {t("built_by_educators_desc")}
            </p>
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold">
              {t("start_free_trial")}
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">
              {t("contact_title")}
            </h2>
            <p className="mb-12 text-pretty text-lg text-gray-600">
              {t("contact_subtitle")}
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            <Card className="border-2 text-center transition-all hover:border-blue-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{t("email_us")}</h3>
                <p className="mb-4 text-sm text-gray-500">{t("email_response")}</p>
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
                <h3 className="mb-2 font-bold text-gray-900">{t("live_chat")}</h3>
                <p className="mb-4 text-sm text-gray-500">{t("chat_instantly")}</p>
                <Button variant="outline" size="sm" className="w-full">
                  {t("start_chat")}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 text-center transition-all hover:border-green-200 hover:shadow-md">
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{t("call_us")}</h3>
                <p className="mb-4 text-sm text-gray-500">{t("call_hours")}</p>
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
                {t("footer_tagline")}
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-bold">{t("quick_links")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#getting-started" className="text-gray-400 transition-colors hover:text-white">
                    {t("footer_getting_started")}
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-gray-400 transition-colors hover:text-white">
                    {t("about_us")}
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-gray-400 transition-colors hover:text-white">
                    {t("contact_title")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-bold">{t("legal")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                    {t("privacy_policy")}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 transition-colors hover:text-white">
                    {t("terms_of_service")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>{t("copyright")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
