import { createDevelopmentFixture } from '../src/data/fixtures/development'
import { loadGameData } from '../src/data'
import { createPlayer } from '../src/domain/players'
import { FORMATION_POSITIONS } from '../src/domain/tactics'
import { createSeededRandomSource } from '../src/core/random'
import { simulateMatch } from '../src/simulation'
import { ENGINE_FACTORS, resolveMatchEngineConfig } from '../src/simulation/config'
import type { MatchEngineConfig } from '../src/simulation/config'
import type { MatchSimulationInput, SimulationTeam } from '../src/simulation'

export interface AnalyzerScenario {
  readonly name: string
  readonly pairs: readonly { home: SimulationTeam; away: SimulationTeam }[]
  readonly neutralVenue: boolean
}

/** Fixture carregada uma única vez; escalação explícita, sem IA nem alteração da base. */
export function createAnalyzerScenarios(): readonly AnalyzerScenario[] {
  const loaded = loadGameData(createDevelopmentFixture(), 'development')
  if (!loaded.ok) throw new Error('Fixture de desenvolvimento inválida.')
  const teams: SimulationTeam[] = loaded.repositories.clubs.getAll().map(club => {
    const startingPlayers = [0, 2, 6, 7, 4, 10, 12, 13, 16, 17, 18].map(index => club.playerIds[index])
    return {
      club, players: loaded.repositories.players.getAll().filter(player => player.clubId === club.id),
      lineup: {
        startingPlayers, bench: club.playerIds.filter(id => !startingPlayers.includes(id)),
        positions: FORMATION_POSITIONS['4-3-3'].map((position, index) => ({ playerId: startingPlayers[index], position })),
      },
      tactics: { formation: '4-3-3', mentality: 'BALANCED', style: 'BALANCED' },
    }
  })
  function controlled(team: SimulationTeam, rating: number): SimulationTeam {
    return {
      ...team,
      players: team.players.map(player => createPlayer({
        ...player, form: 100, fitness: 100,
        attributes: { finishing: rating, passing: rating, technique: rating, defending: rating,
          pace: rating, physical: rating, stamina: rating, decision: rating },
      })),
    }
  }
  const strong = controlled(teams[5], 65)
  const weak = controlled(teams[0], 50)
  const equalA = controlled(teams[0], 60)
  const equalB = controlled(teams[1], 60)
  return [
    { name: 'fixture-mista', neutralVenue: false, pairs: teams.flatMap(home => teams.filter(away => away.club.id !== home.club.id).map(away => ({ home, away }))) },
    { name: 'forte-mandante', neutralVenue: false, pairs: [{ home: strong, away: weak }] },
    { name: 'forte-visitante', neutralVenue: false, pairs: [{ home: weak, away: strong }] },
    { name: 'forte-neutro', neutralVenue: true, pairs: [{ home: strong, away: weak }] },
    { name: 'iguais-mando', neutralVenue: false, pairs: [{ home: equalA, away: equalB }] },
    { name: 'iguais-invertidos', neutralVenue: false, pairs: [{ home: equalB, away: equalA }] },
    { name: 'iguais-neutro', neutralVenue: true, pairs: [{ home: equalA, away: equalB }] },
  ]
}

// Dispersa seeds adjacentes para evitar correlação entre o primeiro sorteio e o índice.
export function analyzerSeed(baseSeed: number, index: number): number {
  let value = (baseSeed + index) >>> 0
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d)
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b)
  return (value ^ (value >>> 16)) >>> 0
}

