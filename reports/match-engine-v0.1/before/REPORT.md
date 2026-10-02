# Professor FC — Avaliação estatística do MatchEngine v0.1

Fixture fictícia exclusivamente de desenvolvimento. Sem React ou renderização.

Cada cenário usa a mesma sequência de seeds dispersas a partir da seed-base; a ordem de eventos pode divergir entre cenários. Tempos medem o loop completo (validação, simulação e agregação), excluindo carregamento do runner.

Amostra mista: 30 confrontos ordenados dos seis clubes, em ciclo fixo; 10.000 não divide 30 e os primeiros dez pares recebem uma partida extra. Sem evolução entre partidas.

Controles: mesmos esquemas 4-3-3 equilibrados; cópias da fixture com todos os atributos em 65 (forte), 50 (fraco) ou 60 (iguais), forma/fitness 100. IDs e posições preservados. Não altera o dataset original.

Zebra: vitória do mais fraco quando o forte possui força geral sem mando pelo menos 10% superior (razão forte/fraco ≥ 1,1). Empate não é zebra. Percentual calculado apenas sobre confrontos elegíveis. Não é uma definição universal nem calibração com futebol real.

## fixture-mista

Partidas: 10000; seed-base: 2026; duração: 2.43 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 2.341 | 2.017 | 4.358 |
| shots | 10.578 | 9.625 | 20.203 |
| shotsOnTarget | 5.461 | 4.993 | 10.454 |
| possession | 50.753 | 49.247 | 100.000 |
| corners | 2.049 | 1.920 | 3.969 |
| fouls | 12.368 | 12.785 | 25.153 |
| yellowCards | 1.966 | 2.040 | 4.005 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 47.28%; empate: 11.83%; vitória visitante: 40.89%.

Zebras: 380/6667 (5.70%). Máximo de gols: 16. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 165 | 1.65% |
| 1 | 657 | 6.57% |
| 2 | 1289 | 12.89% |
| 3 | 1711 | 17.11% |
| 4 | 1858 | 18.58% |
| 5 | 1565 | 15.65% |
| 6+ | 2755 | 27.55% |

Distribuição completa de placares (mandante-visitante):

0-0: 165; 0-1: 321; 0-2: 423; 0-3: 366; 0-4: 302; 0-5: 211; 0-6: 123; 0-7: 76; 0-8: 62; 0-9: 28; 0-10: 7; 0-11: 6; 0-13: 1; 0-14: 1; 1-0: 336; 1-1: 490; 1-2: 470; 1-3: 411; 1-4: 222; 1-5: 164; 1-6: 103; 1-7: 71; 1-8: 32; 1-9: 21; 1-10: 5; 1-11: 5; 2-0: 376; 2-1: 495; 2-2: 370; 2-3: 229; 2-4: 145; 2-5: 76; 2-6: 43; 2-7: 24; 2-8: 10; 2-9: 1; 2-11: 1; 2-13: 1; 3-0: 380; 3-1: 392; 3-2: 269; 3-3: 134; 3-4: 66; 3-5: 26; 3-6: 15; 3-7: 7; 3-8: 1; 3-9: 2; 3-10: 1; 3-11: 1; 4-0: 383; 4-1: 336; 4-2: 147; 4-3: 70; 4-4: 19; 4-5: 6; 4-6: 2; 5-0: 298; 5-1: 184; 5-2: 99; 5-3: 36; 5-4: 7; 5-5: 5; 5-7: 1; 6-0: 181; 6-1: 144; 6-2: 49; 6-3: 15; 6-4: 7; 7-0: 145; 7-1: 63; 7-2: 23; 7-3: 5; 8-0: 74; 8-1: 43; 8-2: 17; 9-0: 47; 9-1: 16; 9-2: 5; 9-3: 4; 10-0: 30; 10-1: 7; 10-2: 1; 10-3: 1; 11-0: 15; 11-1: 7; 11-2: 2; 12-0: 3; 12-1: 3; 13-0: 6; 13-1: 1; 14-1: 3; 15-0: 2; 15-1: 1

