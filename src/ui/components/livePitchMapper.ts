import type { ClubId, PlayerId } from '../../core/ids'
import type { MatchEvent } from '../../domain/matches'
import type { MatchSnapshot, SimulationTeam } from '../../simulation'
import { PITCH_LAYOUTS } from './pitchLayout'

export interface PitchPoint { readonly x: number; readonly y: number }
export interface PitchPlayer extends PitchPoint { readonly id: PlayerId; readonly clubId: ClubId; readonly number: number; readonly name: string; readonly goalkeeper: boolean }
export type AnimationPhase = 'ORGANIZATION' | 'PASS' | 'SHOT' | 'SAVE' | 'GOAL' | 'FOUL' | 'CARD' | 'CORNER' | 'SUBSTITUTION' | 'RESET'
export interface VisualFrame {
  readonly phase: AnimationPhase
  readonly ball: PitchPoint
  readonly players: readonly PitchPlayer[]
  readonly event?: MatchEvent
  readonly label: string
  readonly weight: number
}
/** Coordenadas apenas de apresentação. Nunca entram em MatchSession ou no RNG. */
export interface VisualMatchState {
  playerPositions: readonly PitchPlayer[]
  ballPosition: PitchPoint
  possessionTeam?: ClubId
  activeEvent?: MatchEvent
  animationPhase: AnimationPhase
}

export const CENTER: PitchPoint = { x: 500, y: 310 }
export function pitchPlayers(snapshot: MatchSnapshot, home: SimulationTeam, away: SimulationTeam): readonly PitchPlayer[] {
  return [home, away].flatMap((team, side) => {
    const lineup = side === 0 ? snapshot.homeLineup : snapshot.awayLineup
    const formation = side === 0 ? snapshot.homeTactics.formation : snapshot.awayTactics.formation
    return lineup.positions.map((slot, index) => {
      const [lateral, depth] = PITCH_LAYOUTS[formation][index]
      const x = 85 + (100 - depth) * 4.2
      const player = team.players.find(candidate => candidate.id === slot.playerId)
      return { id: slot.playerId, clubId: team.club.id, number: team.players.findIndex(candidate => candidate.id === slot.playerId) + 1,
        name: player?.displayName ?? 'Jogador', goalkeeper: slot.position === 'GK', x: side === 0 ? x : 1000 - x, y: 70 + lateral * 4.8 }
    })
  })
}

/** Interpreta somente o lote já observado; eventos associados mantêm sua ordem causal. */
export function mapPitchEvents(snapshot: MatchSnapshot, players: readonly PitchPlayer[], events: readonly MatchEvent[]): readonly VisualFrame[] {
  const frames: VisualFrame[] = []
  const owner = snapshot.currentPossessionClubId ?? snapshot.homeClubId
  const teammates = players.filter(player => player.clubId === owner && !player.goalkeeper)
  const receiver = teammates[(snapshot.currentMinute + 3) % teammates.length]
  function frame(phase: AnimationPhase, ball: PitchPoint, label: string, weight: number, event?: MatchEvent, moved = players) {
    frames.push({ phase, ball, label, weight, event, players: moved })
  }
  if (!events.length) {
    frame('PASS', teammates[snapshot.currentMinute % teammates.length] ?? CENTER, 'Circulação da bola', 1)
    frame('PASS', receiver ?? CENTER, 'Passe · apresentação visual', 2)
    return frames
  }
  for (const event of events) {
    const player = players.find(candidate => candidate.id === (event.playerInId ?? event.playerId))
    const homeAction = event.clubId === snapshot.homeClubId
    const goalX = homeAction ? 931 : 69
    const attackingSpot = { x: homeAction ? 770 : 230, y: player ? 250 + (player.y - 310) * .3 : 310 }
    switch (event.type) {
      case 'SHOT': {
        const moved = players.map(candidate => candidate.id === player?.id ? { ...candidate, ...attackingSpot } : candidate)
        frame('SHOT', attackingSpot, `${player?.name ?? 'Atacante'} prepara o chute`, 1, event, moved)
        // O desfecho é apresentado por GOAL/SAVE, nunca decidido aqui.
        const onTarget = events.some(candidate => candidate.type === 'SHOT_ON_TARGET' && candidate.minute === event.minute && candidate.playerId === event.playerId && candidate.clubId === event.clubId)
        frame('SHOT', { x: homeAction ? 907 : 93, y: onTarget ? 310 : 405 }, onTarget ? 'Finalização' : 'Finalização para fora', 2, event, moved)
        break
      }
      case 'SHOT_ON_TARGET': frame('SHOT', { x: homeAction ? 911 : 89, y: 310 }, 'Finalização no alvo', 1, event); break
      case 'GOAL': {
        const celebrate = players.map(candidate => candidate.clubId === event.clubId && !candidate.goalkeeper
          ? { ...candidate, x: homeAction ? 815 : 185, y: 260 + candidate.number * 3 } : candidate)
        frame('GOAL', { x: goalX, y: 310 }, `GOL · ${player?.name ?? 'Gol confirmado'}`, 3, event, celebrate)
        frame('RESET', CENTER, 'Gol confirmado · reinício', 1, event)
        break
      }
      case 'SAVE': {
        const keeper = players.find(candidate => candidate.clubId === event.clubId && candidate.goalkeeper)
        const spot = { x: homeAction ? 103 : 897, y: 295 }
        const moved = players.map(candidate => candidate.id === keeper?.id ? { ...candidate, ...spot } : candidate)
        frame('SAVE', spot, `DEFESA · ${keeper?.name ?? 'Goleiro'}`, 3, event, moved)
        break
      }
      case 'FOUL': frame('FOUL', player ?? CENTER, `FALTA · ${player?.name ?? 'Infração'}`, 2, event); break
      case 'YELLOW_CARD': case 'RED_CARD': frame('CARD', player ?? CENTER, `${event.type === 'YELLOW_CARD' ? 'AMARELO' : 'VERMELHO'} · ${player?.name ?? 'Jogador'}`, 2, event); break
      case 'CORNER': {
        const corner = { x: homeAction ? 916 : 84, y: 75 }
        const moved = players.map(candidate => candidate.goalkeeper ? candidate : { ...candidate, x: candidate.clubId === event.clubId ? (homeAction ? 775 : 225) : (homeAction ? 835 : 165), y: 225 + candidate.number * 7 })
        frame('CORNER', corner, 'ESCANTEIO · organização da área', 2, event, moved)
        frame('CORNER', { x: homeAction ? 820 : 180, y: 310 }, 'Cobrança · representação visual', 1, event, moved)
        break
      }
      case 'SUBSTITUTION': frame('SUBSTITUTION', CENTER, `SUBSTITUIÇÃO · entra ${player?.name ?? 'Reserva'}`, 2, event); break
      default: break
    }
  }
  frame('ORGANIZATION', receiver ?? CENTER, 'Organização tática', 1)
  return frames
}

export function interpolatePoint(from: PitchPoint, to: PitchPoint, progress: number): PitchPoint {
  const t = Math.max(0, Math.min(1, progress))
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
}
