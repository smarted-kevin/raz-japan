"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { 
  Home, 
  Users, 
  GraduationCap, 
  School, 
  BookOpen, 
  ShoppingCart, 
  Key 
} from "lucide-react";
import { cn } from "~/lib/utils";

type UserRole = "user" | "admin" | "org_admin" | "god";

interface SidebarNavProps {
  role: UserRole;
  onLinkClick?: () => void;
  collapsed?: boolean;
}

const iconMap = {
  home: Home,
  users: Users,
  students: GraduationCap,
  classrooms: School,
  courses: BookOpen,
  orders: ShoppingCart,
  activation_codes: Key,
};

export default function SidebarNav({ role, onLinkClick, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.admin.nav");
  
  const allLinks = [
    { name: t("home"), href: "/dashboard/admin", roles: ["admin", "org_admin", "god"], icon: "home" },
    { name: t("users"), href: "/dashboard/admin/users", roles: ["admin", "god"], icon: "users" },
    { name: t("students"), href: "/dashboard/admin/students", roles: ["admin", "org_admin", "god"], icon: "students" },
    { name: t("classrooms"), href: "/dashboard/admin/classrooms", roles: ["admin", "org_admin", "god"], icon: "classrooms" },
    { name: t("courses"), href: "/dashboard/admin/courses", roles: ["admin", "god"], icon: "courses" },
    { name: t("orders"), href: "/dashboard/admin/orders", roles: ["admin", "god"], icon: "orders" },
    { name: t("activation_codes"), href: "/dashboard/admin/activation-codes", roles: ["admin", "org_admin", "god"], icon: "activation_codes" },
  ];

  // Filter links based on user role
  const links = allLinks.filter((link) => link.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      {links.map((link) => {
        const Icon = iconMap[link.icon as keyof typeof iconMap];
        const isActive = pathname === link.href;
        
        return (
          <Link
            key={link.name}
            href={link.href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center rounded-md text-sm font-medium transition-colors",
              collapsed
                ? "justify-center px-2 py-2"
                : "gap-3 px-3 py-2",
              isActive
                ? "bg-blue-900 text-white"
                : "text-white/80 hover:bg-blue-600 hover:text-white"
            )}
            title={collapsed ? link.name : undefined}
          >
            {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
            {!collapsed && <span>{link.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
