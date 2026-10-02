import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { startPrototype, getDevelopmentClubs, advancePrototype, continuePrototypeMatch, moveTeamPlayer, setBench, setPrototypeTactics, prototypeView } from '../application/prototypeSession'
import { startPrototypeLiveMatch, advancePrototypeLiveMatch, advancePrototypeToHalfTime, startPrototypeSecondHalf, finishPrototypeLiveMatch, commitPrototypeLiveTeamSetup } from '../application/liveHumanMatch'
import type { PrototypeSession } from '../application/prototypeSession'
import { captureTeamSetup, commitTeamSetup, hasTeamSetupChanges, previewTeamSetup } from '../application/teamSetup'
import type { TeamSetup } from '../application/teamSetup'
import { ClubSelectionPage } from './pages/ClubSelectionPage'
import { SquadPage } from './pages/SquadPage'
import { TeamPage } from './pages/TeamPage'
import { DashboardPage, StandingsPage } from './pages/SeasonPages'
import { CalendarPage } from './pages/CalendarPage'
import { MatchPage, PreMatchPage } from './pages/MatchPages'
import { LiveMatchPage } from './pages/LiveMatchPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Sidebar } from './layouts/Sidebar'
import { TopBar } from './layouts/TopBar'
import { LeaveTeamDialog } from './components/LeaveTeamDialog'
import { readableSelectionMessage } from './components/presentation'
import './styles.css'

export function App() { return <ErrorBoundary><PrototypeApp /></ErrorBoundary> }
type Page = 'home' | 'clubs' | 'dashboard' | 'squad' | 'team' | 'calendar' | 'table' | 'pregame' | 'live' | 'match'
type LeaveIntent = { type: 'navigate'; page: Page } | { type: 'advance' } | { type: 'restart' }

