import type { PlayerId } from '../core/ids'
import type { Lineup } from '../domain/tactics'

export interface MatchSubstitution {
  readonly minute: number
  readonly playerOutId: PlayerId
  readonly playerInId: PlayerId
}
export interface SubstitutionState {
  readonly limit: number
  readonly used: number
  readonly leftPlayerIds: readonly PlayerId[]
  readonly enteredPlayerIds: readonly PlayerId[]
  readonly changes: readonly MatchSubstitution[]
}
export function substitutionState(limit: number, changes: readonly MatchSubstitution[]): SubstitutionState {
  return Object.freeze({ limit, used: changes.length, changes: Object.freeze([...changes]),
    leftPlayerIds: Object.freeze(changes.map(change => change.playerOutId)),
    enteredPlayerIds: Object.freeze(changes.map(change => change.playerInId)),
  })
}

/** Comparação de seleções completas: reposicionamento de titulares não gasta substituição. */
export function planSubstitutions(current: Lineup, next: Lineup, state: SubstitutionState, minute: number): readonly MatchSubstitution[] {
  const outgoing = current.startingPlayers.filter(id => !next.startingPlayers.includes(id))
  const incoming = next.startingPlayers.filter(id => !current.startingPlayers.includes(id))
  if (incoming.length !== outgoing.length) throw new Error('A equipe precisa manter onze jogadores em campo.')
  for (const id of next.startingPlayers) {
    if (state.leftPlayerIds.includes(id)) throw new Error('Jogador já substituído não pode voltar à partida.')
  }
  for (const id of incoming) {
    if (state.enteredPlayerIds.includes(id)) throw new Error('O mesmo jogador não pode entrar duas vezes.')
    if (!current.bench.includes(id)) throw new Error('Jogador que entra precisa estar no banco disponível da partida.')
  }
  if (state.used + incoming.length > state.limit) throw new Error(`Limite de ${state.limit} substituições por equipe excedido.`)
  const availableBench = current.bench.filter(id => !incoming.includes(id))
  if (next.bench.length !== availableBench.length || next.bench.some(id => !availableBench.includes(id))) {
    throw new Error('Banco deve conter somente reservas disponíveis; jogador que saiu não volta ao banco.')
  }
  return Object.freeze(outgoing.map((playerOutId, index) => Object.freeze({ minute, playerOutId, playerInId: incoming[index] })))
}
