import type { ReactNode } from 'react'
import { dateLabel } from '../components/presentation'
import { InterfaceIcon } from '../components/InterfaceIcon'

export function TopBar({ year, date, action }: { year: number; date: string; action: ReactNode }) {
  return <header className="topbar"><div className="season-clock"><span className="eyebrow">CENTRAL DE COMANDO</span><strong>Temporada {year}</strong><span className="topbar-date"><InterfaceIcon name="calendar" />{dateLabel(date)}</span></div><div className="topbar-action">{action}</div></header>
}