function PrototypeApp() {
  const [session, setSession] = useState<PrototypeSession>()
  const [draft, setDraft] = useState<TeamSetup>()
  const [teamMessage, setTeamMessage] = useState('')
  const [page, setPage] = useState<Page>('home')
  const [error, setError] = useState<string>()
  const [leaveIntent, setLeaveIntent] = useState<LeaveIntent>()
  const [playback, setPlayback] = useState<'PLAYING' | 'PAUSED'>('PAUSED')
  const [management, setManagement] = useState<{ tab: 'lineup' | 'tactics' }>()
  function failure(cause: unknown) { setError(readableSelectionMessage(cause instanceof Error ? cause.message : 'Não foi possível completar esta ação.')); return false }
  function run(action: () => PrototypeSession, destination?: Page) {
    try { setSession(action()); setError(undefined); if (destination) setPage(destination); return true }
    catch (cause) { return failure(cause) }
  }
  const errorBanner = error && <div className="notice error" role="alert">{error}<button onClick={() => setError(undefined)}>Fechar mensagem</button></div>
  if (page === 'home') return <>{errorBanner}<HomePage onNewGame={() => setPage('clubs')} /></>
  if (page === 'clubs' || !session) return <>{errorBanner}<ClubSelectionPage clubs={getDevelopmentClubs()} onBack={() => setPage('home')} onSelect={id => run(() => startPrototype(id), 'dashboard')} /></>
  const currentSession = session
  const dirty = hasTeamSetupChanges(session, draft)
  const editing = previewTeamSetup(session, draft)
  const view = prototypeView(session)
  function editDraft(action: (current: PrototypeSession) => PrototypeSession) {
    try { setDraft(captureTeamSetup(action(editing))); setTeamMessage(''); setError(undefined); return true }
    catch (cause) { return failure(cause) }
  }
  function saveTeam(): PrototypeSession | undefined {
    try {
      const result = commitTeamSetup(currentSession, draft ?? captureTeamSetup(currentSession))
      if (!result.ok) { setError('Equipe não salva. ' + result.validation.errors.map(issue => readableSelectionMessage(issue.message)).join(' ')); return }
      setSession(result.session); setDraft(undefined); setError(undefined); setTeamMessage('Equipe salva')
      return result.session
    } catch (cause) { failure(cause) }
  }
  function discardTeam() { setDraft(undefined); setError(undefined); setTeamMessage('Alterações descartadas') }
  function perform(intent: LeaveIntent, confirmed: PrototypeSession) {
    setLeaveIntent(undefined)
    setPlayback('PAUSED')
    setManagement(undefined)
    if (intent.type === 'navigate') {
      if (intent.page === 'team' && confirmed.liveMatch) { setPage('live'); setManagement({ tab: 'lineup' }) }
      else setPage(intent.page)
    }
    else if (intent.type === 'advance') run(() => advancePrototype(confirmed))
    else { setSession(undefined); setDraft(undefined); setTeamMessage(''); setError(undefined); setPage('clubs') }
  }
  function request(intent: LeaveIntent) {
    if (intent.type === 'navigate' && intent.page === page) return
    if (page === 'team' && dirty) setLeaveIntent(intent)
    else perform(intent, currentSession)
  }
  function navigate(destination: Page) { request({ type: 'navigate', page: destination }) }
  function prepare() { navigate(currentSession.pendingMatch ? 'match' : currentSession.liveMatch ? 'live' : 'pregame') }
  function progress(action: () => PrototypeSession): PrototypeSession | undefined {
    try {
      const next = action()
      setSession(next); setError(undefined); setPage(next.pendingMatch ? 'match' : 'live')
      if (!next.liveMatch?.canAdvance) setPlayback('PAUSED')
      return next
    } catch (cause) { setPlayback('PAUSED'); failure(cause) }
  }
  function manage(tab?: 'lineup' | 'tactics') {
    setPlayback('PAUSED'); setError(undefined); setManagement(tab ? { tab } : undefined)
  }
  return <div className="app-shell"><Sidebar club={view.club} page={page} live={!!session.liveMatch} pending={!!session.pendingMatch} onNavigate={navigate} onRestart={() => request({ type: 'restart' })} />
    <div className="workspace"><TopBar year={view.league.season.year} date={session.game.calendar.currentDate} action={view.league.season.status === 'FINISHED' ? <span className="pill">Temporada encerrada</span> : session.liveMatch ? <button className="primary" onClick={() => navigate('live')}>Voltar à partida</button> : session.pendingMatch ? <button className="primary" onClick={() => navigate('match')}>Ver resultado / Continuar</button> : view.pendingActions.length ? <button className="primary" onClick={prepare}>Preparar partida</button> : <button className="primary" onClick={() => request({ type: 'advance' })}>Avançar →</button>} />
    <main className="game-content">{errorBanner}
      {page === 'dashboard' && <DashboardPage session={session} onPrepare={prepare} onTable={() => navigate('table')} onLastMatch={() => navigate('match')} onTeam={() => navigate('team')} />}
      {page === 'squad' && <SquadPage session={session} />}
      {page === 'team' && <TeamPage session={editing} dirty={dirty} saveMessage={teamMessage} onSave={() => { saveTeam() }} onDiscard={discardTeam} onMove={(id, slot) => editDraft(current => moveTeamPlayer(current, id, slot))} onBench={ids => editDraft(current => setBench(current, ids))} onTactics={tactics => editDraft(current => setPrototypeTactics(current, tactics))} />}
      {page === 'calendar' && <CalendarPage session={session} />}
      {page === 'table' && <StandingsPage session={session} />}
      {page === 'pregame' && <PreMatchPage session={session} onPlay={() => run(() => startPrototypeLiveMatch(session), 'live')} onLineup={() => navigate('team')} onTactics={() => navigate('team')} />}
      {page === 'live' && <LiveMatchPage key={session.liveMatch?.matchId} session={session} playback={playback} onPlayback={setPlayback} management={management} onManagement={manage} error={error} onAdvance={minutes => progress(() => advancePrototypeLiveMatch(session, minutes))} onHalfTime={() => progress(() => advancePrototypeToHalfTime(session))} onFinish={() => progress(() => finishPrototypeLiveMatch(session))} onSecondHalf={() => progress(() => startPrototypeSecondHalf(session))} onConfirm={setup => progress(() => commitPrototypeLiveTeamSetup(session, setup))} />}
      {page === 'match' && <MatchPage session={session} onContinue={() => run(() => continuePrototypeMatch(session), 'dashboard')} onTable={() => navigate('table')} />}
    </main></div>
    {leaveIntent && <LeaveTeamDialog error={error} onCancel={() => setLeaveIntent(undefined)} onDiscard={() => { discardTeam(); perform(leaveIntent, currentSession) }} onSave={() => { const confirmed = saveTeam(); if (confirmed) perform(leaveIntent, confirmed) }} />}
  </div>
}