export function analyzeScenario(scenario: AnalyzerScenario, matches: number, baseSeed = 2026, config: Partial<MatchEngineConfig> = {}) {
  if (!Number.isSafeInteger(matches) || matches < 1) throw new Error('Quantidade de partidas deve ser inteira e positiva.')
  if (!Number.isSafeInteger(baseSeed) || baseSeed < 0 || baseSeed > 0xffffffff || matches > 0x100000000 - baseSeed) {
    throw new Error('Intervalo de seeds deve caber em uint32 sem repetição.')
  }
  if (!scenario.pairs.length) throw new Error('Cenário precisa de confrontos.')
  const resolvedConfig = resolveMatchEngineConfig(config)
  const sums = { goals: { home: 0, away: 0 }, shots: { home: 0, away: 0 }, shotsOnTarget: { home: 0, away: 0 },
    possession: { home: 0, away: 0 }, corners: { home: 0, away: 0 }, fouls: { home: 0, away: 0 },
    yellowCards: { home: 0, away: 0 }, redCards: { home: 0, away: 0 } }
  const outcomes = { homeWins: 0, draws: 0, awayWins: 0 }
  const goalBuckets: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6+': 0 }
  const scorelines: Record<string, number> = {}
  const exactGoals: Record<string, number> = {}
  let maximumGoals = 0
  let upsetEligible = 0
  let upsets = 0
  let invariantViolations = 0
  const strengths = scenario.pairs.map(pair => ({ home: pair.home.club.name, away: pair.away.club.name, homeStrength: 0, awayStrength: 0 }))
  const started = performance.now()
  for (let index = 0; index < matches; index++) {
    const pairIndex = index % scenario.pairs.length
    const pair = scenario.pairs[pairIndex]
    const input: MatchSimulationInput = { ...pair, context: { neutralVenue: scenario.neutralVenue },
      random: createSeededRandomSource(analyzerSeed(baseSeed, index)), config: resolvedConfig }
    const result = simulateMatch(input)
    const { homeGoals, awayGoals } = result.score
    const totalGoals = homeGoals + awayGoals
    sums.goals.home += homeGoals
    sums.goals.away += awayGoals
    for (const key of Object.keys(result.statistics) as (keyof typeof result.statistics)[]) {
      sums[key].home += result.statistics[key].home
      sums[key].away += result.statistics[key].away
    }
    if (homeGoals > awayGoals) outcomes.homeWins++
    else if (homeGoals < awayGoals) outcomes.awayWins++
    else outcomes.draws++
    goalBuckets[totalGoals >= 6 ? '6+' : String(totalGoals)]++
    exactGoals[totalGoals] = (exactGoals[totalGoals] ?? 0) + 1
    const score = `${homeGoals}-${awayGoals}`
    scorelines[score] = (scorelines[score] ?? 0) + 1
    maximumGoals = Math.max(maximumGoals, totalGoals)
    const homeStrength = result.debug.home.overall / result.debug.home.modifiers.home
    const awayStrength = result.debug.away.overall
    strengths[pairIndex].homeStrength = homeStrength
    strengths[pairIndex].awayStrength = awayStrength
    // Zebra = vitória do fraco quando o forte é pelo menos 10% superior, sem mando.
    if (Math.max(homeStrength, awayStrength) / Math.min(homeStrength, awayStrength) >= 1.1) {
      upsetEligible++
      if ((homeStrength < awayStrength && homeGoals > awayGoals) || (awayStrength < homeStrength && awayGoals > homeGoals)) upsets++
    }
    const stats = result.statistics
    if (stats.shotsOnTarget.home > stats.shots.home || stats.shotsOnTarget.away > stats.shots.away ||
      homeGoals > stats.shotsOnTarget.home || awayGoals > stats.shotsOnTarget.away ||
      Math.abs(stats.possession.home + stats.possession.away - 100) > 1e-9 ||
      result.events.filter(event => event.type === 'GOAL' && event.clubId === pair.home.club.id).length !== homeGoals ||
      result.events.filter(event => event.type === 'GOAL' && event.clubId === pair.away.club.id).length !== awayGoals ||
      result.events.some((event, eventIndex) => eventIndex > 0 && event.minute < result.events[eventIndex - 1].minute)) invariantViolations++
  }
  const elapsedMs = performance.now() - started
  const means = Object.fromEntries(Object.entries(sums).map(([key, value]) => [key,
    { home: value.home / matches, away: value.away / matches, total: (value.home + value.away) / matches }])) as
    Record<keyof typeof sums, { home: number; away: number; total: number }>
  return {
    name: scenario.name, matches, baseSeed, neutralVenue: scenario.neutralVenue, config: resolvedConfig, engineFactors: { ...ENGINE_FACTORS }, strengths,
    means, outcomes, outcomePercent: { homeWins: outcomes.homeWins / matches * 100, draws: outcomes.draws / matches * 100, awayWins: outcomes.awayWins / matches * 100 },
    goalBuckets, exactGoals, scorelines, maximumGoals, upsets: { eligible: upsetEligible, wins: upsets, percent: upsetEligible ? upsets / upsetEligible * 100 : null },
    invariantViolations, elapsedMs,
  }
}

