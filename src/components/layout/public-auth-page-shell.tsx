import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { PublicNavBar } from "~/components/ui/nav/publicNavBar";

const HERO_PATTERN_BG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

type PublicAuthPageShellProps = {
  title: string;
  subtitle: string;
  backLabel: string;
  children: ReactNode;
};

export function PublicAuthPageShell({
  title,
  subtitle,
  backLabel,
  children,
}: PublicAuthPageShellProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white">
      <PublicNavBar />

      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: HERO_PATTERN_BG }}
        />
        <div className="container relative z-10 mx-auto px-4 py-12 md:py-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-blue-100 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
          <div className="mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-lg text-blue-100">{subtitle}</p>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
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

      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto flex justify-center px-4">{children}</div>
      </section>
    </main>
  );
}
