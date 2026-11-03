"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { StickyNotePlus } from "lucide-react";
import { BiSolidCoinStack } from "react-icons/bi";
import { BsBarChartLineFill } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Select } from "@/components/ui/Select";
import { isAppLocale } from "@/i18n/routing";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  wide?: boolean;
};

type FeatureIcon = ComponentType<
  SVGProps<SVGSVGElement> & { className?: string; size?: number | string }
>;

function BrandMark({
  compact = false,
  align = "center",
}: {
  compact?: boolean;
  align?: "start" | "center";
}) {
  return (
    <Link
      href="/login"
      className={`inline-flex items-center ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      <BrandLogo
        priority
        className={compact ? "w-[min(100%,280px)]" : "w-[min(100%,460px)]"}
      />
    </Link>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  tone,
  showDivider,
}: {
  icon: FeatureIcon;
  label: string;
  tone: string;
  showDivider?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col items-center gap-2.5 px-3 text-center ${
        showDivider ? "border-e border-[#C5D5E8]/70" : ""
      }`}
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone}`}
      >
        <Icon className="h-7 w-7" size={28} aria-hidden />
      </span>
      <p className="max-w-[5.5rem] text-[12px] font-semibold leading-snug text-[#163A5F]">
        {label}
      </p>
    </div>
  );
}

export function AuthShell({
  children,
  title,
  subtitle,
  wide = false,
}: AuthShellProps) {
  const t = useTranslations("auth");

  const features = [
    {
      icon: FaUserFriends,
      label: t("featureMemberManagement"),
      tone: "bg-[#DCEBFF] text-[#2B7DE9]",
    },
    {
      icon: BiSolidCoinStack,
      label: t("featureLoanManagement"),
      tone: "bg-[#D8F5F0] text-[#00A88E]",
    },
    {
      icon: StickyNotePlus,
      label: t("featureSavingsDeposits"),
      tone: "bg-[#EDE4FF] text-[#8B5CF6]",
    },
    {
      icon: BsBarChartLineFill,
      label: t("featureReportsAnalytics"),
      tone: "bg-[#DCEBFF] text-[#2B7DE9]",
    },
  ] as const;

  return (
    <div className="auth-shell relative min-h-dvh w-full overflow-hidden ">
      {/* Full-bleed scenic background — plant + waves sit bottom-left like the mockup */}
     
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <Image
          src="/floginpagebg.png"
          alt=""
          fill
          priority
          unoptimized
          quality={100}
          sizes="100vw"
          className="select-none object-cover object-left object-bottom"
        />
        {/* Soft wash so left copy stays readable without a frosted card */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/35 to-transparent lg:from-white/55 lg:via-white/15 lg:to-transparent" />
        <div className="absolute inset-0 bg-white/50 lg:hidden" />
      </div>

      {/* <p className="absolute end-5 top-5 z-20 hidden max-w-60 text-end text-[11px] font-medium leading-snug text-[#6F87A3] lg:end-8 lg:top-6 lg:block xl:end-10">
        <span className="border-b-2 border-[#00A88E] pb-0.5">
          {t("empoweringTagline")}
        </span>
      </p> */}

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-8 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-center lg:gap-4 lg:px-8 xl:gap-6 xl:px-10">
        {/* Left branding — closer to the login card, slightly higher */}
        <section className="relative hidden w-full max-w-2xl shrink-0 lg:flex lg:justify-start lg:-translate-y-20 xl:-translate-y-24">
          <div className="relative z-20 w-full max-w-2xl text-start">
            {/* left branding */}
            <BrandMark align="start" />
            <h1 className="mt-8 text-[32px] font-extrabold leading-[1.2] tracking-tight text-[#163A5F] xl:mt-10 xl:text-[40px]">
              <span className="block">{t("smarterTools")}</span>
              <span className="block">
                {t("forWord")}{" "}
                <span className="text-[#00A88E]">{t("strongerCommunities")}</span>
              </span>
            </h1>
            <div className="mt-9 flex max-w-2xl items-start xl:mt-11">
              {features.map((item, index) => (
                <FeatureItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  tone={item.tone}
                  showDivider={index < features.length - 1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Right — login card, centered with left panel */}
        <section className="flex w-full flex-none items-center justify-center lg:w-[min(100%,520px)] xl:w-[560px]">
          <div
            className={`auth-card w-full rounded-[22px] border border-white/90 bg-white px-6 py-8 shadow-[0_18px_50px_rgba(22,58,95,0.14)] sm:rounded-3xl sm:px-10 sm:py-10 ${
              wide ? "max-w-[560px]" : "max-w-[500px]"
            }`}
          >
            {/* login card branding */}
            <div className="mb-6 flex justify-center sm:mb-7">
              <BrandMark compact />
            </div>

            <div className="mb-6 text-center sm:mb-7">
              <h2 className="text-[24px] font-extrabold leading-tight text-[#163A5F] sm:text-[26px]">
                {title}
              </h2>
              <p className="mt-2 text-[13px] text-[#7A93B0] sm:text-sm">{subtitle}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-[11px] text-[#9AADC2] sm:mt-7 sm:text-xs">
              {t("poweredByPrefix")}{" "}
              <a
                href="https://prioritysolutions.in"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer font-semibold text-[#1B74D6] transition-colors hover:text-[#0D5FBF]"
              >
                {t("poweredByBrand")}
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export const authFieldClass =
  "auth-field w-full appearance-none rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-muted-soft hover:border-border-strong focus:border-brand focus:shadow-[var(--focus-ring)]";

const languages = [
  { value: "en", labelKey: "localeEn" },
  { value: "hi", labelKey: "localeHi" },
  { value: "bn", labelKey: "localeBn" },
  { value: "or", labelKey: "localeOr" },
] as const;

export function AuthLanguageSelect({ hideLabel = false }: { hideLabel?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("auth");

  return (
    <div className="auth-field-group block text-sm">
      {hideLabel ? (
        <span className="sr-only">{t("language")}</span>
      ) : (
        <span className="auth-label mb-1.5 block font-medium text-slate-700">
          {t("language")}
        </span>
      )}
      <Select
        aria-label={t("language")}
        value={locale}
        clearable={false}
        searchable={false}
        options={languages.map((lang) => ({
          value: lang.value,
          label: t(lang.labelKey),
        }))}
        onChange={(nextLocale) => {
          if (!isAppLocale(nextLocale) || nextLocale === locale) return;
          router.replace(pathname, { locale: nextLocale });
          router.refresh();
        }}
      />
    </div>
  );
}