Gols exatos: {"0":165,"1":657,"2":1289,"3":1711,"4":1858,"5":1565,"6":1078,"7":779,"8":443,"9":240,"10":127,"11":40,"12":23,"13":15,"14":3,"15":6,"16":1}

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

Partidas: 10000; seed-base: 2026; duração: 2.55 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 4.284 | 0.445 | 4.729 |
| shots | 14.640 | 6.020 | 20.660 |
| shotsOnTarget | 8.344 | 2.647 | 10.991 |
| possession | 57.273 | 42.727 | 100.000 |
| corners | 2.572 | 1.397 | 3.969 |
| fouls | 10.744 | 14.422 | 25.166 |
| yellowCards | 1.743 | 2.273 | 4.017 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 95.40%; empate: 3.41%; vitória visitante: 1.19%.

Zebras: 119/10000 (1.19%). Máximo de gols: 16. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 89 | 0.89% |
| 1 | 399 | 3.99% |
| 2 | 946 | 9.46% |
| 3 | 1597 | 15.97% |
| 4 | 1841 | 18.41% |
| 5 | 1808 | 18.08% |
| 6+ | 3320 | 33.20% |

Distribuição completa de placares (mandante-visitante):

0-0: 89; 0-1: 41; 0-2: 8; 0-3: 1; 1-0: 358; 1-1: 152; 1-2: 45; 1-3: 7; 2-0: 786; 2-1: 367; 2-2: 91; 2-3: 12; 2-4: 2; 2-5: 1; 3-0: 1184; 3-1: 478; 3-2: 108; 3-3: 8; 3-4: 2; 4-0: 1265; 4-1: 590; 4-2: 125; 4-3: 17; 4-4: 1; 5-0: 1098; 5-1: 429; 5-2: 116; 5-3: 20; 5-4: 2; 6-0: 759; 6-1: 344; 6-2: 78; 6-3: 14; 6-4: 2; 7-0: 457; 7-1: 222; 7-2: 42; 7-3: 7; 8-0: 248; 8-1: 109; 8-2: 26; 8-3: 1; 8-4: 1; 9-0: 108; 9-1: 52; 9-2: 12; 9-3: 3; 10-0: 48; 10-1: 24; 10-2: 4; 11-0: 15; 11-1: 8; 11-2: 1; 11-3: 1; 12-0: 4; 12-1: 1; 12-2: 1; 13-0: 3; 13-1: 1; 13-3: 1

Gols exatos: {"0":89,"1":399,"2":946,"3":1597,"4":1841,"5":1808,"6":1323,"7":937,"8":569,"9":275,"10":135,"11":52,"12":20,"13":5,"14":3,"16":1}

Forças gerais sem mando por confronto:

- Serra dos Ventos (65.22) × Aurora Inventada (50.17).

## forte-visitante

Partidas: 10000; seed-base: 2026; duração: 2.27 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 0.523 | 3.695 | 4.218 |
| shots | 6.658 | 13.379 | 20.037 |
| shotsOnTarget | 2.928 | 7.652 | 10.579 |
| possession | 44.251 | 55.749 | 100.000 |
| corners | 1.519 | 2.411 | 3.930 |
| fouls | 13.999 | 11.114 | 25.113 |
| yellowCards | 2.201 | 1.800 | 4.001 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 2.41%; empate: 5.69%; vitória visitante: 91.90%.

Zebras: 241/10000 (2.41%). Máximo de gols: 14. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 126 | 1.26% |
| 1 | 618 | 6.18% |
| 2 | 1262 | 12.62% |
| 3 | 1893 | 18.93% |
| 4 | 1926 | 19.26% |
| 5 | 1674 | 16.74% |
| 6+ | 2501 | 25.01% |

Distribuição completa de placares (mandante-visitante):

