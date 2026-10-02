const wholeCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const preciseCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
const inputCurrency = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatCurrencyBRL(cents: number): string {
  return (cents % 100 === 0 ? wholeCurrency : preciseCurrency).format(cents / 100)
}

export function formatCurrencyInputBRL(cents: number): string {
  return inputCurrency.format(cents / 100)
}

/** Converte a entrada brasileira para centavos inteiros; pontos indicam milhares. */
export function parseCurrencyBRL(value: string): number {
  const match = /^(\d+|\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/.exec(value.trim().replace(/^R\$\s*/, ''))
  if (!match) throw new Error('Informe um valor como 509.000,00, com até duas casas decimais.')
  const cents = Number(match[1].replaceAll('.', '')) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  if (!Number.isSafeInteger(cents)) throw new Error('O valor informado é muito grande.')
  return cents
}
