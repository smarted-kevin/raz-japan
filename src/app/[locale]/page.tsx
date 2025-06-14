import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation.public";

export default function HomePage() {
  const t = useTranslations("Homepage");

  return (
    <div>
      <h1>{t('title')}</h1>
      <Link href="/">{t('button')}</Link>
    </div>
  )
}