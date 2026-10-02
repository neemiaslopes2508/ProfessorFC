import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { ClubIdentity } from './clubIdentity'
import { LiveMatchPitch } from './LiveMatchPitch'
import type { LivePitchProps } from './LiveMatchPitch'
import { PixelPitchScenery } from './PixelPitchArt'

/** Ambientação do pré-jogo ou apresentação 2D de snapshots já processados. */
export function MatchPitch({ identity, stadiumName, homeLabel, awayLabel, scoreLabel = 'VS', live }: { identity: ClubIdentity; stadiumName: string; homeLabel: string; awayLabel: string; scoreLabel?: string; live?: LivePitchProps }) {
  const id = useId().replace(/:/g, '')
  if (live) return <LiveMatchPitch {...live} />
  return <div className="match-pitch" style={{ '--stadium-primary': identity.primaryColor, '--stadium-secondary': identity.secondaryColor } as CSSProperties}>
    <svg viewBox="-60 -60 1120 740" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>Vista estilizada de {stadiumName}, com arquibancadas, iluminação e campo</title>
      <PixelPitchScenery id={id} home={identity} />
      <text x="500" y="-22" textAnchor="middle" fill="#edf3cf" fontFamily="monospace" fontSize="16" fontWeight="700">{homeLabel} {scoreLabel} {awayLabel}</text>
    </svg>
  </div>
}
