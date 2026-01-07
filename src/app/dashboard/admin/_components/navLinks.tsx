"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type UserRole = "user" | "admin" | "org_admin" | "god";

interface NavLinksProps {
  role: UserRole;
}

export default function NavLinks({ role }: NavLinksProps) {
  
  const pathname = usePathname();
  const t = useTranslations("dashboard.admin.nav");
  
  const allLinks = [
    { name: t("home"), href: "/dashboard/admin", roles: ["admin", "org_admin", "god"] },
    { name: t("users"), href: "/dashboard/admin/users", roles: ["admin", "god"] },
    { name: t("students"), href: "/dashboard/admin/students", roles: ["admin", "org_admin", "god"] },
    { name: t("classrooms"), href: "/dashboard/admin/classrooms", roles: ["admin", "org_admin", "god"] },
    { name: t("courses"), href: "/dashboard/admin/courses", roles: ["admin", "god"] },
    { name: t("orders"), href: "/dashboard/admin/orders", roles: ["admin", "god"] },
    { name: t("activation_codes"), href: "/dashboard/admin/activation-codes", roles: ["admin", "org_admin", "god"] },
  ];

  // Filter links based on user role
  const links = allLinks.filter((link) => link.roles.includes(role));

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