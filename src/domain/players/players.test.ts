import { describe, expect, it } from 'vitest'
import { createId } from '../../core/ids'
import { createMoneyFromCents } from '../../core/money'
import { ATTRIBUTE_NAMES, createPlayerAttributes } from './attributes'
import type { PlayerAttributes } from './attributes'
import { createPlayer } from './player'
import type { Player } from './player'
import { POSITIONS, validatePosition } from './position'
import type { Position } from './position'

function attributes(): PlayerAttributes {
  return { finishing: 50, passing: 50, technique: 50, defending: 50, pace: 50, physical: 50, stamina: 50, decision: 50 }
}

function player(): Player {
  return {
    id: createId('Player', 'test-player'), firstName: 'Atleta', lastName: '',
    displayName: 'Atleta de teste', birthDate: '2000-01-01', nationality: 'BR',
    preferredFoot: 'RIGHT', primaryPosition: 'ST', secondaryPositions: ['RW'],
    attributes: attributes(), potential: 80, form: 50, fitness: 100,
    clubId: null, marketValue: createMoneyFromCents(10000), status: 'AVAILABLE',
  }
}

describe('PlayerAttributes', () => {
  it('aceita atributos válidos e preserva os extremos', () => {
    const input = { ...attributes(), finishing: 1, decision: 100 }
    expect(createPlayerAttributes(input)).toEqual(input)
  })
  it.each(ATTRIBUTE_NAMES)('rejeita %s fora da faixa ou não inteiro', attribute => {
    for (const value of [0, 101, 50.5, NaN, Infinity]) {
      expect(() => createPlayerAttributes({ ...attributes(), [attribute]: value })).toThrow()
    }
  })
})

describe('Player e valores controlados', () => {
  it('cria jogador livre sem overall persistido', () => {
    const value = createPlayer(player())
    expect(value.clubId).toBeNull()
    expect(value).not.toHaveProperty('overall')
    expect(value.lastName).toBe('')
  })
  it('aceita jogador vinculado a um clube', () => {
    const clubId = createId('Club', 'club-test')
    expect(createPlayer({ ...player(), clubId }).clubId).toBe(clubId)
  })
  it.each(['LEFT', 'RIGHT', 'BOTH'] as const)('aceita pé %s', preferredFoot => {
    expect(createPlayer({ ...player(), preferredFoot }).preferredFoot).toBe(preferredFoot)
  })
  it.each(['AVAILABLE', 'INJURED', 'SUSPENDED', 'RECOVERING'] as const)('representa status %s sem simular lesões', status => {
    expect(createPlayer({ ...player(), status }).status).toBe(status)
  })
  it.each(POSITIONS)('aceita posição controlada %s', position => {
    expect(() => validatePosition(position)).not.toThrow()
  })
  it('rejeita posição desconhecida em runtime', () => {
    expect(() => validatePosition('FREE' as Position)).toThrow()
  })
  it.each(['potential', 'form', 'fitness'] as const)('valida escala de %s', field => {
    const min = field === 'potential' ? 1 : 0
    expect(createPlayer({ ...player(), [field]: min })[field]).toBe(min)
    expect(createPlayer({ ...player(), [field]: 100 })[field]).toBe(100)
    for (const value of [min - 1, 101, 1.5, NaN]) {
      expect(() => createPlayer({ ...player(), [field]: value })).toThrow()
    }
  })
  it('rejeita nascimento inválido', () => {
    expect(() => createPlayer({ ...player(), birthDate: '2000-02-30' })).toThrow()
  })
  it('rejeita valor de mercado negativo', () => {
    expect(() => createPlayer({ ...player(), marketValue: createMoneyFromCents(-1) })).toThrow()
  })
  it('rejeita posições secundárias duplicadas ou iguais à primária', () => {
    expect(() => createPlayer({ ...player(), secondaryPositions: ['RW', 'RW'] })).toThrow()
    expect(() => createPlayer({ ...player(), secondaryPositions: ['ST'] })).toThrow()
  })
  it('copia atributos e posições em vez de compartilhar arrays mutáveis', () => {
    const secondaryPositions: Position[] = ['RW']
    const inputAttributes = { ...attributes() }
    const value = createPlayer({ ...player(), secondaryPositions, attributes: inputAttributes })
    secondaryPositions.push('LW')
    inputAttributes.finishing = 0
    expect(value.secondaryPositions).toEqual(['RW'])
    expect(value.attributes.finishing).toBe(50)
  })
})
