import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createId } from '../core/ids'
import { FORMATIONS, FORMATION_POSITIONS } from '../domain/tactics'
import { getDevelopmentClubs, startPrototype, humanTeam, moveTeamPlayer, setPrototypeTactics, setStarter, setBench, selectionValidation, advancePrototype, playPrototypeMatch } from './prototypeSession'
import { captureTeamSetup, previewTeamSetup, hasTeamSetupChanges, commitTeamSetup } from './teamSetup'
import { calculateTeamStrength } from '../simulation/strength'
import { PlayerPanel } from '../ui/components/PlayerPanel'
import { PlayerPiece } from '../ui/components/PlayerPiece'
import { PlayerAvatar } from '../ui/components/PlayerAvatar'
import { avatarAppearance } from '../ui/components/avatarAppearance'
import { ClubCrest } from '../ui/components/ClubMark'
import { TacticsControls } from '../ui/components/TacticsControls'
import { PITCH_LAYOUTS } from '../ui/components/pitchLayout'
import { readableSelectionMessage } from '../ui/components/presentation'

function setup() { return startPrototype(getDevelopmentClubs()[0].id) }
function changes(session: ReturnType<typeof setup>) {
  const reserve = humanTeam(session).players.find(player => player.primaryPosition === 'ST' && humanTeam(session).lineup.bench.includes(player.id))!
  const moved = moveTeamPlayer(session, reserve.id, 10)
  return captureTeamSetup(setPrototypeTactics(moved, { formation: '4-1-2-1-2', mentality: 'ATTACKING', style: 'COUNTER_ATTACK' }))
}

