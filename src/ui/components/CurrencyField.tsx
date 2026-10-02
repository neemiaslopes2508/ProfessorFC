import { formatCurrencyInputBRL, parseCurrencyBRL } from './currency'

export function CurrencyField({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="currency-label">{label}<span className="currency-input"><span aria-hidden="true">R$</span><input type="text" inputMode="decimal" required={required} value={value} placeholder="0,00" onChange={event => onChange(event.target.value)} onBlur={() => {
    if (!value.trim()) return
    try { onChange(formatCurrencyInputBRL(parseCurrencyBRL(value))) } catch { /* Mantém a entrada para correção; envio valida e informa o erro. */ }
  }} /></span></label>
}
