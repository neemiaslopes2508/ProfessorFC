import type { CSSProperties } from 'react'
import { prototypeView } from '../../application/prototypeSession'
import type { PrototypeSession } from '../../application/prototypeSession'
import { dateLabel } from '../components/presentation'
import { ClubCrest, ClubMark } from '../components/ClubMark'
import { clubIdentity } from '../components/clubIdentity'
import { DashboardStatCard, NextMatchCard, TeamSummaryCard, RecentMatchesCard } from '../components/DashboardCards'

export function DashboardPage({ session, onPrepare, onTable, onLastMatch, onTeam }: { session: PrototypeSession; onPrepare: () => void; onTable: () => void; onLastMatch: () => void; onTeam?: () => void }) {
  const view = prototypeView(session)
  const finished = view.league.season.status === 'FINISHED'
  const next = view.nextMatch
  const identity = clubIdentity(view.club.id)
  const totalRounds = Math.max(...view.league.fixtures.map(match => match.round))
  return <div className="coach-dashboard" style={{ '--club-primary': identity.primaryColor, '--club-secondary': identity.secondaryColor } as CSSProperties}><header className="coach-identity"><ClubCrest club={view.club} /><div><span className="eyebrow">Central do treinador</span><h1>{view.club.name}</h1><p className="muted">Development League <span>·</span> {dateLabel(session.game.calendar.currentDate)}</p></div><span className="club-watermark" aria-hidden="true">{view.club.shortName}</span></header>
    <div className="metrics"><DashboardStatCard icon="trophy" label="Posição" value={`${view.humanStanding.position}º`} note="Classificação atual" /><DashboardStatCard icon="points" label="Pontos" value={view.humanStanding.points} note={`${view.humanStanding.played} jogos disputados`} /><DashboardStatCard icon="round" label="Rodada" value={<>{view.rounds.current?.round ?? 0}<span className="stat-total"> / {totalRounds}</span></>} note="Turno e returno" /><DashboardStatCard icon="calendar" label="Temporada" value={<span className="status-text">{finished ? 'Encerrada' : view.league.season.status === 'SCHEDULED' ? 'A iniciar' : 'Em andamento'}</span>} note={`${view.league.season.year} · Liga de desenvolvimento`} /></div>
    {finished ? <section className="panel season-end"><span className="eyebrow">Temporada encerrada</span><h2>Campeão: {view.champion?.name}</h2><p>Sua colocação: <strong>{view.humanStanding.position}º lugar</strong> · {view.humanStanding.played} partidas disputadas</p><button className="primary" onClick={onTable}>Ver classificação final</button><p className="muted">Fim do protótipo. A próxima temporada ainda não está disponível.</p></section> : next && <NextMatchCard session={session} match={next} competition="Development League" pending={!!view.pendingActions.length} onPrepare={onPrepare} />}
    <div className="dashboard-bottom"><TeamSummaryCard session={session} onTeam={onTeam ?? (() => {})} /><RecentMatchesCard session={session} matches={view.matches} onLastMatch={onLastMatch} /></div>
  </div>
}

export function StandingsPage({ session }: { session: PrototypeSession }) {
  const view = prototypeView(session)
  return <><h1>{view.league.season.status === 'FINISHED' ? 'Classificação final' : 'Tabela'}</h1><p className="muted">Development League · Pontos → vitórias → saldo → gols pró</p>{session.pendingMatch && <p className="notice warning">Sua partida aguarda confirmação. Clique em Continuar na tela do resultado para atualizar a tabela.</p>}<div className="table-scroll"><table><caption className="sr-only">Classificação da Development League</caption><thead><tr>{['Pos', 'Clube', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG', 'PTS'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{view.standings.map(row => <tr key={row.clubId} className={`${row.clubId === view.club.id ? 'human-row' : ''} ${row.position === 1 ? 'rank-top' : row.position === view.standings.length ? 'rank-bottom' : ''}`}><td>{row.position}</td><th scope="row"><ClubMark session={session} id={row.clubId} />{row.clubId === view.club.id && <small>Seu clube</small>}{view.league.season.championId === row.clubId && <small>Campeão</small>}</th><td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{row.goalDifference}</td><td><strong>{row.points}</strong></td></tr>)}</tbody></table></div><p className="muted">Destaques visuais para a primeira e a última posições. Esta edição fictícia não movimenta clubes entre divisões.</p></>
}

