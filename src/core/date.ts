import { assertDate } from './validation'

/** Convenção existente: data civil ISO, sem horário/fuso. */
export type GameDate = string
const DAY_MS = 86_400_000
const timestamp = (date: GameDate): number => {
  assertDate(date, 'GameDate')
  return Date.parse(`${date}T00:00:00.000Z`)
}

export function compareGameDates(a: GameDate, b: GameDate): number {
  assertDate(a, 'GameDate')
  assertDate(b, 'GameDate')
  return a < b ? -1 : a > b ? 1 : 0
}

/** Dias de a até b; positivo quando b está depois de a. */
export function differenceInGameDays(a: GameDate, b: GameDate): number {
  return (timestamp(b) - timestamp(a)) / DAY_MS
}

export function addGameDays(date: GameDate, days: number): GameDate {
  if (!Number.isSafeInteger(days)) throw new Error('Dias devem ser um inteiro seguro.')
  const shifted = new Date(timestamp(date) + days * DAY_MS)
  if (!Number.isFinite(shifted.getTime())) throw new Error('Data resultante fora do intervalo suportado.')
  const result = shifted.toISOString().slice(0, 10)
  assertDate(result, 'Data resultante (0001–9999)')
  return result
}