0-0: 126; 0-1: 538; 0-2: 970; 0-3: 1241; 0-4: 1154; 0-5: 871; 0-6: 507; 0-7: 309; 0-8: 138; 0-9: 40; 0-10: 12; 0-11: 6; 1-0: 80; 1-1: 274; 1-2: 568; 1-3: 618; 1-4: 599; 1-5: 466; 1-6: 276; 1-7: 161; 1-8: 54; 1-9: 20; 1-10: 10; 1-11: 2; 1-12: 1; 1-13: 1; 2-0: 18; 2-1: 81; 2-2: 135; 2-3: 175; 2-4: 160; 2-5: 109; 2-6: 73; 2-7: 30; 2-8: 7; 2-9: 3; 2-10: 3; 3-0: 3; 3-1: 19; 3-2: 27; 3-3: 31; 3-4: 27; 3-5: 14; 3-6: 12; 3-7: 5; 3-9: 1; 3-10: 1; 3-11: 1; 4-1: 2; 4-2: 3; 4-3: 7; 4-4: 3; 4-5: 3; 4-7: 2; 4-9: 1; 5-3: 1; 5-6: 1

Gols exatos: {"0":126,"1":618,"2":1262,"3":1893,"4":1926,"5":1674,"6":1167,"7":728,"8":390,"9":139,"10":44,"11":22,"12":6,"13":3,"14":2}

Forças gerais sem mando por confronto:

- Aurora Inventada (50.17) × Serra dos Ventos (65.22).

## forte-neutro

Partidas: 10000; seed-base: 2026; duração: 2.24 s; campo neutro: true.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 3.975 | 0.480 | 4.455 |
| shots | 14.021 | 6.304 | 20.325 |
| shotsOnTarget | 7.986 | 2.768 | 10.754 |
| possession | 56.553 | 43.447 | 100.000 |
| corners | 2.494 | 1.459 | 3.952 |
| fouls | 10.926 | 14.248 | 25.174 |
| yellowCards | 1.772 | 2.243 | 4.015 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 93.88%; empate: 4.41%; vitória visitante: 1.71%.

Zebras: 171/10000 (1.71%). Máximo de gols: 15. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 110 | 1.10% |
| 1 | 516 | 5.16% |
| 2 | 1111 | 11.11% |
| 3 | 1728 | 17.28% |
| 4 | 1939 | 19.39% |
| 5 | 1714 | 17.14% |
| 6+ | 2882 | 28.82% |

Distribuição completa de placares (mandante-visitante):

0-0: 110; 0-1: 60; 0-2: 13; 0-3: 1; 1-0: 456; 1-1: 205; 1-2: 65; 1-3: 8; 1-4: 1; 2-0: 893; 2-1: 440; 2-2: 110; 2-3: 15; 2-4: 4; 2-5: 1; 3-0: 1222; 3-1: 565; 3-2: 138; 3-3: 14; 3-4: 3; 4-0: 1256; 4-1: 608; 4-2: 135; 4-3: 22; 4-4: 2; 5-0: 952; 5-1: 455; 5-2: 123; 5-3: 25; 6-0: 655; 6-1: 299; 6-2: 78; 6-3: 11; 6-4: 2; 7-0: 365; 7-1: 167; 7-2: 38; 7-3: 7; 8-0: 178; 8-1: 102; 8-2: 18; 8-3: 1; 8-4: 1; 9-0: 69; 9-1: 29; 9-2: 10; 9-3: 2; 9-4: 1; 10-0: 26; 10-1: 11; 10-2: 4; 10-3: 1; 11-0: 9; 11-1: 4; 11-2: 1; 12-0: 3; 12-2: 2; 12-3: 1; 13-0: 1; 13-1: 2

Gols exatos: {"0":110,"1":516,"2":1111,"3":1728,"4":1939,"5":1714,"6":1263,"7":813,"8":450,"9":220,"10":82,"11":31,"12":14,"13":4,"14":4,"15":1}

Forças gerais sem mando por confronto:

- Serra dos Ventos (65.22) × Aurora Inventada (50.17).

## iguais-mando

