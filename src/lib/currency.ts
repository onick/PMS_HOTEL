export const DEFAULT_CURRENCY = "USD";

export function normalizeCurrencyCode(currency?: string | null): string {
  const value = (currency || "").trim().toUpperCase();
  return value.length === 3 ? value : DEFAULT_CURRENCY;
}

export function formatCurrencyAmount(
  amount: number,
  currency?: string | null,
  locale = "es-DO",
  options?: Intl.NumberFormatOptions,
): string {
  const code = normalizeCurrencyCode(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    ...options,
  }).format(amount);
}

export function formatCurrencyFromCents(
  cents: number,
  currency?: string | null,
  locale = "es-DO",
  options?: Intl.NumberFormatOptions,
): string {
  return formatCurrencyAmount(cents / 100, currency, locale, options);
}
