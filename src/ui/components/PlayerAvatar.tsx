import { avatarAppearance } from './avatarAppearance'

export function PlayerAvatar({ playerId, name = 'Jogador', large = false }: { playerId?: string; name?: string; large?: boolean }) {
  const look = playerId ? avatarAppearance(playerId) : undefined
  return <svg className={`player-avatar ${large ? 'large-avatar' : ''}`} viewBox="0 0 64 76" role="img" aria-label={look ? `Retrato fictício de ${name}` : 'Avatar genérico de jogador'}>
    <rect width="64" height="76" rx="9" fill="#25333c" />
    {look ? <><path d="M4 76V66Q9 55 26 54H38Q55 55 60 66V76" fill={look.shirt} /><path d="M26 47H38V57Q32 63 26 57" fill={look.skin} /><ellipse cx="16" cy="34" rx="4" ry="6" fill={look.skin} /><ellipse cx="48" cy="34" rx="4" ry="6" fill={look.skin} /><path d="M17 23Q17 10 32 10Q47 10 47 23V37Q47 53 32 55Q17 53 17 37Z" fill={look.skin} />
      <path d={['M16 28V20Q17 7 33 8Q48 8 49 21V28L43 20Q29 23 22 18L21 29Z', 'M16 27V21Q17 9 32 9Q48 9 48 23L43 28V20L21 20V29Z', 'M17 22Q18 12 32 12Q44 12 47 22L44 19Q31 17 20 21Z', 'M16 29V20Q16 10 30 9L42 5L49 17L47 29L42 21L24 17L21 29Z'][look.hairstyle]} fill={look.hair} />
      <path d={`M23 ${look.brow}h6 M36 ${look.brow}h6`} stroke={look.hair} strokeWidth="2" strokeLinecap="round" /><circle cx="26" cy="33" r="1.5" fill="#29272c" /><circle cx="39" cy="33" r="1.5" fill="#29272c" /><path d="M32 33l-2 7h4 M27 46q5 3 10 0" stroke="#805542" strokeWidth="1.4" fill="none" strokeLinecap="round" />{look.beard && <path d="M19 40Q19 52 32 54Q45 52 45 40L39 47H25Z" fill={look.hair} opacity=".75" />}<path d="M20 57l12 10 12-10" stroke="#dfe9e4" fill="none" strokeWidth="2" /></> : <><circle cx="32" cy="27" r="13" fill="#a1b1bd" /><path d="M9 76V64Q12 46 32 46Q52 46 55 64V76" fill="#a1b1bd" /></>}
  </svg>
}
