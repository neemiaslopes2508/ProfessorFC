import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { matchDayOverview } from '../../application/matchDayOverview'
import type { TeamSetup } from '../../application/teamSetup'
import { MatchScoreboard } from '../components/MatchScoreboard'
import { MatchPitch } from '../components/MatchPitch'
import { MatchTimeline } from '../components/MatchTimeline'
import { MatchStatisticsPanel } from '../components/MatchStatisticsPanel'
import { LiveTeamDialog } from '../components/LiveTeamDialog'
import { clubIdentity } from '../components/clubIdentity'
import { mentalityLabels, styleLabels } from '../components/presentation'

import { MATCH_PLAYBACK } from '../components/matchPlaybackConfig'
type Playback = 'PLAYING' | 'PAUSED'

export function LiveMatchPage({ session, playback, onPlayback, management, onManagement, error, onAdvance, onHalfTime, onFinish, onSecondHalf, onConfirm }: {
  session: PrototypeSession; playback: Playback; onPlayback: (state: Playback) => void;
  management?: { tab: 'lineup' | 'tactics' }; onManagement: (tab?: 'lineup' | 'tactics') => void; error?: string;
  onAdvance: (minutes: number) => PrototypeSession | undefined; onHalfTime: () => PrototypeSession | undefined;
  onFinish: () => PrototypeSession | undefined; onSecondHalf: () => PrototypeSession | undefined;
  onConfirm: (draft: TeamSetup) => PrototypeSession | undefined;
}) {
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)
  const snapshot = session.liveMatch
  const overview = useMemo(() => snapshot ? matchDayOverview(session, snapshot.matchId) : undefined, [session, snapshot])
  const heading = useRef<HTMLHeadingElement>(null)
  const animationReady = useRef(true)
  const onPitchReady = useCallback((ready: boolean) => { animationReady.current = ready }, [])
  const canAdvance = snapshot?.canAdvance ?? false
  const matchId = snapshot?.matchId
  const managing = !!management
  const tick = useEffectEvent(() => {
    // Também protege callbacks já enfileirados quando Pausar/Alterações é acionado.
    if (playback !== 'PLAYING' || managing || !snapshot?.canAdvance || !animationReady.current) return
    const next = onAdvance(1)
    if (!next?.liveMatch?.canAdvance) onPlayback('PAUSED')
  })
  useEffect(() => {
    if (playback !== 'PLAYING' || !canAdvance || managing) return
    const timer = window.setInterval(() => tick(), MATCH_PLAYBACK.simulationMinuteMs / speed)
    return () => window.clearInterval(timer)
  }, [playback, speed, canAdvance, managing, matchId])
  useEffect(() => { heading.current?.focus() }, [snapshot?.phase])
  if (!snapshot || !overview) return <p>Nenhuma partida em andamento.</p>
  const { home, away, match, competitionName, atmosphere } = overview
  const humanHome = snapshot.homeClubId === session.game.humanClubId
  const tactics = humanHome ? snapshot.homeTactics : snapshot.awayTactics
  const substitutions = humanHome ? snapshot.homeSubstitutions : snapshot.awaySubstitutions
  const halfTime = snapshot.phase === 'HALF_TIME'
  const phaseLabel = halfTime ? 'Intervalo' : snapshot.phase === 'SECOND_HALF' ? 'Segundo tempo' : snapshot.phase === 'PRE_MATCH' ? 'Prontos para jogar' : 'Primeiro tempo'
  const importantEvents = snapshot.events.filter(event => ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'].includes(event.type))
  function fast(action: () => PrototypeSession | undefined) { onPlayback('PAUSED'); action() }
  return <div className="match-day-experience pixel-match scene-instant" data-scene={snapshot.phase} data-playback={playback}>
    <span className="eyebrow">Professor FC · Partida ao vivo</span><h1 ref={heading} tabIndex={-1}>{phaseLabel}</h1>
    <MatchScoreboard home={home.team.club} away={away.team.club} competition={competitionName} round={match.round} score={snapshot.score} matchMinute={snapshot.currentMinute} phase={snapshot.phase} status={phaseLabel} />
    <section className="panel match-controls live-match-controls" aria-label="Controles da partida">
      <div className="section-heading"><div><span className="eyebrow">{halfTime ? 'Conversa de intervalo' : playback === 'PLAYING' ? 'Partida em andamento' : 'Partida pausada'}</span><p className="muted" role="status">{halfTime ? 'O primeiro tempo terminou. Revise a equipe antes de iniciar o segundo.' : playback === 'PLAYING' ? 'Relógio, eventos e estatísticas avançam juntos.' : 'O relógio está parado. Retome ou prepare suas alterações.'}</p></div><span className="pill">{snapshot.currentMinute}′ · {speed}x</span></div>
      <div className="actions playback-actions"><button className="primary" disabled={!snapshot.canAdvance} onClick={() => onPlayback(playback === 'PLAYING' ? 'PAUSED' : 'PLAYING')}>{playback === 'PLAYING' ? '⏸ PAUSAR' : '▶ JOGAR'}</button><div className="segmented-control" role="group" aria-label="Velocidade da apresentação">{([1, 2, 4] as const).map(value => <button key={value} aria-pressed={speed === value} onClick={() => setSpeed(value)}>{value}x</button>)}</div><button disabled={!snapshot.canChangeTactics} onClick={() => onManagement('lineup')}>FAZER ALTERAÇÕES</button></div>
      <div className="pixel-current-plan"><div><small>Plano atual</small><strong>{tactics.formation}</strong><span>{mentalityLabels[tactics.mentality]} · {styleLabels[tactics.style]}</span></div><div><small>Substituições</small><strong>{substitutions.used} / {substitutions.limit}</strong></div></div>
      {halfTime && <div className="half-time-actions actions"><button onClick={() => onManagement('lineup')}>Ajustar equipe</button><button onClick={() => onManagement('tactics')}>Ajustar tática</button><button className="primary" disabled={!snapshot.canStartSecondHalf} onClick={() => { const next = onSecondHalf(); if (next?.liveMatch?.canAdvance) onPlayback('PLAYING') }}>INICIAR 2º TEMPO</button><button onClick={() => fast(onFinish)}>Simular restante</button></div>}
      <div className="actions quick-match-actions"><button disabled={snapshot.phase !== 'PRE_MATCH' && snapshot.phase !== 'FIRST_HALF'} onClick={() => fast(onHalfTime)}>ATÉ O INTERVALO</button><button onClick={() => fast(onFinish)}>ATÉ O FIM</button><button onClick={() => fast(onFinish)}>SIMULAR RÁPIDO</button></div>
    </section>
    <div className="match-broadcast"><div><MatchPitch identity={clubIdentity(home.team.club.id)} stadiumName={atmosphere.stadiumName} homeLabel={home.team.club.shortName} awayLabel={away.team.club.shortName} scoreLabel={`${snapshot.score.homeGoals} – ${snapshot.score.awayGoals}`} live={{ snapshot, home: home.team, away: away.team, playing: playback === 'PLAYING' && !managing, speed, onReadyChange: onPitchReady }} /><MatchStatisticsPanel statistics={snapshot.statistics} homeLabel={home.team.club.shortName} awayLabel={away.team.club.shortName} /></div><MatchTimeline home={home.team.club} away={away.team.club} players={[...home.team.players, ...away.team.players]} events={halfTime ? importantEvents : snapshot.events} title={halfTime ? 'Lances importantes do primeiro tempo' : 'Narração · eventos'} /></div>
    {management && <LiveTeamDialog session={session} initialTab={management.tab} error={error} onConfirm={onConfirm} onCancel={() => onManagement()} />}
  </div>
}
