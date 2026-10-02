import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Club } from '../../domain/clubs'
import type { ClubId } from '../../core/ids'
import type { PrototypeSession } from '../../application/prototypeSession'
import { clubIdentity } from './clubIdentity'

export function ClubCrest({ club, small = false }: { club?: Club; small?: boolean }) {
  const [failedSource, setFailedSource] = useState<string>()
  const identity = club && clubIdentity(club.id)
  const source = identity?.crestPath
  return <span className={`club-crest ${small ? 'small-crest' : ''}`} style={identity ? { '--club-primary': identity.primaryColor, '--club-secondary': identity.secondaryColor } as CSSProperties : undefined}>
    {source && source !== failedSource ? <img src={source} alt={`Escudo fictício de ${club!.name}`} width="64" height="72" draggable={false} onError={() => setFailedSource(source)} /> : <span className="crest-fallback" role="img" aria-label={club ? `Escudo alternativo de ${club.name}` : 'Escudo genérico'}>{club?.shortName ?? 'FC'}</span>}
  </span>
}

export function ClubMark({ session, id, small = true }: { session: PrototypeSession; id: ClubId; small?: boolean }) {
  const club = session.teams.find(team => team.club.id === id)?.club
  return <span className="club-mark"><ClubCrest club={club} small={small} /><span>{club?.name ?? 'Clube desconhecido'}</span></span>
}
