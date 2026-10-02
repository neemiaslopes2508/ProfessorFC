import type { ClubId } from '../../core/ids'

export interface ClubIdentity { readonly primaryColor: string; readonly secondaryColor: string; readonly crestPath?: string }
/** Somente apresentação da fixture; não condiciona Club nem regras esportivas. */
const identities: Readonly<Record<string, ClubIdentity>> = {
  'dev-club-1': { primaryColor: '#bbf16e', secondaryColor: '#233d39', crestPath: '/crests/aurora.svg' },
  'dev-club-2': { primaryColor: '#64cae8', secondaryColor: '#223655', crestPath: '/crests/horizonte.svg' },
  'dev-club-3': { primaryColor: '#ceb0ff', secondaryColor: '#433263', crestPath: '/crests/eclipse.svg' },
  'dev-club-4': { primaryColor: '#ffbd85', secondaryColor: '#653e40', crestPath: '/crests/estrela.svg' },
  'dev-club-5': { primaryColor: '#94d8ea', secondaryColor: '#295666', crestPath: '/crests/porto.svg' },
  'dev-club-6': { primaryColor: '#efde94', secondaryColor: '#415747', crestPath: '/crests/serra.svg' },
}
const fallback: ClubIdentity = { primaryColor: '#c0cbd2', secondaryColor: '#303c46' }
export function clubIdentity(id: ClubId): ClubIdentity {
  const identity = identities[id] ?? fallback
  return identity.crestPath ? { ...identity, crestPath: `${import.meta.env.BASE_URL}${identity.crestPath.slice(1)}` } : identity
}
