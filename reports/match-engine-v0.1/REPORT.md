# Professor FC — Avaliação estatística do MatchEngine v0.1

Fixture fictícia exclusivamente de desenvolvimento. Sem React ou renderização.

Cada cenário usa a mesma sequência de seeds dispersas a partir da seed-base; a ordem de eventos pode divergir entre cenários. Tempos medem o loop completo (validação, simulação e agregação), excluindo carregamento do runner.

Amostra mista: 30 confrontos ordenados dos seis clubes, em ciclo fixo; 10.000 não divide 30 e os primeiros dez pares recebem uma partida extra. Sem evolução entre partidas.

Controles: mesmos esquemas 4-3-3 equilibrados; cópias da fixture com todos os atributos em 65 (forte), 50 (fraco) ou 60 (iguais), forma/fitness 100. IDs e posições preservados. Não altera o dataset original.

Zebra: vitória do mais fraco quando o forte possui força geral sem mando pelo menos 10% superior (razão forte/fraco ≥ 1,1). Empate não é zebra. Percentual calculado apenas sobre confrontos elegíveis. Não é uma definição universal nem calibração com futebol real.

## fixture-mista

Partidas: 10000; seed-base: 2026; duração: 2.33 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.467 | 1.335 | 2.802 |
| shots | 9.845 | 9.179 | 19.023 |
| shotsOnTarget | 5.052 | 4.723 | 9.775 |
| possession | 50.762 | 49.238 | 100.000 |
| corners | 2.080 | 1.965 | 4.045 |
| fouls | 12.409 | 12.751 | 25.160 |
| yellowCards | 1.980 | 2.038 | 4.018 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 41.58%; empate: 20.71%; vitória visitante: 37.71%.

Zebras: 880/6667 (13.20%). Máximo de gols: 15. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 625 | 6.25% |
| 1 | 1730 | 17.30% |
| 2 | 2310 | 23.10% |
| 3 | 2227 | 22.27% |
| 4 | 1546 | 15.46% |
| 5 | 909 | 9.09% |
| 6+ | 653 | 6.53% |

Distribuição completa de placares (mandante-visitante):

0-0: 625; 0-1: 886; 0-2: 653; 0-3: 376; 0-4: 164; 0-5: 62; 0-6: 21; 0-7: 5; 1-0: 844; 1-1: 963; 1-2: 665; 1-3: 353; 1-4: 165; 1-5: 61; 1-6: 15; 1-7: 10; 1-8: 3; 2-0: 694; 2-1: 706; 2-2: 397; 2-3: 186; 2-4: 83; 2-5: 22; 2-6: 4; 2-7: 1; 3-0: 480; 3-1: 396; 3-2: 218; 3-3: 81; 3-4: 29; 3-5: 4; 3-6: 1; 3-7: 1; 3-12: 1; 4-0: 236; 4-1: 173; 4-2: 74; 4-3: 20; 4-4: 4; 5-0: 105; 5-1: 66; 5-2: 28; 5-3: 9; 5-4: 3; 5-5: 1; 6-0: 42; 6-1: 24; 6-2: 9; 6-3: 3; 6-4: 1; 7-0: 9; 7-1: 4; 7-2: 1; 8-0: 3; 8-1: 5; 9-0: 1; 9-1: 2; 10-0: 1; 10-1: 1

Gols exatos: {"0":625,"1":1730,"2":2310,"3":2227,"4":1546,"5":909,"6":428,"7":152,"8":47,"9":18,"10":6,"11":1,"15":1}

Forças gerais sem mando por confronto:

- Aurora Inventada (47.75) × Horizonte Imaginário (51.48).
- Aurora Inventada (47.75) × Vale do Eclipse (55.22).
- Aurora Inventada (47.75) × Estrela de Papel (58.95).
- Aurora Inventada (47.75) × Porto das Nuvens (62.69).
- Aurora Inventada (47.75) × Serra dos Ventos (66.43).
- Horizonte Imaginário (51.48) × Aurora Inventada (47.75).
- Horizonte Imaginário (51.48) × Vale do Eclipse (55.22).
- Horizonte Imaginário (51.48) × Estrela de Papel (58.95).
- Horizonte Imaginário (51.48) × Porto das Nuvens (62.69).
- Horizonte Imaginário (51.48) × Serra dos Ventos (66.43).
- Vale do Eclipse (55.22) × Aurora Inventada (47.75).
- Vale do Eclipse (55.22) × Horizonte Imaginário (51.48).
- Vale do Eclipse (55.22) × Estrela de Papel (58.95).
- Vale do Eclipse (55.22) × Porto das Nuvens (62.69).
- Vale do Eclipse (55.22) × Serra dos Ventos (66.43).
- Estrela de Papel (58.95) × Aurora Inventada (47.75).
- Estrela de Papel (58.95) × Horizonte Imaginário (51.48).
- Estrela de Papel (58.95) × Vale do Eclipse (55.22).
- Estrela de Papel (58.95) × Porto das Nuvens (62.69).
- Estrela de Papel (58.95) × Serra dos Ventos (66.43).
- Porto das Nuvens (62.69) × Aurora Inventada (47.75).
- Porto das Nuvens (62.69) × Horizonte Imaginário (51.48).
- Porto das Nuvens (62.69) × Vale do Eclipse (55.22).
- Porto das Nuvens (62.69) × Estrela de Papel (58.95).
- Porto das Nuvens (62.69) × Serra dos Ventos (66.43).
- Serra dos Ventos (66.43) × Aurora Inventada (47.75).
- Serra dos Ventos (66.43) × Horizonte Imaginário (51.48).
- Serra dos Ventos (66.43) × Vale do Eclipse (55.22).
- Serra dos Ventos (66.43) × Estrela de Papel (58.95).
- Serra dos Ventos (66.43) × Porto das Nuvens (62.69).

