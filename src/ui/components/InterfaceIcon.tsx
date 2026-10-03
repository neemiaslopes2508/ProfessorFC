export type IconName = 'dashboard' | 'team' | 'squad' | 'calendar' | 'table' | 'arrow' | 'trophy' | 'points' | 'round' | 'play' | 'market' | 'finance' | 'stadium' | 'facilities'

const paths: Record<IconName, string> = {
  facilities: 'M3 21V10l6-4 6 4v11M15 21V3h6v18M7 13h4M7 17h4M17 7h2M17 11h2M17 15h2M2 21h20',
  stadium: 'M3 8l9-4 9 4v12H3zM7 10v6M17 10v6M3 13h18M8 20v-4h8v4',
  finance: 'M3 6h18v14H3zM3 9h18M16 12h5v5h-5zM17 14h1M5 6V3h13v3',
  market: 'M3 7h17M16 3l4 4-4 4M21 17H4M8 13l-4 4 4 4',
  dashboard: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
  team: 'M3 4h18v16H3zM12 4v16M3 12h18M3 8h4v8H3M21 8h-4v8h4',
  squad: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M2 21v-3a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v3M17 4a4 4 0 0 1 0 8M18 14a5 5 0 0 1 4 5v2',
  calendar: 'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 17h2',
  table: 'M3 5h18v15H3zM3 10h18M3 15h18M9 5v15M15 5v15',
  arrow: 'M4 12h16M14 6l6 6-6 6',
  trophy: 'M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 14v6M7 21h10',
  points: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  round: 'M20 8a9 9 0 1 0 1 9M20 3v5h-5M12 7v5l3 3',
  play: 'm8 4 12 8-12 8z',
}
export function InterfaceIcon({ name }: { name: IconName }) {
  return <svg className="interface-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
