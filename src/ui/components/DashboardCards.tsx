import type { CSSProperties, ReactNode } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { humanTeam } from '../../application/prototypeSession'
import type { Match } from '../../domain/matches'
import { ClubMark } from './ClubMark'
import { clubIdentity } from './clubIdentity'
import { InterfaceIcon } from './InterfaceIcon'
import type { IconName } from './InterfaceIcon'
import { PITCH_LAYOUTS } from './pitchLayout'
import { dateLabel, mentalityLabels, styleLabels } from './presentation'

export function DashboardStatCard({ label, value, note, icon }: { label: string; value: ReactNode; note: string; icon: IconName }) {
  return <article className="panel dashboard-stat"><div className="stat-icon"><InterfaceIcon name={icon} /></div><div><span className="stat-label">{label}</span><strong>{value}</strong><small>{note}</small></div></article>
}

export function NextMatchCard({ session, match, competition, pending, onPrepare }: { session: PrototypeSession; match: Match; competition: string; pending: boolean; onPrepare: () => void }) {
  const club = humanTeam(session).club
  return <section className="panel next-match">
    <header className="section-heading"><span className="eyebrow">Próxima partida</span><span className={`pill ${pending ? 'match-ready' : ''}`}>{session.liveMatch ? 'Em andamento' : session.pendingMatch ? 'Resultado pendente' : pending ? 'Dia de jogo' : 'Agendada'}</span></header>
    <div className="next-match-duel"><ClubMark session={session} id={match.homeClubId} small={false} /><div className="duel-center"><span className="duel-versus">VS</span><span>{competition}</span><small>RODADA {match.round}</small></div><ClubMark session={session} id={match.awayClubId} small={false} /></div>
    <div className="next-match-meta"><span><InterfaceIcon name="calendar" />{dateLabel(match.date)}</span><span><InterfaceIcon name="dashboard" />{match.homeClubId === club.id ? 'Em casa' : 'Fora de casa'}</span></div>
    <footer className="next-match-footer"><p>{pending ? 'O próximo desafio está à sua espera.' : <>Use o botão <strong>Avançar</strong> para chegar ao dia do jogo.</>}</p>{pending && <button className="primary" onClick={onPrepare}>{session.liveMatch ? 'Voltar à partida' : session.pendingMatch ? 'Ver resultado pendente' : 'Preparar partida'}<InterfaceIcon name="arrow" /></button>}</footer>
  </section>
}

export function TeamSummaryCard({ session, onTeam }: { session: PrototypeSession; onTeam: () => void }) {
  const team = humanTeam(session)
  const identity = clubIdentity(team.club.id)
  return <section className="panel team-summary-card"><header className="section-heading"><h2><InterfaceIcon name="team" />Sua equipe</h2><button className="text-button" onClick={onTeam}>Abrir equipe <InterfaceIcon name="arrow" /></button></header>
    <div className="team-summary-body"><div><strong className="summary-formation">{team.tactics.formation}</strong><p>{team.lineup.startingPlayers.length} titulares <span className="muted">/</span> {team.lineup.bench.length} reservas</p><span className="muted">{mentalityLabels[team.tactics.mentality]} · {styleLabels[team.tactics.style]}</span></div>
      <button className="summary-pitch-button" onClick={onTeam} aria-label="Abrir escalação da equipe" style={{ '--club-primary': identity.primaryColor, '--club-secondary': identity.secondaryColor } as CSSProperties}><svg viewBox="0 0 140 150" aria-hidden="true"><rect x="2" y="2" width="136" height="146" rx="3" className="summary-grass"/><g fill="none" stroke="#a9c4b755" strokeWidth="1"><rect x="7" y="7" width="126" height="136"/><path d="M7 75h126M48 7v25h44V7M48 143v-25h44v25"/><circle cx="70" cy="75" r="18"/></g>{PITCH_LAYOUTS[team.tactics.formation].map(([x, y], index) => <g key={index} transform={`translate(${x * 1.3 + 5},${y * 1.35 + 6})`}><path d="m-5-5-5 3 3 5 3-1v7h8V2l3 1 3-5-5-3-2 2h-4z" fill="var(--club-secondary)" stroke="var(--club-primary)" strokeWidth=".8"/><circle cy="-2" r="1" fill="var(--club-primary)"/></g>)}</svg></button>
    </div><small className="summary-footnote">Elenco de desenvolvimento · condição e forma fixas nesta fase.</small>
  </section>
}

export function RecentMatchesCard({ session, matches, onLastMatch }: { session: PrototypeSession; matches: readonly Match[]; onLastMatch: () => void }) {
  const clubId = session.game.humanClubId
  const recent = matches.filter(match => match.status === 'FINISHED' && (match.homeClubId === clubId || match.awayClubId === clubId)).slice(-3).reverse()
  return <section className="panel recent-matches-card"><header className="section-heading"><h2><InterfaceIcon name="round" />Últimas partidas</h2>{session.lastMatch && <button className="text-button" onClick={onLastMatch}>Último resultado <InterfaceIcon name="arrow" /></button>}</header>
    {recent.length ? <div className="recent-match-list">{recent.map(match => <div className="recent-match-row" key={match.id}><small>{dateLabel(match.date)} · R{match.round}</small><div><ClubMark session={session} id={match.homeClubId} /><strong>{match.result!.homeGoals} – {match.result!.awayGoals}</strong><ClubMark session={session} id={match.awayClubId} /></div></div>)}</div> : <div className="dashboard-empty"><InterfaceIcon name="calendar" /><strong>O primeiro capítulo está por vir</strong><p>Seus resultados aparecerão aqui após a primeira partida confirmada.</p></div>}
  </section>
}