## forte-mandante

Partidas: 10000; seed-base: 2026; duração: 2.43 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 2.285 | 0.561 | 2.846 |
| shots | 12.347 | 6.783 | 19.129 |
| shotsOnTarget | 7.040 | 2.991 | 10.031 |
| possession | 57.330 | 42.670 | 100.000 |
| corners | 2.496 | 1.555 | 4.050 |
| fouls | 10.734 | 14.428 | 25.163 |
| yellowCards | 1.746 | 2.262 | 4.008 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 76.39%; empate: 15.97%; vitória visitante: 7.64%.

Zebras: 764/10000 (7.64%). Máximo de gols: 11. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 599 | 5.99% |
| 1 | 1620 | 16.20% |
| 2 | 2310 | 23.10% |
| 3 | 2262 | 22.62% |
| 4 | 1652 | 16.52% |
| 5 | 898 | 8.98% |
| 6+ | 659 | 6.59% |

Distribuição completa de placares (mandante-visitante):

0-0: 599; 0-1: 325; 0-2: 90; 0-3: 21; 0-4: 3; 1-0: 1295; 1-1: 721; 1-2: 222; 1-3: 39; 1-4: 4; 1-5: 1; 2-0: 1499; 2-1: 844; 2-2: 240; 2-3: 44; 2-4: 5; 3-0: 1175; 3-1: 639; 3-2: 190; 3-3: 33; 3-4: 10; 4-0: 731; 4-1: 389; 4-2: 95; 4-3: 26; 4-4: 4; 5-0: 271; 5-1: 150; 5-2: 44; 5-3: 8; 5-4: 2; 6-0: 115; 6-1: 50; 6-2: 21; 6-3: 3; 7-0: 39; 7-1: 26; 7-2: 5; 7-3: 1; 8-0: 8; 8-1: 6; 8-2: 1; 9-0: 2; 9-1: 2; 10-1: 1; 11-0: 1

Gols exatos: {"0":599,"1":1620,"2":2310,"3":2262,"4":1652,"5":898,"6":399,"7":169,"8":67,"9":18,"10":4,"11":2}

Forças gerais sem mando por confronto:

- Serra dos Ventos (65.22) × Aurora Inventada (50.17).

## forte-visitante

Partidas: 10000; seed-base: 2026; duração: 2.26 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 0.623 | 2.103 | 2.725 |
| shots | 7.324 | 11.606 | 18.930 |
| shotsOnTarget | 3.231 | 6.629 | 9.860 |
| possession | 44.265 | 55.735 | 100.000 |
| corners | 1.657 | 2.375 | 4.032 |
| fouls | 14.000 | 11.107 | 25.107 |
| yellowCards | 2.209 | 1.797 | 4.006 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 9.91%; empate: 17.86%; vitória visitante: 72.23%.

Zebras: 991/10000 (9.91%). Máximo de gols: 13. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 629 | 6.29% |
| 1 | 1792 | 17.92% |
| 2 | 2433 | 24.33% |
| 3 | 2224 | 22.24% |
| 4 | 1542 | 15.42% |
| 5 | 807 | 8.07% |
| 6+ | 573 | 5.73% |

Distribuição completa de placares (mandante-visitante):

0-0: 629; 0-1: 1390; 0-2: 1465; 0-3: 971; 0-4: 590; 0-5: 218; 0-6: 73; 0-7: 11; 0-8: 5; 0-9: 2; 1-0: 402; 1-1: 852; 1-2: 915; 1-3: 626; 1-4: 327; 1-5: 138; 1-6: 57; 1-7: 12; 1-8: 2; 1-12: 1; 2-0: 116; 2-1: 305; 2-2: 270; 2-3: 199; 2-4: 127; 2-5: 43; 2-6: 14; 2-7: 1; 2-8: 3; 3-0: 33; 3-1: 54; 3-2: 59; 3-3: 35; 3-4: 15; 3-5: 8; 3-6: 3; 3-7: 2; 3-8: 1; 4-0: 2; 4-1: 4; 4-2: 8; 4-3: 5; 4-5: 2; 4-6: 1; 4-7: 1; 5-1: 1; 5-2: 1; 5-3: 1

