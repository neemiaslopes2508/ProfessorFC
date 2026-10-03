import { useState } from 'react'
import type { PrototypeSession } from '../../application/prototypeSession'
import { academyAge, academyPotentialLabel, activeAcademyPlayers, promoteAcademyPlayer, releaseAcademyPlayer } from '../../application/academy'
import { recentPlayerDevelopment } from '../../application/playerDevelopment'
import { playerOverall } from '../../application/teamOverview'
import type { PlayerId } from '../../core/ids'
import { PlayerPanel } from './PlayerPanel'
import { PlayerAvatar } from './PlayerAvatar'
import { positionLabel } from './presentation'

export function AcademyPanel({ session, onAction }: { session: PrototypeSession; onAction: (operation: () => PrototypeSession) => boolean }) {
  const [selectedId, setSelectedId] = useState<PlayerId>()
  const records = activeAcademyPlayers(session)
  const selected = records.find(record => record.player.id === selectedId)
  const level = session.facilities.find(item => item.clubId === session.game.humanClubId && item.type === 'YOUTH')?.level ?? 1
  const busy = !!session.liveMatch || !!session.pendingMatch || session.game.competitions[0].league.season.status === 'FINISHED'
  return <section className="panel academy-panel" aria-labelledby="academy-heading">
    <div className="section-heading"><div><span className="eyebrow">Formação do clube</span><h2 id="academy-heading">Categorias de Base</h2></div><span className="pill">Nível {level} / 5</span></div>
    <p className="muted">Jovens entram em abril e setembro. A avaliação de potencial é aproximada.</p>
    {records.length ? <div className="academy-list">{records.map(record => <button key={record.player.id} className={`academy-player ${selectedId === record.player.id ? 'selected-row' : ''}`} onClick={() => setSelectedId(record.player.id)}>
      <PlayerAvatar playerId={record.player.id} name={record.player.displayName} />
      <span><strong>{record.player.displayName}</strong><small>{academyAge(record, session.game.calendar.currentDate)} anos · {positionLabel(record.player.primaryPosition, true)} · Overall {playerOverall(record.player)}</small></span>
      <span className="academy-potential">{academyPotentialLabel(record.player.potential)}<small>potencial</small></span>
    </button>)}</div> : <p className="notice">A primeira captação será apresentada na próxima janela da base.</p>}
    {selected && <div className="academy-profile">
      <PlayerPanel player={selected.player} date={session.game.calendar.currentDate} development={recentPlayerDevelopment(session, selected.player.id)} onClose={() => setSelectedId(undefined)}>
        <p className="muted">Avaliação de potencial: <strong>{academyPotentialLabel(selected.player.potential)}</strong> · na base desde {selected.joinedAt}</p>
        <button disabled={busy} onClick={() => { if (onAction(() => promoteAcademyPlayer(session, selected.player.id))) setSelectedId(undefined) }}>PROMOVER AO PROFISSIONAL</button>
        <button disabled={busy} onClick={() => { if (onAction(() => releaseAcademyPlayer(session, selected.player.id))) setSelectedId(undefined) }}>DISPENSAR DA BASE</button>
      </PlayerPanel>
    </div>}
    {session.academy.some(record => record.status !== 'ACADEMY') && <details className="academy-history"><summary>Histórico de formação</summary>{session.academy.filter(record => record.status !== 'ACADEMY').map(record => <p key={record.player.id}>{record.player.displayName} · {record.status === 'PROMOTED' ? `promovido em ${record.promotedAt}` : `dispensado em ${record.releasedAt}`}</p>)}</details>}
  </section>
}
