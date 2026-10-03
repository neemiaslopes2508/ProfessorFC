import { currentPlayerInjury, injuryOverview } from '../../application/injuryLifecycle'
import { recentPlayerDevelopment } from '../../application/playerDevelopment'
import { useState } from 'react'
import { humanTeam, playerAge } from '../../application/prototypeSession'
import { playerOverall, querySquad, squadOverview } from '../../application/teamOverview'
import type { SquadOrder } from '../../application/teamOverview'
import type { PrototypeSession } from '../../application/prototypeSession'
import type { PlayerId } from '../../core/ids'
import { POSITIONS } from '../../domain/players'
import { money, positionLabels, positionLabel, statusLabels } from '../components/presentation'
import { PlayerPanel } from '../components/PlayerPanel'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { ContractNegotiation } from '../components/ContractNegotiation'
import { marketContract } from '../../application/transferMarket'
import { CONTRACT_TIME_CONFIG, playerContractStatus } from '../../application/contractLifecycle'
import { PayrollSummary } from '../components/PayrollSummary'
import { dateLabel, squadRoleLabels } from '../components/presentation'

export function SquadPage({ session, onList, onAction }: { session: PrototypeSession; onList?: (id: PlayerId) => void; onAction: (operation: () => PrototypeSession) => boolean }) {
  const [filter, setFilter] = useState('ALL')
  const [selected, setSelected] = useState<PlayerId>()
  const [renewing, setRenewing] = useState<PlayerId>()
  const [contractFilter, setContractFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [order, setOrder] = useState<SquadOrder>('name')
  const team = humanTeam(session)
  const player = team.players.find(player => player.id === selected)
  const overview = squadOverview(session)
  const orders: { value: SquadOrder; label: string }[] = [{ value: 'name', label: 'Nome A–Z' }, { value: 'overall', label: 'Overall ↓' }, { value: 'fitness', label: 'Condição ↓' }, { value: 'form', label: 'Forma ↓' }, { value: 'age', label: 'Idade ↑' }, { value: 'value', label: 'Valor ↓' }]
  const players = querySquad(session, search, filter, order).filter(player => contractFilter === 'ALL' || (contractFilter === 'EXPIRING' ? playerContractStatus(session, player.id) === 'EXPIRING' : !marketContract(session, player.id)))
  const expiring = team.players.filter(player => playerContractStatus(session, player.id) === 'EXPIRING').length
  const contractLabels = { ACTIVE: 'Ativo', EXPIRING: 'Terminando', EXPIRED: 'Expirado', FREE_AGENT: 'Agente livre', NO_CONTRACT: 'Não informado' }
  return <><span className="eyebrow">Seu plantel</span><h1>Elenco</h1><p className="muted">{team.club.name} · Conheça as peças do seu time.</p>
    <PayrollSummary session={session} />
    {expiring > 0 && <p className="notice">{expiring} {expiring === 1 ? "contrato termina" : "contratos terminam"} nos próximos {CONTRACT_TIME_CONFIG.expiringDays} dias.</p>}
    <label className="squad-contract-filter">Contratos<select value={contractFilter} onChange={event => setContractFilter(event.target.value)}><option value="ALL">Todos</option><option value="EXPIRING">Terminando</option><option value="NO_CONTRACT">Expirados / sem contrato</option></select></label>
    <div className="squad-metrics">{[{ label: 'Jogadores', value: overview.count }, { label: 'Idade média', value: `${overview.averageAge.toFixed(1)} anos` }, { label: 'Valor total', value: money(overview.totalValue.cents) }, { label: 'Overall médio', value: overview.averageOverall.toFixed(1) }, { label: 'Disponíveis', value: overview.available }, { label: 'Indisponíveis', value: overview.unavailable }].map(metric => <div className="panel" key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong></div>)}</div>
    <div className="position-distribution" aria-label="Distribuição do elenco por posição">{overview.positions.map(entry => <span key={entry.position} title={positionLabels[entry.position]}>{positionLabel(entry.position, true)}<strong>{entry.count}</strong></span>)}</div>
    <div className="squad-toolbar"><div><label htmlFor="squad-search">Buscar jogador</label><input id="squad-search" type="search" placeholder="Nome ou sobrenome…" value={search} onChange={event => setSearch(event.target.value)} /></div><div><label htmlFor="squad-position">Filtrar posição</label><select id="squad-position" value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">Todas as posições</option>{POSITIONS.map(position => <option key={position} value={position}>{positionLabels[position]}</option>)}</select></div><div><label htmlFor="squad-order">Ordenar por</label><select id="squad-order" value={order} onChange={event => { const chosen = orders.find(order => order.value === event.target.value); if (chosen) setOrder(chosen.value) }}>{orders.map(order => <option key={order.value} value={order.value}>{order.label}</option>)}</select></div></div>
    <div className={`squad-workspace ${player ? 'with-player' : ''}`}><div><div className="table-scroll"><table><caption className="sr-only">Elenco de {team.club.name}</caption><thead><tr>{['Jogador', 'Posição', 'OVR', 'Idade', 'Condição', 'Forma', 'Status', 'Valor', 'Contrato'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{players.map(player => <tr key={player.id} className={selected === player.id ? 'selected-row' : ''}><th scope="row"><button className="text-button squad-player-button" onClick={() => setSelected(player.id)}><PlayerAvatar playerId={player.id} name={player.displayName} /><span>{player.displayName}{session.market.listedPlayerIds.includes(player.id) && <small className="market-listed">À VENDA</small>}<small>{player.secondaryPositions.length ? `Também ${player.secondaryPositions.map(position => positionLabel(position)).join(', ')}` : positionLabels[player.primaryPosition]}</small></span></button></th><td><span className="position-tag" title={positionLabel(player.primaryPosition)}>{positionLabel(player.primaryPosition, true)}</span></td><td><strong className="rating-text">{playerOverall(player)}</strong></td><td>{playerAge(player, session.game.calendar.currentDate)}</td><td><span className="condition-value">{player.fitness}%</span><meter className="condition-meter" min="0" max="100" value={player.fitness} aria-label={`Condição de ${player.displayName}`} /></td><td>{player.form}</td><td><span className={`status-chip ${player.status === 'AVAILABLE' ? 'available' : 'unavailable'}`}>{statusLabels[player.status]}</span>{currentPlayerInjury(session, player.id) && <small>{injuryOverview(currentPlayerInjury(session, player.id)!, session.game.calendar.currentDate).label} · {injuryOverview(currentPlayerInjury(session, player.id)!, session.game.calendar.currentDate).remainingDays} dias</small>}</td><td>{money(player.marketValue.cents)}</td><td className={playerContractStatus(session, player.id) === "EXPIRING" ? "contract-expiring" : ""}><strong>{contractLabels[playerContractStatus(session, player.id)]}</strong>{marketContract(session, player.id) && <><small>{money(marketContract(session, player.id)!.salary.cents)}/mês</small><small>Até {dateLabel(marketContract(session, player.id)!.endDate)} · {squadRoleLabels[marketContract(session, player.id)!.squadRole]}</small></>}</td></tr>)}</tbody></table></div><p className="muted">{players.length} de {team.players.length} jogadores · Overall base por posição natural.</p>{!players.length && <p className="notice">Nenhum jogador corresponde à busca e ao filtro.</p>}</div>{player && <PlayerPanel development={recentPlayerDevelopment(session, player.id)} injury={currentPlayerInjury(session, player.id)} player={player} contract={marketContract(session, player.id)} date={session.game.calendar.currentDate} onClose={() => setSelected(undefined)}><button onClick={() => setRenewing(player.id)}>RENOVAR CONTRATO</button>{onList && <button onClick={() => onList(player.id)}>{session.market.listedPlayerIds.includes(player.id) ? 'RETIRAR DA VENDA' : 'COLOCAR À VENDA'}</button>}</PlayerPanel>}</div>
    {renewing && <ContractNegotiation key={renewing} session={session} playerId={renewing} onAction={onAction} onClose={() => setRenewing(undefined)} />}
  </>
}