Gols exatos: {"0":629,"1":1792,"2":2433,"3":2224,"4":1542,"5":807,"6":382,"7":132,"8":40,"9":10,"10":6,"11":2,"13":1}

Forças gerais sem mando por confronto:

- Aurora Inventada (50.17) × Serra dos Ventos (65.22).

## forte-neutro

Partidas: 10000; seed-base: 2026; duração: 2.26 s; campo neutro: true.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 2.187 | 0.586 | 2.773 |
| shots | 12.017 | 6.990 | 19.006 |
| shotsOnTarget | 6.857 | 3.087 | 9.945 |
| possession | 56.611 | 43.389 | 100.000 |
| corners | 2.433 | 1.601 | 4.034 |
| fouls | 10.919 | 14.252 | 25.170 |
| yellowCards | 1.770 | 2.236 | 4.006 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 74.11%; empate: 17.35%; vitória visitante: 8.54%.

Zebras: 854/10000 (8.54%). Máximo de gols: 11. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 643 | 6.43% |
| 1 | 1682 | 16.82% |
| 2 | 2357 | 23.57% |
| 3 | 2286 | 22.86% |
| 4 | 1593 | 15.93% |
| 5 | 859 | 8.59% |
| 6+ | 580 | 5.80% |

Distribuição completa de placares (mandante-visitante):

0-0: 643; 0-1: 357; 0-2: 100; 0-3: 25; 0-4: 3; 1-0: 1325; 1-1: 792; 1-2: 245; 1-3: 46; 1-4: 8; 1-5: 1; 2-0: 1465; 2-1: 887; 2-2: 262; 2-3: 54; 2-4: 5; 3-0: 1129; 3-1: 630; 3-2: 190; 3-3: 33; 3-4: 10; 4-0: 652; 4-1: 369; 4-2: 88; 4-3: 23; 4-4: 5; 5-0: 238; 5-1: 140; 5-2: 41; 5-3: 10; 5-4: 2; 6-0: 94; 6-1: 36; 6-2: 17; 6-3: 1; 6-4: 1; 7-0: 30; 7-1: 21; 7-2: 6; 8-0: 4; 8-1: 7; 8-2: 3; 9-1: 1; 11-0: 1

Gols exatos: {"0":643,"1":1682,"2":2357,"3":2286,"4":1593,"5":859,"6":361,"7":140,"8":57,"9":16,"10":5,"11":1}

Forças gerais sem mando por confronto:

- Serra dos Ventos (65.22) × Aurora Inventada (50.17).

## iguais-mando

Partidas: 10000; seed-base: 2026; duração: 2.36 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.272 | 1.142 | 2.414 |
| shots | 9.610 | 8.929 | 18.539 |
| shotsOnTarget | 5.067 | 4.723 | 9.790 |
| possession | 50.797 | 49.203 | 100.000 |
| corners | 2.060 | 1.955 | 4.015 |
| fouls | 12.417 | 12.748 | 25.165 |
| yellowCards | 1.981 | 2.038 | 4.018 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 39.18%; empate: 27.24%; vitória visitante: 33.58%.

Zebras: 0/0 (não aplicável%). Máximo de gols: 10. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 875 | 8.75% |
| 1 | 2162 | 21.62% |
| 2 | 2623 | 26.23% |
| 3 | 2087 | 20.87% |
| 4 | 1291 | 12.91% |
| 5 | 604 | 6.04% |
| 6+ | 358 | 3.58% |

Distribuição completa de placares (mandante-visitante):

0-0: 875; 0-1: 1018; 0-2: 575; 0-3: 231; 0-4: 72; 0-5: 14; 1-0: 1144; 1-1: 1296; 1-2: 755; 1-3: 298; 1-4: 80; 1-5: 20; 1-6: 1; 2-0: 752; 2-1: 769; 2-2: 465; 2-3: 206; 2-4: 48; 2-5: 10; 2-6: 1; 2-7: 1; 3-0: 332; 3-1: 339; 3-2: 189; 3-3: 83; 3-4: 21; 3-5: 2; 4-0: 117; 4-1: 94; 4-2: 81; 4-3: 16; 4-4: 3; 4-5: 4; 4-6: 1; 5-0: 21; 5-1: 26; 5-2: 18; 5-3: 2; 5-4: 1; 5-5: 2; 6-0: 5; 6-1: 5; 6-2: 2; 6-3: 2; 7-1: 1; 7-2: 1; 7-3: 1

