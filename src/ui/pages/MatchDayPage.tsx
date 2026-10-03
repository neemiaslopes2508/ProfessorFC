import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { humanTeam, prototypeView, selectionValidation } from '../../application/prototypeSession'
import type { PrototypeSession } from '../../application/prototypeSession'
import { matchDayOverview } from '../../application/matchDayOverview'
import type { MatchDayOverview } from '../../application/matchDayOverview'
import { advanceMatchDayScene, MATCH_DAY_TIMING } from '../components/matchDayScenes'
import type { MatchDayScene } from '../components/matchDayScenes'
import { ClubCrest } from '../components/ClubMark'
import { clubIdentity } from '../components/clubIdentity'
import { dateLabel, money, mentalityLabels, positionLabel, styleLabels } from '../components/presentation'
import { ValidationPanel } from '../components/ValidationPanel'
import { MatchPitch } from '../components/MatchPitch'
import { MatchScoreboard } from '../components/MatchScoreboard'
import { StadiumArrival } from '../components/StadiumArrival'

const sceneLabels: Readonly<Record<MatchDayScene, string>> = { HUB: 'Hoje tem jogo', ARRIVAL: 'Chegada ao estádio', MATCH_INTRO: 'Apresentação da partida', LINEUPS: 'Escalações confirmadas', ENTERING_PITCH: 'Os times estão entrando em campo', MATCH: 'Tudo pronto para o apito' }
const number = new Intl.NumberFormat('pt-BR')

export function MatchDayPage({ session, onPlay, onLineup, onTactics }: { session: PrototypeSession; onPlay: () => void; onLineup: () => void; onTactics: () => void }) {
  const matchId = prototypeView(session).pendingActions[0]?.matchId
  const overview = useMemo(() => matchId ? matchDayOverview(session, matchId) : undefined, [session, matchId])
  if (!overview) return <><h1>Match Day</h1><p>Avance o calendário até sua próxima partida.</p></>
  return <MatchDayExperience key={matchId} overview={overview} session={session} onPlay={onPlay} onLineup={onLineup} onTactics={onTactics} />
}

