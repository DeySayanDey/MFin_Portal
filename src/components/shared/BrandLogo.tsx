"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

const LOGO_SRC = "/PrioSuiteLogo.png";
const LOGO_WIDTH = 1026;
const LOGO_HEIGHT = 243;

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  const t = useTranslations("common");

  return (
    <Image
      src={LOGO_SRC}
      alt={t("appName")}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      unoptimized
      className={`h-auto max-w-full object-contain ${className}`}
    />
  );
}
