# MatchEngine v0.1 — Fase 5

`MatchEngine.simulate(input)` / `simulateMatch(input)` recebem mandante, visitante, jogadores, escalações, táticas, contexto `{ neutralVenue }`, `RandomSource` e overrides opcionais de configuração. Retornam `MatchSimulationResult` com `score`, `events`, `statistics` e `debug`. Não importam React, UI, fixtures, repositórios ou persistência. Entradas inválidas são rejeitadas antes de consumir aleatoriedade. Não alteram entidades; somente a fonte aleatória avança seu estado.

## Responsabilidades

- `core/random.ts`: contrato `[0, 1)` e PRNG seeded de 32 bits. Para reproduzir uma partida, criar uma fonte nova com a mesma seed e usar exatamente as mesmas entradas/configuração e versão do motor. Reutilizar a mesma fonte significa continuar sua sequência.
- `config.ts`: rates, limites, pesos por posição, contribuições aos setores e efeitos táticos centralizados.
- `strength.ts`: força contextual individual e coletiva derivada dos titulares; nunca persiste overall. Banco não aumenta força nem entra em campo.
- `matchRules.ts`: valida entradas e executa um minuto de posse, faltas e chances.
- `matchSession.ts`: coordena execução incremental; `matchEngine.ts` conserva a API de lote.
- `events.ts`: participantes ponderados e redução de eventos para placar/contagens.

## Modelo inicial

Força individual é soma ponderada dos atributos relevantes para a posição atribuída, multiplicada por fitness, forma e adequação posicional. Fitness varia de 0.65 a 1, forma de 0.8 a 1; improvisação recebe fator 0.9. Pesos de GK usam defesa/decisão/físico/resistência como aproximação enquanto não existem atributos específicos de goleiro. Não é um modelo definitivo de avaliação.

Defesa, meio e ataque são médias ponderadas pelas contribuições das posições, com modificadores de formação, mentalidade e estilo. Força geral resume os três setores; não é fonte de verdade de Player ou Club. A vantagem de mando padrão é 3%, aplicada uma única vez aos setores do mandante e desativada em campo neutro.

Mentalidade ofensiva melhora ataque e reduz defesa; defensiva faz o inverso. Posse melhora meio e reduz ataque; contra-ataque melhora ataque e reduz meio; pressão melhora meio/defesa, reduz ligeiramente ataque e aumenta faltas. Formações também possuem pequenos trade-offs definidos na configuração, além da distribuição dos jogadores. Nenhuma tática adiciona um bônus único a toda a equipe.

Cada minuto tem um ciclo de posse cuja probabilidade depende dos meios-campos. Uma falta interrompe a chance desse ciclo e pode gerar amarelo. Sem falta, ataque vs defesa influencia a chance de finalização. A força contextual do finalizador influencia o acerto no alvo; ataque/defesa e força do goleiro influenciam a conversão. Chances e conversões têm limites para preservar incerteza. Posse percentual é a proporção observada desses ciclos, arredondada a uma casa decimal, e o visitante recebe o complemento exato até 100.

Eventos suportados: **SHOT → SHOT_ON_TARGET → GOAL ou SAVE**, **FOUL → YELLOW_CARD**, e **CORNER** após tentativa sem gol. GOAL sempre corresponde a uma finalização no alvo do mesmo atleta. Defesa pertence ao goleiro adversário; atacantes/meias têm maior peso ofensivo e GK não é escolhido para finalizar. Escanteio é uma aproximação de tentativa desviada/defesa com rebote, sem simular cobrança posterior nesta versão.

Placar, finalizações, finalizações no alvo, escanteios, faltas e cartões são contados dos eventos. Eventos são criados em ordem cronológica, preservando a ordem causal no mesmo minuto. Vermelhos permanecem zero; um atleta não recebe segundo amarelo porque expulsões ainda não são simuladas. Não há pênaltis, lesões, assistências, desempenho graduado dos jogadores ou desgaste durante a partida. Substituições simples foram adicionadas na Fase 10B.2, descrita abaixo. Esses limites não removem requisitos futuros do GDD.

