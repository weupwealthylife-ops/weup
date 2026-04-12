import type { Currency } from '../types/dashboard'

export const CURRENCIES: Record<Currency, { code: string; locale: string; label: string; flag: string }> = {
  USD: { code: 'USD', locale: 'en-US', label: 'USD – US Dollar',      flag: '🇺🇸' },
  COP: { code: 'COP', locale: 'es-CO', label: 'COP – Colombian Peso', flag: '🇨🇴' },
  MXN: { code: 'MXN', locale: 'es-MX', label: 'MXN – Mexican Peso',   flag: '🇲🇽' },
}

export function fmt(n: number, currency: Currency = 'USD'): string {
  const c = CURRENCIES[currency]
  return new Intl.NumberFormat(c.locale, {
    style: 'currency',
    currency: c.code,
    maximumFractionDigits: currency === 'COP' ? 0 : 2,
  }).format(n)
}

export function fmtDate(dateStr: string, lang: 'en' | 'es' = 'en'): string {
  return new Date(dateStr).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function monthLabel(month: number, year: number, lang: 'en' | 'es' = 'en'): string {
  return new Date(year, month, 1).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
}