export function runAnalyzer(matches = 10000, baseSeed = 2026, config: Partial<MatchEngineConfig> = {}) {
  return createAnalyzerScenarios().map(scenario => analyzeScenario(scenario, matches, baseSeed, config))
}

export function renderAnalyzerReport(reports: ReturnType<typeof runAnalyzer>): string {
  const lines = ['# Professor FC — Avaliação estatística do MatchEngine v0.1', '',
    'Fixture fictícia exclusivamente de desenvolvimento. Sem React ou renderização.', '',
    'Cada cenário usa a mesma sequência de seeds dispersas a partir da seed-base; a ordem de eventos pode divergir entre cenários. Tempos medem o loop completo (validação, simulação e agregação), excluindo carregamento do runner.', '',
    'Amostra mista: 30 confrontos ordenados dos seis clubes, em ciclo fixo; 10.000 não divide 30 e os primeiros dez pares recebem uma partida extra. Sem evolução entre partidas.', '',
    'Controles: mesmos esquemas 4-3-3 equilibrados; cópias da fixture com todos os atributos em 65 (forte), 50 (fraco) ou 60 (iguais), forma/fitness 100. IDs e posições preservados. Não altera o dataset original.', '',
    'Zebra: vitória do mais fraco quando o forte possui força geral sem mando pelo menos 10% superior (razão forte/fraco ≥ 1,1). Empate não é zebra. Percentual calculado apenas sobre confrontos elegíveis. Não é uma definição universal nem calibração com futebol real.', '']
  for (const report of reports) {
    lines.push(`## ${report.name}`, '', `Partidas: ${report.matches}; seed-base: ${report.baseSeed}; duração: ${(report.elapsedMs / 1000).toFixed(2)} s; campo neutro: ${report.neutralVenue}.`, '',
      `Configuração: \`${JSON.stringify(report.config)}\``, '',
      `Fatores internos: \`${JSON.stringify(report.engineFactors)}\``, '',
      '| Métrica | Mandante | Visitante | Total |', '| --- | ---: | ---: | ---: |')
    for (const [key, mean] of Object.entries(report.means)) lines.push(`| ${key} | ${mean.home.toFixed(3)} | ${mean.away.toFixed(3)} | ${mean.total.toFixed(3)} |`)
    lines.push('', `Vitória mandante: ${report.outcomePercent.homeWins.toFixed(2)}%; empate: ${report.outcomePercent.draws.toFixed(2)}%; vitória visitante: ${report.outcomePercent.awayWins.toFixed(2)}%.`, '',
      `Zebras: ${report.upsets.wins}/${report.upsets.eligible} (${report.upsets.percent?.toFixed(2) ?? 'não aplicável'}%). Máximo de gols: ${report.maximumGoals}. Partidas com violações de invariantes: ${report.invariantViolations}.`, '',
      '| Gols totais | Partidas | Frequência |', '| --- | ---: | ---: |')
    for (const [bucket, count] of Object.entries(report.goalBuckets)) lines.push(`| ${bucket} | ${count} | ${(count / report.matches * 100).toFixed(2)}% |`)
    lines.push('', 'Distribuição completa de placares (mandante-visitante):', '',
      Object.entries(report.scorelines).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })).map(([score, count]) => `${score}: ${count}`).join('; '), '',
      `Gols exatos: ${JSON.stringify(report.exactGoals)}`, '',
      'Forças gerais sem mando por confronto:', '', ...report.strengths.map(pair => `- ${pair.home} (${pair.homeStrength.toFixed(2)}) × ${pair.away} (${pair.awayStrength.toFixed(2)}).`), '')
  }
  return lines.join('\n') + '\n'
}
