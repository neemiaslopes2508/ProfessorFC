import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { MatchSnapshot, SimulationTeam } from '../../simulation'
import type { PlayerId } from '../../core/ids'
import { clubIdentity } from './clubIdentity'
import { PixelBall, PixelFootballer, PixelPitchScenery } from './PixelPitchArt'
import { eventLabels } from './presentation'
import { CENTER, interpolatePoint, mapPitchEvents, pitchPlayers } from './livePitchMapper'
import { MATCH_PLAYBACK } from './matchPlaybackConfig'
import type { PitchPlayer, VisualFrame, VisualMatchState } from './livePitchMapper'

export interface LivePitchProps {
  snapshot: MatchSnapshot; home: SimulationTeam; away: SimulationTeam;
  playing: boolean; speed: 1 | 2 | 4; onReadyChange: (ready: boolean) => void;
}
interface TimedFrame { frame: VisualFrame; duration: number }
interface Presentation {
  state: VisualMatchState; base: readonly PitchPlayer[]; frames: TimedFrame[];
  elapsed: number; clock: number; consumed: number; minute: number; commentUntil: number;
  origin?: VisualMatchState;
}
const important = new Set(['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'])

/** Um RAF local move 22 peças e uma bola; não provoca renders React por frame. */
export function LiveMatchPitch({ snapshot, home, away, playing, speed, onReadyChange }: LivePitchProps) {
  const id = useId().replace(/:/g, '')
  const pieces = useRef(new Map<PlayerId, SVGGElement>())
  const ball = useRef<SVGGElement>(null)
  const marker = useRef<SVGGElement>(null)
  const card = useRef<SVGGElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const caption = useRef<HTMLParagraphElement>(null)
  const runtime = useRef<Presentation | undefined>(undefined)
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const base = pitchPlayers(snapshot, home, away)
  const highlights = snapshot.events.filter(event => event.minute === snapshot.currentMinute && important.has(event.type))
  const identity = clubIdentity(home.club.id)
  const awayIdentity = clubIdentity(away.club.id)

  const draw = useEffectEvent((state: VisualMatchState, label?: string) => {
    for (const player of state.playerPositions) {
      const element = pieces.current.get(player.id)
      if (!element) continue
      element.style.transform = `translate(${Math.round(player.x / 2) * 2}px, ${Math.round(player.y / 2) * 2}px)`
      element.dataset.active = String(player.id === state.activeEvent?.playerId)
    }
    if (ball.current) ball.current.style.transform = `translate(${Math.round(state.ballPosition.x)}px, ${Math.round(state.ballPosition.y)}px)`
    if (stage.current) stage.current.dataset.phase = state.animationPhase
    if (marker.current) {
      marker.current.style.transform = `translate(${Math.round(state.ballPosition.x)}px, ${Math.round(state.ballPosition.y)}px)`
      marker.current.style.opacity = ['FOUL', 'SAVE', 'GOAL'].includes(state.animationPhase) ? '1' : '0'
    }
    if (card.current) {
      const offender = state.playerPositions.find(player => player.id === state.activeEvent?.playerId)
      card.current.style.transform = `translate(${(offender?.x ?? 500) + 18}px, ${(offender?.y ?? 310) - 30}px)`
      card.current.style.opacity = state.animationPhase === 'CARD' ? '1' : '0'
      card.current.style.color = state.activeEvent?.type === 'RED_CARD' ? '#ff6969' : '#ffe16c'
    }
    const presentation = runtime.current
    const notable = state.activeEvent && important.has(state.activeEvent.type) && state.animationPhase !== 'RESET'
    if (presentation && notable) presentation.commentUntil = presentation.clock + MATCH_PLAYBACK.importantCommentHoldMs
    if (caption.current && label && (!presentation || notable || presentation.clock >= presentation.commentUntil) && caption.current.textContent !== label) caption.current.textContent = label
  })

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(preference.matches)
    preference.addEventListener('change', change)
    return () => preference.removeEventListener('change', change)
  }, [])

  useLayoutEffect(() => {
    const positions = pitchPlayers(snapshot, home, away)
    let presentation = runtime.current
    if (!presentation) {
      presentation = { base: positions, state: { playerPositions: positions, ballPosition: CENTER, possessionTeam: snapshot.currentPossessionClubId, animationPhase: 'ORGANIZATION' }, frames: [], consumed: snapshot.events.length, minute: snapshot.currentMinute, elapsed: 0, clock: 0, commentUntil: 0 }
      runtime.current = presentation
    }
    const added = snapshot.events.slice(presentation.consumed)
    const changedMinute = snapshot.currentMinute !== presentation.minute
    const changedTeam = positions.some(player => !presentation.base.some(previous => previous.id === player.id && previous.x === player.x && previous.y === player.y))
    // A lineup atual é autoridade mesmo quando o relógio está pausado.
    presentation.state.playerPositions = positions.map((player, index) => ({ ...player, ...(presentation!.state.playerPositions.find(previous => previous.id === player.id) ?? presentation!.state.playerPositions[index] ?? player), id: player.id, clubId: player.clubId, number: player.number, name: player.name, goalkeeper: player.goalkeeper }))
    presentation.base = positions
    if (changedTeam) {
      presentation.frames = presentation.frames.map(entry => ['ORGANIZATION', 'RESET'].includes(entry.frame.phase)
        ? { ...entry, frame: { ...entry.frame, players: positions } } : entry)
    }
    presentation.state.possessionTeam = snapshot.currentPossessionClubId
    presentation.consumed = snapshot.events.length
    presentation.minute = snapshot.currentMinute
    if (changedMinute || added.length) {
      const mapped = mapPitchEvents(snapshot, positions, added)
      const total = mapped.reduce((sum, frame) => sum + frame.weight, 0)
      presentation.frames.push(...mapped.map(frame => ({ frame, duration: MATCH_PLAYBACK.visualMinuteMs * frame.weight / total })))
    } else if (changedTeam && !presentation.frames.length) {
      presentation.frames.push({ frame: { phase: 'ORGANIZATION', ball: presentation.state.ballPosition, players: positions, label: 'Nova organização tática', weight: 1 }, duration: MATCH_PLAYBACK.formationTransitionMs })
    }
    if (reduced) {
      const last = presentation.frames.at(-1)?.frame
      presentation.state = { ...presentation.state, playerPositions: positions, ballPosition: last?.ball ?? presentation.state.ballPosition, animationPhase: 'ORGANIZATION', activeEvent: undefined }
      presentation.frames = []; presentation.origin = undefined; presentation.elapsed = 0
    }
    onReadyChange(presentation.frames.length === 0)
    draw(presentation.state, reduced ? added.map(event => eventLabels[event.type]).join(' · ') || 'Organização tática' : undefined)
  }, [snapshot, home, away, reduced, onReadyChange])

  const animate = useEffectEvent((delta: number) => {
    const presentation = runtime.current
    if (!presentation) return
    presentation.clock += delta * speed
    const next = presentation.frames[0]
    if (next) {
      if (!presentation.origin) presentation.origin = { ...presentation.state, playerPositions: [...presentation.state.playerPositions] }
      presentation.elapsed += delta * speed
      const progress = Math.min(1, presentation.elapsed / next.duration)
      const target = next.frame
      const positions = presentation.base.map(player => {
        const from = presentation.origin!.playerPositions.find(candidate => candidate.id === player.id) ?? player
        const to = target.players.find(candidate => candidate.id === player.id) ?? player
        return { ...player, ...interpolatePoint(from, to, progress) }
      })
      presentation.state = { ...presentation.state, playerPositions: positions, ballPosition: interpolatePoint(presentation.origin.ballPosition, target.ball, progress), activeEvent: target.event, animationPhase: target.phase }
      draw(presentation.state, target.label)
      if (progress === 1) { presentation.frames.shift(); presentation.origin = undefined; presentation.elapsed = Math.max(0, presentation.elapsed - next.duration); if (!presentation.frames.length) presentation.elapsed = 0 }
    } else {
      const owner = presentation.state.possessionTeam
      const phase = presentation.clock / MATCH_PLAYBACK.idleMovementPeriodMs
      const positions = presentation.base.map(player => {
        const attacking = player.clubId === owner
        const direction = player.clubId === snapshot.homeClubId ? 1 : -1
        return { ...player, x: player.x + (player.goalkeeper ? 0 : direction * (attacking ? 16 : -6) + Math.sin(phase + player.number) * 4), y: player.y + Math.cos(phase + player.number * .6) * (player.goalkeeper ? 1 : 4) }
      })
      const carrier = positions.filter(player => player.clubId === owner && !player.goalkeeper)[(snapshot.currentMinute + 3) % 10]
      presentation.state = { ...presentation.state, playerPositions: positions, ballPosition: carrier ? { x: carrier.x + 12, y: carrier.y + 8 } : CENTER, activeEvent: undefined, animationPhase: 'ORGANIZATION' }
      draw(presentation.state, 'Organização tática · apresentação 2D')
    }
    onReadyChange(presentation.frames.length === 0)
  })

  useEffect(() => {
    if (!playing || reduced) return
    let request = 0
    let previous: number | undefined
    const tick = (now: number) => {
      const delta = previous === undefined ? 0 : Math.min(64, now - previous)
      previous = now
      animate(delta)
      request = window.requestAnimationFrame(tick)
    }
    request = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(request)
  }, [playing, reduced])

  return <section className="live-pitch-panel" aria-label="Representação visual 2D da partida">
    <header className="live-pitch-legend"><span><i style={{ background: identity.primaryColor }} />{home.club.shortName} · {snapshot.homeTactics.formation} →</span><span>← {away.club.shortName} · {snapshot.awayTactics.formation}<i style={{ background: awayIdentity.primaryColor }} /></span></header>
    <div className="live-pitch-stage" ref={stage} style={{ '--pitch-home': identity.primaryColor, '--pitch-away': awayIdentity.primaryColor } as CSSProperties}>
      <svg className="live-pitch-svg" viewBox="-60 -60 1120 740" role="img" aria-labelledby={`${id}-title`}>
        <title id={`${id}-title`}>Campo visto de cima: {home.club.name} contra {away.club.name}, 11 jogadores por equipe. Coordenadas ilustrativas; eventos e placar são oficiais da sessão.</title>
        <PixelPitchScenery id={id} home={identity} away={awayIdentity} />
        {base.map(player => <g key={player.id} ref={node => { if (node) pieces.current.set(player.id, node); else pieces.current.delete(player.id) }} className={`live-player ${player.clubId === snapshot.homeClubId ? 'home-player' : 'away-player'} ${player.goalkeeper ? 'keeper-player' : ''}`} style={{ transform: `translate(${Math.round(player.x / 2) * 2}px, ${Math.round(player.y / 2) * 2}px)` }} data-player-id={player.id}><title>{player.number} · {player.name}{player.goalkeeper ? ' · Goleiro' : ''}</title><path className="player-shadow" d="M-16 9h32v6h-32z" /><PixelFootballer id={player.id} kit={player.clubId === snapshot.homeClubId ? identity : awayIdentity} away={player.clubId !== snapshot.homeClubId} keeper={player.goalkeeper} /><text className="pixel-shirt-number" textAnchor="middle" y="25" fontSize="11" fontWeight="800">{player.number}</text>{player.goalkeeper && <text className="keeper-label" textAnchor="middle" y="36" fontSize="8">GOL</text>}</g>)}
        <g ref={marker} className="live-action-marker" style={{ opacity: 0 }}><circle r="26" fill="none" stroke="currentColor" strokeWidth="3" /></g>
        <g ref={card} className="live-card-marker" style={{ opacity: 0 }}><rect width="14" height="20" rx="2" fill="currentColor" stroke="#131c1b" strokeWidth="2" /></g>
        <g ref={ball} className="live-ball" style={{ transform: 'translate(500px,310px)' }}><PixelBall /></g>
      </svg>
    </div>
    <div className="pixel-commentary"><svg viewBox="-22 -40 44 65" aria-hidden="true"><PixelFootballer id="professor-commentator" kit={{ primaryColor: '#9cbed0', secondaryColor: '#1a303c' }} /></svg><div><span className="eyebrow">Voz da partida · {snapshot.currentMinute}′</span><p className="live-visual-caption" ref={caption}>Organização tática · apresentação 2D</p></div></div>
    {!!highlights.length && <ul className="live-pitch-highlights" aria-label="Lances importantes deste minuto">{highlights.map((event, index) => <li key={index}>{event.minute}′ · {eventLabels[event.type]} · {[...home.players, ...away.players].find(player => player.id === (event.playerInId ?? event.playerId))?.displayName}</li>)}</ul>}
    <small className="live-pitch-note">{playing ? 'Ao vivo' : 'Pausado'} · {speed}x · Posições e passes ilustrativos{reduced ? ' · Movimento reduzido' : ''}</small>
  </section>
}

