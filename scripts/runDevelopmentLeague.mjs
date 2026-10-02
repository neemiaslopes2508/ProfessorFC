import { createServer } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { simulateDevelopmentLeague } = await server.ssrLoadModule('/scripts/developmentLeague.ts')
  const report = simulateDevelopmentLeague(Number(process.argv[2] ?? 2026))
  await mkdir('reports/development-league', { recursive: true })
  await writeFile('reports/development-league/results.json', JSON.stringify(report, null, 2) + '\n')
  const table = ['| Pos | Clube | J | V | E | D | GP | GC | SG | PTS |', '| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...report.standings.map(row => `| ${row.position} | ${row.club} | ${row.played} | ${row.wins} | ${row.draws} | ${row.losses} | ${row.goalsFor} | ${row.goalsAgainst} | ${row.goalDifference} | ${row.points} |`)].join('\n')
  const text = `# Development League — demonstração fictícia\n\nSeed-base: ${report.baseSeed}; seeds: ${report.seedRecipe}.\n\n${report.rounds} rodadas, ${report.matches} partidas; temporada ${report.season.status}.\n\n${table}\n\nCampeão: **${report.champion}**.\n\nFixture exclusivamente de desenvolvimento; nunca é a base oficial do Professor FC. Nenhum parâmetro do MatchEngine foi alterado nesta fase.\n`
  await writeFile('reports/development-league/REPORT.md', text)
  console.log(text)
} finally {
  await server.close()
}
