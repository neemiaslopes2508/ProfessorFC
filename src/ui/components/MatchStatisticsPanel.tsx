import type { MatchStatistics } from '../../domain/matches'
import { statisticLabels } from './presentation'

export function MatchStatisticsPanel({ statistics, homeLabel, awayLabel }: { statistics?: MatchStatistics; homeLabel: string; awayLabel: string }) {
  return <section className="panel match-statistics"><h2>Estatísticas</h2>{statistics ? <table className="match-stats"><caption className="sr-only">Estatísticas da partida: mandante e visitante</caption><thead><tr><th scope="col">{homeLabel}</th><th scope="col">Estatística</th><th scope="col">{awayLabel}</th></tr></thead><tbody>{Object.entries(statistics).map(([key, values]) => <tr key={key}><td>{values.home}</td><th scope="row">{statisticLabels[key as keyof typeof statisticLabels]}</th><td>{values.away}</td></tr>)}</tbody></table> : <p className="muted">Estatísticas disponíveis quando a sessão da partida for iniciada.</p>}</section>
}
