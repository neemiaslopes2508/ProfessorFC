import { expect, it } from 'vitest'
import { getDevelopmentClubs, prototypeMatchDependencies, startPrototype } from './prototypeSession'
import { prototypeMatchSeed } from './prototypeMatchSeed'

it('preserva a seed da carreira e distingue confrontos e novos jogos', () => {
  const clubId = getDevelopmentClubs()[0].id
  const session = startPrototype(clubId, 12345)
  const replay = startPrototype(clubId, 12345)
  const otherCareer = startPrototype(clubId, 67890)
  const { league } = session.game.competitions[0]
  const seeds = league.fixtures.map(match => prototypeMatchSeed(session.careerSeed, league.season.id, match.id, match.homeClubId, match.awayClubId))
  expect(new Set(seeds).size).toBe(league.fixtures.length)
  const matchId = league.fixtures[0].id
  const sequence = (game: typeof session) => {
    const random = prototypeMatchDependencies(game).randomForMatch(matchId)
    return Array.from({ length: 8 }, () => random.next())
  }
  expect(sequence(session)).toEqual(sequence(replay))
  expect(sequence(session)).not.toEqual(sequence(otherCareer))
  expect(() => prototypeMatchDependencies(session).randomForMatch('unknown' as typeof matchId)).toThrow('Partida desconhecida')
})
