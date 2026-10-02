# Professor FC — Revisão estatística da Fase 6

Execução local em 30/09/2026. Sete cenários de 10.000 partidas cada, seed-base 2026, antes e depois (140.000 partidas no total). Dados fictícios exclusivamente de desenvolvimento. As condições e distribuições completas estão em [antes](before/REPORT.md) e [depois](after/REPORT.md), acompanhadas de JSON bruto. Cenários usam a mesma sequência de seeds; não há evolução, desgaste ou alteração da base entre jogos.

## Diagnóstico e ajustes

Antes de qualquer ajuste, a amostra mista apresentou 4,358 gols/jogo, 27,55% com 6+ gols e somente 11,83% de empates. A equipe com atributos 65 contra 50 venceu 95,40% como mandante, com apenas 1,19% de derrotas. Não são comparações com futebol real; revelam amplificação excessiva para o objetivo de v0.1: força pesa simultaneamente em posse, criação, acerto e conversão.

Ajustes mínimos, sem reescrever o motor:

- `baseConversionRate`: 0,28 → 0,24, em `src/simulation/config.ts`.
- Razões de força na chance e na conversão: expoente efetivo 1 → 0,5, centralizado como `ENGINE_FACTORS.strengthRatioExponent`. Chance usa `(ataque/defesa)^0,5`; conversão usa `((ataque/defesa)*(finalizador/goleiro))^0,5`.
- Mando permanece 0,03; atributos, setores, posse, acerto, faltas/cartões, limite de gols e eventos permanecem com suas regras anteriores. Não foi criado limite de placar.

| Métrica da amostra mista | Antes | Depois |
| --- | ---: | ---: |
| Gols por partida | 4,358 | 2,802 |
| Gols mandante | 2,341 | 1,467 |
| Gols visitante | 2,017 | 1,335 |
| Vitória mandante | 47,28% | 41,58% |
| Empate | 11,83% | 20,71% |
| Vitória visitante | 40,89% | 37,71% |
| Finalizações | 20,203 | 19,023 |
| No alvo | 10,454 | 9,775 |
| Faltas | 25,153 | 25,160 |
| Amarelos | 4,005 | 4,018 |
| Partidas com 6+ gols | 27,55% | 6,53% |
| Zebras entre confrontos elegíveis | 5,70% | 13,20% |

## Força, zebras e mando

Controles preservam identidade/posição da fixture, mas usam atributos uniformes (65 forte, 50 fraco, 60 iguais), forma/fitness 100 e 4-3-3 equilibrado. O forte é 30% superior ao fraco; não simula clubes reais. Zebra é vitória do fraco quando o forte possui força geral sem mando pelo menos 10% superior (razão ≥ 1,1), com percentual sobre partidas elegíveis; empates não contam.

| Cenário | Vitória do forte antes | Vitória do forte depois | Empates depois | Zebras antes → depois |
| --- | ---: | ---: | ---: | ---: |
| Forte mandante | 95,40% | 76,39% | 15,97% | 1,19% → 7,64% |
| Forte visitante (mesmo confronto invertido) | 91,90% | 72,23% | 17,86% | 2,41% → 9,91% |
| Forte em campo neutro | 93,88% | 74,11% | 17,35% | 1,71% → 8,54% |

Entre iguais, a vitória do lado mandante passou de 38,28% em campo neutro para 43,28% com mando antes; depois, 36,42% → 39,18% (+2,76 pontos percentuais). A diferença entre vitórias do forte em casa e fora passou de 3,50 para 4,16 pontos percentuais. Inverter a identidade dos times iguais mantém todos os agregados exatamente iguais: o efeito acompanha o mando, não o nome/ID. Em campo neutro após ajuste, iguais vencem 36,42%/36,13%, com 27,45% de empate; a diferença residual é amostral.

Na amostra mista após ajuste, zebras: 880/6.667 partidas elegíveis (13,20%). A amostra inteira tem 10.000 partidas; confrontos semelhantes ficam fora desse denominador.

## Distribuição de gols — amostra mista

| Gols totais | Antes | Depois | Quantidade depois |
| --- | ---: | ---: | ---: |
| 0 | 1,65% | 6,25% | 625 |
| 1 | 6,57% | 17,30% | 1.730 |
| 2 | 12,89% | 23,10% | 2.310 |
| 3 | 17,11% | 22,27% | 2.227 |
| 4 | 18,58% | 15,46% | 1.546 |
| 5 | 15,65% | 9,09% | 909 |
| 6+ | 27,55% | 6,53% | 653 |

O máximo caiu de 16 para 15 gols totais na amostra mista; extremos continuam possíveis, mas a faixa 6+ deixou de dominar. Partidas com 10+ gols: 215 antes (2,15%) e 8 depois (0,08%). Placares individuais e distribuição exata de gols estão nos relatórios completos/JSON, sem ocultar a cauda.

## Performance, validação e limites

10.000 partidas da amostra mista: 2,43 s antes e 2,33 s depois, incluindo validação, simulação e agregação; todos os cenários ficaram aproximadamente entre 2,2 e 2,6 s. Exclui carregamento do Vite/fixture e escrita de arquivos. Não houve gargalo que justificasse otimização do motor.

Zero partidas com violações das invariantes verificadas em todos os cenários antes/depois: placar versus GOAL, gols ≤ alvo ≤ finalizações, posse total e ordem cronológica. Não constitui prova de todas as regras possíveis.

Persistem limites conhecidos: a precisão depende de força absoluta; GK usa atributos genéricos; um ciclo por minuto simplifica posse/chances; faltas interrompem chances; não há segundo amarelo ou vermelho. Média de escanteios (~4 totais) e a cauda extrema merecem acompanhamento futuro. Não alteramos essas regras nem calibramos táticas nesta fase. Intervalos de confiança e validação contra dados reais também não fazem parte desta avaliação; com 10.000 jogos, erro amostral binomial máximo aproximado é ±0,98 ponto percentual (95%), sem presumir independência perfeita do PRNG.

Não foi alegado realismo perfeito. Os parâmetros foram ajustados após registrar distorções e antes de executar os testes novos, sem perseguir limiares de teste. Documentos oficiais mantidos e nenhuma funcionalidade da Fase 7 implementada.
