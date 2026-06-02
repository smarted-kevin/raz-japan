import { useTranslations } from "next-intl";

const STATUS_KEYS = ["active", "inactive", "removed", "used", "unused", "all"] as const;

export function useAdminStatusLabel() {
  const t = useTranslations("dashboard.admin.common");

  return (status: string) => {
    if (STATUS_KEYS.includes(status as (typeof STATUS_KEYS)[number])) {
      return t(status as (typeof STATUS_KEYS)[number]);
    }
    return status;
  };
}
