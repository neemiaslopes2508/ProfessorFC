import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { PlayerId } from '../../core/ids'
import type { Tactics } from '../../domain/tactics'
import { FORMATION_POSITIONS } from '../../domain/tactics'
import { humanTeam, starterSlots } from '../../application/prototypeSession'
import type { PrototypeSession } from '../../application/prototypeSession'
import { PlayerPiece } from '../components/PlayerPiece'
import { PlayerPanel } from '../components/PlayerPanel'
import { TacticalPitch } from '../components/TacticalPitch'
import { TacticsControls } from '../components/TacticsControls'
import { ValidationPanel } from '../components/ValidationPanel'
import { mentalityLabels, positionLabels, positionLabel, styleLabels } from '../components/presentation'
import { ClubCrest } from '../components/ClubMark'
import { useTeamDrag } from '../hooks/useTeamDrag'

export function TeamPage({ session, onMove, onTactics, onBench, dirty = false, saveMessage = '', onSave, onDiscard, live = false, initialTab = 'lineup' }: { session: PrototypeSession; onMove: (id: PlayerId, slot: number) => boolean; onTactics: (tactics: Tactics) => void; onBench: (ids: readonly PlayerId[]) => void; dirty?: boolean; saveMessage?: string; onSave?: () => void; onDiscard?: () => void; live?: boolean; initialTab?: 'lineup' | 'tactics' }) {
  const [tab, setTab] = useState<'lineup' | 'tactics'>(initialTab)
  const [selection, setSelection] = useState<{ slot?: number; playerId?: PlayerId }>()
  const [feedback, setFeedback] = useState('')
  const [replacementSlot, setReplacementSlot] = useState(0)
  const team = humanTeam(session)
  const slots = starterSlots(session)
  const locked = !!session.liveMatch || !!session.pendingMatch || session.game.competitions[0].league.season.status === 'FINISHED'
  const drag = useTeamDrag(locked, onMove, setFeedback)
  const player = team.players.find(player => player.id === (selection?.slot !== undefined ? slots[selection.slot] : selection?.playerId))
  const candidates = team.players.filter(player => team.lineup.bench.includes(player.id) || team.lineup.startingPlayers.includes(player.id))
  const positions = FORMATION_POSITIONS[team.tactics.formation]
  function chooseSlot(slot: number) { if (!drag.consumeClick()) setSelection({ slot }) }
  function choosePlayer(id: PlayerId) { if (!drag.consumeClick()) setSelection({ playerId: id }) }
  function apply(id: PlayerId, slot: number) { if (onMove(id, slot)) { setFeedback('Troca aplicada. Confira os alertas de posição.'); setSelection({ slot }) } }
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'lineup' : event.key === 'End' ? 'tactics' : tab === 'lineup' ? 'tactics' : 'lineup'
    setTab(next)
    document.getElementById(`${next}-tab`)?.focus()
  }
  const benchPlayers = team.players.filter(player => team.lineup.bench.includes(player.id))
  const outside = team.players.filter(player => !team.lineup.bench.includes(player.id) && !team.lineup.startingPlayers.includes(player.id))
  return <><div className="page-heading"><div><span className="eyebrow">Mesa do treinador</span><h1>Equipe</h1><div className="team-club-heading"><ClubCrest club={team.club} small /><span>{team.club.name}<small>{live ? 'Alterações para os próximos minutos, com a partida pausada.' : 'Organize o time para o próximo apito.'}</small></span></div></div><div className="tactic-summary"><strong>{team.tactics.formation}</strong><span>{mentalityLabels[team.tactics.mentality]}</span><span>{styleLabels[team.tactics.style]}</span></div></div>
    {!live && <div className={`team-save-bar ${dirty ? 'has-changes' : ''}`}><div><strong role="status">{dirty ? 'Alterações pendentes' : saveMessage || 'Equipe confirmada'}</strong><small>{dirty ? 'O próximo jogo usa a equipe confirmada até você salvar.' : 'Confirmação da equipe nesta sessão, sem savegame persistente.'}</small></div><div className="actions"><button disabled={locked || !dirty} onClick={() => { setFeedback(''); setSelection(undefined); onDiscard?.() }}>DESCARTAR ALTERAÇÕES</button><button className="primary" disabled={locked || !dirty} onClick={onSave}>SALVAR EQUIPE</button></div></div>}
    <div className="team-tabs" role="tablist" aria-label="Gerenciamento da equipe"><button id="lineup-tab" role="tab" tabIndex={tab === 'lineup' ? 0 : -1} aria-selected={tab === 'lineup'} aria-controls="team-workspace" onKeyDown={navigateTabs} onClick={() => setTab('lineup')}>Escalação</button><button id="tactics-tab" role="tab" tabIndex={tab === 'tactics' ? 0 : -1} aria-selected={tab === 'tactics'} aria-controls="team-workspace" onKeyDown={navigateTabs} onClick={() => setTab('tactics')}>Táticas</button></div>
    {locked && <p className="notice">Equipe em modo de consulta: confirme o resultado pendente ou inicie um novo jogo após o fim da temporada.</p>}
    <div id="team-workspace" role="tabpanel" aria-labelledby={tab === 'lineup' ? 'lineup-tab' : 'tactics-tab'}>
      {tab === 'tactics' && <TacticsControls tactics={team.tactics} locked={locked} onChange={tactics => { if (tactics.formation !== team.tactics.formation) setSelection(undefined); onTactics(tactics) }} />}
      <div className={`team-workspace ${selection ? 'with-player' : ''}`} {...drag.handlers}>
        <section className="panel pitch-panel"><div className="section-heading"><h2>{live ? 'Em campo' : 'Onze iniciais'}</h2><span className="pill">{team.tactics.formation}</span></div><TacticalPitch session={session} selectedSlot={selection?.slot} onSelect={chooseSlot} drag={drag.drag} locked={locked} onPointerDown={event => drag.begin(event, team.players.find(player => player.id === event.currentTarget.dataset.playerId)?.id)} /><div className="pitch-legend"><span>● Natural</span><span className="secondary">● Secundária</span><span className="improvised">● Improvisado</span><span>↓ Condição baixa</span><span>× Indisponível</span></div><p className="muted pitch-help">Arraste uma reserva para o campo ou troque dois titulares. Clique em uma camisa para editar sem arrastar.</p></section>
        <section className="panel bench-panel"><div className="section-heading"><h2>Banco</h2><span className="pill">{benchPlayers.length} reservas</span></div><p className="muted">{live ? 'Trocas ficam no rascunho até confirmar. Quem sair não poderá voltar à partida.' : 'Trocas de equipe antes do jogo. Reservas não entram durante a simulação.'}</p><div className="reserve-grid">{benchPlayers.map(player => <PlayerPiece key={player.id} player={player} position={player.primaryPosition} number={team.players.indexOf(player) + 1} compact selected={selection?.playerId === player.id} moving={drag.drag?.playerId === player.id} locked={locked} onSelect={() => choosePlayer(player.id)} onPointerDown={event => drag.begin(event, player.id)} />)}</div>
          {!live && outside.length > 0 && <details><summary>Fora do banco ({outside.length})</summary>{outside.map(player => <button className="text-button" key={player.id} onClick={() => choosePlayer(player.id)}>{player.displayName} · {positionLabel(player.primaryPosition)}</button>)}</details>}
        </section>
        {selection && <div className="context-column">{player ? <PlayerPanel player={player} position={selection.slot !== undefined ? positions[selection.slot] : undefined} date={session.game.calendar.currentDate} onClose={() => setSelection(undefined)}>
          {selection.slot === undefined && !locked && <><label htmlFor="replacement-slot">Substituir titular em</label><select id="replacement-slot" value={replacementSlot} onChange={event => setReplacementSlot(Number(event.target.value))}>{positions.map((position, index) => <option value={index} key={index}>{positionLabel(position, true)} · {team.players.find(player => player.id === slots[index])?.displayName ?? 'Slot vazio'}</option>)}</select>{team.lineup.bench.includes(player.id) ? <><button className="primary" onClick={() => apply(player.id, replacementSlot)}>SUBSTITUIR</button>{!live && <button onClick={() => onBench(team.lineup.bench.filter(id => id !== player.id))}>Retirar do banco</button>}</> : !live && <button onClick={() => onBench([...team.lineup.bench, player.id])}>Adicionar ao banco</button>}</>}
        </PlayerPanel> : <section className="panel"><h2>Slot vazio</h2><button onClick={() => setSelection(undefined)}>Fechar seleção</button></section>}
          {selection.slot !== undefined && <section className="panel replacement-panel"><h3>Substituir em {positionLabels[positions[selection.slot]]}</h3><p className="muted">{live ? 'Escolha uma reserva ou reposicione um titular. A saída definitiva só ocorre após confirmar.' : 'Escolha uma reserva ou outro titular. O titular atual volta ao banco ou troca de posição.'}</p><div className="replacement-list">{candidates.filter(candidate => candidate.id !== player?.id).map(candidate => <button disabled={locked} key={candidate.id} onClick={() => apply(candidate.id, selection.slot!)}><span>{candidate.displayName}<small>{positionLabel(candidate.primaryPosition)} · {team.lineup.bench.includes(candidate.id) ? 'Banco' : 'Titular'} · Condição {candidate.fitness}%</small></span><span>↔</span></button>)}</div></section>}
        </div>}
      </div>
    </div>
    {drag.drag && <div className={`drag-ghost ${drag.drag.target === undefined ? 'invalid-drop' : ''}`} style={{ transform: `translate(${drag.drag.x + 16}px, ${drag.drag.y + 16}px)` }} aria-hidden="true"><strong>{team.players.find(player => player.id === drag.drag?.playerId)?.displayName}</strong><small>{drag.drag.target === undefined ? 'Solte sobre uma camisa' : `Trocar em ${positionLabel(positions[drag.drag.target])}`}</small></div>}
    <p className="drag-feedback" role="status">{feedback}</p><ValidationPanel session={session} />
  </>
}


