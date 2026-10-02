import { createId } from '../../core/ids'
import { createMoneyFromCents } from '../../core/money'
import { createPlayer } from '../../domain/players'
import type { Player, Position } from '../../domain/players'
import { createClub } from '../../domain/clubs'
import type { Club } from '../../domain/clubs'
import { createCoach } from '../../domain/coaches'
import type { Coach } from '../../domain/coaches'
import { createCompetition, createCompetitionSeason } from '../../domain/competitions'
import type { GameData } from '../gameData'

// Exclusivamente fictício. Sem export pelo barrel principal e sem import na UI.
const CLUB_NAMES = [
  ['Aurora Inventada', 'AUR'], ['Horizonte Imaginário', 'HOR'],
  ['Vale do Eclipse', 'VEC'], ['Estrela de Papel', 'EDP'],
  ['Porto das Nuvens', 'PDN'], ['Serra dos Ventos', 'SDV'],
] as const
const COACH_NAMES = ['Otávio Nuvem', 'Lia Horizonte', 'Mauro Eclipse', 'Íris Papel', 'Nilo Brisa', 'Cora Vento'] as const
const FIRST_NAMES = ['Ari', 'Bento', 'Caio', 'Davi', 'Enzo', 'Fábio', 'Gil', 'Hugo', 'Ivo', 'João'] as const
const LAST_NAMES = ['Nuvem', 'Brisa', 'Horizonte', 'Eclipse', 'Papel', 'Vento'] as const
const SQUAD_POSITIONS: readonly Position[] = [
  'GK', 'GK', 'RB', 'RB', 'LB', 'LB', 'CB', 'CB', 'CB', 'CB',
  'DM', 'DM', 'CM', 'CM', 'AM', 'AM', 'RW', 'LW', 'ST', 'ST',
]

/** Dataset fixo/reproduzível, não um gerador de jogadores da simulação. */
export function createDevelopmentFixture(): GameData {
  const players: Player[] = []
  const clubs: Club[] = []
  const coaches: Coach[] = []

  CLUB_NAMES.forEach(([name, shortName], clubIndex) => {
    const clubId = createId('Club', `dev-club-${clubIndex + 1}`)
    const coachId = createId('Coach', `dev-coach-${clubIndex + 1}`)
    const squad = SQUAD_POSITIONS.map((primaryPosition, playerIndex) => {
      const base = 45 + clubIndex * 4 + playerIndex % 12
      const firstName = FIRST_NAMES[playerIndex % FIRST_NAMES.length]
      const lastName = `${LAST_NAMES[clubIndex]} ${playerIndex + 1}`
      return createPlayer({
        id: createId('Player', `dev-player-${clubIndex + 1}-${playerIndex + 1}`),
        firstName, lastName, displayName: `${firstName} ${lastName}`,
        birthDate: `${1991 + playerIndex % 15}-06-15`, nationality: 'BR',
        preferredFoot: playerIndex % 3 === 0 ? 'LEFT' : playerIndex % 3 === 1 ? 'RIGHT' : 'BOTH',
        // Exemplo fictício para consultar principal/secundárias, sem alterar a posição inicial.
        primaryPosition, secondaryPositions: primaryPosition === 'ST' ? ['RW', 'LW'] : [],
        attributes: {
          finishing: base + 2, passing: base + 1, technique: base + 3,
          defending: base, pace: base + 4, physical: base + 2, stamina: base + 5, decision: base + 1,
        },
        potential: base + 10, form: 70 + playerIndex % 20, fitness: 85 + playerIndex % 15,
        clubId, marketValue: createMoneyFromCents((clubIndex + 1) * 10000000 + playerIndex * 100000),
        status: 'AVAILABLE', metadata: { source: 'development-fixture', fictional: true },
      })
    })
    players.push(...squad)
    coaches.push(createCoach({
      id: coachId, name: COACH_NAMES[clubIndex], nationality: 'BR',
      reputation: 40 + clubIndex * 5, experience: 100 + clubIndex * 20,
      currentClubId: clubId, humanControlled: false,
    }))
    clubs.push(createClub({
      id: clubId, name, shortName, country: 'BR', reputation: 40 + clubIndex * 5,
      playerIds: squad.map(player => player.id), coachId,
      profile: {
        youthPreference: 30 + clubIndex * 10, transferAggressiveness: 40 + clubIndex * 5,
        sellingPreference: 60 - clubIndex * 5, financialRisk: 20 + clubIndex * 8,
        experiencedPlayerPreference: 70 - clubIndex * 10,
      },
      finances: {
        cashBalance: createMoneyFromCents(500000000 + clubIndex * 100000000),
        transferBudget: createMoneyFromCents(100000000 + clubIndex * 20000000),
        wageBudget: createMoneyFromCents(10000000 + clubIndex * 1000000),
      },
      metadata: { source: 'development-fixture', fictional: true },
    }))
  })

  const competition = createCompetition({
    id: createId('Competition', 'dev-competition-1'), name: 'Liga Laboratório — Fictícia',
    country: 'BR', type: 'LEAGUE', format: { legs: 2 },
  })
  const competitionSeason = createCompetitionSeason({
    id: createId('CompetitionSeason', 'dev-competition-season-2026'),
    competitionId: competition.id, year: 2026, participantClubIds: clubs.map(club => club.id), status: 'SCHEDULED',
  })
  return Object.freeze({
    id: 'dev-fixture-v1', kind: 'DEVELOPMENT_FIXTURE', source: 'Professor FC — fixture fictícia de desenvolvimento',
    referenceDate: '2026-01-01', initialYear: 2026,
    players: Object.freeze(players), clubs: Object.freeze(clubs), coaches: Object.freeze(coaches),
    competitions: Object.freeze([competition]), competitionSeasons: Object.freeze([competitionSeason]),
  })
}
