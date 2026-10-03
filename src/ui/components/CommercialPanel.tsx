import type { PrototypeSession } from '../../application/prototypeSession'
import { acceptSponsorOffer, activeSponsorship, rejectSponsorOffer } from '../../application/commercial'
import type { PrototypeSession as Session } from '../../application/prototypeSession'
import type { SponsorObjective, SponsorOffer } from '../../finance/sponsorship'
import { dateLabel, money } from './presentation'
import { addGameDays } from '../../core/date'

function objectiveLabel(objective: SponsorObjective) {
  if (objective.type === 'FINISH_POSITION') return `Terminar no Top ${objective.target}`
  if (objective.type === 'WIN_COMPETITION') return 'Ser campeão da competição'
  return 'Encerrar a temporada com saúde financeira saudável'
}
function sponsorName(session: PrototypeSession, sponsorId: string) { return session.commercial.sponsors.find(item => item.id === sponsorId)?.name ?? 'Patrocinador' }
function offerCard(session: Session, offer: SponsorOffer, onAction: (action: () => Session) => void) {
  return <article className="panel sponsor-offer" key={offer.id}><span className="eyebrow">Proposta · {offer.durationSeasons} {offer.durationSeasons === 1 ? 'temporada' : 'temporadas'}</span><h3>{sponsorName(session, offer.sponsorId)}</h3><dl><div><dt>Receita mensal</dt><dd>{money(offer.monthlyPaymentCents)}</dd></div><div><dt>Bônus de assinatura</dt><dd>{offer.signingBonusCents ? money(offer.signingBonusCents) : 'Sem bônus'}</dd></div><div><dt>Objetivo</dt><dd>{objectiveLabel(offer.objective)}</dd></div><div><dt>Bônus por meta</dt><dd>{money(offer.objective.bonusCents)}</dd></div><div><dt>Vigência</dt><dd>{dateLabel(offer.startDate)} – {dateLabel(addGameDays(offer.endDate, -1))}</dd></div></dl><div className="actions"><button className="primary" onClick={() => onAction(() => acceptSponsorOffer(session, offer.id))}>ASSINAR</button><button onClick={() => onAction(() => rejectSponsorOffer(session, offer.id))}>RECUSAR</button></div></article>
}

export function CommercialPanel({ session, onAction }: { session: PrototypeSession; onAction: (action: () => PrototypeSession) => void }) {
  const clubId = session.game.humanClubId
  const today = session.game.calendar.currentDate
  const contract = session.commercial.contracts.find(item => item.clubId === clubId && item.status === 'ACTIVE' && item.endDate > today)
  const active = activeSponsorship(session)
  const offers = session.commercial.offers.filter(offer => offer.clubId === clubId && offer.status === 'OFFERED')
  const contractSponsor = contract ? sponsorName(session, contract.sponsorId) : undefined
  return <section className="commercial-panel"><header><span className="eyebrow">Receitas comerciais</span><h2>Patrocínio principal</h2><p className="muted">Compare propostas e escolha um contrato. Valores e metas são conteúdo configurável.</p></header>
    {contract ? <article className="panel sponsor-current"><div><span className="eyebrow">{active ? 'Contrato ativo' : 'Contrato assinado'}</span><h3>{contractSponsor}</h3></div><div><small>Receita mensal</small><strong>{money(contract.monthlyPaymentCents)}</strong></div><div><small>Vigente até</small><strong>{dateLabel(addGameDays(contract.endDate, -1))}</strong></div><div><small>Tempo restante</small><strong>{Math.max(0, Math.ceil((Date.parse(`${contract.endDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000))} dias</strong></div><div className="sponsor-current-objective"><small>Objetivo · {contract.objectiveStatus === 'PENDING' ? 'em avaliação' : contract.objectiveStatus === 'ACHIEVED' ? 'cumprido' : 'não cumprido'}</small><strong>{objectiveLabel(contract.objective)}</strong><span>Bônus potencial: {money(contract.objective.bonusCents)}</span></div></article> : <p className="notice">O clube está sem patrocinador principal. Escolha uma das propostas disponíveis.</p>}
    {offers.length ? <><div className="section-heading"><h3>Propostas disponíveis</h3><span className="pill">{offers.length} ofertas</span></div><div className="sponsor-offers">{offers.map(offer => offerCard(session, offer, onAction))}</div></> : <p className="muted">Não há propostas disponíveis neste momento. Novas ofertas podem chegar em uma próxima janela comercial.</p>}
  </section>
}