Partidas: 10000; seed-base: 2026; duração: 2.32 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.610 | 1.363 | 2.973 |
| shots | 10.001 | 9.011 | 19.012 |
| shotsOnTarget | 5.286 | 4.770 | 10.056 |
| possession | 50.821 | 49.179 | 100.000 |
| corners | 2.070 | 1.920 | 3.990 |
| fouls | 12.402 | 12.763 | 25.166 |
| yellowCards | 1.981 | 2.043 | 4.024 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 43.28%; empate: 24.26%; vitória visitante: 32.46%.

Zebras: 0/0 (não aplicável%). Máximo de gols: 12. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 511 | 5.11% |
| 1 | 1499 | 14.99% |
| 2 | 2235 | 22.35% |
| 3 | 2290 | 22.90% |
| 4 | 1682 | 16.82% |
| 5 | 980 | 9.80% |
| 6+ | 803 | 8.03% |

Distribuição completa de placares (mandante-visitante):

0-0: 511; 0-1: 688; 0-2: 476; 0-3: 232; 0-4: 83; 0-5: 25; 0-6: 2; 1-0: 811; 1-1: 1099; 1-2: 752; 1-3: 353; 1-4: 128; 1-5: 26; 1-6: 4; 2-0: 660; 2-1: 904; 2-2: 629; 2-3: 268; 2-4: 97; 2-5: 27; 2-6: 2; 3-0: 402; 3-1: 470; 3-2: 328; 3-3: 172; 3-4: 51; 3-5: 17; 3-6: 4; 3-8: 1; 4-0: 147; 4-1: 182; 4-2: 147; 4-3: 45; 4-4: 10; 4-5: 8; 4-6: 2; 5-0: 49; 5-1: 58; 5-2: 51; 5-3: 12; 5-4: 3; 5-5: 5; 6-0: 10; 6-1: 17; 6-2: 13; 6-3: 6; 6-4: 4; 7-0: 1; 7-1: 3; 7-2: 1; 7-3: 1; 7-4: 1; 8-1: 1; 10-2: 1

Gols exatos: {"0":511,"1":1499,"2":2235,"3":2290,"4":1682,"5":980,"6":512,"7":196,"8":57,"9":23,"10":12,"11":2,"12":1}

Forças gerais sem mando por confronto:

- Aurora Inventada (60.20) × Horizonte Imaginário (60.20).

## iguais-invertidos

Partidas: 10000; seed-base: 2026; duração: 2.23 s; campo neutro: false.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.610 | 1.363 | 2.973 |
| shots | 10.001 | 9.011 | 19.012 |
| shotsOnTarget | 5.286 | 4.770 | 10.056 |
| possession | 50.821 | 49.179 | 100.000 |
| corners | 2.070 | 1.920 | 3.990 |
| fouls | 12.402 | 12.763 | 25.166 |
| yellowCards | 1.981 | 2.043 | 4.024 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 43.28%; empate: 24.26%; vitória visitante: 32.46%.

Zebras: 0/0 (não aplicável%). Máximo de gols: 12. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 511 | 5.11% |
| 1 | 1499 | 14.99% |
| 2 | 2235 | 22.35% |
| 3 | 2290 | 22.90% |
| 4 | 1682 | 16.82% |
| 5 | 980 | 9.80% |
| 6+ | 803 | 8.03% |

Distribuição completa de placares (mandante-visitante):

0-0: 511; 0-1: 688; 0-2: 476; 0-3: 232; 0-4: 83; 0-5: 25; 0-6: 2; 1-0: 811; 1-1: 1099; 1-2: 752; 1-3: 353; 1-4: 128; 1-5: 26; 1-6: 4; 2-0: 660; 2-1: 904; 2-2: 629; 2-3: 268; 2-4: 97; 2-5: 27; 2-6: 2; 3-0: 402; 3-1: 470; 3-2: 328; 3-3: 172; 3-4: 51; 3-5: 17; 3-6: 4; 3-8: 1; 4-0: 147; 4-1: 182; 4-2: 147; 4-3: 45; 4-4: 10; 4-5: 8; 4-6: 2; 5-0: 49; 5-1: 58; 5-2: 51; 5-3: 12; 5-4: 3; 5-5: 5; 6-0: 10; 6-1: 17; 6-2: 13; 6-3: 6; 6-4: 4; 7-0: 1; 7-1: 3; 7-2: 1; 7-3: 1; 7-4: 1; 8-1: 1; 10-2: 1

