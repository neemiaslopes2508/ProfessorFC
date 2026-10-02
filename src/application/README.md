# Camada de aplicação

`registerLeagueMatchResult` coordena registro de `MatchSimulationResult` e entrega liga/classificação atualizadas.

`temporalGame.ts` coordena calendário, ligas e MatchEngine com dependências explícitas. GameCalendar cuida somente de tempo/eventos; liga cuida de pontos/classificação/conclusão; MatchEngine cuida da simulação. Nenhuma função importa React, fixture ou repositório. Partida humana requer chamada explícita `playHumanMatch`; advanceGame* retorna bloqueio e PendingHumanAction.

APIs, invariantes e demonstração: [../domain/calendar/README.md](../domain/calendar/README.md).

## Sessão de desenvolvimento — Fase 9

`prototypeSession.ts` é o bootstrap explícito do protótipo fictício, separado do coordenador temporal genérico. Carrega/valida GameData, cria seis snapshots de equipe e instala uma liga/agenda nova sem alterar repositórios. `startPrototype`, `setStarter`, `setBench`, `setPrototypeTactics`, `advancePrototype`, `playPrototypeMatch` e `continuePrototypeMatch` são operações síncronas sem React, DOM ou persistência. A UI mantém o snapshot em useState; classificação, partidas e ações pendentes são projeções dos sistemas existentes.

A seleção inicial escolhe o primeiro atleta disponível por posição natural, depois secundária e, se necessário, improvisação; não é IA. Ao trocar formação, reorganiza somente os titulares escolhidos, priorizando posição natural, secundária e depois improvisação. Preserva conjunto de titulares e banco; não repõe silenciosamente um rascunho incompleto. Titulares incompletos ficam em slots opcionais de rascunho e são convertidos para Lineup sem IDs artificiais; o validador existente decide erros/alertas. Editar um titular retira-o do banco e devolve o substituído ao banco, quando aplicável. Forma/fitness são fixos; não há evolução de cartões/lesões.

Na Fase 9.1, `moveTeamPlayer` efetua troca atômica banco/titular ou titular/titular e submete o time ao validador de domínio antes de entregar um novo snapshot. Entradas inválidas não alteram a sessão; improvisações geram alertas e são permitidas. Equipe continua bloqueada com resultado pendente ou temporada encerrada. `teamOverview.ts` reúne projeções de elenco, busca/ordenação, distribuição por posição natural e resultados recentes. O overall reaproveita `attributeStrength` do cálculo existente de força por posição, sem condição/forma nem armazenamento; o total monetário utiliza os helpers seguros de Money.

`previewHumanMatch` simula sem confirmar calendário ou resultado. `completeHumanMatch` registra o resultado apresentado, confirma a ação e processa o restante do dia; repetir é inválido. `playHumanMatch` conserva a API da Fase 8, combinando essas operações para scripts. A sessão conserva `pendingMatch` até Continuar, bloqueia edição/avanço nesse intervalo e torna uma segunda confirmação um no-op. `lastMatch` permite rever o resultado confirmado. Seeds novas por ID usam a mesma receita determinística da demonstração temporal, sem RNG global ou alterações no motor.

Os sete testes da Fase 9 protegem seleção de todos os clubes, rascunho/restauração, alertas, táticas, bloqueio, prévia/confirmação e temporada completa reproduzível. Mais sete testes abrangentes em `teamManagement.test.tsx` protegem trocas atômicas, rejeição sem mutação, catálogo de formações preservando jogadores, projeções do elenco, painel/campo renderizados a partir da sessão e envio do time editado ao MatchEngine. A fixture nunca é base oficial. Não há segunda temporada nem formato de save.

## Confirmação da equipe — Fase 9.2

`teamSetup.ts` expõe captureTeamSetup, previewTeamSetup, hasTeamSetupChanges e commitTeamSetup. Capture cria uma cópia imutável da configuração escolhida; preview é exclusiva do editor e permite reutilizar as operações existentes sem alterar a sessão confirmada. A detecção de alterações compara apenas configuração, sem relógio/resultados/entidades do mundo. Descartar é simplesmente remover o rascunho e apresentar a sessão confirmada, que pode já conter commits humanos anteriores.

