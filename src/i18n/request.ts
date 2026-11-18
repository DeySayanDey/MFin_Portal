import { getRequestConfig } from "next-intl/server";
import { isAppLocale, routing, type AppLocale } from "./routing";
import en from "../../messages/en.json";
import bn from "../../messages/bn.json";
import hi from "../../messages/hi.json";
import orMessages from "../../messages/or.json";

const catalogs: Record<AppLocale, typeof en> = {
  en,
  bn,
  hi,
  or: orMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isAppLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: catalogs[locale],
  };
});
