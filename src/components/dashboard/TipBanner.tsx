import { useState } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'

interface TipBannerProps {
  pageKey: string
  en: string
  es: string
}

export function TipBanner({ pageKey, en, es }: TipBannerProps) {
  const { user, lang } = useDashboard()
  const storageKey = `weup_tip_${pageKey}_${user.id}`

  const [visible, setVisible] = useState(() => !localStorage.getItem(storageKey))

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
  }

  if (!visible) return null

  const text = lang === 'es' ? es : en

  return (
    <div className="tip-banner">
      <span className="tip-banner-icon">💡</span>
      <span className="tip-banner-text">{text}</span>
      <button className="tip-banner-close" onClick={dismiss} aria-label="Dismiss tip">✕</button>
    </div>
  )
}
