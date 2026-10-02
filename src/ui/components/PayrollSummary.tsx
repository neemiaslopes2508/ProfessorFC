import type { PrototypeSession } from '../../application/prototypeSession'
import { humanTeam } from '../../application/prototypeSession'
import { clubPayroll } from '../../application/contractLifecycle'
import { dateLabel, money } from './presentation'

export function PayrollSummary({ session }: { session: PrototypeSession }) {
  const club = humanTeam(session).club
  const payroll = clubPayroll(session, club.id)
  const last = session.financialTransactions.filter(transaction => transaction.clubId === club.id).at(-1)
  return <section className="panel payroll-summary" aria-label="Folha salarial"><div className="contract-finances"><span>Folha mensal<strong>{money(payroll.current)}/mês</strong></span><span>Teto salarial<strong>{money(payroll.budget)}/mês</strong></span><span>Espaço disponível<strong>{money(payroll.available)}/mês</strong></span><span>Caixa<strong>{money(club.finances.cashBalance.cents)}</strong></span></div><p className="muted">{last ? `Último pagamento: ${dateLabel(last.date)} · ${money(last.amount.cents)} · PLAYER_WAGES` : 'Nenhum pagamento salarial registrado.'}{payroll.incomplete ? ' Folha parcial: há salários não informados.' : ''}</p></section>
}
