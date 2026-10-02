import { addGameDays, compareGameDates } from '../../core/date'
import type { GameDate } from '../../core/date'
import { assertDate, assertIntegerRange, assertNonEmptyString, assertUnique } from '../../core/validation'
import type { CalendarEvent } from './event'

interface EventIndex<E> {
  readonly ordered: readonly E[]
  readonly byId: ReadonlyMap<string, E>
}

/** Snapshot imutável; índice compartilhado entre avanços, sem reconstrução da agenda. */
export class GameCalendar<E extends CalendarEvent = CalendarEvent> {
  private constructor(
    readonly currentDate: GameDate,
    private readonly index: EventIndex<E>,
    private readonly processed: ReadonlySet<string>,
  ) { Object.freeze(this) }

  static create<E extends CalendarEvent>(currentDate: GameDate, events: readonly E[]): GameCalendar<E> {
    assertDate(currentDate, 'Data corrente')
    assertUnique(events.map(event => event.id), 'Eventos do calendário')
    const ordered = events.map(event => {
      assertNonEmptyString(event.id, 'ID de evento')
      assertNonEmptyString(event.type, 'Tipo de evento')
      assertDate(event.date, 'Data de evento')
      if (compareGameDates(event.date, currentDate) < 0) throw new Error('Evento inicial anterior à data corrente.')
      if (event.order !== undefined) assertIntegerRange(event.order, 0, Number.MAX_SAFE_INTEGER, 'Ordem lógica')
      if (event.reference) {
        assertNonEmptyString(event.reference.kind, 'Tipo de referência')
        assertNonEmptyString(event.reference.id, 'ID da referência')
      }
      return Object.freeze({ ...event, ...(event.reference ? { reference: Object.freeze({ ...event.reference }) } : {}) }) as E
    }).sort((a, b) => compareGameDates(a.date, b.date) || (a.order ?? 0) - (b.order ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    return new GameCalendar(currentDate, { ordered: Object.freeze(ordered), byId: new Map(ordered.map(event => [event.id, event])) }, new Set())
  }

  private lowerBound(date: GameDate): number {
    let low = 0
    let high = this.index.ordered.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (compareGameDates(this.index.ordered[middle].date, date) < 0) low = middle + 1
      else high = middle
    }
    return low
  }

  eventsBetween(from: GameDate, to: GameDate): readonly E[] {
    if (compareGameDates(from, to) > 0) throw new Error('Intervalo de consulta invertido.')
    const start = this.lowerBound(from)
    let end = this.lowerBound(to)
    while (end < this.index.ordered.length && this.index.ordered[end].date === to) end++
    return Object.freeze(this.index.ordered.slice(start, end))
  }

  eventsOn(date: GameDate): readonly E[] { return this.eventsBetween(date, date) }
  eventById(id: string): E | undefined { return this.index.byId.get(id) }
  isProcessed(id: string): boolean { return this.processed.has(id) }
  pendingOn(date: GameDate): readonly E[] { return Object.freeze(this.eventsOn(date).filter(event => !this.isProcessed(event.id))) }

  nextPendingEvent(): E | undefined {
    for (let index = this.lowerBound(this.currentDate); index < this.index.ordered.length; index++) {
      const event = this.index.ordered[index]
      if (!this.isProcessed(event.id)) return event
    }
  }

  markProcessed(ids: readonly string[]): GameCalendar<E> {
    if (ids.length === 0) return this
    assertUnique(ids, 'Eventos processados')
    const processed = new Set(this.processed)
    for (const id of ids) {
      const event = this.eventById(id)
      if (!event || event.date !== this.currentDate) throw new Error('Só é possível processar evento conhecido da data corrente.')
      if (processed.has(id)) throw new Error('Evento já processado.')
      processed.add(id)
    }
    return new GameCalendar(this.currentDate, this.index, processed)
  }

  advanceTo(date: GameDate) {
    if (compareGameDates(date, this.currentDate) < 0) throw new Error('Data corrente não pode regredir.')
    const next = this.nextPendingEvent()
    if (next && compareGameDates(next.date, date) < 0) throw new Error(`Evento pendente ${next.id} impede pular ${next.date}.`)
    const calendar = new GameCalendar(date, this.index, this.processed)
    return Object.freeze({ calendar, newDate: date, pendingEvents: calendar.pendingOn(date) })
  }

  advanceDay() { return this.advanceTo(addGameDays(this.currentDate, 1)) }
  advanceToNextEvent() {
    const next = this.nextPendingEvent()
    return this.advanceTo(next?.date ?? this.currentDate)
  }
}
