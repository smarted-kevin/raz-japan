"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";




export default function NavLinks() {
  
  const pathname = usePathname();
  const t = useTranslations("dashboard.admin.nav");
  const links = [
    { name: t("home"), href: "/dashboard/admin" },
    { name: t("users"), href: "/dashboard/admin/users" },
    { name: t("students"), href: "/dashboard/admin/students" },
    { name: t("classrooms"), href: "/dashboard/admin/classrooms" },
    { name: t("courses"), href: "/dashboard/admin/courses"},
    { name: t("orders"), href: "/dashboard/admin/orders" },
  ];

  return (
    <div className="flex h-full">
      {links.map((link) => {
        return (
          <Link
            key={link.name}
            href={link.href}
            className={(pathname == link.href ? "bg-blue-900" : "bg-blue-400") + "text-white h-full flex items-center gap-x-1 [&:hover]:bg-blue-600 px-5"}
          >
            <span className="text-lightgray">{link.name}</span>
          </Link>
        )
      })}
    </div>
  );
}