Gols exatos: {"0":511,"1":1499,"2":2235,"3":2290,"4":1682,"5":980,"6":512,"7":196,"8":57,"9":23,"10":12,"11":2,"12":1}

Forças gerais sem mando por confronto:

- Horizonte Imaginário (60.20) × Aurora Inventada (60.20).

## iguais-neutro

Partidas: 10000; seed-base: 2026; duração: 2.25 s; campo neutro: true.

Configuração: `{"minutes":90,"homeAdvantage":0.03,"baseChanceRate":0.28,"foulRate":0.28,"cardRate":0.18,"cornerRate":0.25,"baseOnTargetRate":0.44,"baseConversionRate":0.28}`

Fatores internos: `{"attributeScale":100,"referenceStrength":50,"fitnessFloor":0.65,"fitnessInfluence":0.35,"formFloor":0.8,"formInfluence":0.2,"outOfPosition":0.9,"minPossession":0.25,"maxPossession":0.75,"strengthRatioExponent":1,"minChance":0.02,"maxChance":0.6,"minOnTarget":0.15,"maxOnTarget":0.8,"minConversion":0.05,"maxConversion":0.65,"possessionPrecision":10}`

| Métrica | Mandante | Visitante | Total |
| --- | ---: | ---: | ---: |
| goals | 1.493 | 1.474 | 2.967 |
| shots | 9.575 | 9.431 | 19.005 |
| shotsOnTarget | 5.055 | 4.986 | 10.041 |
| possession | 50.089 | 49.911 | 100.000 |
| corners | 1.993 | 1.999 | 3.992 |
| fouls | 12.586 | 12.562 | 25.148 |
| yellowCards | 2.002 | 2.015 | 4.016 |
| redCards | 0.000 | 0.000 | 0.000 |

Vitória mandante: 38.28%; empate: 24.24%; vitória visitante: 37.48%.

Zebras: 0/0 (não aplicável%). Máximo de gols: 12. Partidas com violações de invariantes: 0.

| Gols totais | Partidas | Frequência |
| --- | ---: | ---: |
| 0 | 509 | 5.09% |
| 1 | 1499 | 14.99% |
| 2 | 2249 | 22.49% |
| 3 | 2294 | 22.94% |
| 4 | 1674 | 16.74% |
| 5 | 991 | 9.91% |
| 6+ | 784 | 7.84% |

Distribuição completa de placares (mandante-visitante):

0-0: 509; 0-1: 723; 0-2: 564; 0-3: 291; 0-4: 114; 0-5: 30; 0-6: 5; 1-0: 776; 1-1: 1125; 1-2: 839; 1-3: 413; 1-4: 158; 1-5: 35; 1-6: 10; 2-0: 560; 2-1: 848; 2-2: 600; 2-3: 313; 2-4: 123; 2-5: 33; 2-6: 7; 2-7: 1; 3-0: 316; 3-1: 427; 3-2: 308; 3-3: 175; 3-4: 59; 3-5: 15; 3-6: 6; 3-7: 1; 3-8: 1; 4-0: 120; 4-1: 146; 4-2: 115; 4-3: 43; 4-4: 10; 4-5: 5; 4-6: 2; 5-0: 36; 5-1: 40; 5-2: 40; 5-3: 10; 5-4: 5; 5-5: 5; 6-0: 2; 6-1: 12; 6-2: 8; 6-3: 5; 6-4: 2; 7-0: 1; 7-1: 3; 7-2: 1; 7-3: 1; 7-4: 2; 10-2: 1

Gols exatos: {"0":509,"1":1499,"2":2249,"3":2294,"4":1674,"5":991,"6":495,"7":198,"8":53,"9":23,"10":11,"11":3,"12":1}

Forças gerais sem mando por confronto:

- Aurora Inventada (60.20) × Horizonte Imaginário (60.20).

