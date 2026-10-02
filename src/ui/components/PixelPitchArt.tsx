import type { ClubIdentity } from './clubIdentity'
import { avatarAppearance } from './avatarAppearance'

/** Um sprite reutilizável; identidade visual não consome aleatoriedade da partida. */
export function PixelFootballer({ id, kit, away = false, keeper = false }: { id: string; kit: ClubIdentity; away?: boolean; keeper?: boolean }) {
  const look = avatarAppearance(id)
  const shirt = keeper ? (away ? '#ef805e' : '#67d5d2') : away ? kit.secondaryColor : kit.primaryColor
  const trim = keeper ? '#fff0cc' : away ? kit.primaryColor : kit.secondaryColor
  return <g className="pixel-footballer" shapeRendering="crispEdges" transform="translate(-16 -32) scale(2)">
    <path fill="#081719" d="M5 0h6v1h2v5h-1v2h2v1h1v6h-2v6h-5v-2H6v2H2v-6H1V9h2V8h1V6H3V2h2z" />
    <path fill={look.skin} d="M5 2h6v5H5zM2 10h2v4H2zM12 10h2v4h-2zM4 16h3v3H4zM9 16h3v3H9z" />
    <path fill={look.hair} d={look.hairstyle % 2 ? 'M4 1h8v3H9V2H5v3H4z' : 'M4 1h8v2H6v2H4z'} />
    <path fill="#182528" d="M9 4h1v1H9zM5 19h3v2H3v-1h2zM10 19h3v2H9v-1h1z" />
    <path fill={shirt} d="M4 8h8v7H4zM2 9h2v2H2zM12 9h2v2h-2z" />
    <path fill={trim} d="M6 8h4v1H6zM4 9h1v5H4zM4 15h8v2H4z" />
    {away && !keeper && <path fill="#eef2df" d="M2 9h2v1H2zM12 9h2v1h-2zM4 17h3v2H4zM9 17h3v2H9z" />}
    <path fill="#ffffff" opacity=".8" d="M9 10h2v2H9z" />
    {keeper && <path fill="#fff0cc" d="M1 12h3v3H1zM12 12h3v3h-3z" />}
  </g>
}

export function PixelBall() {
  return <g shapeRendering="crispEdges"><path fill="#091b20" opacity=".5" d="M-7 5H7v4H-7z" /><path fill="#142525" d="M-4-8H4v2h3v3h2v6H7v3H4v2h-8V6h-3V3h-2v-6h2v-3h3z" /><path fill="#faf7de" d="M-4-6H4v2h3v7H4v3h-8V3h-3v-7h3z" /><path fill="#243d40" d="M-2-2h4v4h-4zM-4-6h3v2h-3zM4 1h3v2H4zM-3 4h3v2h-3z" /></g>
}

