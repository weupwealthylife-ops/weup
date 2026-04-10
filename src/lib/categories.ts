export const CAT_ICONS: Record<string, string> = {
  food: '🛒', transport: '🚌', housing: '🏠', health: '💊',
  leisure: '🎬', entertainment: '🎬', shopping: '🛍️', education: '📚',
  subscriptions: '📱', salary: '💼', freelance: '💻', savings: '🏦', other: '📦',
}

export const CAT_COLORS: Record<string, string> = {
  food: '#FEE2E2', transport: '#FEF3C7', housing: '#DBEAFE', health: '#D1FAE5',
  leisure: '#EDE9FE', entertainment: '#EDE9FE', shopping: '#FCE7F3', education: '#E0F2FE',
  subscriptions: '#F0FDF4', salary: '#D1FAE5', freelance: '#D1FAE5',
  savings: '#FEF3C7', other: '#F1F5F9',
}

export const CAT_OPTIONS = [
  { value: 'food',          label: '🛒 Food & groceries' },
  { value: 'transport',     label: '🚌 Transport' },
  { value: 'housing',       label: '🏠 Housing & utilities' },
  { value: 'health',        label: '💊 Health' },
  { value: 'leisure',       label: '🎬 Leisure & dining' },
  { value: 'shopping',      label: '🛍️ Shopping & clothing' },
  { value: 'education',     label: '📚 Education' },
  { value: 'subscriptions', label: '📱 Subscriptions' },
  { value: 'salary',        label: '💼 Salary' },
  { value: 'freelance',     label: '💻 Freelance' },
  { value: 'savings',       label: '🏦 Savings' },
  { value: 'other',         label: '📦 Other' },
]

export const CAT_LABELS_EN: Record<string, string> = {
  food: 'Food', transport: 'Transport', housing: 'Housing', health: 'Health',
  leisure: 'Leisure', entertainment: 'Entertainment', shopping: 'Shopping',
  education: 'Education', subscriptions: 'Subscriptions',
  salary: 'Salary', freelance: 'Freelance', savings: 'Savings', other: 'Other',
}

export const CAT_LABELS_ES: Record<string, string> = {
  food: 'Alimentación', transport: 'Transporte', housing: 'Vivienda', health: 'Salud',
  leisure: 'Ocio', entertainment: 'Entretenimiento', shopping: 'Compras',
  education: 'Educación', subscriptions: 'Suscripciones',
  salary: 'Salario', freelance: 'Freelance', savings: 'Ahorros', other: 'Otro',
}

export const DEFAULT_BUDGETS: Record<string, number> = {
  food: 500, transport: 150, housing: 800,
  entertainment: 200, shopping: 300, health: 100, education: 100,
}

export const BUDGET_CATS = [
  { key: 'food',          icon: '🛒', en: 'Food & groceries',   es: 'Alimentación' },
  { key: 'transport',     icon: '🚌', en: 'Transport',           es: 'Transporte' },
  { key: 'housing',       icon: '🏠', en: 'Housing & utilities', es: 'Vivienda' },
  { key: 'health',        icon: '💊', en: 'Health',              es: 'Salud' },
  { key: 'leisure',       icon: '🎬', en: 'Leisure & dining',    es: 'Ocio' },
  { key: 'shopping',      icon: '🛍️', en: 'Shopping',            es: 'Compras' },
  { key: 'education',     icon: '📚', en: 'Education',           es: 'Educación' },
  { key: 'subscriptions', icon: '📱', en: 'Subscriptions',       es: 'Suscripciones' },
]

// Client-side AI categorization rules
export const CAT_RULES: Record<string, string[]> = {
  food:          ['éxito','exito','carulla','jumbo','olímpica','olimpica','walmart','mercado','supermarket','grocery','rappi','ifood','domicilio','pizza','burger','kfc','mcdonald','subway','restaurant','restaurante','cafe','café','coffee','starbucks','juan valdez','crepes','frisby'],
  transport:     ['uber','cabify','transmilenio','metro','taxi','gasolina','gas station','peaje','parkeo','parking','vuelo','flight','bus','tren','train'],
  housing:       ['arriendo','rent','alquiler','epm','acueducto','gas natural','electricidad','electricity','internet','claro','tigo','movistar','wom','vodafone','agua','utilities'],
  health:        ['farmacia','droguería','drogueria','pharmacy','clinica','clínica','hospital','medico','médico','doctor','dentist','gym','gimnasio','smartfit'],
  leisure:       ['netflix','spotify','disney','hbo','amazon prime','youtube','cinema','cine','teatro','concert','concierto','bar','club','discoteca','licorera','deporte','sport','nike','adidas'],
  shopping:      ['zara','h&m','falabella','alkosto','ktronix','apple','samsung','amazon','ebay','mercadolibre','linio','ropa','clothes','zapateria','shopping'],
  education:     ['universidad','university','colegio','school','curso','course','udemy','coursera','platzi','libro','book','libreria'],
  subscriptions: ['netflix','spotify','disney','hbo','amazon','apple','google','microsoft','adobe','canva','notion','slack','github','dropbox','icloud'],
  salary:        ['salario','salary','nomina','nómina','sueldo','pago empresa','employer','company payment','payroll'],
  freelance:     ['freelance','cliente','client','proyecto','project','honorarios','consulting','factura','invoice'],
  savings:       ['ahorro','saving','inversion','inversión','cdts','fiducia','fondos'],
}

export function autoCategory(desc: string): string | null {
  const lower = desc.toLowerCase()
  for (const [cat, keywords] of Object.entries(CAT_RULES)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return null
}
