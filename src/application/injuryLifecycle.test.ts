import { captureTeamSetup } from './teamSetup'
import { expect, it } from 'vitest'
import { advancePrototype, getDevelopmentClubs, humanTeam, startPrototype, continuePrototypeMatch, selectionValidation, moveTeamPlayer } from './prototypeSession'
import { advancePrototypeLiveMatch, startPrototypeLiveMatch, finishPrototypeLiveMatch, captureLiveTeamSetup, liveTeamEditorSession, commitPrototypeLiveTeamSetup } from './liveHumanMatch'
import { developmentInjuryScenario } from './developmentInjuryScenario'
import { currentPlayerInjury, processInjuryDate, registerMatchInjuries } from './injuryLifecycle'
import { createInjury, medicalRecoveryReduction } from '../domain/players/injury'

it('registra uma lesão uma vez, impede escalação e recupera pelas datas reais do calendário', () => {
  let session = developmentInjuryScenario(startPrototype(getDevelopmentClubs()[0].id), 'short')
  while (!session.game.calendar.currentDate.startsWith('2026-04-05')) session = advancePrototype(session)
  session = startPrototypeLiveMatch(session)
  session = advancePrototypeLiveMatch(session, 1)
  const event = session.liveMatch!.events.find(event => event.type === 'INJURY')!
  const playerId = event.playerId!
  const injury = currentPlayerInjury(session, playerId)!
  expect(humanTeam(session).players.find(player => player.id === playerId)!.status).toBe('INJURED')
  expect(selectionValidation(session).valid).toBe(false)
  expect(registerMatchInjuries(session, session.liveMatch!.matchId, [event], session.game.calendar.currentDate)).toBe(session)
  expect(processInjuryDate(session, '2026-04-09')).toBe(session)
  const editor = liveTeamEditorSession(session, captureLiveTeamSetup(session))
  const injuredSlot = humanTeam(editor).lineup.positions.findIndex(slot => slot.playerId === playerId)
  const replacement = humanTeam(editor).lineup.bench.find(id => humanTeam(editor).players.find(player => player.id === id)!.primaryPosition !== 'GK')!
  const draft = captureTeamSetup(moveTeamPlayer(editor, replacement, injuredSlot))
  session = commitPrototypeLiveTeamSetup(session, draft)
  expect(session.liveMatch!.homeLineup.startingPlayers).not.toContain(playerId)
  session = finishPrototypeLiveMatch(session)
  expect(session.pendingMatch!.result.events.filter(item => item.minute > 1 && (item.playerId === playerId || item.secondaryPlayerId === playerId))).toEqual([])
  const pastEvents = session.pendingMatch!.result.events
  session = continuePrototypeMatch(session)
  expect(session.injuries).toHaveLength(1)
  session = advancePrototype(session)
  expect(session.game.calendar.currentDate).toBe('2026-04-10')
  expect(currentPlayerInjury(session, playerId)!.status).toBe('RECOVERING')
  expect(selectionValidation(session).valid).toBe(false)
  session = advancePrototype(session)
  expect(session.game.calendar.currentDate).toBe('2026-04-12')
  expect(humanTeam(session).players.find(player => player.id === playerId)!.status).toBe('AVAILABLE')
  expect(currentPlayerInjury(session, playerId)).toBeUndefined()
  expect(session.injuries[0]).toMatchObject({ ...injury, status: 'HEALED' })
  expect(session.lastMatch!.result.events).toEqual(pastEvents)
})

it('DM superior reduz a duração configurada, sem antecipar ou eliminar readaptação', () => {
  const playerId = humanTeam(startPrototype(getDevelopmentClubs()[0].id)).players[0].id
  const input = { id: 'medical-test', playerId, injuryType: 'MUSCLE' as const, severity: 'MODERATE' as const, occurredAt: '2026-04-05', baseDays: 20 }
  const basic = createInjury({ ...input, medicalLevel: 1 })
  const better = createInjury({ ...input, medicalLevel: 5 })
  expect(medicalRecoveryReduction(5)).toBe(0.2)
  expect(basic.expectedRecoveryDate).toBe('2026-04-25')
  expect(better.expectedRecoveryDate).toBe('2026-04-21')
  expect(better.availableAt).toBe('2026-04-23')
  expect(createInjury({ ...input, baseDays: 1, medicalLevel: 5 }).expectedRecoveryDate).toBe('2026-04-06')
})
