import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createId } from '../core/ids'
import { FORMATIONS } from '../domain/tactics'
import { getPendingHumanActions, completeHumanMatch } from './temporalGame'
import { getDevelopmentClubs, startPrototype, humanTeam, selectionValidation, setStarter, setPrototypeTactics, setBench, advancePrototype, playPrototypeMatch, continuePrototypeMatch, prototypeView, starterSlots } from './prototypeSession'
import type { PrototypeSession } from './prototypeSession'
import { PreMatchPage, MatchPage } from '../ui/pages/MatchPages'

function ready() {
  let session = startPrototype(getDevelopmentClubs()[0].id)
  for (let count = 0; !getPendingHumanActions(session.game).length && count < 5; count++) session = advancePrototype(session)
  return session
}
describe('Vertical slice de desenvolvimento', () => {
  it('inicia sessões independentes para qualquer um dos seis clubes com seleção válida', () => {
    const clubs = getDevelopmentClubs()
    expect(clubs).toHaveLength(6)
    for (const club of clubs) {
      const session = startPrototype(club.id)
      expect(humanTeam(session).club.id).toBe(club.id)
      expect(humanTeam(session).players).toHaveLength(20)
      expect(selectionValidation(session)).toMatchObject({ valid: true, warnings: [] })
      expect(prototypeView(session).matches).toHaveLength(30)
      expect(prototypeView(session).league.results).toHaveLength(0)
    }
    expect(() => startPrototype(createId('Club', 'unknown'))).toThrow()
  })
  it('mantém rascunho incompleto, bloqueia pré-jogo e permite restaurar slots sem deslocamento', () => {
    let session = ready()
    const slots = [...starterSlots(session)]
    session = setStarter(session, 2, undefined)
    expect(starterSlots(session)[3]).toBe(slots[3])
    expect(selectionValidation(session).valid).toBe(false)
    expect(() => playPrototypeMatch(session)).toThrow('Corrija a escalação')
    const markup = renderToStaticMarkup(<PreMatchPage session={session} onPlay={() => {}} onLineup={() => {}} onTactics={() => {}} />)
    expect(markup).toContain('disabled=""')
    session = setStarter(session, 2, slots[2])
    expect(selectionValidation(session).valid).toBe(true)
    expect(starterSlots(session)).toEqual(slots)
    session = setBench(session, [])
    expect(humanTeam(session).lineup.bench).toEqual([])
    expect(selectionValidation(session).valid).toBe(true)
  })
  it('permite improvisação com alertas sem bloquear a partida', () => {
    let session = ready()
    const reserveKeeper = humanTeam(session).players.find(player => player.primaryPosition === 'GK' && !humanTeam(session).lineup.startingPlayers.includes(player.id))!
    session = setStarter(session, 10, reserveKeeper.id)
    expect(selectionValidation(session)).toMatchObject({ valid: true, errors: [], warnings: [expect.objectContaining({ code: 'OUT_OF_POSITION' })] })
    expect(playPrototypeMatch(session).pendingMatch).toBeDefined()
  })
  it('atualiza todas as formações e mantém mudanças de mentalidade e estilo sem trocar titulares', () => {
    let session = ready()
    for (const formation of FORMATIONS) {
      session = setPrototypeTactics(session, { formation, mentality: 'DEFENSIVE', style: 'COUNTER_ATTACK' })
      expect(selectionValidation(session).valid).toBe(true)
      expect(humanTeam(session).tactics.formation).toBe(formation)
    }
    const lineup = humanTeam(session).lineup
    session = setPrototypeTactics(session, { ...humanTeam(session).tactics, mentality: 'ATTACKING', style: 'PRESSING' })
    expect(humanTeam(session).lineup).toBe(lineup)
    expect(humanTeam(session).tactics).toMatchObject({ mentality: 'ATTACKING', style: 'PRESSING' })
  })
  it('processa CPU e bloqueia avanço na ação humana sem repetir resultados', () => {
    const session = ready()
    expect(prototypeView(session).league.results).toHaveLength(2)
    const repeated = advancePrototype(session)
    expect(repeated.game.calendar.currentDate).toBe(session.game.calendar.currentDate)
    expect(prototypeView(repeated).league.results).toEqual(prototypeView(session).league.results)
    expect(getPendingHumanActions(repeated.game)).toHaveLength(1)
  })
  it('apresenta valores exatos, confirma uma vez e permite avançar apenas após Continuar', () => {
    const before = ready()
    const session = playPrototypeMatch(before)
    expect(session.game).toBe(before.game)
    expect(prototypeView(session).humanStanding.played).toBe(0)
    expect(playPrototypeMatch(session)).toBe(session)
    expect(() => advancePrototype(session)).toThrow('Continuar')
    expect(() => setPrototypeTactics(session, humanTeam(session).tactics)).toThrow('Continue')
    const markup = renderToStaticMarkup(<MatchPage session={session} onContinue={() => {}} onTable={() => {}} />)
    for (const values of Object.values(session.pendingMatch!.result.statistics)) {
      expect(markup).toContain(`<td>${values.home}</td>`)
      expect(markup).toContain(`<td>${values.away}</td>`)
    }
    const confirmed = continuePrototypeMatch(session)
    expect(prototypeView(confirmed).humanStanding.played).toBe(1)
    expect(prototypeView(confirmed).league.results).toHaveLength(3)
    expect(getPendingHumanActions(confirmed.game)).toHaveLength(0)
    expect(continuePrototypeMatch(confirmed)).toBe(confirmed)
    expect(() => completeHumanMatch(confirmed.game, session.pendingMatch!.matchId, session.pendingMatch!.result, { getTeam: () => humanTeam(session), randomForMatch: () => ({ next: () => 0 }) })).toThrow()
    expect(advancePrototype(confirmed).game.calendar.currentDate).toBe('2026-04-12')
  })
  it('joga uma temporada inteira reproduzível e encerra com campeão e dez jogos por clube', () => {
    function fullSeason(): PrototypeSession {
      let session = startPrototype(getDevelopmentClubs()[4].id)
      for (let count = 0; session.game.calendar.nextPendingEvent() && count < 30; count++) {
        session = advancePrototype(session)
        if (getPendingHumanActions(session.game).length) session = continuePrototypeMatch(playPrototypeMatch(session))
      }
      return session
    }
    const final = fullSeason()
    const view = prototypeView(final)
    expect(view.league.season.status).toBe('FINISHED')
    expect(view.league.results).toHaveLength(30)
    expect(view.standings.every(row => row.played === 10)).toBe(true)
    expect(view.champion!.id).toBe(view.standings[0].clubId)
    expect(final.game.calendar.nextPendingEvent()).toBeUndefined()
    expect(prototypeView(fullSeason()).standings).toEqual(view.standings)
    expect(advancePrototype(final).game).toBe(final.game)
  })
})
