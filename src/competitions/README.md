# Liga genérica — Fase 7

`createLeagueSeason(competition, season, rules?)` aceita exclusivamente LEAGUE de grupo único, edição SCHEDULED sem campeão e pelo menos dois participantes únicos. Retorna `LeagueSeason`: snapshot de `CompetitionSeason`, fixtures, regras copiadas e registro de resultados. O estado de execução não altera GameData/repositórios nem os modelos-base da fixture. Não é parser de JSON nem implementação de save.

`generateLeagueFixtures(seasonId, clubIds, legs)` usa método circular com IDs ordenados de forma canônica. Ordem original dos participantes não muda o sorteio, que não consome RNG. Cada clube joga no máximo uma vez por rodada. Quantidades ímpares têm folgas; turno único também é suportado. No turno/returno cada confronto retorna com mando invertido e rodada deslocada. Para seis clubes: 10 rodadas, três jogos por rodada, 30 jogos, dez jogos e cinco adversários por clube.

Fixtures possuem ID estável, edição, rodada, turno e mandos, sem data. A Fase 8 associa datas por `createSeasonSchedule` e projeta `Match` em `application/getScheduledMatch`, sem duplicar resultados. Um resultado registrado representa uma partida concluída; o estado SCHEDULED/FINISHED de cada jogo é inferido pela presença de seu ID no registro.

`recordLeagueMatch(league, matchId, result)` valida ID conhecido/único, modelos de resultado/estatísticas/eventos, clubes e cronologia dos eventos, gols compatíveis com GOAL e finalizações no alvo. Rejeita duplicação mesmo com placar diferente; não substitui resultado antigo. Copia score, estatísticas e eventos (metadados clonados, opacos, sem garantia de congelamento profundo). Não altera a entrada. O consumidor fornece o resultado do confronto correspondente ao ID; o resultado do motor não contém identificação dos clubes em seu cabeçalho.

`application/registerLeagueMatchResult.ts` recebe explicitamente `MatchSimulationResult` e retorna `{ league, standings }`. Não simula partidas, não escolhe jogadores e não importa fixtures. Debug do motor não é guardado na liga. O registro mantém placar, eventos e estatísticas; a classificação é derivada com `getLeagueStandings` e não persistida como segunda fonte de verdade. Resultado inválido falha antes de entregar um novo estado.

Pontuação: vitória 3, empate 1, derrota 0. Classificação inclui jogos, vitórias, empates, derrotas, gols pró/contra, saldo, pontos e posição. `LeagueRules.tieBreakers` é uma sequência de campo numérico/direção, padrão pontos → vitórias → saldo → gols pró, todos decrescentes. Novos critérios numéricos podem ser adicionados aos tipos/regras; critérios de confronto direto ainda não existem. Empate absoluto usa ID crescente como fallback técnico determinístico, inclusive para determinar o campeão nesta versão; não representa regulamento oficial de nenhum país.

`positionOutcomes` associa posições a `champion`, `promotion`, `relegation`, `qualification`. São rótulos indicativos na tabela; resultados esportivos só são definitivos ao encerrar a edição. Champion pode marcar apenas a primeira posição. Nenhum clube muda de divisão ou ingressa em outra competição. Após o primeiro resultado, a edição vira IN_PROGRESS; no fluxo temporal, `beginLeagueSeason` também inicia a edição no evento SEASON_START. Apenas quando todas as fixtures têm resultado vira FINISHED com `championId` igual ao primeiro colocado. Pontuação e regras não mudam durante uma execução.

## Demonstração

`pnpm demo:league` executa a liga fictícia completa com as mesmas escalações explícitas 4-3-3 equilibradas da fixture e seeds determinísticas por partida. `pnpm demo:league 2026` explicita a seed-base. O runner usa Vite instalado apenas para carregar TypeScript em Node, sem navegador/React/servidor HTTP.

Gera classificação, campeão e placares por rodada em `reports/development-league/REPORT.md` e `results.json`. Não tem IA, desgaste, progressão, calendário global, movimentação entre divisões ou UI. Fixtures fictícias nunca são a base oficial do Professor FC. A demonstração não altera parâmetros do MatchEngine e não é evidência de balanceamento.

A demonstração temporal da Fase 8 é `pnpm demo:calendar 2026`. Consulte [../domain/calendar/README.md](../domain/calendar/README.md) para datas, estado derivado de rodada, bloqueio humano e múltiplas competições.
