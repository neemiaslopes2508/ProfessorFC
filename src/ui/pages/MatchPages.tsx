import { useEffect, useMemo, useRef } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { matchDayOverview } from '../../application/matchDayOverview'
import { MatchDayPage } from './MatchDayPage'
import { MatchScoreboard } from '../components/MatchScoreboard'
import { MatchPitch } from '../components/MatchPitch'
import { MatchTimeline } from '../components/MatchTimeline'
import { MatchStatisticsPanel } from '../components/MatchStatisticsPanel'
import { clubIdentity } from '../components/clubIdentity'
import { dateLabel } from '../components/presentation'

// Mantém o contrato do pré-jogo e a navegação/commit existentes.
export function PreMatchPage(props: { session: PrototypeSession; onPlay: () => void; onLineup: () => void; onTactics: () => void }) { return <MatchDayPage {...props} /> }

export function MatchPage({ session, onContinue, onTable }: { session: PrototypeSession; onContinue: () => void; onTable: () => void }) {
  const presented = session.pendingMatch ?? session.lastMatch
  const overview = useMemo(() => presented ? matchDayOverview(session, presented.matchId) : undefined, [session, presented])
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [presented?.matchId])
  if (!presented || !overview) return <><h1>Partida</h1><p>Nenhum resultado disponível.</p></>
  const { match, home, away, competitionName, atmosphere } = overview
  const { result } = presented
  return <div className="match-day-experience" data-scene="FULL_TIME">
    <span className="eyebrow">Professor FC · Resultado final</span><h1 ref={heading} tabIndex={-1}>FIM DE JOGO</h1><p className="muted">{dateLabel(match.date)} · {atmosphere.stadiumName} · {new Intl.NumberFormat('pt-BR').format(atmosphere.attendance)} torcedores (fictício)</p>
    <div className="match-day-scene"><MatchScoreboard home={home.team.club} away={away.team.club} score={result.score} matchMinute={result.debug.config.minutes} phase="FULL_TIME" competition={competitionName} round={match.round} status="Encerrado" />
      <div className="match-result-actions"><p className="muted">{session.pendingMatch ? 'Resultado aguardando confirmação. Continuar registra a partida e atualiza a tabela.' : 'Resultado registrado.'}</p><div className="actions">{session.pendingMatch && <button className="primary" onClick={onContinue}>CONTINUAR</button>}<button onClick={onTable}>Ver tabela</button></div></div>
      <div className="match-broadcast"><div><MatchPitch identity={clubIdentity(home.team.club.id)} stadiumName={atmosphere.stadiumName} homeLabel={home.team.club.shortName} awayLabel={away.team.club.shortName} scoreLabel={`${result.score.homeGoals} – ${result.score.awayGoals}`} /><MatchStatisticsPanel statistics={result.statistics} homeLabel={home.team.club.shortName} awayLabel={away.team.club.shortName} /></div><MatchTimeline home={home.team.club} away={away.team.club} players={[...home.team.players, ...away.team.players]} events={result.events} /></div>
    </div>
  </div>
}
