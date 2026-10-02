import { createServer } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { simulateDevelopmentCalendar } = await server.ssrLoadModule('/scripts/developmentCalendar.ts')
  const report = simulateDevelopmentCalendar(Number(process.argv[2] ?? 2026))
  await mkdir('reports/development-calendar', { recursive: true })
  await writeFile('reports/development-calendar/results.json', JSON.stringify(report, null, 2) + '\n')
  const table = ['| Pos | Clube | J | V | E | D | GP | GC | SG | PTS |', '| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...report.standings.map(row => `| ${row.position} | ${row.club} | ${row.played} | ${row.wins} | ${row.draws} | ${row.losses} | ${row.goalsFor} | ${row.goalsAgainst} | ${row.goalDifference} | ${row.points} |`)].join('\n')
  const text = `# Development Calendar — demonstração fictícia\n\nSeed-base: ${report.baseSeed}. Clube humano: ${report.humanClub}.\n\nConfiguração: ${JSON.stringify(report.configuration)}\n\n${report.trace.join('\n\n')}\n\n${table}\n\n${report.matches} jogos; ${report.completedRounds} rodadas concluídas; data final ${report.currentDate}; edição ${report.season.status}.\n\nO script chama PLAY_MATCH explicitamente após cada bloqueio; a aplicação temporal não automatiza a decisão humana. Fixture nunca é base oficial. MatchEngine sem alterações.\n`
  await writeFile('reports/development-calendar/REPORT.md', text)
  console.log(text)
} finally { await server.close() }
