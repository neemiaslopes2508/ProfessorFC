import type { MatchId } from '../core/ids'
import { createDevelopmentFixture } from '../data/fixtures/development'
import { matchStadiumAttendance } from './stadiumManagement'
import { getLeagueStandings } from '../competitions'
import type { SimulationTeam } from '../simulation'
import { playerOverall } from './teamOverview'
import { getScheduledMatch } from './temporalGame'
import type { PrototypeSession } from './prototypeSession'

/** Projeção do protótipo confirmado. Nenhuma simulação, escalação automática ou alteração temporal. */
export function matchDayOverview(session: PrototypeSession, matchId: MatchId) {
  const match = getScheduledMatch(session.game, matchId)
  const edition = session.game.competitions.find(entry => entry.league.season.id === match.competitionSeasonId)!
  const competition = createDevelopmentFixture().competitions.find(item => item.id === edition.league.season.competitionId)
  const standings = getLeagueStandings(edition.league)
  function teamView(team: SimulationTeam) {
    const starters = team.lineup.positions.map(slot => {
      const player = team.players.find(player => player.id === slot.playerId)
      if (!player) throw new Error('Titular ausente da equipe confirmada.')
      return { player, position: slot.position, overall: playerOverall(player, slot.position) }
    })
    const bestOverall = [...starters].sort((a, b) => b.overall - a.overall)[0]
    const bestForm = [...starters].sort((a, b) => b.player.form - a.player.form)[0]
    return { team, starters, bestOverall, bestForm, standing: standings.find(row => row.clubId === team.club.id) }
  }
  const home = session.teams.find(team => team.club.id === match.homeClubId)
  const away = session.teams.find(team => team.club.id === match.awayClubId)
  if (!home || !away) throw new Error('Equipe da partida ausente da sessão.')
  return { match, competitionName: competition?.name ?? 'Competição', home: teamView(home), away: teamView(away),
    atmosphere: matchStadiumAttendance(session, match.id) }
}

export type MatchDayOverview = ReturnType<typeof matchDayOverview>
