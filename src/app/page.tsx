import {
  Award,
  BookOpen,
  BookText,
  CheckCircle2,
  Headphones,
  Laptop,
  PenTool,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { HeroBannerBackground } from "~/components/landing/hero-banner-background";
import { LANDING_IMAGES } from "~/lib/landing-images";
import { publicSiteContainerClassName } from "~/lib/public-layout";
import { cn } from "~/lib/utils";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

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
  ];

  const highlights = [
    {
      icon: BookOpen,
      stat: t("books_stat"),
      label: t("books_label"),
      description: t("books_description"),
      color: "from-[#c83192] to-[#e46bb6]",
    },
    {
      icon: Laptop,
      stat: t("device_stat"),
      label: t("device_label"),
      description: t("device_description"),
      color: "from-[#8f1f69] to-[#c83192]",
    },
    {
      icon: Trophy,
      stat: t("badges_stat"),
      label: t("badges_label"),
      description: t("badges_description"),
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <main className="raz-brand overflow-x-hidden">
      <PublicNavBar branded />

      {/* Hero Section with Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#c83192] via-[#a92379] to-[#651348] max-lg:min-h-[32rem] sm:max-lg:min-h-[36rem]">
        <HeroBannerBackground
          src={LANDING_IMAGES.heroBanner}
          alt={t("banner_alt")}
        />
        {/* Background Pattern */}
        <div className="absolute inset-0 z-[1] opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div
          className={cn(
            publicSiteContainerClassName,
            "relative z-10 py-16 md:py-24",
          )}
        >
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div className="relative space-y-6 text-white">
              <h1 className="text-4xl leading-tight font-bold md:text-5xl lg:text-6xl">
                {t("hero_title")}{" "}
                <span className="text-yellow-300">
                  {t("hero_title_highlight")}
                </span>
              </h1>

              <p className="max-w-lg text-lg text-[#fde8f5] md:text-xl">
                {t("hero_subtitle")}
              </p>

              <div className="flex justify-center lg:justify-start">
                <Link
                  href="/getting-started"
                  className={buttonVariants({
                    variant: "ghost",
                    size: "default",
                    className:
                      "scale-[1.2] bg-[#c83192] px-5 font-semibold text-white shadow-lg ring-1 shadow-[#651348]/35 ring-white/20 hover:bg-[#a92379] hover:text-white",
                  })}
                >
                  <BookOpen className="mr-2 h-[1.2rem] w-[1.2rem]" />
                  {t("get_started_now")}
                </Link>
              </div>
            </div>

            {/* Right — portrait image (lg+ only; below lg uses section background) */}
            <div className="relative hidden justify-end lg:flex">
              <div className="relative w-full max-w-[420px]">
                <div className="pointer-events-none absolute top-12 -right-6 -bottom-8 -left-6 rounded-[2.5rem] bg-gradient-to-tr from-[#f5c542]/25 via-transparent to-[#f8b5dd]/20 blur-2xl" />
                <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] shadow-2xl ring-[3px] shadow-black/35 ring-white/25">
                  <Image
                    src={LANDING_IMAGES.heroBanner}
                    alt={t("banner_alt")}
                    fill
                    sizes="420px"
                    className="object-cover object-[50%_35%]"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider — desktop only; flat edge on mobile/tablet hero */}
        <div className="absolute right-0 -bottom-1 left-0 z-10 hidden lg:block">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="bg-white py-16 md:py-24">
        <div className={publicSiteContainerClassName}>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t("highlights_title")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              {t("highlights_subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="group relative">
                  <div
                    className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r opacity-0 blur-xl transition-opacity group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    }}
                  />
                  <Card className="h-full border-2 transition-all hover:border-[#edacd5] hover:shadow-xl">
                    <CardContent className="p-8 text-center">
                      <div
                        className={`mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="mb-1 text-4xl font-bold text-gray-900">
                        {item.stat}
                      </div>
                      <div className="mb-2 text-lg font-semibold text-gray-700">
                        {item.label}
                      </div>
                      <p className="text-gray-500">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="relative overflow-hidden bg-gradient-to-br from-[#fff2f9] via-[#fbe8f4] to-[#f3c7e2] py-16 text-gray-900 md:py-24"
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className={cn(publicSiteContainerClassName, "relative z-10")}>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
              {t("pricing_title")}
            </h2>
            <p className="text-lg text-pretty text-[#6f3157] md:text-xl">
              {t("pricing_subtitle")}
            </p>
          </div>

          <div className="mx-auto max-w-xl">
            <Card className="border-2 border-[#edacd5] bg-white/95 text-gray-900 shadow-2xl shadow-[#8f1f69]/15 backdrop-blur-sm">
              <CardContent className="space-y-8 p-8 md:p-10">
                <div className="space-y-3 text-center">
                  <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-gray-900">
                    <span className="text-5xl font-bold tracking-tight md:text-6xl">
                      {t("pricing_amount")}
                    </span>
                    <span className="text-sm whitespace-nowrap text-gray-600 md:text-base">
                      {t("pricing_tax_included")}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-700 md:text-xl">
                    {t("pricing_per_student_year")}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {t("pricing_billed_annually")}
                  </p>
                </div>

                <ul className="space-y-4 border-t border-gray-100 pt-6">
                  {[
                    t("pricing_include_books"),
                    t("pricing_include_features"),
                    t("pricing_include_devices"),
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <span className="leading-relaxed text-gray-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/getting-started"
                  className={buttonVariants({
                    size: "lg",
                    variant: "ghost",
                    className:
                      "w-full bg-[#c83192] font-semibold text-white shadow-lg shadow-[#c83192]/30 hover:bg-[#a92379]",
                  })}
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t("get_started_now")}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Read Anywhere Section */}
      <section className="bg-gradient-to-br from-gray-50 to-[#fff0f9] py-16 md:py-24">
        <div className={publicSiteContainerClassName}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="relative">
                {/* Device mockups representation */}
                <div className="relative">
                  {/* Dashboard Preview Card */}
                  <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/30">
                    <Image
                      src={LANDING_IMAGES.dashboard}
                      alt={t("dashboard_alt")}
                      width={800}
                      height={600}
                      className="h-auto w-full"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 space-y-6 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                {t("read_anywhere_title")}
              </h2>

              <p className="text-lg text-gray-600">
                {t("read_anywhere_description")}
              </p>

              <ul className="space-y-4">
                {[
                  t("sync_feature"),
                  t("resume_feature"),
                  t("browser_feature"),
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      {/* Badges & Motivation Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-16 md:py-24">
        <div className={publicSiteContainerClassName}>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t("badges_section_title")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              {t("badges_section_subtitle")}
            </p>
          </div>

          {/* Motivation Features */}
          <div className="grid gap-6 md:grid-cols-3">
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
              const Icon = item.icon;
              return (
                <Card
                  key={index}
                  className="border-2 border-amber-200 bg-white"
                >
                  <CardContent className="p-6">
                    <div
                      className={`h-14 w-14 rounded-xl bg-gradient-to-br ${item.color} mb-4 flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="bg-white py-20 md:py-32">
        <div className={publicSiteContainerClassName}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance text-gray-900 md:text-5xl">
              {t("getting_started_title")}
            </h2>
            <p className="mb-12 text-lg text-pretty text-gray-600">
              {t("getting_started_subtitle")}
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={index}
                  className="relative overflow-hidden border-2 transition-all hover:border-[#edacd5] hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fbe8f4]">
                        <Icon className="h-6 w-6 text-[#c83192]" />
                      </div>
                      <span className="rounded-full bg-[#c83192] px-3 py-1 text-xs font-semibold text-white">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <p className="leading-relaxed text-gray-600">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="about" className="bg-[#fff8fc] py-20 md:py-32">
        <div className={publicSiteContainerClassName}>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance text-gray-900 md:text-5xl">
              {t("about_title")}
            </h2>
            <p className="mb-12 text-lg leading-relaxed text-pretty text-gray-600">
              {t("about_subtitle")}
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="border-2 bg-white transition-all hover:border-[#edacd5] hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#fbe8f4]">
                      <Icon className="h-7 w-7 text-[#c83192]" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-r from-[#c83192] to-[#8f1f69] p-8 text-center md:p-12">
            <h3 className="mb-4 text-2xl font-bold text-balance text-white md:text-3xl">
              {t("beloved_classroom_tool")}
            </h3>
            <p className="mx-auto mb-6 max-w-2xl leading-relaxed text-pretty text-[#f9d8ec]">
              {t("beloved_classroom_tool_desc")}
            </p>
            <Link
              href="/getting-started"
              className={buttonVariants({
                size: "lg",
                variant: "ghost",
                className:
                  "bg-white font-semibold text-[#8f1f69] shadow-lg shadow-[#651348]/25 hover:bg-[#fbe8f4] hover:text-[#651348]",
              })}
            >
              {t("get_started_now")}
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="border-t border-gray-200 bg-white py-12 md:py-16"
      >
        <div className={publicSiteContainerClassName}>
          <Card className="mx-auto max-w-2xl border-2 border-[#f1bddc] bg-gradient-to-br from-[#fff2f9] to-[#fbe8f4]/70 shadow-md">
            <CardContent className="p-8 text-center md:p-10">
              <h2 className="mb-3 text-2xl font-bold tracking-tight text-balance text-gray-900 md:text-4xl">
                {t("contact_title")}
              </h2>
              <p className="mb-6 leading-relaxed text-pretty text-gray-600">
                {t("contact_subtitle")}
              </p>
              <Link
                href="/contact"
                className={buttonVariants({
                  size: "lg",
                  variant: "ghost",
                  className:
                    "bg-[#c83192] text-white shadow-md shadow-[#c83192]/25 hover:bg-[#a92379]",
                })}
              >
                {t("contact_us")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#651348] bg-[#351027] py-12 text-white">
        <div className={publicSiteContainerClassName}>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c83192]">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Raz-Japan</span>
              </Link>
              <p className="mb-4 max-w-md text-sm leading-relaxed text-gray-400">
                {t("footer_tagline")}
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-bold">{t("quick_links")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#getting-started"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("footer_getting_started")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("footer_pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#about"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("about_us")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#contact"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("contact_title")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-bold">{t("legal")}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("privacy_policy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("terms_of_service")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/scta"
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    {t("scta_link")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>{t("copyright")}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
