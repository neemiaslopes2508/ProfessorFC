import { financialHealth } from '../../application/financialHealth'
import { useState } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { humanTeam, playerAge } from '../../application/prototypeSession'
import { playerOverall } from '../../application/teamOverview'
import { completeTransfer, listTransferPlayer, queryTransferMarket, refreshTransferMarket, respondTransfer, sendTransferOffer } from '../../application/transferMarket'
import { ContractNegotiation } from '../components/ContractNegotiation'
import { PayrollSummary } from '../components/PayrollSummary'
import type { MarketFilters } from '../../application/transferMarket'
import type { TransferNegotiation } from '../../transfers/types'
import type { PlayerId } from '../../core/ids'
import { POSITIONS } from '../../domain/players'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { PlayerPanel } from '../components/PlayerPanel'
import { CurrencyField } from '../components/CurrencyField'
import { formatCurrencyInputBRL as feeInput, parseCurrencyBRL as feeCents } from '../components/currency'
import { money, dateLabel, positionLabel, positionLabels } from '../components/presentation'

type Action = (operation: () => PrototypeSession) => boolean
const statusLabels = { PENDING: 'Aguardando resposta', CLUB_ACCEPTED: 'Clube aceitou', REJECTED: 'Rejeitada', COUNTERED: 'Contraproposta', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' }

function NegotiationCard({ item, session, onAction, onContract }: { item: TransferNegotiation; session: PrototypeSession; onAction: Action; onContract: () => void }) {
  const [amount, setAmount] = useState(feeInput(item.counterFee?.cents ?? item.offeredFee.cents))
  const [editing, setEditing] = useState(false)
  const player = session.teams.flatMap(team => team.players).find(player => player.id === item.playerId)
  const buying = session.teams.find(team => team.club.id === item.buyingClubId)?.club
  const selling = session.teams.find(team => team.club.id === item.sellingClubId)?.club
  const received = item.sellingClubId === session.game.humanClubId
  const active = !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(item.status)
  const response = {
    PENDING: 'Proposta recebida. Escolha aceitar, rejeitar ou negociar o valor.',
    CLUB_ACCEPTED: received ? 'Clube comprador e jogador acertaram os termos. Confirme a venda.' : 'Clube aceitou. Negocie salário, duração e papel com o jogador.',
    COUNTERED: `${selling?.name} pede ${money(item.counterFee?.cents ?? item.offeredFee.cents)}.`,
    REJECTED: received ? 'Proposta recusada. Negociação encerrada sem transferência.' : 'Proposta recusada. Você pode enviar uma nova oferta.',
    COMPLETED: 'Transferência concluída e elencos atualizados.',
    CANCELLED: 'Negociação encerrada sem transferência.',
  }[item.status]
  return <article className="panel negotiation-card">
    <div className="negotiation-overview">
      <div className="market-person"><PlayerAvatar playerId={item.playerId} name={player?.displayName ?? 'Jogador'} /><div><strong>{player?.displayName ?? 'Jogador'}</strong>{player && <small><span className="position-chip">{positionLabel(player.primaryPosition, true)}</span> · {playerAge(player, session.game.calendar.currentDate)} anos · OVR {playerOverall(player)}</small>}</div></div>
      <div className="negotiation-route"><small>Origem → destino</small><span>{selling?.name}</span><span className="muted">→ {buying?.name}</span></div>
      <div className="negotiation-fee"><small>Valor da proposta</small><strong>{money(item.offeredFee.cents)}</strong><span className="negotiation-direction">{received ? '↙ Recebida' : '↗ Enviada'}</span></div>
      <span className={`pill negotiation-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span>
    </div>
    <div className="negotiation-footer"><p>{response}</p><div className="negotiation-actions">
    {item.status === 'CLUB_ACCEPTED' && (received ? <button className="primary" disabled={!!session.liveMatch || !!session.pendingMatch} onClick={() => onAction(() => completeTransfer(session, item.negotiationId))}>CONFIRMAR VENDA</button> : <button className="primary" onClick={onContract}>NEGOCIAR CONTRATO</button>)}
    {((received && item.status === 'PENDING') || (!received && item.status === 'COUNTERED')) && <div className="actions"><button className="primary" onClick={() => onAction(() => respondTransfer(session, item.negotiationId, 'accept'))}>{received ? 'ACEITAR PROPOSTA' : 'ACEITAR CONTRAPROPOSTA'}</button><button onClick={() => onAction(() => respondTransfer(session, item.negotiationId, 'reject'))}>REJEITAR</button></div>}
    {((received && item.status === 'PENDING') || (!received && ['COUNTERED', 'REJECTED'].includes(item.status))) && <button aria-expanded={editing} onClick={() => setEditing(!editing)}>{received ? 'CONTRAPROPOR' : 'NOVA PROPOSTA'}</button>}
    {active && <button className="text-button" onClick={() => onAction(() => respondTransfer(session, item.negotiationId, 'cancel'))}>DESISTIR</button>}</div></div>
    {editing && ((received && item.status === 'PENDING') || (!received && ['COUNTERED', 'REJECTED'].includes(item.status))) && <form className="market-offer negotiation-edit" onSubmit={event => { event.preventDefault(); if (onAction(() => received ? respondTransfer(session, item.negotiationId, 'counter', feeCents(amount)) : sendTransferOffer(session, item.playerId, feeCents(amount), item.negotiationId))) setEditing(false) }}><CurrencyField label="Novo valor da negociação" required value={amount} onChange={setAmount} /><button className="primary" type="submit">ENVIAR VALOR</button></form>}
  </article>
}

export function MarketPage({ session, onAction }: { session: PrototypeSession; onAction: Action }) {
  const [filters, setFilters] = useState<MarketFilters>({ name: '', position: 'ALL', club: 'ALL', order: 'overall' })
  const [selected, setSelected] = useState<PlayerId>()
  const [amount, setAmount] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [group, setGroup] = useState<'received' | 'sent' | 'completed'>('received')
  const [message, setMessage] = useState('')
  const [contractTarget, setContractTarget] = useState<{ playerId: PlayerId; negotiationId?: string }>()
  const rows = queryTransferMarket(session, filters)
  const selectedRow = queryTransferMarket(session, { name: '', position: 'ALL', club: 'ALL', order: 'name' }).find(row => row.player.id === selected)
  const human = humanTeam(session)
  const health = financialHealth(session, human.club.id)
  const negotiations = session.market.negotiations.filter(item => group === 'completed' ? item.status === 'COMPLETED' : item.status !== 'COMPLETED' && (group === 'received' ? item.sellingClubId === human.club.id : item.buyingClubId === human.club.id))
  const act: Action = operation => { const success = onAction(operation); if (success) setMessage('Mercado atualizado. Confira a resposta e o orçamento.'); return success }
  function numeric(key: 'minAge' | 'maxAge' | 'minOverall', value: string) { setFilters(current => ({ ...current, [key]: value === '' ? undefined : Number(value) })) }
  function updateMaxValue(value: string) {
    setMaxValue(value)
    try { const cents = value.trim() ? feeCents(value) : undefined; setFilters(current => ({ ...current, maxValueCents: cents })) } catch { /* Entrada incompleta mantém o último filtro válido durante a digitação. */ }
  }
  const tabs = [
    { id: 'received', label: 'Recebidas', empty: 'Nenhuma proposta recebida no momento.', hint: 'Coloque um jogador à venda e use Atualizar mercado para solicitar propostas.' },
    { id: 'sent', label: 'Enviadas', empty: 'Nenhuma negociação enviada no momento.', hint: 'Encontre um reforço, abra seu perfil e envie uma proposta.' },
    { id: 'completed', label: 'Concluídas', empty: 'Suas transferências concluídas aparecerão aqui.', hint: 'Depois de uma proposta aceita, confirme a transferência para finalizar o negócio.' },
  ] as const
  const emptyTab = tabs.find(tab => tab.id === group)!
  return <div className="market-page"><span className="eyebrow">Central de negócios · Base fictícia</span><h1>Mercado</h1>
    <div className="panel market-summary"><div><small>Orçamento disponível real</small><strong>{money(health.availableTransferBudget)}</strong><small>Orçamento aprovado: {money(health.approvedTransferBudget)}</small><span>{human.club.name}</span></div><div><small>À venda</small><strong>{session.market.listedPlayerIds.length}</strong><span>{session.market.history.length} transferências concluídas</span></div><button className="primary" onClick={() => act(() => refreshTransferMarket(session))}>ATUALIZAR MERCADO</button></div>
    <PayrollSummary session={session} />
    {health.alerts.length > 0 && <p className="notice warning">{health.alerts.join(' ')}</p>}
    <p className="muted">Atualizar mercado solicita propostas por seus jogadores listados. Contratos e avaliações são simplificados de desenvolvimento.</p>
    {(session.liveMatch || session.pendingMatch) && <p className="notice">Conclua e confirme a partida para finalizar transferências.</p>}
    {message && <p role="status" className="notice">{message}</p>}
    <section className="panel"><h2>Encontrar reforços</h2><div className="market-filters">
      <label>Buscar jogador<input type="search" value={filters.name} onChange={event => setFilters({ ...filters, name: event.target.value })} placeholder="Nome ou sobrenome…" /></label>
      <label>Posição<select value={filters.position} onChange={event => setFilters({ ...filters, position: event.target.value })}><option value="ALL">Todas</option>{POSITIONS.map(position => <option key={position} value={position}>{positionLabels[position]}</option>)}</select></label>
      <label>Clube<select value={filters.club} onChange={event => setFilters({ ...filters, club: event.target.value })}><option value="ALL">Todos</option><option value="FREE_AGENT">Agentes livres</option>{session.teams.map(team => <option key={team.club.id} value={team.club.id}>{team.club.name}</option>)}</select></label>
      <label>Idade mínima<input type="number" min="0" value={filters.minAge ?? ''} onChange={event => numeric('minAge', event.target.value)} /></label>
      <label>Idade máxima<input type="number" min="0" value={filters.maxAge ?? ''} onChange={event => numeric('maxAge', event.target.value)} /></label>
      <label>Overall mínimo<input type="number" min="1" max="100" value={filters.minOverall ?? ''} onChange={event => numeric('minOverall', event.target.value)} /></label>
      <CurrencyField label="Valor máximo" value={maxValue} onChange={updateMaxValue} />
      <label>Ordenação<select value={filters.order} onChange={event => setFilters({ ...filters, order: event.target.value as MarketFilters['order'] })}><option value="overall">Overall ↓</option><option value="age">Idade ↑</option><option value="value">Valor ↑</option><option value="name">Nome A–Z</option></select></label>
    </div></section>
    <div className={`squad-workspace ${selectedRow ? 'with-player' : ''}`}><section className="panel"><div className="section-heading"><h2>Jogadores disponíveis para análise</h2><span className="pill">{rows.length} jogadores</span></div><div className="market-player-grid">{rows.map(row => <button key={row.player.id} className={`market-player-card ${selected === row.player.id ? 'selected-row' : ''}`} onClick={() => { setSelected(row.player.id); setAmount(feeInput(row.player.marketValue.cents)) }}><PlayerAvatar playerId={row.player.id} name={row.player.displayName} /><div><strong>{row.player.displayName}</strong><small>{row.club?.name ?? 'Agente livre'}</small><span>{positionLabel(row.player.primaryPosition, true)} · {row.age} anos · OVR {row.overall}</span><strong className="market-value">{money(row.player.marketValue.cents)}</strong><small>{row.contract ? `Contrato até ${dateLabel(row.contract.endDate)}` : !row.club ? 'Sem contrato ativo · Sem taxa de transferência' : 'Contrato não informado'}{row.listed ? ' · À VENDA' : ''}</small></div></button>)}</div>{!rows.length && <p className="muted">Nenhum jogador corresponde aos filtros.</p>}</section>
      {selectedRow && <PlayerPanel player={selectedRow.player} contract={selectedRow.contract} date={session.game.calendar.currentDate} onClose={() => setSelected(undefined)}><p>{selectedRow.club?.name ?? 'Agente livre · Sem taxa de transferência'}</p><p className="muted">{selectedRow.contract ? `Contrato até ${dateLabel(selectedRow.contract.endDate)} · Salário mensal ${money(selectedRow.contract.salary.cents)}` : 'Contrato atual não informado na base fictícia.'}</p>{!selectedRow.club ? <button className="primary" onClick={() => setContractTarget({ playerId: selectedRow.player.id })}>NEGOCIAR CONTRATO</button> : selectedRow.club.id !== human.club.id ? <form className="market-offer market-proposal" onSubmit={event => { event.preventDefault(); if (act(() => sendTransferOffer(session, selectedRow.player.id, feeCents(amount)))) setGroup('sent') }}><div className="proposal-heading"><span className="eyebrow">Proposta de transferência</span><strong>{selectedRow.player.displayName}</strong><small>Referência de valor: {money(selectedRow.player.marketValue.cents)}</small></div><CurrencyField label="Valor oferecido ao clube" required value={amount} onChange={setAmount} /><small className="currency-hint">Use vírgula para centavos. Exemplo: 509.000,00.</small><button className="primary" type="submit">FAZER PROPOSTA →</button></form> : <><button onClick={() => setContractTarget({ playerId: selectedRow.player.id })}>RENOVAR CONTRATO</button><button onClick={() => act(() => listTransferPlayer(session, selectedRow.player.id))}>{selectedRow.listed ? 'RETIRAR DA VENDA' : 'COLOCAR À VENDA'}</button></>}</PlayerPanel>}
    </div>
    <section className="market-negotiations"><div className="section-heading"><div><span className="eyebrow">Central de propostas</span><h2>Negociações</h2></div><span className="pill">{negotiations.length} nesta aba</span></div><div className="negotiation-tabs" role="group" aria-label="Grupo de negociações">{tabs.map(tab => <button key={tab.id} aria-pressed={group === tab.id} onClick={() => setGroup(tab.id)}>{tab.label}<span>{session.market.negotiations.filter(item => tab.id === 'completed' ? item.status === 'COMPLETED' : item.status !== 'COMPLETED' && (tab.id === 'received' ? item.sellingClubId === human.club.id : item.buyingClubId === human.club.id)).length}</span></button>)}</div><div className="negotiation-grid">{negotiations.map(item => <NegotiationCard key={item.negotiationId} item={item} session={session} onAction={act} onContract={() => setContractTarget({ playerId: item.playerId, negotiationId: item.negotiationId })} />)}</div>{!negotiations.length && <div className="panel negotiation-empty"><span className="negotiation-empty-icon" aria-hidden="true">⇄</span><div><strong>{emptyTab.empty}</strong><p>{emptyTab.hint}</p></div></div>}</section>
    {contractTarget && <ContractNegotiation key={contractTarget.negotiationId ?? contractTarget.playerId} session={session} {...contractTarget} onAction={act} onClose={() => setContractTarget(undefined)} />}
  </div>
}




