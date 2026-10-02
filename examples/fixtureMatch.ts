import { createDevelopmentFixture } from '../src/data/fixtures/development'
import { loadGameData } from '../src/data'
import { createSeededRandomSource } from '../src/core/random'
import { FORMATION_POSITIONS } from '../src/domain/tactics'
import { simulateMatch } from '../src/simulation'
import type { MatchSimulationInput, SimulationTeam } from '../src/simulation'

/** Montagem explícita de um exemplo fictício, sem seleção automática por qualidade. */
export function createFixtureMatchInput(seed = 2026): MatchSimulationInput {
  const loaded = loadGameData(createDevelopmentFixture(), 'development')
  if (!loaded.ok) throw new Error('Fixture inválida.')
  const repositories = loaded.repositories
  const clubs = repositories.clubs.getAll()
  function team(index: number): SimulationTeam {
    const club = clubs[index]
    const startingPlayers = [0, 2, 6, 7, 4, 10, 12, 13, 16, 17, 18].map(slot => club.playerIds[slot])
    return {
      club, players: repositories.players.getAll().filter(player => player.clubId === club.id),
      lineup: {
        startingPlayers, bench: club.playerIds.filter(id => !startingPlayers.includes(id)),
        positions: FORMATION_POSITIONS['4-3-3'].map((position, slot) => ({ playerId: startingPlayers[slot], position })),
      },
      tactics: { formation: '4-3-3', mentality: 'BALANCED', style: 'BALANCED' },
    }
  }
  return { home: team(0), away: team(1), random: createSeededRandomSource(seed), context: { neutralVenue: false } }
}

export function simulateFixtureExample(seed = 2026) {
  const input = createFixtureMatchInput(seed)
  return { home: input.home.club.name, away: input.away.club.name, seed, result: simulateMatch(input) }
}
