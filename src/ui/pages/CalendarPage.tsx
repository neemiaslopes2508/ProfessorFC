import { useEffect, useRef, useState } from 'react'
import { getClubCalendarEvents } from '../../application/calendarOverview'
import type { ClubCalendarEvent } from '../../application/calendarOverview'
import type { PrototypeSession } from '../../application/prototypeSession'
import { ClubCrest, ClubMark } from '../components/ClubMark'
import { dateLabel } from '../components/presentation'

const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// Datas civis em UTC, usadas apenas para montar a grade e navegar visualmente.
function monthLayout(month: string) {
  const first = new Date(`${month}-01T00:00:00Z`)
  const last = new Date(first)
  last.setUTCMonth(last.getUTCMonth() + 1, 0)
  const count = last.getUTCDate()
  const offset = first.getUTCDay()
  const cells = Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1
    return day > 0 && day <= count ? `${month}-${String(day).padStart(2, '0')}` : undefined
  })
  return { first, lastDate: last.toISOString().slice(0, 10), cells, title: monthFormatter.format(first) }
}

function eventStatus(event: ClubCalendarEvent, currentDate: string) {
  if (event.type !== 'MATCH') return event.processed ? 'Concluído' : 'Agendado'
  return event.match.status === 'FINISHED' ? 'Concluído' : event.date === currentDate ? 'Pendente' : 'Agendado'
}
function milestoneLabel(event: ClubCalendarEvent) { return event.type === 'SEASON_START' ? 'Início da temporada' : 'Fim da temporada' }

export function CalendarPage({ session }: { session: PrototypeSession }) {
  const currentDate = session.game.calendar.currentDate
  const [month, setMonth] = useState(currentDate.slice(0, 7))
  const [selectedDate, setSelectedDate] = useState<string>()
  const layout = monthLayout(month)
  const events = getClubCalendarEvents(session.game, `${month}-01`, layout.lastDate)
  const byDate = new Map<string, ClubCalendarEvent[]>()
  for (const event of events) byDate.set(event.date, [...(byDate.get(event.date) ?? []), event])
  function navigate(offset: number) {
    const date = new Date(layout.first)
    date.setUTCMonth(date.getUTCMonth() + offset)
    setMonth(date.toISOString().slice(0, 7))
    setSelectedDate(undefined)
  }
  return <>
    <span className="eyebrow">Agenda do clube</span><h1>Calendário</h1>
    <p className="muted">Data atual: <time dateTime={currentDate}>{dateLabel(currentDate)}</time> · Clique em um dia com evento para ver os detalhes.</p>
    <section className="calendar-panel" aria-labelledby="calendar-month-title">
      <header className="calendar-toolbar">
        <h2 id="calendar-month-title" aria-live="polite">{layout.title}</h2>
        <div className="calendar-navigation">
          <button aria-label="Mês anterior" disabled={month === '0001-01'} onClick={() => navigate(-1)}>‹ <span>Mês anterior</span></button>
          <button onClick={() => { setMonth(currentDate.slice(0, 7)); setSelectedDate(undefined) }}>Hoje</button>
          <button aria-label="Mês seguinte" disabled={month === '9999-12'} onClick={() => navigate(1)}><span>Mês seguinte</span> ›</button>
        </div>
      </header>
      <div className="calendar-legend">
        <span className="calendar-home">● Jogo em casa</span><span className="calendar-away">◆ Jogo fora</span>
        <span className="calendar-completed-key">✓ Concluído</span><span className="calendar-today-key">◎ Data atual</span>
      </div>
      <div className="calendar-scroll" role="region" aria-label="Calendário mensal, com rolagem horizontal em telas menores" tabIndex={0}>
        <table className="monthly-calendar">
          <caption className="sr-only">{layout.title} — partidas do seu clube e marcos da temporada</caption>
          <thead><tr>{weekdays.map(day => <th key={day} scope="col">{day}</th>)}</tr></thead>
          <tbody>{Array.from({ length: layout.cells.length / 7 }, (_, week) => <tr key={week}>
            {layout.cells.slice(week * 7, week * 7 + 7).map((date, column) => {
              if (!date) return <td key={column} className="calendar-empty" />
              const dayEvents = byDate.get(date) ?? []
              const primary = dayEvents.find(event => event.type === 'MATCH') ?? dayEvents[0]
              const opponent = primary?.type === 'MATCH' ? session.teams.find(team => team.club.id === primary.opponentId)?.club : undefined
              const today = date === currentDate
              const content = <>
                <span className="calendar-day-heading"><time dateTime={date}>{Number(date.slice(-2))}</time>{today && <span>Hoje</span>}</span>
                {primary?.type === 'MATCH' ? <span className={`calendar-match ${primary.isHome ? 'calendar-home' : 'calendar-away'} ${primary.match.status === 'FINISHED' ? 'calendar-completed' : 'calendar-upcoming'}`}>
                  <span className="calendar-opponent"><ClubCrest small club={opponent} /><strong>{opponent?.shortName ?? 'Adversário'}</strong></span>
                  <span className="calendar-match-meta"><span>{primary.isHome ? '● Casa' : '◆ Fora'}</span><span>R{primary.match.round}</span></span>
                  <span className="calendar-match-status">{primary.match.result ? <><strong>{primary.match.result.homeGoals}–{primary.match.result.awayGoals}</strong> <span>✓ Concluído</span></> : eventStatus(primary, currentDate)}</span>
                </span> : primary && <span className="calendar-milestone">{milestoneLabel(primary)}<small>{eventStatus(primary, currentDate)}</small></span>}
                {dayEvents.length > 1 && <span className="calendar-more">+{dayEvents.length - 1} {dayEvents.length === 2 ? 'evento' : 'eventos'}</span>}
              </>
              const description = primary?.type === 'MATCH' ? `Rodada ${primary.match.round}, ${opponent?.name ?? 'Adversário'}, ${primary.isHome ? 'em casa' : 'fora de casa'}, ${eventStatus(primary, currentDate)}${primary.match.result ? `, placar ${primary.match.result.homeGoals} a ${primary.match.result.awayGoals}, mandante–visitante` : ''}` : primary ? milestoneLabel(primary) : ''
              return <td key={column}>{primary ? <button className={`calendar-day ${today ? 'calendar-current-day' : ''}`} aria-current={today ? 'date' : undefined} aria-label={`${dateLabel(date)}, ${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}. ${description}`} onClick={() => setSelectedDate(date)}>{content}</button> : <div className={`calendar-day ${today ? 'calendar-current-day' : ''}`} aria-current={today ? 'date' : undefined}>{content}</div>}</td>
            })}
          </tr>)}</tbody>
        </table>
      </div>
      <p className="calendar-footnote">Placares na ordem mandante–visitante. Navegar entre meses não avança a data do jogo.{!events.length && ' Nenhum evento do clube neste mês.'}</p>
    </section>
    {selectedDate && <CalendarDayDialog session={session} date={selectedDate} events={byDate.get(selectedDate) ?? []} onClose={() => setSelectedDate(undefined)} />}
  </>
}

