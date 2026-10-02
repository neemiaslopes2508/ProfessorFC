import { useRef, useState } from 'react'
import type { PointerEvent, KeyboardEvent } from 'react'
import type { PlayerId } from '../../core/ids'

interface Gesture { pointerId: number; playerId: PlayerId; startX: number; startY: number; moved: boolean; element: HTMLButtonElement }
interface DragView { playerId: PlayerId; x: number; y: number; target?: number }

/** Somente gesto/feedback. A operação esportiva é recebida da camada de aplicação. */
export function useTeamDrag(locked: boolean, onMove: (playerId: PlayerId, slot: number) => boolean, onFeedback: (text: string) => void) {
  const gesture = useRef<Gesture | undefined>(undefined)
  const suppressClick = useRef(false)
  const [drag, setDrag] = useState<DragView>()
  function targetAt(x: number, y: number): number | undefined {
    const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-team-slot]')
    if (!element) return undefined
    const value = Number(element.dataset.teamSlot)
    return Number.isInteger(value) ? value : undefined
  }
  function clear() {
    const current = gesture.current
    gesture.current = undefined
    if (current?.element.hasPointerCapture(current.pointerId)) current.element.releasePointerCapture(current.pointerId)
    setDrag(undefined)
  }
  function begin(event: PointerEvent<HTMLButtonElement>, playerId?: PlayerId) {
    if (locked || !playerId || gesture.current || !event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    gesture.current = { pointerId: event.pointerId, playerId, startX: event.clientX, startY: event.clientY, moved: false, element: event.currentTarget }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function move(event: PointerEvent<HTMLElement>) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 7) return
    current.moved = true
    setDrag({ playerId: current.playerId, x: event.clientX, y: event.clientY, target: targetAt(event.clientX, event.clientY) })
  }
  function end(event: PointerEvent<HTMLElement>) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    if (current.moved) {
      suppressClick.current = true
      const target = targetAt(event.clientX, event.clientY)
      if (target === undefined) onFeedback('Destino inválido. Solte sobre uma camisa do campo; a equipe não foi alterada.')
      else if (onMove(current.playerId, target)) onFeedback('Troca aplicada. Confira a escalação e os alertas de posição.')
    }
    clear()
  }
  function cancel() {
    if (gesture.current?.moved) suppressClick.current = true
    clear()
    onFeedback('Arraste cancelado. A equipe não foi alterada.')
  }
  function keyDown(event: KeyboardEvent<HTMLElement>) { if (event.key === 'Escape' && gesture.current) { event.preventDefault(); cancel() } }
  function consumeClick(): boolean { if (!suppressClick.current) return false; suppressClick.current = false; return true }
  return { drag, begin, consumeClick, handlers: { onPointerMove: move, onPointerUp: end, onPointerCancel: cancel, onKeyDown: keyDown } }
}
