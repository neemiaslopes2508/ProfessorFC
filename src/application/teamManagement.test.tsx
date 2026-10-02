import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createId } from '../core/ids'
import { FORMATIONS } from '../domain/tactics'
import { calculateTeamStrength } from '../simulation/strength'
import { getDevelopmentClubs, startPrototype, humanTeam, moveTeamPlayer, selectionValidation, setPrototypeTactics, setStarter, starterSlots, advancePrototype, playPrototypeMatch, continuePrototypeMatch, prototypeView } from './prototypeSession'
import { querySquad, squadOverview } from './teamOverview'
import { TeamPage } from '../ui/pages/TeamPage'
import { PlayerPanel } from '../ui/components/PlayerPanel'

function setup() { return startPrototype(getDevelopmentClubs()[0].id) }
describe('Gerenciamento visual de equipe', () => {
  it('substitui uma reserva mantendo onze únicos, banco consistente e snapshot anterior intacto', () => {
    const before = setup()
    const team = humanTeam(before)
    const reserve = team.players.find(player => player.primaryPosition === 'ST' && team.lineup.bench.includes(player.id))!
    const displaced = starterSlots(before)[10]!
    const after = moveTeamPlayer(before, reserve.id, 10)
    expect(starterSlots(after)[10]).toBe(reserve.id)
    expect(humanTeam(after).lineup.bench).toContain(displaced)
    expect(humanTeam(after).lineup.bench).not.toContain(reserve.id)
    expect(new Set(humanTeam(after).lineup.startingPlayers).size).toBe(11)
    expect(selectionValidation(after)).toMatchObject({ valid: true, warnings: [] })
    expect(starterSlots(before)[10]).toBe(displaced)
    expect(before.game).toBe(after.game)
  })
  it('troca dois titulares atomicamente e permite improvisação com alerta, sem duplicar jogadores', () => {
    const before = setup()
    const old = starterSlots(before)
    const after = moveTeamPlayer(before, old[2]!, 10)
    expect(starterSlots(after)[10]).toBe(old[2])
    expect(starterSlots(after)[2]).toBe(old[10])
    expect(humanTeam(after).lineup.bench).toEqual(humanTeam(before).lineup.bench)
    expect(selectionValidation(after).valid).toBe(true)
    expect(selectionValidation(after).warnings).toHaveLength(2)
    expect(moveTeamPlayer(after, old[2]!, 10)).toBe(after)
  })
  it('rejeita destino, jogador e indisponibilidade inválidos sem retornar estado parcial', () => {
    const session = setup()
    const reserve = humanTeam(session).lineup.bench[0]
    expect(() => moveTeamPlayer(session, reserve, -1)).toThrow('Destino')
    expect(() => moveTeamPlayer(session, createId('Player', 'unknown'), 0)).toThrow('titular ou jogador do banco')
    const foreign = session.teams[1].players[0].id
    expect(() => moveTeamPlayer(session, foreign, 0)).toThrow()
    const unavailable = { ...session, teams: session.teams.map(team => team.club.id === session.game.humanClubId ? { ...team, players: team.players.map(player => player.id === reserve ? { ...player, status: 'INJURED' as const } : player) } : team) }
    expect(() => moveTeamPlayer(unavailable, reserve, 0)).toThrow('indisponível')
    expect(selectionValidation(session).valid).toBe(true)
  })
  it('preserva seleção personalizada e banco em todas as formações, sem preencher rascunho incompleto', () => {
    let session = setup()
    const reserve = humanTeam(session).players.find(player => player.primaryPosition === 'ST' && humanTeam(session).lineup.bench.includes(player.id))!
    session = moveTeamPlayer(session, reserve.id, 10)
    const ids = [...humanTeam(session).lineup.startingPlayers].sort()
    const bench = humanTeam(session).lineup.bench
    for (const formation of FORMATIONS) {
      session = setPrototypeTactics(session, { formation, mentality: 'BALANCED', style: 'BALANCED' })
      expect([...humanTeam(session).lineup.startingPlayers].sort()).toEqual(ids)
      expect(humanTeam(session).lineup.bench).toEqual(bench)
      expect(selectionValidation(session).valid).toBe(true)
    }
    session = setStarter(session, 3, undefined)
    const incomplete = humanTeam(session).lineup.startingPlayers
    session = setPrototypeTactics(session, { formation: '4-4-2', mentality: 'ATTACKING', style: 'PRESSING' })
    expect(new Set(humanTeam(session).lineup.startingPlayers)).toEqual(new Set(incomplete))
    expect(selectionValidation(session).valid).toBe(false)
  })
  it('consulta elenco com busca, filtro e ordenação e deriva totais sem mutar a base', () => {
    const session = setup()
    const original = [...humanTeam(session).players]
    const overview = squadOverview(session)
    expect(overview).toMatchObject({ count: 20, available: 20, unavailable: 0 })
    expect(overview.positions.reduce((sum, row) => sum + row.count, 0)).toBe(20)
    expect(overview.totalValue.cents).toBe(original.reduce((sum, player) => sum + player.marketValue.cents, 0))
    const player = original.find(player => player.displayName.includes('João'))!
    expect(querySquad(session, 'joao', player.primaryPosition, 'name')).toContain(player)
    const ordered = querySquad(session, '', 'ALL', 'fitness')
    expect(ordered.map(player => player.fitness)).toEqual(original.map(player => player.fitness).sort((a, b) => b - a))
    expect(querySquad(session, 'ninguém', 'ALL', 'name')).toEqual([])
    expect(humanTeam(session).players).toEqual(original)
  })
  it('campo e painel apresentam a equipe alterada a partir da mesma sessão', () => {
    const before = setup()
    const reserve = humanTeam(before).lineup.bench[0]
    const session = moveTeamPlayer(before, reserve, 0)
    const team = humanTeam(session)
    const markup = renderToStaticMarkup(<TeamPage session={session} onMove={() => true} onTactics={() => {}} onBench={() => {}} />)
    expect(markup.match(/data-team-slot=/g)).toHaveLength(11)
    expect(markup).toContain(`data-team-slot="0" data-player-id="${reserve}"`)
    expect(markup).toContain('role="tablist"')
    const player = team.players.find(player => player.id === reserve)!
    const panel = renderToStaticMarkup(<PlayerPanel player={player} date={session.game.calendar.currentDate} onClose={() => {}} />)
    expect(panel).toContain(player.displayName)
    expect(panel).toContain(`value="${player.attributes.finishing}"`)
    expect(panel).toContain('Overall base')
  })
  it('motor consome os titulares e tática alterados e confirmação mantém o fluxo da temporada', () => {
    let session = setup()
    const reserve = humanTeam(session).players.find(player => player.primaryPosition === 'ST' && humanTeam(session).lineup.bench.includes(player.id))!
    session = moveTeamPlayer(session, reserve.id, 10)
    session = setPrototypeTactics(session, { formation: '4-2-3-1', mentality: 'ATTACKING', style: 'COUNTER_ATTACK' })
    session = advancePrototype(advancePrototype(session))
    const before = session
    session = playPrototypeMatch(session)
    const debug = session.pendingMatch!.result.debug.home
    const expected = calculateTeamStrength(humanTeam(before), debug.modifiers.home)
    expect(debug.players.map(player => player.playerId).sort()).toEqual([...humanTeam(before).lineup.startingPlayers].sort())
    expect(debug.players.some(player => player.playerId === reserve.id)).toBe(true)
    expect(debug).toEqual(expected)
    expect(() => moveTeamPlayer(session, humanTeam(session).lineup.bench[0], 0)).toThrow('Continue')
    session = continuePrototypeMatch(session)
    expect(prototypeView(session).humanStanding.played).toBe(1)
    expect(advancePrototype(session).game.calendar.currentDate).toBe('2026-04-12')
  })
})
