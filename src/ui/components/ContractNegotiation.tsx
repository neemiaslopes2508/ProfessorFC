import { useEffect, useRef, useState } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { humanTeam, playerAge } from '../../application/prototypeSession'
import { playerOverall } from '../../application/teamOverview'
import { completeTransfer, contractPayroll, marketContract, offerPlayerContract, playerContractExpectations, previewPlayerContract, renewPlayerContract, respondTransfer, signFreeAgent } from '../../application/transferMarket'
import { SQUAD_ROLES } from '../../domain/contracts'
import type { SquadRole } from '../../domain/contracts'
import type { PlayerId } from '../../core/ids'
import type { ContractResponse, ContractTerms } from '../../transfers/playerContract'
import { CurrencyField } from './CurrencyField'
import { formatCurrencyInputBRL, parseCurrencyBRL } from './currency'
import { PlayerAvatar } from './PlayerAvatar'
import { dateLabel, money, squadRoleLabels } from './presentation'

export function ContractNegotiation({ session, playerId, negotiationId, onAction, onClose }: { session: PrototypeSession; playerId: PlayerId; negotiationId?: string; onAction: (operation: () => PrototypeSession) => boolean; onClose: () => void }) {
  const negotiation = session.market.negotiations.find(item => item.negotiationId === negotiationId)
  const team = session.teams.find(team => team.players.some(player => player.id === playerId))
  const free = session.freeAgents.find(player => player.id === playerId)
  const player = free ?? team!.players.find(player => player.id === playerId)!
  const destination = negotiation?.buyingClubId ?? humanTeam(session).club.id
  const expected = playerContractExpectations(session, playerId, destination)
  const current = marketContract(session, playerId)
  const initial = negotiation?.contractOffer?.terms ?? expected
  const [salary, setSalary] = useState(formatCurrencyInputBRL(initial.salaryCents))
  const [years, setYears] = useState(initial.years)
  const [role, setRole] = useState(initial.squadRole)
  const [renewalResponse, setRenewalResponse] = useState<ContractResponse>()
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const previous = document.activeElement; dialogRef.current?.focus(); return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus() } }, [])
  const response = dirty ? undefined : negotiation?.contractOffer ?? renewalResponse
  let payroll: ReturnType<typeof contractPayroll> | undefined
  try { payroll = contractPayroll(session, playerId, destination, parseCurrencyBRL(salary)) } catch { /* Valor incompleto durante edição. */ }
  function propose(terms: ContractTerms) {
    try {
      if (negotiationId) { const next = offerPlayerContract(session, negotiationId, terms); if (!onAction(() => next)) return }
      else setRenewalResponse(previewPlayerContract(session, playerId, destination, terms))
      setSalary(formatCurrencyInputBRL(terms.salaryCents)); setYears(terms.years); setRole(terms.squadRole); setDirty(false); setError('')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível avaliar o contrato.') }
  }
  function sign(terms: ContractTerms) {
    try {
      const next = negotiationId ? completeTransfer(session, negotiationId) : free ? signFreeAgent(session, playerId, terms) : renewPlayerContract(session, playerId, terms)
      if (onAction(() => next)) onClose()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível assinar o contrato.') }
  }
  return <div className="modal-backdrop"><div className="panel contract-dialog" role="dialog" aria-modal="true" aria-label={negotiationId || free ? 'Negociar contrato' : 'Renovar contrato'} tabIndex={-1} ref={dialogRef} onKeyDown={event => {
    if (event.key === 'Escape') onClose()
    if (event.key === 'Tab') {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input, select'))
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
  }}>
    <div className="section-heading"><div><span className="eyebrow">Conversa com o jogador</span><h2>{negotiationId || free ? 'Negociar contrato' : 'Renovar contrato'}</h2></div><button aria-label="Fechar negociação de contrato" onClick={onClose}>×</button></div>
    <div className="market-person"><PlayerAvatar playerId={player.id} name={player.displayName} /><div><strong>{player.displayName}</strong><small>{team?.club.name ?? 'Agente livre'} · {playerAge(player, session.game.calendar.currentDate)} anos · OVR {playerOverall(player)}</small></div></div>
    <p className="muted">{current ? `${money(current.salary.cents)}/mês · ${squadRoleLabels[current.squadRole]} · Contrato até ${dateLabel(current.endDate)}` : free ? 'Sem clube e sem contrato ativo.' : 'Sem contrato ativo informado na base de desenvolvimento.'}</p>
    {free && <p className="notice">Agente livre. Contratação sem taxa de transferência.</p>}
    {negotiation && <p className="notice">Clube aceitou a transferência por {money(negotiation.offeredFee.cents)}. Falta acertar os termos com o jogador.</p>}
    <div className="contract-expectations"><small>Expectativas do jogador</small><strong>{money(expected.salaryCents)}/mês</strong><span>{expected.years} {expected.years === 1 ? 'ano' : 'anos'} · {squadRoleLabels[expected.squadRole]}</span></div>
    <form className="contract-form" onSubmit={event => { event.preventDefault(); try { propose({ salaryCents: parseCurrencyBRL(salary), years, squadRole: role }) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Valor inválido.') } }}>
      <CurrencyField label="Salário mensal" value={salary} required onChange={value => { if (value !== salary) setDirty(true); setSalary(value) }} />
      <label>Duração<select value={years} onChange={event => { setYears(Number(event.target.value)); setDirty(true) }}>{[1, 2, 3, 4, 5].map(year => <option key={year} value={year}>{year} {year === 1 ? 'ano' : 'anos'}</option>)}</select></label>
      <label>Papel no elenco<select value={role} onChange={event => { setRole(event.target.value as SquadRole); setDirty(true) }}>{SQUAD_ROLES.map(role => <option key={role} value={role}>{squadRoleLabels[role]}</option>)}</select></label>
      <button type="submit">PROPOR CONTRATO</button>
    </form>
    {payroll && <div className="contract-finances"><span>Folha atual conhecida<strong>{money(payroll.current)}/mês</strong></span><span>Novo salário<strong>{money(payroll.total - payroll.current + payroll.previous)}/mês</strong></span><span>Impacto mensal<strong>{payroll.delta > 0 ? '+' : ''}{money(payroll.delta)}</strong></span><span>Nova folha / limite<strong>{money(payroll.total)} / {money(payroll.budget)}</strong></span>{payroll.incomplete && <small>Estimativa parcial: há jogadores sem salário informado.</small>}</div>}
    {error && <p role="alert" className="notice error">{error}</p>}
    {response && <div className={`contract-response negotiation-${response.status.toLowerCase()}`} role="status"><strong>{response.status === 'ACCEPTED' ? 'Termos aceitos' : response.status === 'COUNTERED' ? 'Contraproposta do jogador' : 'Proposta rejeitada'}</strong><p>“{response.message}”</p>{response.counter && <><p>{money(response.counter.salaryCents)}/mês · {response.counter.years} anos · {squadRoleLabels[response.counter.squadRole]}</p><button onClick={() => propose(response.counter!)}>ACEITAR CONTRAPROPOSTA DO JOGADOR</button></>}{response.status === 'ACCEPTED' && <button className="primary" disabled={!!session.liveMatch || !!session.pendingMatch} onClick={() => sign(response.terms)}>ASSINAR CONTRATO{negotiationId ? ' E CONCLUIR' : ''}</button>}</div>}
    {(session.liveMatch || session.pendingMatch) && <p className="muted">Conclua a partida para assinar.</p>}
    <button className="text-button" onClick={() => { if (!negotiationId || onAction(() => respondTransfer(session, negotiationId, 'cancel'))) onClose() }}>DESISTIR</button>
  </div></div>
}

