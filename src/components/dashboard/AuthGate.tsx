interface AuthGateProps {
  step: 1 | 2 | 3
  error?: string
}

const STEPS = [
  { en: 'Verifying your session',   es: 'Verificando tu sesión' },
  { en: 'Loading your profile',     es: 'Cargando tu perfil' },
  { en: 'Getting your data ready',  es: 'Preparando tus datos' },
]

export function AuthGate({ step, error }: AuthGateProps) {
  return (
    <div className="auth-gate">
      <div className="gate-logo-wrap">
        <img src="/Logo_WeUp.png" alt="WeUp" className="gate-logo-img" />
        <span className="gate-wordmark">WeUp</span>
      </div>

      <div className="gate-steps">
        {STEPS.map((s, i) => {
          const n = i + 1
          const isDone   = n < step
          const isActive = n === step
          return (
            <div
              key={n}
              className={`gate-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
            >
              <div className="gate-step-icon">{isDone ? '✓' : n}</div>
              <span>{s.en}</span>
            </div>
          )
        })}
      </div>

      {!error && <div className="gate-spinner" />}

      {error && (
        <div className="gate-error">
          {error}
        </div>
      )}
    </div>
  )
}
