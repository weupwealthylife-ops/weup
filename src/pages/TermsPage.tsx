import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/policy.css'

type Lang = 'en' | 'es'

export default function TermsPage() {
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
        <div className="policy-header" style={{ marginBottom: 48 }}>
          <div className="policy-badge">
            📋 {t('Terms & Conditions', 'Términos y Condiciones')}
          </div>
          <h1 className="policy-title">
            {t('Terms of', 'Términos de')} <em>{t('service', 'servicio')}</em>
          </h1>
          <p className="policy-meta">
            {t('Last updated:', 'Última actualización:')} <strong>March 21, 2026</strong>
            &nbsp;·&nbsp;
            {t('Effective:', 'Vigente desde:')} <strong>March 21, 2026</strong>
          </p>
          <p className="policy-meta" style={{ marginTop: 10 }}>
            {t('Please read these Terms carefully before using WeUp. By creating an account or using the service, you agree to be bound by these Terms.', 'Lee estos Términos cuidadosamente antes de usar WeUp. Al crear una cuenta o usar el servicio, aceptas estar sujeto a estos Términos.')}
          </p>
        </div>

        {/* Summary cards */}
        <div className="summary-grid">
          {[
            { icon: '📱', label: t('Personal use only', 'Solo uso personal'), desc: t('WeUp is for personal finance tracking, not professional financial advice.', 'WeUp es para seguimiento financiero personal, no asesoría financiera profesional.') },
            { icon: '💳', label: t('Subscription billing', 'Facturación por suscripción'), desc: t('Pro plan billed monthly or annually. Cancel anytime with no penalty.', 'Plan Pro facturado mensual o anualmente. Cancela cuando quieras sin penalidad.') },
            { icon: '⚖️', label: t('Fair use', 'Uso justo'), desc: t('Use WeUp responsibly. We may suspend accounts that violate these terms.', 'Usa WeUp responsablemente. Podemos suspender cuentas que violen estos términos.') },
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
              ['t1', t('Acceptance of terms', 'Aceptación de términos')],
              ['t2', t('Description of service', 'Descripción del servicio')],
              ['t3', t('Account registration', 'Registro de cuenta')],
              ['t4', t('Subscription & payments', 'Suscripción y pagos')],
              ['t5', t('Acceptable use', 'Uso aceptable')],
              ['t6', t('Financial disclaimer', 'Descargo financiero')],
              ['t7', t('Intellectual property', 'Propiedad intelectual')],
              ['t8', t('Limitation of liability', 'Limitación de responsabilidad')],
              ['t9', t('Termination', 'Terminación')],
              ['t10', t('Governing law', 'Ley aplicable')],
              ['t11', t('Contact', 'Contacto')],
            ].map(([id, label], i) => (
              <a href={`#${id}`} key={id}>
                <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <div className="policy-section" id="t1">
          <div className="section-num">01</div>
          <h2 className="section-heading">{t('Acceptance of terms', 'Aceptación de términos')}</h2>
          <div className="section-body">
            <p>{t('By accessing or using WeUp (the "Service"), you confirm that you are at least 18 years old, have the legal capacity to enter into these Terms, and agree to be bound by them.', 'Al acceder o usar WeUp (el "Servicio"), confirmas que tienes al menos 18 años, tienes capacidad legal para aceptar estos Términos y aceptas estar sujeto a ellos.')}</p>
            <p>{t('If you are using WeUp on behalf of a company or organization, you represent that you have the authority to bind that entity to these Terms.', 'Si usas WeUp en nombre de una empresa u organización, declaras que tienes autoridad para vincular a esa entidad con estos Términos.')}</p>
            <div className="highlight">
              <p>{t('These Terms constitute a legally binding agreement between you and WeUp. If you do not agree to these Terms, do not use the Service.', 'Estos Términos constituyen un acuerdo legalmente vinculante entre tú y WeUp. Si no estás de acuerdo con estos Términos, no uses el Servicio.')}</p>
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 2 */}
        <div className="policy-section" id="t2">
          <div className="section-num">02</div>
          <h2 className="section-heading">{t('Description of service', 'Descripción del servicio')}</h2>
          <div className="section-body">
            <p>{t('WeUp is a personal finance management platform that allows users to:', 'WeUp es una plataforma de gestión de finanzas personales que permite a los usuarios:')}</p>
            <ul className="policy-list">
              {[
                t('Manually record income and expenses', 'Registrar ingresos y gastos manualmente'),
                t('Categorize and track spending habits', 'Categorizar y rastrear hábitos de gasto'),
                t('Set budgets and financial goals', 'Establecer presupuestos y metas financieras'),
                t('Receive AI-powered financial insights (Pro plan)', 'Recibir insights financieros con IA (plan Pro)'),
                t('Connect bank accounts for automatic transaction import (Pro plan)', 'Conectar cuentas bancarias para importación automática de transacciones (plan Pro)'),
                t('View visual reports and spending analytics', 'Ver reportes visuales y análisis de gastos'),
              ].map((item, i) => <li key={i}>{item}</li>)}
            </ul>
            <p style={{ marginTop: 14 }}>{t('WeUp reserves the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable notice.', 'WeUp se reserva el derecho de modificar, suspender o discontinuar cualquier aspecto del Servicio en cualquier momento con aviso razonable.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 3 */}
        <div className="policy-section" id="t3">
          <div className="section-num">03</div>
          <h2 className="section-heading">{t('Account registration', 'Registro de cuenta')}</h2>
          <div className="section-body">
            <p>{t('To use WeUp you must create an account. You agree to:', 'Para usar WeUp debes crear una cuenta. Aceptas:')}</p>
            <ul className="policy-list">
              {[
                t('Provide accurate, current, and complete information during registration', 'Proporcionar información precisa, actual y completa durante el registro'),
                t('Maintain and update your account information as needed', 'Mantener y actualizar tu información de cuenta según sea necesario'),
                t('Keep your password secure and confidential', 'Mantener tu contraseña segura y confidencial'),
                t('Not share your account with any other person', 'No compartir tu cuenta con ninguna otra persona'),
              ].map((item, i) => <li key={i}>{item}</li>)}
              <li>{t('Notify us immediately of any unauthorized access at ', 'Notificarnos inmediatamente de cualquier acceso no autorizado en ')}<a href="mailto:legal@weup.app">legal@weup.app</a></li>
            </ul>
            <p style={{ marginTop: 14 }}>{t('You are responsible for all activity that occurs under your account. WeUp will not be liable for any loss resulting from unauthorized use of your account.', 'Eres responsable de toda la actividad que ocurra bajo tu cuenta. WeUp no será responsable por ninguna pérdida derivada del uso no autorizado de tu cuenta.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 4 */}
        <div className="policy-section" id="t4">
          <div className="section-num">04</div>
          <h2 className="section-heading">{t('Subscription & payments', 'Suscripción y pagos')}</h2>
          <div className="section-body">
            <p>{t('WeUp offers the following plans:', 'WeUp ofrece los siguientes planes:')}</p>
            <table className="plan-table">
              <thead>
                <tr>
                  <th>{t('Plan', 'Plan')}</th>
                  <th>{t('Price', 'Precio')}</th>
                  <th>{t('Features', 'Funciones')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Free</td>
                  <td>{t('$0 forever', '$0 siempre')}</td>
                  <td>{t('1 account, 30 transactions/month, basic reports', '1 cuenta, 30 transacciones/mes, reportes básicos')}</td>
                </tr>
                <tr>
                  <td>Pro</td>
                  <td>{t('$4.99/month or $39/year', '$4.99/mes o $39/año')}</td>
                  <td>{t('Unlimited everything, AI insights, bank sync, advanced reports', 'Todo ilimitado, insights IA, sincronización bancaria, reportes avanzados')}</td>
                </tr>
                <tr>
                  <td>Family</td>
                  <td>{t('$9.99/month or $79/year', '$9.99/mes o $79/año')}</td>
                  <td>{t('Everything in Pro, up to 5 members, shared household budget', 'Todo en Pro, hasta 5 miembros, presupuesto familiar compartido')}</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: 16 }}>
              <strong>{t('Billing:', 'Facturación:')}</strong> {t('Subscriptions are billed automatically at the start of each billing period. All prices are in USD unless otherwise stated.', 'Las suscripciones se facturan automáticamente al inicio de cada período de facturación. Todos los precios son en USD salvo que se indique lo contrario.')}
            </p>
            <p>
              <strong>{t('Free trial:', 'Prueba gratuita:')}</strong> {t('Pro plan includes a 14-day free trial. No credit card required. You will only be charged if you choose to continue after the trial.', 'El plan Pro incluye una prueba gratuita de 14 días. No se requiere tarjeta de crédito. Solo se te cobrará si decides continuar después de la prueba.')}
            </p>
            <p>
              <strong>{t('Cancellation:', 'Cancelación:')}</strong> {t('You may cancel your subscription at any time from Settings. Your access continues until the end of the current billing period. No refunds for partial periods.', 'Puedes cancelar tu suscripción en cualquier momento desde Ajustes. Tu acceso continúa hasta el final del período de facturación actual. Sin reembolsos por períodos parciales.')}
            </p>
            <p>
              <strong>{t('Refunds:', 'Reembolsos:')}</strong> {t('If you experience a technical issue caused by WeUp that prevents you from using the service, contact us within 7 days for a full refund consideration.', 'Si experimentas un problema técnico causado por WeUp que te impide usar el servicio, contáctanos dentro de 7 días para una consideración de reembolso completo.')}
            </p>
            <div className="highlight">
              <p>{t('Price changes will be communicated at least 30 days in advance via email. Your continued use of the service after the price change constitutes acceptance.', 'Los cambios de precio se comunicarán con al menos 30 días de anticipación por email. El uso continuado del servicio después del cambio de precio constituye aceptación.')}</p>
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 5 */}
        <div className="policy-section" id="t5">
          <div className="section-num">05</div>
          <h2 className="section-heading">{t('Acceptable use', 'Uso aceptable')}</h2>
          <div className="section-body">
            <p>{t('You agree to use WeUp only for lawful purposes. You must NOT:', 'Aceptas usar WeUp solo para propósitos legales. NO debes:')}</p>
            <ul className="policy-list">
              {[
                t('Use the service for money laundering or any illegal financial activity', 'Usar el servicio para lavado de dinero o cualquier actividad financiera ilegal'),
                t('Attempt to gain unauthorized access to any part of the Service', 'Intentar obtener acceso no autorizado a cualquier parte del Servicio'),
                t('Reverse engineer, decompile, or disassemble the Service', 'Realizar ingeniería inversa, descompilar o desensamblar el Servicio'),
                t('Use automated bots or scrapers to extract data from WeUp', 'Usar bots automatizados o scrapers para extraer datos de WeUp'),
                t('Upload malicious code, viruses, or any harmful content', 'Subir código malicioso, virus o cualquier contenido dañino'),
                t('Impersonate another person or create accounts under false identities', 'Suplantar a otra persona o crear cuentas bajo identidades falsas'),
                t('Resell or commercially exploit the Service without written permission', 'Revender o explotar comercialmente el Servicio sin permiso escrito'),
              ].map((item, i) => <li key={i} className="no">{item}</li>)}
            </ul>
            <p style={{ marginTop: 14 }}>{t('Violation of this section may result in immediate account suspension or termination without refund.', 'La violación de esta sección puede resultar en suspensión o terminación inmediata de la cuenta sin reembolso.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 6 */}
        <div className="policy-section" id="t6">
          <div className="section-num">06</div>
          <h2 className="section-heading">{t('Financial disclaimer', 'Descargo financiero')}</h2>
          <div className="section-body">
            <div className="highlight-warn">
              <p><strong>{t('WeUp is NOT a financial advisor.', 'WeUp NO es un asesor financiero.')}</strong> {t('The AI insights, reports, and suggestions provided by WeUp are for informational and educational purposes only. They do not constitute financial, investment, tax, or legal advice.', 'Los insights de IA, reportes y sugerencias proporcionados por WeUp son solo para propósitos informativos y educativos. No constituyen asesoría financiera, de inversión, fiscal ni legal.')}</p>
            </div>
            <p>{t('You should always consult a qualified financial professional before making significant financial decisions. WeUp is not responsible for any financial decisions you make based on information provided by the Service.', 'Siempre debes consultar a un profesional financiero calificado antes de tomar decisiones financieras importantes. WeUp no es responsable de ninguna decisión financiera que tomes basada en la información proporcionada por el Servicio.')}</p>
            <p>{t('The accuracy of your financial data depends entirely on the information you enter. WeUp does not verify the accuracy of manually entered transactions.', 'La precisión de tus datos financieros depende completamente de la información que ingresas. WeUp no verifica la precisión de las transacciones ingresadas manualmente.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 7 */}
        <div className="policy-section" id="t7">
          <div className="section-num">07</div>
          <h2 className="section-heading">{t('Intellectual property', 'Propiedad intelectual')}</h2>
          <div className="section-body">
            <p>{t('All content, features, and functionality of the WeUp Service — including but not limited to the design, text, graphics, logos, AI models, and code — are owned by WeUp and protected by applicable intellectual property laws.', 'Todo el contenido, funciones y funcionalidades del Servicio WeUp — incluyendo pero no limitado al diseño, texto, gráficos, logotipos, modelos de IA y código — son propiedad de WeUp y están protegidos por las leyes de propiedad intelectual aplicables.')}</p>
            <p>{t('You retain full ownership of all financial data you enter into WeUp. By using the Service, you grant WeUp a limited license to process your data solely to provide the Service to you.', 'Conservas la propiedad total de todos los datos financieros que ingresas en WeUp. Al usar el Servicio, otorgas a WeUp una licencia limitada para procesar tus datos únicamente para prestarte el Servicio.')}</p>
            <p>{t('You may not copy, modify, distribute, sell, or lease any part of our Service without prior written permission from WeUp.', 'No puedes copiar, modificar, distribuir, vender ni arrendar ninguna parte de nuestro Servicio sin permiso previo por escrito de WeUp.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 8 */}
        <div className="policy-section" id="t8">
          <div className="section-num">08</div>
          <h2 className="section-heading">{t('Limitation of liability', 'Limitación de responsabilidad')}</h2>
          <div className="section-body">
            <p>{t('To the maximum extent permitted by law, WeUp and its officers, directors, employees, and agents shall not be liable for:', 'En la máxima medida permitida por la ley, WeUp y sus directivos, directores, empleados y agentes no serán responsables por:')}</p>
            <ul className="policy-list">
              {[
                t('Any indirect, incidental, special, or consequential damages', 'Cualquier daño indirecto, incidental, especial o consecuente'),
                t('Loss of profits, data, goodwill, or other intangible losses', 'Pérdida de ganancias, datos, buena voluntad u otras pérdidas intangibles'),
                t('Financial decisions made based on WeUp insights or reports', 'Decisiones financieras tomadas basadas en insights o reportes de WeUp'),
                t('Service interruptions, bugs, or errors in the platform', 'Interrupciones del servicio, errores o fallos en la plataforma'),
                t('Unauthorized access to your account by third parties', 'Acceso no autorizado a tu cuenta por terceros'),
              ].map((item, i) => <li key={i} className="bullet">{item}</li>)}
            </ul>
            <p style={{ marginTop: 14 }}>{t('Our total liability to you for any claim arising from these Terms or your use of the Service shall not exceed the amount you paid to WeUp in the 12 months preceding the claim.', 'Nuestra responsabilidad total ante ti por cualquier reclamación derivada de estos Términos o tu uso del Servicio no excederá el monto que pagaste a WeUp en los 12 meses anteriores a la reclamación.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 9 */}
        <div className="policy-section" id="t9">
          <div className="section-num">09</div>
          <h2 className="section-heading">{t('Termination', 'Terminación')}</h2>
          <div className="section-body">
            <p><strong>{t('By you:', 'Por ti:')}</strong> {t('You may delete your account at any time from Settings → Danger Zone. Upon deletion, all your data will be permanently removed within 30 days.', 'Puedes eliminar tu cuenta en cualquier momento desde Ajustes → Zona de peligro. Tras la eliminación, todos tus datos se eliminarán permanentemente dentro de 30 días.')}</p>
            <p><strong>{t('By WeUp:', 'Por WeUp:')}</strong> {t('We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, or if required by law. We will notify you by email when possible.', 'Podemos suspender o terminar tu cuenta de inmediato si violas estos Términos, participas en actividad fraudulenta, o si la ley lo requiere. Te notificaremos por email cuando sea posible.')}</p>
            <p>{t('Upon termination, your right to use the Service ceases immediately. All provisions of these Terms that by their nature should survive termination shall survive.', 'Tras la terminación, tu derecho a usar el Servicio cesa de inmediato. Todas las disposiciones de estos Términos que por su naturaleza deben sobrevivir a la terminación, sobrevivirán.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 10 */}
        <div className="policy-section" id="t10">
          <div className="section-num">10</div>
          <h2 className="section-heading">{t('Governing law', 'Ley aplicable')}</h2>
          <div className="section-body">
            <p>{t('These Terms shall be governed by and construed in accordance with the laws of the Republic of Colombia, without regard to its conflict of law provisions.', 'Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República de Colombia, sin tener en cuenta sus disposiciones sobre conflictos de leyes.')}</p>
            <p>{t('For users in Mexico, to the extent required by local law, Mexican consumer protection regulations (Ley Federal de Protección al Consumidor) also apply.', 'Para usuarios en México, en la medida requerida por la ley local, también aplican las regulaciones mexicanas de protección al consumidor (Ley Federal de Protección al Consumidor).')}</p>
            <p>{t('Any disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in Bogotá, Colombia.', 'Cualquier disputa derivada de estos Términos se intentará resolver primero mediante negociación de buena fe. Si no se resuelve en 30 días, las disputas se someterán a arbitraje vinculante en Bogotá, Colombia.')}</p>
          </div>
        </div>
        <div className="section-divider" />

        {/* Section 11 */}
        <div className="policy-section" id="t11">
          <div className="section-num">11</div>
          <h2 className="section-heading">{t('Contact', 'Contacto')}</h2>
          <div className="section-body">
            <p>{t('If you have any questions about these Terms, please contact us:', 'Si tienes preguntas sobre estos Términos, contáctanos:')}</p>
          </div>
          <div className="contact-card">
            <h3>{t('Questions about these terms?', '¿Preguntas sobre estos términos?')}</h3>
            <p>{t('Our team is happy to clarify anything in plain language. We respond within 5 business days.', 'Nuestro equipo está feliz de aclarar cualquier cosa en lenguaje sencillo. Respondemos dentro de 5 días hábiles.')}</p>
            <a href="mailto:legal@weup.app">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              legal@weup.app
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
            <Link to="/terms">{t('Terms & Conditions', 'Términos y Condiciones')}</Link>
            <Link to="/#pricing">{t('Pricing', 'Precios')}</Link>
          </div>
          <p className="policy-footer-copy">© 2026 WeUp. {t('All rights reserved.', 'Todos los derechos reservados.')}</p>
        </div>

      </div>
    </div>
  )
}
