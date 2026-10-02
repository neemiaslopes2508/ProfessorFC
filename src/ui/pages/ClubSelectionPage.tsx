import { useState } from 'react'
import type { Club } from '../../domain/clubs'
import type { ClubId } from '../../core/ids'
import { money } from '../components/presentation'
import { ClubCrest } from '../components/ClubMark'

export function ClubSelectionPage({ clubs, onSelect, onBack }: { clubs: readonly Club[]; onSelect: (id: ClubId) => void; onBack: () => void }) {
  const [chosen, setChosen] = useState<ClubId>()
  return <main className="selection"><span className="eyebrow">Development League · 2026</span><h1>Escolha seu clube</h1><p>Seis histórias fictícias, dez rodadas. Os dados oficiais serão adicionados em uma fase futura.</p>
    <div className="club-grid">{clubs.map(club => <button key={club.id} className={`club-card ${chosen === club.id ? 'selected' : ''}`} aria-pressed={chosen === club.id} onClick={() => setChosen(club.id)}>
      <ClubCrest club={club} /><h2>{club.name}</h2><dl><dt>Reputação</dt><dd>{club.reputation}/100</dd><dt>Orçamento de referência</dt><dd>{money(club.finances.transferBudget.cents)}</dd><dt>Elenco</dt><dd>{club.playerIds.length} jogadores</dd><dt>Preferência por jovens</dt><dd>{club.profile.youthPreference}/100</dd></dl>
    </button>)}</div><div className="actions"><button onClick={onBack}>Voltar</button><button className="primary" disabled={!chosen} onClick={() => chosen && onSelect(chosen)}>Assumir clube</button></div>
  </main>
}
