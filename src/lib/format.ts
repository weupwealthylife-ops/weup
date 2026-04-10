export function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
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