Configuração padrão: 90 minutos, baseChanceRate 0.28 por ciclo sem falta, foulRate 0.28, cardRate 0.18 por falta, cornerRate 0.25 por tentativa sem gol, baseOnTargetRate 0.44 e baseConversionRate 0.24 por finalização no alvo. Na Fase 6, razões de força na criação de chances e conversão passaram a usar expoente 0.5 (`ENGINE_FACTORS.strengthRatioExponent`), reduzindo amplificação em cascata. Posse e acerto no alvo mantêm suas fórmulas anteriores. `debug` expõe bases, forças por jogador/setor, modificadores táticos/mando, configuração e alertas de improvisação. Não é exibido na UI.

## Exemplo fictício

`examples/fixtureMatch.ts` monta explicitamente dois times da fixture da Fase 3 em 4-3-3, sem IA. `simulateFixtureExample(2026)` permite reproduzir uma partida. A fixture permanece exclusiva de desenvolvimento e nunca é base oficial do Professor FC.

## MatchSession — Fase 10B

`new MatchSession({ ...input, matchId })` valida e captura escalações, atributos, forma/fitness e táticas, sem consumir RNG ou calcular eventos futuros. `snapshot()` retorna um read model congelado com minuto, fase, status, placar, estatísticas, histórico, escalações/táticas e permissões. Em zero a posse é neutra (50/50, nenhum ciclo observado); depois usa apenas ciclos processados. `currentPossessionClubId` identifica o último ciclo; os participantes estão nos eventos, sem coordenadas visuais.

`advance(n)` aceita inteiro não negativo e retorna `{ snapshot, newEvents }`, preservando o histórico. O primeiro avanço inicia FIRST_HALF; chega a 45 e para em HALF_TIME, mesmo com um passo maior. `startSecondHalf()` inicia SECOND_HALF uma única vez. Aos 90, FULL_TIME bloqueia novos avanços/táticas. Para preservar configurações de duração usadas anteriormente, o intervalo é `ceil(minutes / 2)` e o fim tem prioridade quando coincidem. Não há acréscimos ou prorrogação.

`applyTactics(clubId, tactics)` usa os validadores existentes e recalcula os setores/modificadores apenas para os próximos minutos. A formação deve ser compatível com as posições da lineup. Eventos, estatísticas e RNG já consumidos permanecem intactos. Na Fase 10B.2, `applyTeamSelection` permite confirmar formação e lineup conjuntamente, incluindo substituições.

`toResult()` exige FULL_TIME e retorna MatchSimulationResult compatível, sem registrar competição/calendário. Debug reflete as últimas táticas/forças efetivas. `simulateMatch` usa esta mesma sessão e inicia explicitamente o segundo tempo no modo de lote, mantendo a ordem dos sorteios e o resultado anterior sem intervenções. Não existe segundo motor.

A RandomSource recebida pertence exclusivamente à sessão até o fim; não compartilhar nem consumir externamente. Mesma versão, seed, contexto e sequência de mudanças nos mesmos minutos reproduzem o resultado. Mudar apenas o tamanho dos passos não muda sorteios/regras. Sem advance não há passagem de tempo, timer, React ou DOM.

Quatro testes em `matchSession.test.ts` protegem compatibilidade com um resultado capturado antes da refatoração, determinismo por passos, intervalo/fim, snapshots/eventos/stats parciais e táticas/confirmação pela aplicação. Executar somente testes novos/afetados; não executar analyzer, temporada completa ou suíte completa.

## Controles e substituições — Fase 10B.2

`applyTeamSelection(clubId, lineup, tactics)` valida a seleção inteira e planeja trocas antes de alterar o estado. Somente reservas atualmente disponíveis podem entrar. Atletas que saíram são removidos do banco e não podem voltar; entradas repetidas e excesso de trocas são rejeitados. Reorganizar os mesmos onze titulares não consome troca. `rules: { maxSubstitutions }` no construtor permite alterar o limite padrão 5, centralizado em `config.ts` e separado dos parâmetros probabilísticos anteriores.

