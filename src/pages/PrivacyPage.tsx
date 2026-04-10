import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/policy.css'

type Lang = 'en' | 'es'

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>(() =>
    navigator.language?.startsWith('es') ? 'es' : 'en'
  )

  const t = (en: string, es: string) => lang === 'es' ? es : en

  return (
    <div className="policy-root">
      <div className="policy-bg" />

      {/* Nav */}
      <nav className="policy-nav">
        <Link to="/" className="policy-nav-logo">
          <span className="policy-nav-dot" />
          WeUp
        </Link>
        <div className="policy-nav-right">
          <div className="policy-nav-lang">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>ES</button>
          </div>
          <Link to="/" className="policy-nav-back">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('Back to WeUp', 'Volver a WeUp')}
          </Link>
        </div>
      </nav>

      <div className="policy-page">

        {/* Header */}
        <div className="policy-header">
          <div className="policy-badge">
            🔒 {t('Privacy Policy', 'Política de Privacidad')}
          </div>
          <h1 className="policy-title">
            {t('Your data,', 'Tus datos,')}<br />
            <em>{t('your control', 'tu control')}</em>
          </h1>
          <p className="policy-meta">
            {t('Last updated:', 'Última actualización:')} <strong>March 21, 2026</strong>
            &nbsp;·&nbsp;
            {t('Effective:', 'Vigente desde:')} <strong>March 21, 2026</strong>
          </p>
        </div>

        {/* Summary cards */}
        <div className="summary-grid">
          {[
            { icon: '🚫', label: t('We never sell your data', 'Nunca vendemos tus datos'), desc: t('Your financial information is never sold to third parties. Ever.', 'Tu información financiera nunca se vende a terceros. Jamás.') },
            { icon: '🔐', label: t('Bank-level encryption', 'Cifrado bancario'), desc: t('All data encrypted in transit and at rest with AES-256.', 'Todos los datos cifrados en tránsito y en reposo con AES-256.') },
            { icon: '✋', label: t("You're in control", 'Tú tienes el control'), desc: t('Export or delete your data anytime, with no questions asked.', 'Exporta o elimina tus datos en cualquier momento, sin preguntas.') },
          ].map((c, i) => (
            <div className="summary-card" key={i}>
              <div className="summary-icon">{c.icon}</div>
              <div className="summary-label">{c.label}</div>
              <div className="summary-desc">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* TOC */}
        <div className="toc">
          <div className="toc-title">{t('Table of Contents', 'Tabla de Contenidos')}</div>
          <div className="toc-list">
            {[
              ['s1', t('Who we are', 'Quiénes somos')],
              ['s2', t('What data we collect', 'Qué datos recopilamos')],
              ['s3', t('How we use your data', 'Cómo usamos tus datos')],
              ['s4', t('Who we share data with', 'Con quién compartimos datos')],
              ['s5', t('Data security', 'Seguridad de datos')],
              ['s6', t('Your rights', 'Tus derechos')],
              ['s7', 'Cookies'],
              ['s8', t("Children's privacy", 'Privacidad de menores')],
              ['s9', t('Changes to this policy', 'Cambios a esta política')],
              ['s10', t('Contact us', 'Contáctanos')],
            ].map(([id, label], i) => (
              <a href={`#${id}`} key={id}>
                <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <div className="policy-section" id="s1">
          <div className="section-num">01</div>
          <h2 className="section-heading">{t('Who we are', 'Quiénes somos')}</h2>
          <div className="section-body">
            <p>{t('WeUp is a personal finance management platform designed for users in Colombia and Mexico. We help you track income, expenses, budgets, and financial goals through an AI-powered dashboard.', 'WeUp es una plataforma de gestión de finanzas personales diseñada para usuarios en Colombia y México. Te ayudamos a rastrear ingresos, gastos, presupuestos y metas financieras a través de un dashboard con inteligencia artificial.')}</p>
            <p>{t('This Privacy Policy explains how WeUp collects, uses, and protects your personal and financial information when you use our services at www.weupwealthylife.com and any associated apps.', 'Esta Política de Privacidad explica cómo WeUp recopila, usa y protege tu información personal y financiera cuando usas nuestros servicios en www.weupwealthylife.com y cualquier aplicación asociada.')}</p>
            <div className="highlight">
              <p>{t('By using WeUp, you agree to the collection and use of information in accordance with this policy. If you do not agree, please stop using the service.', 'Al usar WeUp, aceptas la recopilación y el uso de información de acuerdo con esta política. Si no estás de acuerdo, por favor deja de usar el servicio.')}</p>
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 2 */}
        <div className="policy-section" id="s2">
          <div className="section-num">02</div>
          <h2 className="section-heading">{t('What data we collect', 'Qué datos recopilamos')}</h2>
          <div className="section-body">
            <p>{t('We collect only what we need to provide and improve the service:', 'Recopilamos solo lo necesario para prestar y mejorar el servicio:')}</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Data type', 'Tipo de dato')}</th>
                  <th>{t('What we collect', 'Qué recopilamos')}</th>
                  <th>{t('Why', 'Por qué')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [t('Account info', 'Info de cuenta'), t('Name, email address', 'Nombre, correo electrónico'), t('To create and manage your account', 'Para crear y gestionar tu cuenta')],
                  [t('Financial data', 'Datos financieros'), t('Transactions, amounts, categories, descriptions you enter', 'Transacciones, montos, categorías, descripciones que ingresas'), t('To power your dashboard, reports and AI insights', 'Para impulsar tu dashboard, reportes e insights de IA')],
                  [t('Preferences', 'Preferencias'), t('Currency, language, income range, financial goal', 'Moneda, idioma, rango de ingresos, meta financiera'), t('To personalize the experience', 'Para personalizar la experiencia')],
                  [t('Usage data', 'Datos de uso'), t('Pages visited, features used, session duration', 'Páginas visitadas, funciones usadas, duración de sesión'), t('To improve the product', 'Para mejorar el producto')],
                  [t('Device info', 'Info del dispositivo'), t('Browser type, OS, IP address', 'Tipo de navegador, SO, dirección IP'), t('For security and fraud prevention', 'Para seguridad y prevención de fraude')],
                ].map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
            <div className="highlight">
              <p><strong>{t('We do NOT collect:', 'NO recopilamos:')}</strong> {t('bank account numbers, card numbers, PINs, or any payment credentials. WeUp is a manual tracking tool — you enter what you want to share.', 'números de cuenta bancaria, números de tarjeta, PINs, ni credenciales de pago. WeUp es una herramienta de seguimiento manual — tú ingresas lo que quieres compartir.')}</p>
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 3 */}
        <div className="policy-section" id="s3">
          <div className="section-num">03</div>
          <h2 className="section-heading">{t('How we use your data', 'Cómo usamos tus datos')}</h2>
          <div className="section-body">
            <p>{t('We use your information exclusively to:', 'Usamos tu información exclusivamente para:')}</p>
            <ul className="policy-list">
              {[
                t('Provide and maintain the WeUp service', 'Prestar y mantener el servicio WeUp'),
                t('Generate personalized AI insights based on your financial data', 'Generar insights de IA personalizados basados en tus datos financieros'),
                t('Send transactional emails (account confirmation, password reset)', 'Enviar correos transaccionales (confirmación de cuenta, restablecimiento de contraseña)'),
                t('Detect and prevent fraud and security threats', 'Detectar y prevenir fraudes y amenazas de seguridad'),
                t('Improve our product through aggregated, anonymous analytics', 'Mejorar nuestro producto a través de análisis agregados y anónimos'),
                t('Comply with legal obligations in Colombia and Mexico', 'Cumplir con obligaciones legales en Colombia y México'),
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p style={{ marginTop: 16 }}>{t('We will never use your financial data for advertising, profiling for third parties, or any purpose not listed above.', 'Nunca usaremos tus datos financieros para publicidad, creación de perfiles para terceros, ni para ningún propósito no listado anteriormente.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 4 */}
        <div className="policy-section" id="s4">
          <div className="section-num">04</div>
          <h2 className="section-heading">{t('Who we share data with', 'Con quién compartimos datos')}</h2>
          <div className="section-body">
            <p>{t('We share your data only with trusted service providers who help us operate WeUp:', 'Compartimos tus datos solo con proveedores de servicios de confianza que nos ayudan a operar WeUp:')}</p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('Provider', 'Proveedor')}</th>
                  <th>{t('Purpose', 'Propósito')}</th>
                  <th>{t('Data shared', 'Datos compartidos')}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Supabase', t('Database & authentication', 'Base de datos y autenticación'), t('All user data (encrypted)', 'Todos los datos de usuario (cifrados)')],
                  ['Google OAuth', t('Optional sign-in with Google', 'Inicio de sesión opcional con Google'), t('Name, email (only if you choose Google login)', 'Nombre, email (solo si eliges Google)')],
                  ['Vercel', t('App hosting & delivery', 'Alojamiento y entrega de la app'), t('Server logs, IP addresses', 'Registros del servidor, direcciones IP')],
                  ['Anthropic (Claude AI)', t('AI-powered financial insights', 'Insights financieros con IA'), t('Anonymized spending patterns (no personal identifiers)', 'Patrones de gasto anonimizados (sin identificadores personales)')],
                ].map((row, i) => (
                  <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
            <div className="highlight">
              <p><strong>{t('We never sell your data.', 'Nunca vendemos tus datos.')}</strong> {t('All service providers are bound by data processing agreements and must handle your information according to this policy.', 'Todos los proveedores están sujetos a acuerdos de procesamiento de datos y deben manejar tu información según esta política.')}</p>
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 5 */}
        <div className="policy-section" id="s5">
          <div className="section-num">05</div>
          <h2 className="section-heading">{t('Data security', 'Seguridad de datos')}</h2>
          <div className="section-body">
            <p>{t("We take the security of your financial data seriously. Here's how we protect it:", 'Tomamos muy en serio la seguridad de tus datos financieros. Así los protegemos:')}</p>
            <ul className="policy-list">
              {[
                t('AES-256 encryption for all data at rest', 'Cifrado AES-256 para todos los datos en reposo'),
                t('TLS 1.3 encryption for all data in transit (HTTPS)', 'Cifrado TLS 1.3 para todos los datos en tránsito (HTTPS)'),
                t('Row-level security — you can only access your own data', 'Seguridad a nivel de fila — solo puedes acceder a tus propios datos'),
                t('Password hashing using bcrypt — we never store plain passwords', 'Hash de contraseñas con bcrypt — nunca almacenamos contraseñas en texto plano'),
                t('Regular security audits and dependency updates', 'Auditorías de seguridad regulares y actualizaciones de dependencias'),
                t('Multi-factor authentication available for all accounts', 'Autenticación multifactor disponible para todas las cuentas'),
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p style={{ marginTop: 16 }}>{t('While we implement industry-standard security measures, no system is 100% secure. If you discover a security vulnerability, please contact us immediately at ', 'Aunque implementamos medidas de seguridad estándar de la industria, ningún sistema es 100% seguro. Si descubres una vulnerabilidad, contáctanos de inmediato en ')}<a href="mailto:privacy@weup.app">privacy@weup.app</a>.</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 6 */}
        <div className="policy-section" id="s6">
          <div className="section-num">06</div>
          <h2 className="section-heading">{t('Your rights', 'Tus derechos')}</h2>
          <div className="section-body">
            <p>{t('You have full control over your data. You can exercise any of these rights at any time:', 'Tienes control total sobre tus datos. Puedes ejercer cualquiera de estos derechos en cualquier momento:')}</p>
            <div className="rights-grid">
              {[
                { icon: '👁️', title: t('Access', 'Acceso'), desc: t('Request a copy of all personal data we hold about you.', 'Solicitar una copia de todos los datos personales que tenemos sobre ti.') },
                { icon: '✏️', title: t('Correction', 'Corrección'), desc: t('Update or correct inaccurate information in your account.', 'Actualizar o corregir información inexacta en tu cuenta.') },
                { icon: '🗑️', title: t('Deletion', 'Eliminación'), desc: t('Delete your account and all associated data permanently.', 'Eliminar tu cuenta y todos los datos asociados de forma permanente.') },
                { icon: '📦', title: t('Portability', 'Portabilidad'), desc: t('Export all your financial data in CSV or JSON format.', 'Exportar todos tus datos financieros en formato CSV o JSON.') },
                { icon: '🚫', title: t('Opt-out', 'Cancelar suscripción'), desc: t('Opt out of marketing emails at any time from Settings.', 'Cancelar emails de marketing en cualquier momento desde Ajustes.') },
                { icon: '⏸️', title: t('Restriction', 'Restricción'), desc: t('Request restriction of processing while a dispute is resolved.', 'Solicitar restricción del procesamiento mientras se resuelve una disputa.') },
              ].map((r, i) => (
                <div className="right-item" key={i}>
                  <div className="right-icon">{r.icon}</div>
                  <div className="right-title">{r.title}</div>
                  <div className="right-desc">{r.desc}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16 }}>{t('To exercise any of these rights, email us at ', 'Para ejercer cualquiera de estos derechos, escríbenos a ')}<a href="mailto:privacy@weup.app">privacy@weup.app</a>. {t('We will respond within 30 business days.', 'Responderemos dentro de 30 días hábiles.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 7 */}
        <div className="policy-section" id="s7">
          <div className="section-num">07</div>
          <h2 className="section-heading">Cookies</h2>
          <div className="section-body">
            <p>{t('WeUp uses minimal cookies strictly necessary to operate the service:', 'WeUp usa cookies mínimas estrictamente necesarias para operar el servicio:')}</p>
            <ul className="policy-list">
              <li>{t('Session cookies to keep you logged in securely', 'Cookies de sesión para mantenerte autenticado de forma segura')}</li>
              <li>{t('Preference cookies to remember your language and currency settings', 'Cookies de preferencia para recordar tu idioma y configuración de moneda')}</li>
            </ul>
            <p style={{ marginTop: 14 }}>{t('We do not use advertising cookies, tracking pixels, or third-party analytics that sell your data. You can disable cookies in your browser settings, but the app may not function correctly.', 'No usamos cookies de publicidad, píxeles de rastreo ni análisis de terceros que vendan tus datos. Puedes deshabilitar las cookies en tu navegador, pero la app puede no funcionar correctamente.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 8 */}
        <div className="policy-section" id="s8">
          <div className="section-num">08</div>
          <h2 className="section-heading">{t("Children's privacy", 'Privacidad de menores')}</h2>
          <div className="section-body">
            <p>{t('WeUp is not directed to children under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has created an account, please contact us at ', 'WeUp no está dirigido a menores de 18 años. No recopilamos intencionalmente información personal de menores. Si crees que un menor ha creado una cuenta, contáctanos en ')}<a href="mailto:privacy@weup.app">privacy@weup.app</a> {t('and we will delete the account immediately.', 'y eliminaremos la cuenta de inmediato.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 9 */}
        <div className="policy-section" id="s9">
          <div className="section-num">09</div>
          <h2 className="section-heading">{t('Changes to this policy', 'Cambios a esta política')}</h2>
          <div className="section-body">
            <p>{t('We may update this Privacy Policy from time to time. When we make significant changes, we will:', 'Podemos actualizar esta Política de Privacidad periódicamente. Cuando hagamos cambios significativos:')}</p>
            <ul className="policy-list">
              <li>{t('Notify you by email at least 30 days before the changes take effect', 'Notificarte por email al menos 30 días antes de que los cambios entren en vigor')}</li>
              <li>{t('Display a prominent notice in the app', 'Mostrar un aviso destacado en la app')}</li>
              <li>{t("Update the 'Last updated' date at the top of this page", "Actualizar la fecha 'Última actualización' al inicio de esta página")}</li>
            </ul>
            <p style={{ marginTop: 14 }}>{t('Continued use of WeUp after changes take effect constitutes acceptance of the new policy.', 'El uso continuado de WeUp después de que los cambios entren en vigor constituye la aceptación de la nueva política.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 10 */}
        <div className="policy-section" id="s10">
          <div className="section-num">10</div>
          <h2 className="section-heading">{t('Contact us', 'Contáctanos')}</h2>
          <div className="section-body">
            <p>{t('If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out:', 'Si tienes preguntas, inquietudes o solicitudes sobre esta Política de Privacidad o tus datos personales, comunícate:')}</p>
          </div>
          <div className="contact-card">
            <h3>{t("We're here to help", 'Estamos aquí para ayudarte')}</h3>
            <p>{t('Our team responds to all privacy requests within 30 business days. We take your concerns seriously.', 'Nuestro equipo responde a todas las solicitudes de privacidad dentro de 30 días hábiles. Tomamos tus inquietudes en serio.')}</p>
            <a href="mailto:privacy@weup.app">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              privacy@weup.app
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="policy-footer">
          <Link to="/" className="policy-footer-logo">
            <span className="footer-dot" />
            WeUp
          </Link>
          <div className="policy-footer-links">
            <Link to="/">{t('Home', 'Inicio')}</Link>
            <Link to="/privacy">{t('Privacy Policy', 'Política de Privacidad')}</Link>
            <Link to="/terms">{t('Terms', 'Términos')}</Link>
            <Link to="/#pricing">{t('Pricing', 'Precios')}</Link>
          </div>
          <p className="policy-footer-copy">© 2026 WeUp. {t('All rights reserved.', 'Todos los derechos reservados.')}</p>
        </div>

      </div>
    </div>
  )
}
