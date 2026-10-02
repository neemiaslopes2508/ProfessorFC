import { describe, expect, it } from 'vitest'
import { createId } from '../core/ids'
import { createDevelopmentFixture } from './fixtures/development'
import { loadGameData } from './loadGameData'
import { validateGameData } from './validation'
import type { GameData } from './gameData'

describe('Base fictícia e carregamento', () => {
  it('carrega uma seed consistente, reproduzível e com elencos utilizáveis', () => {
    const fixture = createDevelopmentFixture()
    const result = loadGameData(fixture, 'development')
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(JSON.stringify(result.validation.errors))

    expect(fixture.kind).toBe('DEVELOPMENT_FIXTURE')
    expect(fixture.clubs).toHaveLength(6)
    expect(fixture.players).toHaveLength(120)
    expect(fixture.coaches).toHaveLength(6)
    expect(fixture.competitions).toHaveLength(1)
    expect(fixture.competitionSeasons).toHaveLength(1)
    for (const club of result.repositories.clubs.getAll()) {
      const squad = result.repositories.players.getAll().filter(player => player.clubId === club.id)
      expect(squad).toHaveLength(20)
      expect(squad.filter(player => player.primaryPosition === 'GK')).toHaveLength(2)
      expect(new Set(squad.map(player => player.primaryPosition)).size).toBe(10)
      expect(result.repositories.coaches.getById(club.coachId!)?.currentClubId).toBe(club.id)
    }
    const season = result.repositories.competitionSeasons.getAll()[0]
    expect(season.year).toBe(2026)
    expect(season.participantClubIds).toHaveLength(6)
    expect(result.repositories.competitions.getById(season.competitionId)).toBeDefined()
    expect(createDevelopmentFixture()).toEqual(fixture)
  })

  it('rejeita fixture fictícia como base oficial sem expor repositórios', () => {
    const result = loadGameData(createDevelopmentFixture(), 'official')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('Fixture foi aceita como oficial.')
    expect(result.validation.errors).toContainEqual(expect.objectContaining({
      code: 'DEVELOPMENT_DATA_NOT_OFFICIAL', path: 'kind',
    }))
    expect(result).not.toHaveProperty('repositories')
  })

  it('informa metadados incompatíveis com snapshot sem expor carga parcial', () => {
    const fixture = createDevelopmentFixture()
    const input = { ...fixture, players: fixture.players.map((player, index) => index === 0
      ? { ...player, metadata: { callback: () => 'não serializável' } } : player) }
    const result = loadGameData(input, 'development')
    if (result.ok) throw new Error('Metadados não copiáveis foram aceitos.')
    expect(result.validation.errors).toContainEqual(expect.objectContaining({ code: 'UNCLONEABLE_DATA', path: 'data' }))
    expect(result).not.toHaveProperty('repositories')
  })

  it('isola entrada, snapshot e consultas, inclusive metadados aninhados', () => {
    const fixture = createDevelopmentFixture()
    const input = {
      ...fixture,
      players: fixture.players.map(player => ({
        ...player, attributes: { ...player.attributes }, metadata: { notes: { label: 'original' } },
      })),
    }
    const id = input.players[0].id
    const originalFinishing = input.players[0].attributes.finishing
    const result = loadGameData(input, 'development')
    if (!result.ok) throw new Error('Seed válida foi rejeitada.')
    input.players[0].attributes.finishing = 1
    input.players[0].metadata.notes.label = 'entrada editada'
    expect(result.data.players[0].attributes.finishing).toBe(originalFinishing)
    expect(result.data.players[0].metadata?.notes).toEqual({ label: 'original' })

    const queried = result.repositories.players.getById(id)!
    Object.assign(queried.attributes, { finishing: 2 })
    Object.assign(queried.metadata!.notes as object, { label: 'consulta editada' })
    Object.assign(result.data.players[0].metadata!.notes as object, { label: 'snapshot editado' })
    expect(result.repositories.players.getById(id)?.attributes.finishing).toBe(originalFinishing)
    expect(result.repositories.players.getById(id)?.metadata?.notes).toEqual({ label: 'original' })
    expect(fixture.players[0].attributes.finishing).toBe(originalFinishing)
  })
})

