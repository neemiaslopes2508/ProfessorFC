import type { CSSProperties, PointerEventHandler } from 'react'
import { humanTeam, starterSlots } from '../../application/prototypeSession'
import type { PrototypeSession } from '../../application/prototypeSession'
import { FORMATION_POSITIONS } from '../../domain/tactics'
import { PITCH_LAYOUTS } from './pitchLayout'
import { PlayerPiece } from './PlayerPiece'
import { positionLabel } from './presentation'
import { clubIdentity } from './clubIdentity'

export function TacticalPitch({ session, selectedSlot, onSelect, onPointerDown, drag, locked = false, miniature = false }: { session: PrototypeSession; selectedSlot?: number; onSelect?: (slot: number) => void; onPointerDown?: PointerEventHandler<HTMLButtonElement>; drag?: { playerId: string; target?: number }; locked?: boolean; miniature?: boolean }) {
  const team = humanTeam(session)
  const slots = starterSlots(session)
  const identity = clubIdentity(team.club.id)
  return <div className={`tactical-pitch ${miniature ? 'miniature-pitch' : ''}`} style={{ '--club-primary': identity.primaryColor, '--club-secondary': identity.secondaryColor } as CSSProperties} aria-label={`Campo tático, formação ${team.tactics.formation}`}>
    <svg className="pitch-lines" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true"><rect x="3" y="3" width="94" height="124"/><path d="M3 65H97 M29 3V23H71V3 M39 3V11H61V3 M29 127V107H71V127 M39 127V119H61V127"/><ellipse cx="50" cy="65" rx="13" ry="10"/><circle cx="50" cy="65" r=".6"/><path d="M42 3V0H58V3 M42 127V130H58V127"/></svg>
    {FORMATION_POSITIONS[team.tactics.formation].map((position, index) => {
      const player = team.players.find(player => player.id === slots[index])
      const [x, y] = PITCH_LAYOUTS[team.tactics.formation][index]
      return <div className="pitch-slot" key={index} style={{ left: `${x}%`, top: `${y}%` }}>{onSelect ? <PlayerPiece player={player} position={position} number={player ? team.players.findIndex(candidate => candidate.id === player.id) + 1 : undefined} slot={index} selected={selectedSlot === index} moving={drag?.playerId === player?.id} target={drag?.target === index} dragging={!!drag} locked={locked} onSelect={() => onSelect(index)} onPointerDown={onPointerDown} /> : <div className="readonly-piece"><span className="jersey-number">{player ? team.players.findIndex(candidate => candidate.id === player.id) + 1 : '—'}</span><strong>{player?.displayName ?? 'Vazio'}</strong><small>{positionLabel(position, true)}</small></div>}</div>
    })}
  </div>
}
