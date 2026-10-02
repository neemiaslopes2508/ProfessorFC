import { describe, expect, it } from 'vitest'
import { addGameDays, compareGameDates, differenceInGameDays } from '../../core/date'
import { GameCalendar } from './calendar'

describe('tempo civil e calendário', () => {
  it('opera datas civis incluindo bissexto, mudança de ano, extremos e 50 temporadas', () => {
    expect(addGameDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addGameDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addGameDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addGameDays('0001-01-01', 1)).toBe('0001-01-02')
    expect(compareGameDates('2026-04-01', '2026-04-05')).toBe(-1)
    expect(differenceInGameDays('2026-04-05', '2026-04-01')).toBe(-4)
    expect(addGameDays('2026-01-01', differenceInGameDays('2026-01-01', '2076-01-01'))).toBe('2076-01-01')
    for (const run of [() => addGameDays('2026-02-29', 1), () => addGameDays('9999-12-31', 1),
      () => addGameDays('0001-01-01', -1), () => addGameDays('2026-01-01', 0.5)]) expect(run).toThrow()
  })

  it('ordena por data/ordem/ID, consulta intervalos inclusivos e preserva isolamento', () => {
    const events = [
      { id: 'z', type: 'CUSTOM', date: '2026-04-05', order: 10, reference: { kind: 'Object', id: 'old' } },
      { id: 'b', type: 'CUSTOM', date: '2026-04-05', order: 0 },
      { id: 'a', type: 'CUSTOM', date: '2026-04-05', order: 0 },
      { id: 'earlier', type: 'CUSTOM', date: '2026-04-03', order: 20 },
    ]
    const calendar = GameCalendar.create('2026-04-01', events)
    events[0].reference!.id = 'changed'
    expect(calendar.eventsOn('2026-04-05').map(event => event.id)).toEqual(['a', 'b', 'z'])
    expect(calendar.eventsBetween('2026-04-03', '2026-04-05')).toHaveLength(4)
    expect(calendar.eventsBetween('2026-04-04', '2026-04-04')).toEqual([])
    expect(calendar.eventById('z')!.reference!.id).toBe('old')
    expect(() => calendar.eventsBetween('2026-04-05', '2026-04-03')).toThrow()
    expect(() => GameCalendar.create('2026-04-01', [events[0], events[0]])).toThrow()
    expect(() => GameCalendar.create('2026-04-06', events)).toThrow()
  })

  it('avança um dia/próximo evento sem regressão nem salto de pendências, confirmando uma única vez', () => {
    const original = GameCalendar.create('2026-04-01', [{ id: 'match', type: 'CUSTOM', date: '2026-04-05' }])
    expect(original.advanceDay().newDate).toBe('2026-04-02')
    expect(original.currentDate).toBe('2026-04-01')
    const advanced = original.advanceToNextEvent()
    expect(advanced.newDate).toBe('2026-04-05')
    expect(advanced.pendingEvents.map(event => event.id)).toEqual(['match'])
    expect(() => original.advanceTo('2026-04-06')).toThrow(/pendente/)
    expect(() => original.markProcessed(['match'])).toThrow()
    expect(() => advanced.calendar.advanceDay()).toThrow(/pendente/)
    expect(() => advanced.calendar.advanceTo('2026-04-04')).toThrow(/regredir/)
    const acknowledged = advanced.calendar.markProcessed(['match'])
    expect(acknowledged.nextPendingEvent()).toBeUndefined()
    expect(acknowledged.advanceToNextEvent().newDate).toBe('2026-04-05')
    expect(acknowledged.advanceDay().newDate).toBe('2026-04-06')
    expect(advanced.calendar.isProcessed('match')).toBe(false)
    expect(() => acknowledged.markProcessed(['match'])).toThrow(/já processado/)
  })
})