describe('Integridade da base', () => {
  it('acumula erros locais com caminhos úteis e rejeita carregamento parcial', () => {
    const fixture = createDevelopmentFixture()
    const data = {
      ...fixture,
      players: fixture.players.map((player, index) => index === 0
        ? { ...player, attributes: { ...player.attributes, finishing: 0 } } : player),
      source: '',
    }
    const result = loadGameData(data, 'development')
    if (result.ok) throw new Error('Dados inválidos foram aceitos.')
    expect(result.validation.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INVALID_ENTITY', path: 'players[0]', message: expect.stringContaining('finishing') }),
      expect.objectContaining({ code: 'INVALID_METADATA', path: 'source' }),
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'clubs[0].playerIds[0]' }),
    ]))
    expect(result).not.toHaveProperty('repositories')
  })

  it.each(['same-collection', 'across-collections'] as const)('detecta ID duplicado: %s', scenario => {
    const fixture = createDevelopmentFixture()
    const data: GameData = scenario === 'same-collection'
      ? { ...fixture, players: [...fixture.players, fixture.players[0]] }
      : { ...fixture, coaches: fixture.coaches.map((coach, index) => index === 0
        ? { ...coach, id: createId('Coach', fixture.players[0].id) } : coach) }
    const result = validateGameData(data)
    expect(result.valid).toBe(false)
    expect(result.errors).toContainEqual(expect.objectContaining({
      code: 'DUPLICATE_ID', message: expect.stringContaining('players[0].id'),
    }))
  })

  it('detecta jogador referenciado por dois elencos', () => {
    const fixture = createDevelopmentFixture()
    const data = { ...fixture, clubs: fixture.clubs.map((club, index) => index === 1
      ? { ...club, playerIds: [...club.playerIds, fixture.players[0].id] } : club) }
    const result = validateGameData(data)
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'MULTIPLE_CLUBS', path: 'clubs[1].playerIds[20]' }))
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'INCONSISTENT_RELATION' }))
  })

  it('detecta jogador ligado a clube sem constar no elenco correspondente', () => {
    const fixture = createDevelopmentFixture()
    const data = { ...fixture, clubs: fixture.clubs.map((club, index) => index === 0
      ? { ...club, playerIds: club.playerIds.slice(1) } : club) }
    expect(validateGameData(data).errors).toContainEqual(expect.objectContaining({
      code: 'INCONSISTENT_RELATION', path: 'players[0].clubId',
    }))
  })

  it('detecta jogador inexistente no elenco e clube inexistente no jogador', () => {
    const fixture = createDevelopmentFixture()
    const data = {
      ...fixture,
      clubs: fixture.clubs.map((club, index) => index === 0
        ? { ...club, playerIds: [...club.playerIds, createId('Player', 'missing-player')] } : club),
      players: fixture.players.map((player, index) => index === 0
        ? { ...player, clubId: createId('Club', 'missing-club') } : player),
    }
    expect(validateGameData(data).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'clubs[0].playerIds[20]', message: expect.stringContaining('missing-player') }),
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'players[0].clubId', message: expect.stringContaining('missing-club') }),
    ]))
  })

  it('detecta referências ausentes nos dois sentidos de treinador/clube', () => {
    const fixture = createDevelopmentFixture()
    const data = {
      ...fixture,
      clubs: fixture.clubs.map((club, index) => index === 0
        ? { ...club, coachId: createId('Coach', 'missing-coach') } : club),
      coaches: fixture.coaches.map((coach, index) => index === 0
        ? { ...coach, currentClubId: createId('Club', 'missing-club') } : coach),
    }
    expect(validateGameData(data).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'clubs[0].coachId' }),
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'coaches[0].currentClubId' }),
    ]))
  })

  it('detecta vínculo assimétrico entre treinador existente e clube', () => {
    const fixture = createDevelopmentFixture()
    const data = { ...fixture, coaches: fixture.coaches.map((coach, index) => index === 0
      ? { ...coach, currentClubId: fixture.clubs[1].id } : coach) }
    expect(validateGameData(data).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'INCONSISTENT_RELATION', path: 'clubs[0].coachId' }),
      expect.objectContaining({ code: 'INCONSISTENT_RELATION', path: 'coaches[0].currentClubId' }),
    ]))
  })

  it('detecta definição da competição e participantes inexistentes na edição', () => {
    const fixture = createDevelopmentFixture()
    const data = { ...fixture, competitionSeasons: [{
      ...fixture.competitionSeasons[0], competitionId: createId('Competition', 'missing-competition'),
      participantClubIds: [createId('Club', 'missing-participant')],
    }] }
    expect(validateGameData(data).errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'competitionSeasons[0].competitionId' }),
      expect.objectContaining({ code: 'MISSING_REFERENCE', path: 'competitionSeasons[0].participantClubIds[0]' }),
    ]))
  })

  it('permite jogador livre e treinador sem clube com vínculos removidos', () => {
    const fixture = createDevelopmentFixture()
    const data = {
      ...fixture,
      players: fixture.players.map((player, index) => index === 0 ? { ...player, clubId: null } : player),
      coaches: fixture.coaches.map((coach, index) => index === 0 ? { ...coach, currentClubId: undefined } : coach),
      clubs: fixture.clubs.map((club, index) => index === 0
        ? { ...club, playerIds: club.playerIds.slice(1), coachId: undefined } : club),
    }
    expect(validateGameData(data)).toEqual({ valid: true, errors: [] })
  })
})