`substitutions.ts` mantém a regra simples de limite por equipe, sem janelas. Snapshots incluem `homeSubstitutions`, `awaySubstitutions` (limit/used, entradas, saídas e changes), lineup/banco atuais, `lastEvent` e `canStartSecondHalf`. Cada entrada gera SUBSTITUTION no minuto da confirmação, com clubId e playerInId/playerOutId; playerId é quem entra e secondaryPlayerId é quem sai para manter compatibilidade. Se várias trocas são confirmadas juntas, os removidos/adicionados são pareados pela ordem das seleções. Eventos anteriores permanecem intactos; contagens de gols/finalizações/cartões não mudam por trocar jogadores.

Forças e participantes usam a nova lineup a partir do próximo minuto. O atleta que saiu não gera ações futuras, e quem entra usa atributos, form e fitness capturados no início, sem desgaste progressivo. Novas configurações não alteram a sequência já consumida do RNG. `toResult` permanece compatível com liga/calendário. Três testes simples em `liveMatchControls.test.ts` verificam substituição sem retorno, limite por equipe/rejeição atômica e confirmação de rascunho sem alterar o passado. O determinismo por passos continua protegido pelos testes existentes da MatchSession.

## Analyzer — Fase 6

Execute `pnpm analyze:simulation` na raiz. Sem dependências novas: um runner Node usa o carregamento TypeScript do Vite instalado, em middleware e sem servidor HTTP, DOM ou React. `scripts/simulationAnalyzer.ts` pode ser chamado diretamente com cenários personalizados e overrides de MatchEngineConfig.

`pnpm analyze:simulation 10000 2026 reports/minha-avaliacao` define partidas **por cenário**, seed-base e pasta de saída. O padrão executa sete cenários (70.000 partidas) e grava Markdown e JSON em `reports/match-engine-v0.1/latest/`. Não guarda cada partida em memória. Configuração, fatores internos, tamanho da amostra, forças, contagens e duração ficam registrados; apenas duração varia entre execuções idênticas.

A amostra geral alterna 30 confrontos ordenados da fixture; controles usam cópias com atributos uniformes 65 vs 50 e 60 vs 60, com posições/IDs preservados e forma/fitness 100. Mando é invertido e comparado com campo neutro. Seeds uint32 são dispersas por mistura determinística do índice, evitando a correlação inicial de seeds consecutivas do PRNG. Não há temporada, competição ou evolução de estado.

Relatórios preservados de antes/depois e interpretação estão em `reports/match-engine-v0.1/REVIEW.md`. Essas amostras avaliam comportamento, sem comprovar realismo ou calibrar com dados oficiais. Os três testes novos verificam conservação/reprodutibilidade e tendências muito amplas; o benchmark completo não roda em cada teste.

O sistema de liga da Fase 7 está em `src/competitions/` e consome resultados sem alterar o motor. A Fase 8 coordena chamadas determinísticas ao motor em `src/application/temporalGame.ts`, com bloqueio da partida humana. Demonstrações: `pnpm demo:league 2026` e `pnpm demo:calendar 2026`. A Fase 9 apresenta timeline/estatísticas em `src/ui/` e confirma o resultado pela aplicação em Continuar, sem modificar o motor. Transferências, IA completa, progressão, save e dados reais permanecem para fases posteriores.

## Lesões em partida — Fase 12E.1

injuries centraliza taxa pequena por jogador/minuto (0.00004), condição, fadiga temporal, físico/resistência e intensidade tática. Usa o RandomSource da partida: velocidade visual continua sem efeito sobre o resultado, mas seeds anteriores passam a consumir novos sorteios. O catálogo de quatro tipos e MEDICAL_CONFIG ficam em domain/players/injury. Leves podem continuar; moderadas/graves permanecem no slot até troca, porém sua força fica zerada e deixam de participar das ações. Um goleiro indisponível usa um jogador ativo como goleiro emergencial com força reduzida. Substituições seguem o limite existente. Histórico imutável; sem tratamento, treinamento ou recaídas. A aplicação calcula as datas e o efeito do DM, sem inserir regra médica no GameCalendar.