Commit valida lineup/tactics no contexto atual do clube/jogadores, retorna erros ou confirma cópias validadas de uma só vez. Rejeita clube diferente, resultado pendente e temporada encerrada. A UI usa a sessão retornada para qualquer avanço solicitado junto com Salvar, evitando executar uma ação sobre a configuração anterior. Não há savegame, cópia do mundo para edição, persistência nem lógica React neste módulo. DEC-030 registra esta distinção.

Nove testes em `teamSetup.test.tsx` protegem dirty/undo, commit conjunto e motor, descarte para a última configuração salva, erros/alertas, novas formações válidas e suas projeções, posições secundárias/tradução, avatares e fallback. Na Fase 9.2 executamos somente esse arquivo e os testes afetados de equipe, táticas, seleção contextual e dados; nenhuma temporada completa, analyzer ou suíte histórica integral.

## Apresentação do dia de jogo — Fase 10A

`matchDayOverview` é consulta do protótipo confirmado: projeta Match pela API temporal, localiza os dois snapshots de equipe e a edição, deriva titulares/overall/forma/posição na tabela e consulta o nome da competição fictícia existente. Não confirma escalação, não executa o motor e não altera calendário/resultados. `data/fixtures/matchDay` concentra estádio/capacidade fictícios e público determinístico por matchId, reputação e importância aproximada pela rodada. Usa uma RandomSource separada, sem consumir a seed da partida; não implementa economia ou audiência real. Os dois testes novos protegem configuração confirmada/imutabilidade/público e o fluxo das cenas, inclusive Pular.

## Partida incremental — Fase 10B

`startHumanMatchSession` reutiliza a validação temporal e os providers existentes; cria MatchSession sem simular ou confirmar PLAY_MATCH. `liveHumanMatch.ts` coordena startPrototypeLiveMatch, advancePrototypeLiveMatch, advancePrototypeToNextMatchEvent, startPrototypeSecondHalf e updatePrototypeLiveTactics. Próximo evento avança um minuto por vez até produzir evento ou alcançar intervalo/fim; não procura eventos pré-calculados.

A sessão de protótipo contém somente `liveMatch: MatchSnapshot`. Um WeakMap privado associa o snapshot atual ao controlador e rejeita comandos com snapshots já consumidos; React não recebe MatchSession. Cada operação publica uma nova leitura imutável. Navegar preserva a sessão; editar/confirmar equipe, simular novamente e avançar calendário são bloqueados durante a partida. Mudanças ao vivo só atingem o clube humano e não persistem na equipe confirmada.

FULL_TIME encerra o controlador e publica pendingMatch com toResult, sem ressimulação. ContinuePrototypeMatch conserva a confirmação única na liga/calendário. APIs de lote anteriores permanecem para CPU/scripts, usando a mesma MatchSession. Não há persistência, timers ou outra biblioteca de estado. DEC-031 registra essa integração.

## Gerenciamento ao vivo — Fase 10B.2

`liveTeamEditorSession` projeta a lineup/tática atuais da MatchSession exclusivamente para o editor. `captureLiveTeamSetup` cria o rascunho TeamSetup reutilizado pela tela Equipe e por suas operações de troca/formação; experimentar/cancelar não executa comandos na partida. `commitPrototypeLiveTeamSetup` confirma o conjunto atomicamente, normaliza o banco removendo titulares que saíram e chama applyTeamSelection. Erros preservam controlador/snapshot; táticas e elenco pré-jogo permanecem inalterados. A UI só permite alterações do clube humano.

`advancePrototypeToHalfTime` para no intervalo e não faz nada no segundo tempo. `finishPrototypeLiveMatch` processa os minutos restantes, inicia explicitamente o segundo tempo quando permitido e publica o resultado; Até o fim, Simular rápido e Simular restante usam essa mesma operação. Não há motor separado nem atraso artificial. O loop consulta canAdvance/canStartSecondHalf; futuras pendências obrigatórias devem bloquear essas permissões. A confirmação em Continuar continua única, inclusive com SUBSTITUTION.
