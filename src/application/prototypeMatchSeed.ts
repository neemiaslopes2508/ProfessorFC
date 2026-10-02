/** Entropia somente ao criar um novo jogo; a seed fica estável durante a sessão. */
export function newPrototypeCareerSeed(): number {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
}

export function prototypeMatchSeed(careerSeed: number, seasonId: string, matchId: string, homeClubId: string, awayClubId: string): number {
  let hash = 2166136261
  for (const character of JSON.stringify([careerSeed, seasonId, matchId, homeClubId, awayClubId])) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  }
  return hash
}
