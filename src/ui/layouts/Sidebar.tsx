import type { Club } from '../../domain/clubs'
import { ClubCrest } from '../components/ClubMark'
import { InterfaceIcon } from '../components/InterfaceIcon'

const navigation = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'team', label: 'Equipe' }, { id: 'squad', label: 'Elenco' }, { id: 'calendar', label: 'Calendário' }, { id: 'table', label: 'Tabela' }] as const
type NavigationPage = typeof navigation[number]['id'] | 'live' | 'match'

export function Sidebar({ club, page, live, pending, onNavigate, onRestart }: {
  club: Club; page: string; live: boolean; pending: boolean;
  onNavigate: (page: NavigationPage) => void; onRestart: () => void;
}) {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-monogram" aria-hidden="true">P<span>FC</span></span><div>Professor <strong>FC</strong><small>MODO CARREIRA</small></div></div>
    <nav aria-label="Navegação principal">{navigation.map(item => <button key={item.id} aria-current={page === item.id ? 'page' : undefined} onClick={() => onNavigate(item.id)}><InterfaceIcon name={item.id} /><span>{item.label}</span></button>)}
      {live && <button aria-current={page === 'live' ? 'page' : undefined} onClick={() => onNavigate('live')}><InterfaceIcon name="play" /><span>Partida em andamento</span></button>}
      {pending && <button aria-current={page === 'match' ? 'page' : undefined} onClick={() => onNavigate('match')}><InterfaceIcon name="round" /><span>Resultado pendente</span></button>}
    </nav>
    <div className="club-identity"><ClubCrest club={club} small /><div><small>SEU CLUBE</small><strong>{club.name}</strong></div></div>
    <footer className="sidebar-footer"><p className="sidebar-note"><span className="development-dot" /> Em desenvolvimento<small>v0.1.0 · Base fictícia · Sessão em memória</small></p><button className="new-session" onClick={onRestart}>Novo jogo — reiniciar sessão</button></footer>
  </aside>
}