function MatchDayExperience({ overview, session, onPlay, onLineup, onTactics }: { overview: MatchDayOverview; session: PrototypeSession; onPlay: () => void; onLineup: () => void; onTactics: () => void }) {
  const [{ scene, animate }, setScene] = useState<{ scene: MatchDayScene; animate: boolean }>({ scene: 'HUB', animate: false })
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [scene])
  useEffect(() => {
    if (scene !== 'ARRIVAL' && scene !== 'ENTERING_PITCH') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduced ? 200 : scene === 'ARRIVAL' ? MATCH_DAY_TIMING.arrival : MATCH_DAY_TIMING.entering
    const timer = window.setTimeout(() => {
      const next = advanceMatchDayScene(scene, 'CONTINUE')
      if (next === 'MATCH') onPlay()
      else setScene({ scene: next, animate: !reduced })
    }, duration)
    return () => window.clearTimeout(timer)
  }, [scene, onPlay])
  function change(action: 'CONTINUE' | 'SKIP', event: MouseEvent<HTMLButtonElement>) {
    const next = advanceMatchDayScene(scene, action)
    if (next === 'MATCH') onPlay()
    else setScene({ scene: next, animate: action !== 'SKIP' && event.detail > 0 })
  }
  const { match, home, away, atmosphere, competitionName } = overview
  const human = humanTeam(session)
  const valid = selectionValidation(session).valid
  const pitch = <MatchPitch identity={clubIdentity(home.team.club.id)} stadiumName={atmosphere.stadiumName} homeLabel={home.team.club.shortName} awayLabel={away.team.club.shortName} scoreLabel={scene === 'MATCH' ? '0 – 0' : 'VS'} />
  return <div className="match-day-experience">
    <div className="match-day-heading"><div><span className="eyebrow">Professor FC · Match Day</span><h1 ref={heading} tabIndex={-1}>{sceneLabels[scene]}</h1><p className="muted">{dateLabel(match.date)} · {competitionName} · Rodada {match.round}</p></div>{scene !== 'MATCH' && <button disabled={!valid} onClick={event => change('SKIP', event)}>PULAR APRESENTAÇÃO</button>}</div>
    <div className={`match-day-scene ${animate ? '' : 'scene-instant'}`} key={scene} data-scene={scene}>
      {scene === 'HUB' && <>
        <MatchScoreboard home={home.team.club} away={away.team.club} competition={competitionName} round={match.round} status="Partida pendente" />
        <div className="match-day-hub"><section className="match-day-venue">{pitch}<div className="venue-caption"><div><span className="eyebrow">Palco da partida</span><h2>{atmosphere.stadiumName}</h2></div><span>Estádio fictício</span></div></section>
          <section className="panel match-day-plan"><span className="eyebrow">Seu plano de jogo</span><h2>{human.club.name}</h2><strong className="match-day-formation">{human.tactics.formation}</strong><p>{mentalityLabels[human.tactics.mentality]} · {styleLabels[human.tactics.style]}</p><dl><dt>Técnico humano</dt><dd>Você</dd><dt>Mandante</dt><dd>{home.team.tactics.formation}</dd><dt>Visitante</dt><dd>{away.team.tactics.formation}</dd><dt>Público estimado</dt><dd>{number.format(atmosphere.attendance)}</dd><dt>Capacidade</dt><dd>{number.format(atmosphere.capacity)}</dd><dt>Ocupação estimada</dt><dd>{(atmosphere.occupancy * 100).toFixed(1)}%</dd><dt>Receita estimada</dt><dd>{money(atmosphere.revenueCents)}</dd><dt>Status</dt><dd>Pendente</dd></dl><p className="muted">Público fictício de desenvolvimento. Bilheteria registrada ao confirmar o resultado.</p><div className="actions"><button onClick={onLineup}>EDITAR EQUIPE</button><button onClick={onTactics}>Revisar plano tático</button></div></section>
        </div><ValidationPanel session={session} /><MatchHighlights overview={overview} />
      </>}
      {scene === 'ARRIVAL' && <StadiumArrival club={human.club} stadiumName={atmosphere.stadiumName} />}
      {scene === 'MATCH_INTRO' && <section className="match-intro" style={{ '--home-color': clubIdentity(home.team.club.id).primaryColor, '--away-color': clubIdentity(away.team.club.id).primaryColor } as CSSProperties}>
        <span className="eyebrow">Encontro marcado · {dateLabel(match.date)}</span><div className="match-intro-clubs"><div><ClubCrest club={home.team.club} /><h2>{home.team.club.name}</h2><span>MANDANTE</span></div><strong>VS</strong><div><ClubCrest club={away.team.club} /><h2>{away.team.club.name}</h2><span>VISITANTE</span></div></div><h3>{competitionName}</h3><p>Rodada {match.round} · {atmosphere.stadiumName}</p><p><strong>{number.format(atmosphere.attendance)}</strong> torcedores · estimativa fictícia</p>
      </section>}
      {scene === 'LINEUPS' && <><div className="match-day-lineups">{[home, away].map((entry, index) => <section key={entry.team.club.id} className="panel lineup-announcement"><header><ClubCrest small club={entry.team.club} /><div><span className="eyebrow">{index === 0 ? 'Mandante' : 'Visitante'}{entry.team.club.id === human.club.id ? ' · Sua equipe salva' : ''}</span><h2>{entry.team.club.name}</h2></div><strong>{entry.team.tactics.formation}</strong></header><ol>{entry.starters.map(slot => <li key={slot.player.id}><span>{positionLabel(slot.position, true)}</span><strong>{slot.player.displayName}</strong><small>Forma {slot.player.form}</small></li>)}</ol><p className="muted">11 titulares · {entry.team.lineup.bench.length} reservas</p></section>)}</div><MatchHighlights overview={overview} /></>}
      {scene === 'ENTERING_PITCH' && <div className="entering-pitch">{pitch}<div className="entering-caption"><span className="eyebrow">Prontos para o apito</span><strong>Os times estão entrando em campo</strong><span>{home.team.club.shortName} × {away.team.club.shortName}</span></div></div>}
    </div>
    {scene !== 'MATCH' && <footer className="match-day-actions"><span className="muted">{scene === 'ARRIVAL' ? 'Chegada breve · você pode continuar agora.' : scene === 'ENTERING_PITCH' ? 'Transição breve · você pode continuar agora.' : 'Sua equipe confirmada será usada na partida.'}</span><button className="primary" disabled={!valid} onClick={event => change('CONTINUE', event)}>{scene === 'HUB' ? 'INICIAR MATCH DAY' : scene === 'LINEUPS' ? 'ENTRAR EM CAMPO' : 'CONTINUAR'}</button></footer>}
  </div>
}

function MatchHighlights({ overview }: { overview: MatchDayOverview }) {
  return <section className="panel match-highlights"><span className="eyebrow">Destaques da partida</span><div>{[overview.home, overview.away].map(entry => <article key={entry.team.club.id}><h3>{entry.team.club.name} <small>{entry.standing?.position}º na tabela</small></h3><dl><dt>Maior overall entre titulares</dt><dd>{entry.bestOverall?.player.displayName} · {entry.bestOverall?.overall}</dd><dt>Melhor forma entre titulares</dt><dd>{entry.bestForm?.player.displayName} · {entry.bestForm?.player.form}</dd></dl></article>)}</div></section>
}
