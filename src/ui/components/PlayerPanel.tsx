import type { Injury } from '../../domain/players/injury'
import { injuryOverview } from '../../application/injuryLifecycle'
import type { TrainingChange } from '../../application/playerDevelopment'
import { useEffect, useRef } from 'react'
import type { Player, Position } from '../../domain/players'
import { playerAge } from '../../application/prototypeSession'
import { playerOverall, positionFit } from '../../application/teamOverview'
import { attributeLabels, dateLabel, money, positionLabel, statusLabels, squadRoleLabels } from './presentation'
import type { Contract } from '../../domain/contracts'
import type { ReactNode } from 'react'
import { PlayerAvatar } from './PlayerAvatar'

export function PlayerPanel({ player, date, position, contract, injury, development = [], onClose, children }: { player: Player; date: string; position?: Position; contract?: Contract; injury?: Injury; development?: readonly TrainingChange[]; onClose: () => void; children?: ReactNode }) {
  const medical = injury ? injuryOverview(injury, date) : undefined
  const recentChanges = Object.entries(development.reduce<Partial<Record<keyof Player['attributes'], number>>>((totals, change) => {
    totals[change.attribute] = (totals[change.attribute] ?? 0) + change.after - change.before
    return totals
  }, {})).filter((entry): entry is [keyof Player['attributes'], number] => entry[1] !== 0)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { const previous = document.activeElement; closeRef.current?.focus(); return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus() } }, [player.id])
  return <section className="panel player-panel" aria-label={`Detalhes de ${player.displayName}`} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose() } }}>
    <div className="section-heading"><span className="eyebrow">Perfil do jogador</span><button className="icon-button" ref={closeRef} aria-label="Fechar detalhes do jogador" onClick={onClose}>×</button></div>
    <div className="player-heading"><PlayerAvatar playerId={player.id} name={player.displayName} large /><div><h2>{player.displayName}</h2><p className="muted">{playerAge(player, date)} anos · {player.nationality}</p></div><strong className="overall-badge" title="Overall base calculado por posição">{playerOverall(player, position)}</strong></div>
    <div className="player-positions"><div><small>Posição principal</small><span className="position-chip primary-position">{positionLabel(player.primaryPosition)}</span></div><div><small>Posições secundárias</small>{player.secondaryPositions.length ? <div className="position-chips">{player.secondaryPositions.map(position => <span className="position-chip secondary-position" key={position}>{positionLabel(position)}</span>)}</div> : <p className="muted">Sem posições secundárias</p>}</div></div>
    {position && <p className={`fit-note ${positionFit(player, position)}`}>Em {positionLabel(position)}: {positionFit(player, position) === 'natural' ? 'posição natural' : positionFit(player, position) === 'secondary' ? 'posição secundária' : 'improvisado — permitido com alerta'}</p>}
    <div className="player-numbers"><div><small>Condição</small><strong>{player.fitness}%</strong></div><div><small>Forma</small><strong>{player.form}</strong></div><div><small>Valor de referência</small><strong>{money(player.marketValue.cents)}</strong></div></div><p className="status-line">{statusLabels[player.status]} · Overall base, sem os modificadores de condição e forma.</p>
    {medical && <div className="notice warning" aria-label="Situação médica"><h3>Departamento Médico</h3><p>Lesão: <strong>{medical.label}</strong><br />Gravidade: <strong>{{ MINOR: 'Leve', MODERATE: 'Moderada', SERIOUS: 'Grave' }[medical.severity]}</strong><br />Retorno estimado: <strong>{medical.remainingDays} dias</strong> · {dateLabel(medical.availableAt)}<br />Status: <strong>{statusLabels[player.status]}</strong></p><small>{medical.status === 'INJURED' ? 'Readaptação prevista: ' + dateLabel(medical.expectedRecoveryDate) : 'Readaptação final antes de voltar a jogar.'}</small></div>}
    <h3>Atributos</h3><div className="attribute-list">{Object.entries(player.attributes).map(([key, value]) => <div key={key}><span>{attributeLabels[key as keyof typeof attributeLabels]}</span><meter min="1" max="100" value={value} aria-label={attributeLabels[key as keyof typeof attributeLabels]} /><strong>{value}</strong></div>)}</div>
    {development.length > 0 && <div className="player-development"><h3>Evolução recente · últimos seis ciclos</h3>{recentChanges.length ? recentChanges.map(([attribute, amount]) => <p key={attribute}>{attributeLabels[attribute]} <strong>{amount > 0 ? '+' : ''}{amount}</strong></p>) : <p className="muted">Sem alteração líquida nos últimos ciclos.</p>}</div>}
    {contract && <div className="contract-profile"><h3>Contrato atual</h3><p>Contrato até: <strong>{dateLabel(contract.endDate)}</strong></p><p>{money(contract.salary.cents)}/mês · {squadRoleLabels[contract.squadRole]}</p></div>}
    {children && <div className="player-actions">{children}</div>}
  </section>
}
