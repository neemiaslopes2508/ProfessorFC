import { createServer } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [matchesArg = '10000', seedArg = '2026', outputArg = 'reports/match-engine-v0.1/latest'] = process.argv.slice(2)
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const analyzer = await server.ssrLoadModule('/scripts/simulationAnalyzer.ts')
  const reports = analyzer.runAnalyzer(Number(matchesArg), Number(seedArg))
  const output = resolve(outputArg)
  await mkdir(output, { recursive: true })
  await writeFile(resolve(output, 'results.json'), JSON.stringify(reports, null, 2) + '\n')
  await writeFile(resolve(output, 'REPORT.md'), analyzer.renderAnalyzerReport(reports))
  console.log(JSON.stringify(reports.map(({ name, matches, means, outcomePercent, upsets, goalBuckets, maximumGoals, invariantViolations, elapsedMs }) =>
    ({ name, matches, means, outcomePercent, upsets, goalBuckets, maximumGoals, invariantViolations, elapsedMs })), null, 2))
  console.log(`Relatórios: ${output}`)
} finally {
  await server.close()
}
