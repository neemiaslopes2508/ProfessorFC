import { humanTeam, selectionValidation } from '../../application/prototypeSession'
import type { PrototypeSession } from '../../application/prototypeSession'
import { readableSelectionMessage } from './presentation'

export function ValidationPanel({ session }: { session: PrototypeSession }) {
  const validation = selectionValidation(session)
  const players = humanTeam(session).players
  function readable(message: string) {
    return readableSelectionMessage(players.reduce((text, player) => text.replaceAll(`"${player.id}"`, player.displayName), message))
  }
  return <div aria-live="polite" className="validation">
    {validation.errors.length > 0 && <section className="notice error"><h3>Erros — impedem a partida</h3><ul>{validation.errors.map((error, index) => <li key={index}>{readable(error.message)}</li>)}</ul></section>}
    {validation.warnings.length > 0 && <section className="notice warning"><h3>Alertas — não impedem a partida</h3><ul>{validation.warnings.map((warning, index) => <li key={index}>{readable(warning.message)}</li>)}</ul></section>}
    {validation.valid && <p className="notice success">Escalação válida · {humanTeam(session).lineup.startingPlayers.length} titulares · {humanTeam(session).lineup.bench.length} reservas</p>}
  </div>
}