Gols exatos: {"0":875,"1":2162,"2":2623,"3":2087,"4":1291,"5":604,"6":263,"7":71,"8":11,"9":9,"10":4}

Forças gerais sem mando por confronto:

- Aurora Inventada (60.20) × Horizonte Imaginário (60.20).

## iguais-invertidos

Partidas: 10000; seed-base: 2026; duração: 2.24 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.272 | 1.142 | 2.414 |
| shots | 9.610 | 8.929 | 18.539 |
| shotsOnTarget | 5.067 | 4.723 | 9.790 |
| possession | 50.797 | 49.203 | 100.000 |
| corners | 2.060 | 1.955 | 4.015 |
| fouls | 12.417 | 12.748 | 25.165 |
| yellowCards | 1.981 | 2.038 | 4.018 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 39.18%; empate: 27.24%; vitória visitante: 33.58%.

Zebras: 0/0 (não aplicável%). Máximo de gols: 10. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 875 | 8.75% |
| 1 | 2162 | 21.62% |
| 2 | 2623 | 26.23% |
| 3 | 2087 | 20.87% |
| 4 | 1291 | 12.91% |
| 5 | 604 | 6.04% |
| 6+ | 358 | 3.58% |

Distribuição completa de placares (mandante-visitante):

0-0: 875; 0-1: 1018; 0-2: 575; 0-3: 231; 0-4: 72; 0-5: 14; 1-0: 1144; 1-1: 1296; 1-2: 755; 1-3: 298; 1-4: 80; 1-5: 20; 1-6: 1; 2-0: 752; 2-1: 769; 2-2: 465; 2-3: 206; 2-4: 48; 2-5: 10; 2-6: 1; 2-7: 1; 3-0: 332; 3-1: 339; 3-2: 189; 3-3: 83; 3-4: 21; 3-5: 2; 4-0: 117; 4-1: 94; 4-2: 81; 4-3: 16; 4-4: 3; 4-5: 4; 4-6: 1; 5-0: 21; 5-1: 26; 5-2: 18; 5-3: 2; 5-4: 1; 5-5: 2; 6-0: 5; 6-1: 5; 6-2: 2; 6-3: 2; 7-1: 1; 7-2: 1; 7-3: 1

Gols exatos: {"0":875,"1":2162,"2":2623,"3":2087,"4":1291,"5":604,"6":263,"7":71,"8":11,"9":9,"10":4}

Forças gerais sem mando por confronto:

- Horizonte Imaginário (60.20) × Aurora Inventada (60.20).

## iguais-neutro

Partidas: 10000; seed-base: 2026; duração: 2.25 s; campo neutro: true.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.24}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":0.5,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.216 | 1.198 | 2.414 |
| shots | 9.318 | 9.197 | 18.516 |
| shotsOnTarget | 4.907 | 4.872 | 9.780 |
| possession | 50.057 | 49.943 | 100.000 |
| corners | 2.000 | 2.008 | 4.008 |
| fouls | 12.602 | 12.555 | 25.157 |
| yellowCards | 2.006 | 2.015 | 4.021 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 36.42%; empate: 27.45%; vitória visitante: 36.13%.

Zebras: 0/0 (não aplicável%). Máximo de gols: 10. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 880 | 8.80% |
| 1 | 2152 | 21.52% |
| 2 | 2613 | 26.13% |
| 3 | 2116 | 21.16% |
| 4 | 1286 | 12.86% |
| 5 | 592 | 5.92% |
| 6+ | 361 | 3.61% |

Distribuição completa de placares (mandante-visitante):

0-0: 880; 0-1: 1065; 0-2: 629; 0-3: 262; 0-4: 92; 0-5: 16; 1-0: 1087; 1-1: 1306; 1-2: 801; 1-3: 320; 1-4: 84; 1-5: 23; 1-6: 4; 1-7: 1; 2-0: 678; 2-1: 765; 2-2: 465; 2-3: 214; 2-4: 59; 2-5: 11; 2-7: 1; 3-0: 288; 3-1: 304; 3-2: 184; 3-3: 88; 3-4: 22; 3-5: 5; 3-6: 1; 3-7: 1; 4-0: 105; 4-1: 77; 4-2: 72; 4-3: 11; 4-4: 4; 4-5: 2; 5-0: 17; 5-1: 19; 5-2: 18; 5-3: 1; 5-4: 2; 5-5: 2; 6-0: 2; 6-1: 5; 6-2: 5; 6-3: 1; 7-3: 1

Gols exatos: {"0":880,"1":2152,"2":2613,"3":2116,"4":1286,"5":592,"6":263,"7":71,"8":16,"9":7,"10":4}

Forças gerais sem mando por confronto:

- Aurora Inventada (60.20) × Horizonte Imaginário (60.20).

