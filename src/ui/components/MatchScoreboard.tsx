import type { Club } from '../../domain/clubs'
import type { MatchResult } from '../../domain/matches'
import type { MatchPhase } from '../../simulation'
import type { CSSProperties } from 'react'
import { ClubCrest } from './ClubMark'
import { clubIdentity } from './clubIdentity'

export function MatchScoreboard({ home, away, score, matchMinute, phase, competition, round, status }: { home: Club; away: Club; score?: MatchResult; matchMinute?: number; phase?: MatchPhase; competition: string; round: number; status: string }) {
  return <section className="match-scoreboard" aria-label="Placar da partida">
    <div className="scoreboard-context"><span>{competition} · Rodada {round}</span><span>{status}</span></div>
    <div className="scoreboard-teams">
      {[home, away].map((club, index) => <div key={club.id} className={`scoreboard-team scoreboard-${index === 0 ? 'home' : 'away'}`} style={{ '--team-color': clubIdentity(club.id).primaryColor } as CSSProperties}>
        <ClubCrest club={club} /><div><strong>{club.shortName}</strong><span>{club.name}</span><small>{index === 0 ? 'Mandante' : 'Visitante'}</small></div>
      </div>)}
      <div className="scoreboard-score"><strong aria-label={score ? `${home.name} ${score.homeGoals}, ${away.name} ${score.awayGoals}` : 'Partida ainda não disputada'}>{score ? `${score.homeGoals} – ${score.awayGoals}` : 'VS'}</strong><span>{phase === 'HALF_TIME' ? 'INT' : phase === 'FULL_TIME' ? 'FIM' : matchMinute !== undefined ? `${matchMinute}′` : 'DIA DE JOGO'}</span></div>
    </div>
  </section>
}
