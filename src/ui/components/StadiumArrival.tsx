import type { CSSProperties } from 'react'
import type { Club } from '../../domain/clubs'
import { ClubCrest } from './ClubMark'
import { clubIdentity } from './clubIdentity'
import { MATCH_DAY_TIMING } from './matchDayScenes'

export function StadiumArrival({ club, stadiumName }: { club: Club; stadiumName: string }) {
  const identity = clubIdentity(club.id)
  return <div className="stadium-arrival" style={{ '--arrival-primary': identity.primaryColor, '--arrival-secondary': identity.secondaryColor, '--arrival-duration': `${MATCH_DAY_TIMING.arrival}ms` } as CSSProperties}>
    <svg className="arrival-stadium" viewBox="0 0 1000 460" aria-hidden="true">
      <rect width="1000" height="460" fill="#111c26" />
      <path d="M90 310 V185 Q500 -40 910 185 V310 Z" fill="var(--arrival-secondary)" />
      <path d="M70 190 Q500 -60 930 190" fill="none" stroke="#6b7c85" strokeWidth="13" />
      <path d="M100 200 Q500 30 900 200 M100 245 Q500 110 900 245" fill="none" stroke="var(--arrival-primary)" strokeOpacity=".25" strokeWidth="5" />
      {Array.from({ length: 11 }, (_, i) => <rect key={i} x={165 + i * 62} y="212" width="34" height="67" fill="#e8f5df" opacity=".15" />)}
      <rect x="398" y="225" width="204" height="110" rx="5" fill="#0a1219" /><path d="M438 335 V242 H562 V335" fill="none" stroke="var(--arrival-primary)" strokeOpacity=".5" strokeWidth="3" />
      <path d="M60 320 V60 M940 320 V60" stroke="#576d79" strokeWidth="7" /><path d="M30 60 H90 M910 60 H970" stroke="#e1f2dd" strokeWidth="14" />
      <path d="M60 70 L210 320 H85 Z M940 70 L790 320 H915 Z" fill="#dff9e3" opacity=".06" />
      <path d="M0 345 H1000 V460 H0 Z" fill="#1d2931" /><path d="M0 420 H1000" stroke="#a3ac9b" strokeWidth="2" strokeDasharray="35 20" opacity=".35" />
    </svg>
    <div className="arrival-venue"><span className="eyebrow">CHEGADA AO ESTÁDIO</span><strong>{stadiumName}</strong></div>
    <div className="arrival-bus" aria-label={`Ônibus de ${club.name} chegando ao estádio`}>
      <svg viewBox="0 0 430 160" aria-hidden="true"><path d="M15 20 Q15 8 32 8 H360 Q404 8 414 40 L425 102 V130 H12 Z" fill="var(--arrival-primary)" /><path d="M24 26 H344 V74 H24 Z M357 25 H386 L405 74 H357 Z" fill="#172e3c" /><path d="M80 26 V74 M145 26 V74 M210 26 V74 M275 26 V74" stroke="var(--arrival-primary)" strokeWidth="4" /><path d="M13 105 H424 V130 H13 Z" fill="var(--arrival-secondary)" /><circle cx="85" cy="131" r="23" fill="#10171e" /><circle cx="85" cy="131" r="12" fill="#87949b" /><circle cx="352" cy="131" r="23" fill="#10171e" /><circle cx="352" cy="131" r="12" fill="#87949b" /><rect x="410" y="84" width="12" height="11" rx="2" fill="#fff5c7" /></svg>
      <div className="arrival-bus-brand"><ClubCrest small club={club} /><strong>{club.shortName}</strong></div>
    </div>
    <span className="arrival-flash arrival-flash-one" aria-hidden="true" /><span className="arrival-flash arrival-flash-two" aria-hidden="true" />
    <div className="arrival-club"><ClubCrest small club={club} /><span>{club.name}</span></div>
  </div>
}