/** Patterns de torcida/gramado evitam centenas de personagens no DOM. */
export function PixelPitchScenery({ id, home, away = home }: { id: string; home: ClubIdentity; away?: ClubIdentity }) {
  return <g shapeRendering="crispEdges" aria-hidden="true">
    <defs>
      <pattern id={`${id}-pixel-grass`} width="120" height="48" patternUnits="userSpaceOnUse"><rect width="120" height="48" fill="#47813b" /><rect width="60" height="48" fill="#528f40" /><path d="M8 8h3v2H8zM43 28h3v2h-3zM80 16h2v3h-2zM103 39h3v2h-3z" fill="#a3b750" opacity=".24" /></pattern>
      <pattern id={`${id}-fans`} width="32" height="24" patternUnits="userSpaceOnUse"><rect width="32" height="24" fill="#21333b" /><path d="M2 7h10v10H2zM18 12h10v9H18z" fill={home.primaryColor} /><path d="M4 3h6v5H4zM20 8h6v5h-6z" fill="#d9aa7a" /><path d="M3 17h8v4H3zM19 20h8v3h-8zM3 2h8v2H3z" fill="#101f29" /><path d="M18 13h10v5H18z" fill={away.primaryColor} /><path d="M0 23h32" stroke="#64716a" /></pattern>
      <pattern id={`${id}-net`} width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0h8v8" fill="none" stroke="#d2ded0" strokeWidth="1" /></pattern>
    </defs>
    <rect x="-60" y="-60" width="1120" height="740" fill="#102329" />
    <path d="M-40-42H1040V40H-40zM-40 580H1040v82H-40zM-40 40H42v540H-40zM958 40h82v540h-82z" fill={`url(#${id}-fans)`} />
    <path d="M-40-8H1040M-40 18H1040M-40 608H1040M-40 638H1040M-14 40v540M12 40v540M986 40v540M1014 40v540" stroke="#08151e" strokeWidth="5" fill="none" />
    <rect x="42" y="40" width="916" height="540" fill="#a28b56" />
    <rect x="58" y="54" width="884" height="512" fill="#324c34" />
    <rect x="70" y="60" width="860" height="500" fill={`url(#${id}-pixel-grass)`} />
    <g fill="none" stroke="#e5edbf" strokeWidth="3"><rect x="80" y="70" width="840" height="480" /><path d="M500 70v480M80 188h135v244H80M920 188H785v244h135M80 255h52v110H80M920 255h-52v110h52" /><circle cx="500" cy="310" r="64" /><path d="M215 270a50 50 0 0 1 0 80M785 270a50 50 0 0 0 0 80" /></g>
    <g fill="#e5edbf"><rect x="497" y="307" width="6" height="6" /><rect x="176" y="308" width="4" height="4" /><rect x="820" y="308" width="4" height="4" /></g>
    <g stroke="#eef1d5" strokeWidth="3"><rect x="58" y="273" width="22" height="74" fill={`url(#${id}-net)`} /><rect x="920" y="273" width="22" height="74" fill={`url(#${id}-net)`} /></g>
    {[80, 920].flatMap(x => [70, 550].map(y => <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M0-19V0" stroke="#e8eccd" strokeWidth="2" /><path d="M0-19h12v8H0z" fill={x === 80 ? home.primaryColor : away.primaryColor} /></g>))}
    {[210, 600].map((x, i) => <g key={x} transform={`translate(${x} 566)`}><rect width="150" height="30" fill="#162a33" stroke="#637c82" strokeWidth="4" /><path d="M4 4h142v7H4z" fill={i ? away.secondaryColor : home.secondaryColor} /><path d="M12 16h126v8H12z" fill={i ? away.primaryColor : home.primaryColor} /><path d="M37 12v16M75 12v16M113 12v16" stroke="#11222b" strokeWidth="3" /><g transform="translate(170 10)"><PixelFootballer id={`coach-${i}`} kit={i ? away : home} away={!!i} /></g></g>)}
    {[0, 940].map(x => <g key={x} transform={`translate(${x} -35)`}><path d="M0 0h50v24H0z" fill="#152c39" stroke="#738585" strokeWidth="3" /><path d="M6 5h8v6H6zM20 5h8v6h-8zM34 5h8v6h-8zM6 14h8v6H6zM20 14h8v6h-8zM34 14h8v6h-8z" fill="#ffe9a5" /><path d="M23 25v20" stroke="#9ba79b" strokeWidth="5" /></g>)}
    <g fill="#102c37" stroke="#adba79" strokeWidth="2"><rect x="180" y="27" width="240" height="24" /><rect x="580" y="27" width="240" height="24" /></g>
    <g fill="#e8edc7" fontFamily="monospace" fontWeight="bold" fontSize="14" textAnchor="middle"><text x="300" y="44">PROFESSOR FC</text><text x="700" y="44">MAIS QUE UM TIME</text></g>
    <g className="pixel-supporter-flags"><path d="M130-22h62v34h-62z" fill={home.primaryColor} /><path d="M808-22h62v34h-62z" fill={away.primaryColor} /><path d="M140-16h8v23h-8zM818-16h8v23h-8z" fill="#f1f3d3" /></g>
  </g>
}