describe('Polimento de equipe — rascunho e confirmação', () => {
  it('marca edições reais, mantém sessão salva intacta e limpa dirty ao desfazer a troca', () => {
    const saved = setup()
    const initial = captureTeamSetup(saved)
    expect(hasTeamSetupChanges(saved, initial)).toBe(false)
    const old = humanTeam(saved).lineup.positions[10].playerId
    const reserve = humanTeam(saved).players.find(player => player.primaryPosition === 'ST' && humanTeam(saved).lineup.bench.includes(player.id))!
    const moved = moveTeamPlayer(saved, reserve.id, 10)
    expect(hasTeamSetupChanges(saved, captureTeamSetup(moved))).toBe(true)
    const undone = moveTeamPlayer(moved, old, 10)
    expect(hasTeamSetupChanges(saved, captureTeamSetup(undone))).toBe(false)
    expect(captureTeamSetup(saved)).toEqual(initial)
    expect(previewTeamSetup(saved, changes(saved)).game).toBe(saved.game)
  })
  it('confirma conjuntamente titulares, banco e táticas e o motor recebe somente a configuração salva', () => {
    const saved = setup()
    const draft = changes(saved)
    expect(humanTeam(saved).tactics.formation).toBe('4-3-3')
    const result = commitTeamSetup(saved, draft)
    if (!result.ok) throw new Error('Rascunho válido rejeitado')
    expect(humanTeam(result.session).lineup).toEqual(draft.lineup)
    expect(humanTeam(result.session).tactics).toEqual(draft.tactics)
    expect(result.session.game).toBe(saved.game)
    const matchDay = advancePrototype(advancePrototype(result.session))
    const played = playPrototypeMatch(matchDay)
    const actual = played.pendingMatch!.result.debug.home
    expect(actual).toEqual(calculateTeamStrength(humanTeam(matchDay), actual.modifiers.home))
    expect(actual.players.map(player => player.playerId).sort()).toEqual([...draft.lineup.startingPlayers].sort())
    expect(() => commitTeamSetup(played, draft)).toThrow('Continue')
  })
  it('descarta todas as edições por projeção da sessão confirmada, sem reconstituir a seleção inicial', () => {
    const first = setup()
    const result = commitTeamSetup(first, changes(first))
    if (!result.ok) throw new Error('Primeiro commit rejeitado')
    const saved = result.session
    const edited = setBench(setPrototypeTactics(saved, { formation: '3-4-3', mentality: 'DEFENSIVE', style: 'PRESSING' }), [])
    expect(hasTeamSetupChanges(saved, captureTeamSetup(edited))).toBe(true)
    const restored = previewTeamSetup(saved, undefined)
    expect(restored).toBe(saved)
    expect(captureTeamSetup(restored)).toEqual(changes(first))
    expect(hasTeamSetupChanges(saved, undefined)).toBe(false)
  })
  it('rejeita erros estruturais/contextuais ao salvar sem entregar estado parcial', () => {
    const saved = setup()
    const initial = captureTeamSetup(saved)
    const incomplete = captureTeamSetup(setStarter(saved, 0, undefined))
    const duplicate = captureTeamSetup(setBench(saved, [humanTeam(saved).lineup.startingPlayers[0]]))
    const unavailable = { ...saved, teams: saved.teams.map(team => team.club.id === saved.game.humanClubId ? { ...team, players: team.players.map(player => player.id === team.lineup.startingPlayers[0] ? { ...player, status: 'INJURED' as const } : player) } : team) }
    for (const [session, draft] of [[saved, incomplete], [saved, duplicate], [unavailable, initial]] as const) {
      const result = commitTeamSetup(session, draft)
      expect(result.ok).toBe(false)
      expect(result.validation.errors.length).toBeGreaterThan(0)
      expect(result).not.toHaveProperty('session')
    }
    expect(() => previewTeamSetup(saved, { ...initial, clubId: createId('Club', 'another-club') })).toThrow('outro clube')
    expect(captureTeamSetup(saved)).toEqual(initial)
  })
  it('permite salvar improvisação com alertas e mantém o aviso separado dos erros', () => {
    const saved = setup()
    const edited = moveTeamPlayer(saved, humanTeam(saved).lineup.startingPlayers[2], 10)
    const result = commitTeamSetup(saved, captureTeamSetup(edited))
    expect(result.ok).toBe(true)
    expect(result.validation.errors).toEqual([])
    expect(result.validation.warnings).toHaveLength(2)
  })
  it('todas as novas formações produzem slots válidos, layout correspondente e força calculável', () => {
    let session = setup()
    const ids = new Set(humanTeam(session).lineup.startingPlayers)
    for (const formation of FORMATIONS) {
      session = setPrototypeTactics(session, { formation, mentality: 'BALANCED', style: 'BALANCED' })
      expect(selectionValidation(session).valid).toBe(true)
      expect(new Set(humanTeam(session).lineup.startingPlayers)).toEqual(ids)
      expect(PITCH_LAYOUTS[formation]).toHaveLength(FORMATION_POSITIONS[formation].length)
      expect(new Set(PITCH_LAYOUTS[formation].map(point => point.join(','))).size).toBe(11)
      expect(Number.isFinite(calculateTeamStrength(humanTeam(session), 1).overall)).toBe(true)
    }
    const cards = renderToStaticMarkup(<TacticsControls tactics={humanTeam(session).tactics} locked={false} onChange={() => {}} />)
    expect(cards.match(/class="formation-card"/g)).toHaveLength(15)
  })
  it('perfil e peças traduzem principal/secundárias e abreviações sem modificar os códigos internos', () => {
    const session = setup()
    const striker = humanTeam(session).players.find(player => player.primaryPosition === 'ST')!
    const panel = renderToStaticMarkup(<PlayerPanel player={striker} date="2026-04-01" onClose={() => {}} />)
    expect(panel).toContain('Posição principal')
    expect(panel).toContain('Centroavante')
    expect(panel).toContain('Posições secundárias')
    expect(panel).toContain('Ponta direita')
    expect(panel).toContain('Ponta esquerda')
    const keeper = humanTeam(session).players[0]
    expect(renderToStaticMarkup(<PlayerPanel player={keeper} date="2026-04-01" onClose={() => {}} />)).toContain('Sem posições secundárias')
    expect(renderToStaticMarkup(<PlayerPiece player={striker} position="ST" onSelect={() => {}} />)).toContain('>ATA</span>')
    expect(readableSelectionMessage('Jogador escalado em RB, posição natural ST. INJURED')).toBe('Jogador escalado em Lateral-direito, posição natural Centroavante. Lesionado')
    expect(striker.primaryPosition).toBe('ST')
    expect(striker.secondaryPositions).toEqual(['RW', 'LW'])
  })
  it('o mesmo ID gera o mesmo rosto em banco e perfil sem depender do nome ou da sessão', () => {
    const player = humanTeam(setup()).players[0]
    expect(avatarAppearance(player.id)).toEqual(avatarAppearance(player.id))
    expect(avatarAppearance(player.id)).not.toEqual(avatarAppearance('dev-player-1-2'))
    const small = renderToStaticMarkup(<PlayerAvatar playerId={player.id} name={player.displayName} />)
    const large = renderToStaticMarkup(<PlayerAvatar playerId={player.id} name="Nome atualizado" large />)
    expect(small.slice(small.indexOf('<rect'))).toEqual(large.slice(large.indexOf('<rect')))
    expect(small).not.toContain('<image')
  })
  it('clube sem asset e jogador sem ID possuem fallback local sem imagem quebrada', () => {
    const club = { ...getDevelopmentClubs()[0], id: createId('Club', 'without-asset') }
    const crest = renderToStaticMarkup(<ClubCrest club={club} />)
    expect(crest).toContain('Escudo alternativo')
    expect(crest).toContain(club.shortName)
    expect(crest).not.toContain('<img')
    const avatar = renderToStaticMarkup(<PlayerAvatar />)
    expect(avatar).toContain('Avatar genérico de jogador')
    expect(avatar).not.toContain('<image')
  })
})
