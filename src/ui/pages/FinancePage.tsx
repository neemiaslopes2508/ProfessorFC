import { FinancialHealthPanel } from '../components/FinancialHealthPanel'
import { useState } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { financeOverview } from '../../application/financeOverview'
import type { FinanceDirection, FinancePeriod } from '../../application/financeOverview'
import { transactionDirection } from '../../finance/types'
import { dateLabel, financeTypeLabels, money } from '../components/presentation'
import { CommercialPanel } from '../components/CommercialPanel'

export function FinancePage({ session, onAction }: { session: PrototypeSession; onAction: (action: () => PrototypeSession) => void }) {
  const [period, setPeriod] = useState<FinancePeriod>('MONTH')
  const [direction, setDirection] = useState<FinanceDirection>('ALL')
  const [section, setSection] = useState<'finance' | 'commercial'>('finance')
  const view = financeOverview(session, period, direction)
  const balanceLabels = { POSITIVE: 'Positivo', NEGATIVE: 'Negativo', NEUTRAL: 'Neutro' }
  const periodLabel = period === 'MONTH' ? `Mês ${view.month.slice(5)}/${view.month.slice(0, 4)}` : `Temporada ${view.year}`
  return <div className="finance-page"><header><span className="eyebrow">Gestão do clube · {view.club.name}</span><h1>Centro Financeiro</h1><p className="muted">Caixa, salários e negócios registrados · {dateLabel(session.game.calendar.currentDate)}</p></header>
    <div className="finance-section-tabs" role="tablist" aria-label="Seções financeiras"><button role="tab" aria-selected={section === 'finance'} onClick={() => setSection('finance')}>FINANÇAS</button><button role="tab" aria-selected={section === 'commercial'} onClick={() => setSection('commercial')}>COMERCIAL</button></div>
    {section === 'commercial' ? <CommercialPanel session={session} onAction={onAction} /> : <>
    <div className="finance-metrics">{[
      { label: 'Caixa atual', value: view.club.finances.cashBalance.cents },
      { label: 'Disponível para transferências', value: view.health.availableTransferBudget },
      { label: 'Folha salarial mensal', value: view.payroll.current },
      { label: 'Teto salarial mensal', value: view.payroll.budget },
      { label: 'Espaço salarial disponível', value: view.payroll.available },
      { label: 'Balanço do mês', value: view.balance, status: view.balanceStatus.toLowerCase(), note: balanceLabels[view.balanceStatus] },
    ].map(item => <article className={`panel finance-metric ${item.status ?? ''}`} key={item.label}><small>{item.label}</small><strong>{money(item.value)}</strong>{item.note && <span>{item.note}</span>}</article>)}</div>
    <FinancialHealthPanel health={view.health} />
    <div className="finance-panels"><section className="panel"><div className="section-heading"><h2>Balanço mensal</h2><span className="pill">{view.month.slice(5)}/{view.month.slice(0, 4)}</span></div><div className="finance-equation"><div><small>Receitas</small><strong className="finance-income">{money(view.income)}</strong></div><span aria-hidden="true">−</span><div><small>Despesas</small><strong className="finance-expense">{money(view.expenses)}</strong></div><span aria-hidden="true">=</span><div><small>Saldo</small><strong className={view.balance > 0 ? 'finance-income' : view.balance < 0 ? 'finance-expense' : ''}>{money(view.balance)}</strong></div></div><p className="muted">Receitas na temporada {view.year}: <strong className="finance-income">{money(view.seasonIncome)}</strong></p></section>
    <section className="panel"><h2>Folha salarial</h2><strong>{money(view.payroll.current)} / {money(view.payroll.budget)}</strong><meter className="finance-wage-meter" min={0} max={Math.max(1, view.payroll.budget)} value={view.payroll.current} aria-label={`Uso do teto salarial: ${money(view.payroll.current)} de ${money(view.payroll.budget)}`} /><p className="muted">{view.payroll.available >= 0 ? 'Espaço disponível' : 'Acima do teto'}: {money(Math.abs(view.payroll.available))}/mês</p>{view.payroll.incomplete && <small className="muted">Folha parcial: há salários não informados.</small>}</section></div>
    <section className="panel"><div className="section-heading"><h2>Transferências</h2><span className="pill">Temporada {view.year}</span></div><div className="finance-transfer-summary"><div><small>Orçamento aprovado</small><strong>{money(view.club.finances.transferBudget.cents)}</strong><small>Disponível atualmente: {money(view.health.availableTransferBudget)}</small></div><div><small>Gasto com compras</small><strong className="finance-expense">{money(view.purchases)}</strong></div><div><small>Recebido com vendas</small><strong className="finance-income">{money(view.sales)}</strong></div></div></section>
    <section className="panel"><div className="section-heading"><h2>Histórico financeiro</h2><span className="pill">{view.transactions.length} registros</span></div><div className="finance-filters"><div role="group" aria-label="Tipo de movimentação">{([{ value: 'ALL', label: 'Todas' }, { value: 'INCOME', label: 'Receitas' }, { value: 'EXPENSE', label: 'Despesas' }] as const).map(item => <button key={item.value} aria-pressed={direction === item.value} onClick={() => setDirection(item.value)}>{item.label}</button>)}</div><label>Período<select value={period} onChange={event => setPeriod(event.target.value as FinancePeriod)}><option value="MONTH">Mês atual</option><option value="SEASON">Temporada {view.year}</option></select></label></div>
      {view.transactions.length ? <div className="table-scroll"><table><caption className="sr-only">Transações de {view.club.name} · {periodLabel}</caption><thead><tr>{['Data', 'Categoria', 'Descrição', 'Movimento', 'Valor'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{view.transactions.map(item => <tr key={item.id}><td>{dateLabel(item.date)}</td><td>{financeTypeLabels[item.type]}</td><td>{item.attendance !== undefined && <small>Público: {new Intl.NumberFormat('pt-BR').format(item.attendance)} · </small>}{item.description ?? (item.type === 'PLAYER_WAGES' ? `Folha mensal · ${item.month ?? item.date.slice(0, 7)}` : financeTypeLabels[item.type])}</td><td><span className={`pill finance-${transactionDirection[item.type].toLowerCase()}`}>{transactionDirection[item.type] === 'INCOME' ? 'Receita' : 'Despesa'}</span></td><td className={`finance-amount finance-${transactionDirection[item.type].toLowerCase()}`}>{transactionDirection[item.type] === 'INCOME' ? '+' : '−'} {money(item.amount.cents)}</td></tr>)}</tbody></table></div> : <p className="finance-empty">Nenhuma movimentação registrada para este filtro. Receitas da temporada, salários e transferências concluídas aparecerão aqui.</p>}
    </section>
    <div className="finance-panels">{[{ title: 'Maiores despesas', items: view.expenseCategories, kind: 'expense' }, { title: 'Principais receitas', items: view.incomeCategories, kind: 'income' }].map(group => <section className="panel" key={group.title}><div className="section-heading"><h2>{group.title}</h2><small className="muted">{periodLabel}</small></div>{group.items.length ? <ul className="finance-categories">{group.items.map(item => <li key={item.type}><span>{financeTypeLabels[item.type]}</span><strong className={`finance-${group.kind}`}>{money(item.total)}</strong></li>)}</ul> : <p className="muted">Nenhuma {group.kind === 'income' ? 'receita' : 'despesa'} registrada no período.</p>}</section>)}</div>
    </>}
  </div>
}
