import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  UserPlus,
  User,
  Mail,
  Globe,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export const metadata = {
  title: "Getting Started | Raz-Japan",
  description:
    "Learn how to create an account, add students, and start reading with Raz-Japan",
};

export default async function GettingStartedPage() {
  const t = await getTranslations("GettingStarted");

  const steps = [
    {
      icon: UserPlus,
      title: t("step_1_title"),
      content: (
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          {t("step_1_link")}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
    },
    {
      icon: User,
      title: t("step_2_title"),
      content: t("step_2_content"),
    },
    {
      icon: Mail,
      title: t("step_3_title"),
      content: t("step_3_content"),
    },
    {
      icon: Globe,
      title: t("step_4_title"),
      content: (
        <span>
          {t("step_4_prefix")}{" "}
          <a
            href="https://kidsa-z.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            kidsa-z.com
            <span className="text-xs">↗</span>
          </a>{" "}
          {t("step_4_suffix")}
        </span>
      ),
    },
    {
      icon: BookOpen,
      title: t("step_5_title"),
      content: t("step_5_content"),
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <PublicNavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="container relative z-10 mx-auto px-4 py-12 md:py-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-blue-100 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_home")}
          </Link>
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              {t("header")}
            </h1>
            <p className="mt-4 text-lg text-blue-100">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={index}
                  className="overflow-hidden border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-lg"
                >
                  <CardContent className="p-6 md:p-7">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {t("step_label", { number: index + 1 })}
                          </span>
                        </div>
                        <h2 className="mb-3 text-lg font-bold text-gray-900 md:text-xl">
                          {step.title}
                        </h2>
                        <div className="text-gray-600 leading-relaxed [&>a]:inline-flex">
                          {step.content}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center shadow-xl shadow-blue-500/20 md:p-12">
            <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
              {t("cta_title")}
            </h2>
            <p className="mb-8 text-blue-100">
              {t("cta_subtitle")}
            </p>
            <Button
              asChild
              size="lg"
              className="bg-yellow-400 font-semibold text-gray-900 shadow-lg shadow-yellow-400/30 transition-all hover:bg-yellow-500"
            >
              <Link href="/sign-up" className="inline-flex items-center gap-2">
                {t("cta_button")}
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
