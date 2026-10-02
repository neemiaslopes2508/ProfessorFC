import type { MatchEvent } from '../../domain/matches'
import type { Club } from '../../domain/clubs'
import type { Player } from '../../domain/players'
import { eventLabels } from './presentation'

function narration(event: MatchEvent, club: string, player?: string, playerOut?: string) {
  const who = player ?? `Um jogador de ${club}`
  switch (event.type) {
    case 'GOAL': return `GOL — ${who}! Marca para ${club}.`
    case 'SHOT': return `${who} finaliza pelo ${club}.`
    case 'SHOT_ON_TARGET': return `No alvo! Finalização de ${who}.`
    case 'SAVE': return `${who} faz a defesa para ${club}.`
    case 'FOUL': return `Falta cometida por ${who}.`
    case 'YELLOW_CARD': return `Cartão amarelo para ${who}.`
    case 'CORNER': return `Escanteio para ${club}. ${player ? `${player} na cobrança.` : ''}`
    case 'SUBSTITUTION': return `SUBSTITUIÇÃO — Sai ${playerOut ?? 'um jogador'}. Entra ${who}.`
    default: return `${eventLabels[event.type]} — ${who}.`
  }
}

export function MatchTimeline({ events, home, away, players, title = 'Narração · eventos' }: { events: readonly MatchEvent[]; home: Club; away: Club; players: readonly Player[]; title?: string }) {
  const byId = new Map(players.map(player => [player.id, player.displayName]))
  return <section className="panel match-narration"><span className="eyebrow">Cabine de transmissão</span><h2>{title}</h2>
    <p className="muted">{events.length ? 'Eventos já processados da partida.' : 'Nenhum evento registrado até agora.'}</p>
    <ol className="timeline" tabIndex={events.length ? 0 : undefined} aria-label="Eventos da partida, em ordem cronológica">{events.map((event, index) => {
      const club = event.clubId === home.id ? home.name : away.name
      return <li key={index} data-event-type={event.type} className={event.type === 'GOAL' ? 'goal-event' : ''}><time>{event.minute}′</time><div><strong>{narration(event, club, event.playerInId || event.playerId ? byId.get((event.playerInId ?? event.playerId)!) : undefined, event.playerOutId || event.secondaryPlayerId ? byId.get((event.playerOutId ?? event.secondaryPlayerId)!) : undefined)}</strong><small>{club}</small></div></li>
    })}</ol>
  </section>
}
