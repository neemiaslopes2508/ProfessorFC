import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { ClubIdentity } from './clubIdentity'

/** Base visual estática: sem bola, atletas, relógio ou regras de simulação. */
export function MatchPitch({ identity, stadiumName, homeLabel, awayLabel, scoreLabel = 'VS' }: { identity: ClubIdentity; stadiumName: string; homeLabel: string; awayLabel: string; scoreLabel?: string }) {
  const id = useId().replace(/:/g, '')
  return <div className="match-pitch" style={{ '--stadium-primary': identity.primaryColor, '--stadium-secondary': identity.secondaryColor } as CSSProperties}>
    <svg viewBox="0 0 1000 600" role="img" aria-labelledby={`${id}-title`}>
      <title id={`${id}-title`}>Vista estilizada de {stadiumName}, com arquibancadas, iluminação e campo</title>
      <defs>
        <pattern id={`${id}-crowd`} width="15" height="12" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="1.8" fill="var(--stadium-primary)" opacity=".65" /><circle cx="11" cy="9" r="1.6" fill="#bac8cb" opacity=".4" /></pattern>
        <pattern id={`${id}-grass`} width="104" height="80" patternUnits="userSpaceOnUse"><rect width="104" height="80" fill="#244c3a" /><rect width="52" height="80" fill="#2a5943" /></pattern>
        <linearGradient id={`${id}-light`} x2="0" y2="1"><stop stopColor="#e4f8df" stopOpacity=".2" /><stop offset="1" stopColor="#e4f8df" stopOpacity="0" /></linearGradient>
      </defs>
      <rect width="1000" height="600" rx="18" fill="#111c26" />
      <path d="M65 180 L130 60 H870 L935 180 Z" fill="var(--stadium-secondary)" />
      <path d="M82 162 L140 77 H860 L918 162 Z" fill={`url(#${id}-crowd)`} />
      <path d="M58 196 H942 M66 172 H934 M93 128 H907 M112 98 H888" fill="none" stroke="#657888" strokeOpacity=".4" strokeWidth="3" />
      <path d="M55 202 H130 V510 H55 Z M870 202 H945 V510 H870 Z M130 520 H870 V572 H130 Z" fill="var(--stadium-secondary)" />
      <path d="M58 207 H126 V505 H58 Z M874 207 H942 V505 H874 Z M134 525 H866 V568 H134 Z" fill={`url(#${id}-crowd)`} />
      <rect x="372" y="90" width="256" height="64" rx="5" fill="#0d171d" stroke="var(--stadium-primary)" />
      <text x="500" y="128" textAnchor="middle" fill="#edf3f6" fontSize="18" fontWeight="700">{homeLabel} {scoreLabel} {awayLabel}</text>
      <path d="M45 205 V42 M955 205 V42" stroke="#647681" strokeWidth="6" />
      <rect x="17" y="33" width="58" height="15" rx="3" fill="#d8e7dd" /><rect x="925" y="33" width="58" height="15" rx="3" fill="#d8e7dd" />
      <path d="M18 48 L280 480 L95 480 Z M982 48 L720 480 L905 480 Z" fill={`url(#${id}-light)`} />
      <rect x="155" y="200" width="690" height="310" rx="3" fill={`url(#${id}-grass)`} />
      <g fill="none" stroke="#dfeddd" strokeWidth="2.5" opacity=".85">
        <rect x="170" y="215" width="660" height="280" /><path d="M500 215 V495" /><circle cx="500" cy="355" r="48" />
        <path d="M170 275 H270 V435 H170 M170 314 H213 V396 H170 M830 275 H730 V435 H830 M830 314 H787 V396 H830" />
        <path d="M270 326 A38 38 0 0 1 270 384 M730 326 A38 38 0 0 0 730 384" />
        <rect x="151" y="330" width="19" height="50" /><rect x="830" y="330" width="19" height="50" />
        <path d="M170 227 Q182 227 182 215 M818 215 Q818 227 830 227 M170 483 Q182 483 182 495 M818 495 Q818 483 830 483" />
      </g>
      <g fill="#dfeddd"><circle cx="500" cy="355" r="3" /><circle cx="240" cy="355" r="2.5" /><circle cx="760" cy="355" r="2.5" /></g>
      <text x="500" y="555" textAnchor="middle" fill="#edf3f6" opacity=".8" fontSize="15" letterSpacing="5">PROFESSOR FC</text>
    </svg>
  </div>
}