function CalendarDayDialog({ session, date, events, onClose }: { session: PrototypeSession; date: string; events: readonly ClubCalendarEvent[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current!
    element.showModal()
    return () => { element.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])
  return <dialog className="calendar-dialog" ref={dialog} aria-labelledby="calendar-day-title" onCancel={event => { event.preventDefault(); onClose() }}>
    <div className="section-heading"><div><span className="eyebrow">Agenda do clube</span><h2 id="calendar-day-title">{dateLabel(date)}</h2></div><button autoFocus aria-label="Fechar detalhes do dia" onClick={onClose}>Fechar</button></div>
    {events.map(event => <article className="calendar-event-detail" key={event.id}>
      {event.type === 'MATCH' ? <>
        <h3>Rodada {event.match.round} · {event.isHome ? 'Em casa' : 'Fora de casa'}</h3>
        <div className="calendar-detail-score"><ClubMark session={session} id={event.match.homeClubId} /><strong>{event.match.result ? `${event.match.result.homeGoals}–${event.match.result.awayGoals}` : '×'}</strong><ClubMark session={session} id={event.match.awayClubId} /></div>
        <dl><dt>Adversário</dt><dd>{session.teams.find(team => team.club.id === event.opponentId)?.club.name ?? 'Adversário'}</dd><dt>Seu clube</dt><dd>{event.isHome ? 'Mandante' : 'Visitante'}</dd><dt>Status da partida</dt><dd>{eventStatus(event, session.game.calendar.currentDate)}</dd><dt>Resultado</dt><dd>{event.match.result ? `${event.match.result.homeGoals}–${event.match.result.awayGoals} (mandante–visitante)` : 'Ainda não disputada'}</dd></dl>
      </> : <><h3>{milestoneLabel(event)}</h3><p className="muted">{eventStatus(event, session.game.calendar.currentDate)}</p></>}
    </article>)}
  </dialog>
}
