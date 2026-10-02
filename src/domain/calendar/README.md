# Calendário central — Fase 8

## Datas e eventos

`core/date.ts` reutiliza `assertDate` e a convenção civil ISO `YYYY-MM-DD`, anos 0001–9999, sem hora/fuso. `compareGameDates`, `addGameDays` e `differenceInGameDays` concentram as operações. A diferença é assinada (dias da primeira data até a segunda). A aritmética usa meia-noite UTC para evitar horário de verão; não lê relógio do sistema. Helpers aceitam deslocamento negativo; os avanços do calendário/aplicação proíbem regressão.

`CalendarEvent` possui ID, data, tipo, ordem lógica opcional e referência opcional `{ kind, id }`. O calendário é genérico no tipo de evento; não conhece React, ligas, clubes ou MatchEngine. `FootballCalendarEvent` tipa as referências concretas de MATCH, ROUND_START/END e SEASON_START/END. A prioridade inicial na mesma data é início de temporada → início de rodada → partidas → fim de rodada → fim de temporada; ID crescente desempata. Prioridade configura ordem de processamento, não horário de início da partida.

`GameCalendar.create(currentDate, events)` valida datas, IDs únicos e ausência de eventos anteriores à instalação. Copia/congela eventos e referências. É snapshot imutável: operações retornam novos calendários; os índices são compartilhados internamente, sem exposição mutável. `eventsOn` e `eventsBetween` são consultas inclusivas por busca binária em agenda ordenada; `eventById` usa Map. `pendingOn`, `isProcessed` e `nextPendingEvent` consultam a confirmação de processamento. Não percorrem elencos ou objetos do mundo.

`advanceDay`, `advanceTo`, `advanceToNextEvent` retornam `{ calendar, newDate, pendingEvents }`. Nenhuma operação permite regressão ou ultrapassar um evento não confirmado; ao alcançar sua data, o evento ainda está pendente. Sem próximo evento, advanceToNextEvent é um no-op. `markProcessed(ids)` permite apenas eventos da data corrente, conhecidos e ainda não confirmados. O calendário não executa efeitos esportivos nem resolve ação humana por conta própria.

O conjunto de IDs processados é copiado ao confirmar um lote; avanços de dias sem eventos não copiam o histórico e não reconstroem índices. O próximo evento usa busca binária e ignora somente eventos já processados a partir da data atual. Arquivamento de agendas antigas e restauração persistida ficam para necessidades futuras; não há formato de save ou transição automática de temporada aqui.

## SeasonSchedule e Match

`competitions/createSeasonSchedule(league, config)` transforma fixtures da Fase 7 em agenda, sem modificar a base. Configuração: `seasonStartDate`, `firstRoundDate` opcional e `daysBetweenRounds` positivo; alternativamente, `roundDates` permite datas explícitas irregulares. Todas as partidas da rodada recebem a mesma data nesta versão; rodadas têm datas estritamente crescentes, primeira rodada pode coincidir com início da temporada. Nenhum jogo pode anteceder o início. Fim agendado corresponde à data da última rodada.

SeasonSchedule contém referências ID/data e os eventos canônicos. Não guarda uma segunda coleção de resultados. `application/getScheduledMatch` projeta o `Match` existente, agora com data: SCHEDULED enquanto não há resultado e FINISHED quando há registro da liga. Placar, eventos e estatísticas vêm do mesmo registro usado pela classificação; não se armazena um segundo status independente. Escalações são recebidas como snapshots explícitos na hora de jogar; não há histórico persistido de escalação neste estágio.

`getLeagueRoundState(league, schedule, date)` deriva rodadas, seus jogos concluídos/pendentes, conclusão, rodada atual (última data de rodada alcançada) e próxima rodada cronológica. Antes da primeira rodada, current é undefined; depois da última, next é undefined. A próxima rodada pode existir enquanto a atual está bloqueada, mas a aplicação não permite ultrapassá-la.

## Coordenação na aplicação

`application/temporalGame.ts` mantém `TemporalGame` com calendário, lista de ligas/agendas e `humanClubId` opcional. A instalação valida edições novas, identidade das agendas, cobertura de todos os jogos, datas coerentes por rodada e conflitos na agenda conjunta. Reconstitui eventos canônicos das referências de partidas para impedir eventos avulsos inconsistentes. O calendário aceita tipos genéricos; o fluxo atual instala/processa apenas os cinco tipos de futebol, sem handlers vazios para sistemas futuros.

`validateMatchDateConflicts` fornece erros estruturados com código CLUB_DATE_CONFLICT, clube, data, partidas e IDs dos eventos. Sem horários detalhados, duas partidas do mesmo clube na mesma data são rejeitadas, inclusive entre competições. `CalendarConflictError` expõe a validação além da mensagem. Ligas simultâneas com clubes distintos ou datas alternadas são aceitas.

`MatchDayDependencies` exige `getTeam(clubId, match)` e `randomForMatch(matchId)`, e permite overrides de configuração do motor. getTeam entrega Player/Club/Lineup/Tactics existentes; o MatchEngine aplica as validações da Fase 4. A aplicação confirma a identidade dos clubes antes da simulação. Não há seleção automática/IA nem acesso oculto a fixture, repositórios ou UI. randomForMatch deve construir uma fonte nova, estável por ID e seed-base, garantindo que mudar a ordem CPU/humano não altere partidas. Somente a fonte local do motor avança estado.

`processCurrentDate` inicia edições em SEASON_START, confirma ROUND_START, simula partidas CPU pendentes, registra pelo use case da Fase 7 e confirma encerramentos somente quando os resultados permitem. Primeiro resultado continua iniciando a liga no caminho não temporal da Fase 7; no fluxo temporal, beginLeagueSeason também permite iniciar sem resultado. FINISHED/championId continuam sendo determinados exclusivamente pela liga quando todos os jogos terminam.

Partida envolvendo humanClubId produz `PendingHumanAction { type: 'PLAY_MATCH', date, matchId, competitionSeasonId, clubId }`, derivada das partidas/eventos pendentes da data corrente. CPU não solicita suas escalações nem consome sua aleatoriedade. ROUND_END e SEASON_END permanecem pendentes quando dependem dela. `playHumanMatch` é uma chamada explícita, só aceita a ação da data corrente e depois processa o restante do dia. Repetir a chamada é inválido. Sem clube humano, todas as partidas podem ser processadas pelo fluxo CPU.

`advanceGameDay`, `advanceGameTo` e `advanceGameToNextEvent` processam a data corrente e visitam as próximas datas relevantes até o alvo. Param no primeiro bloqueio, mantendo a data da decisão em vez de saltar para o destino solicitado. Não percorrem cada dia vazio. Sem próximo evento, advanceGameToNextEvent retorna NO_EVENTS.

As operações retornam explicitamente novo estado/data, status, eventos encontrados pendentes, processados/bloqueados, ações humanas e IDs de partidas simuladas. No avanço longo, as listas acumulam as datas visitadas; requestedDate pode diferir de newDate quando houve bloqueio. Reprocessar o dia não repete jogos ou eventos já confirmados. Se um provider/validação falha, não se devolve estado parcial nem se altera o snapshot de entrada; providers devem ser livres de efeitos externos e RNGs devem ser locais à tentativa.

## Extensão e demonstração

Novo tipo temporal pode reutilizar GameCalendar com outra referência/prioridade. Adicionar comportamento requer um use case concreto na aplicação. Contratos, mercado, treinamento e carreira não possuem processadores artificiais nesta fase. Novas competições podem produzir eventos/agendas compatíveis futuramente; o calendário central não está preso a uma CompetitionSeason. O coordenador esportivo atual é exclusivamente LEAGUE, sem antecipar Copa.

`pnpm demo:calendar 2026` usa as mesmas APIs acima com Development League. Configuração fictícia: corrente 31/03/2026, início 01/04, primeira rodada 05/04, intervalo sete dias, última rodada 07/06. Cada rodada mostra duas partidas CPU, partida de Aurora Inventada PENDENTE, chamada explícita PLAY_MATCH e conclusão. O script automatiza essa chamada somente como demonstração; advanceGame* não o faz.

Relatório e trilha estruturada em `reports/development-calendar/`. São 30 jogos, dez rodadas e dez ações humanas explícitas. Fixture nunca é base oficial; nenhuma fórmula do MatchEngine é alterada. A Fase 9 agora utiliza essas APIs no navegador, separando prévia de partida e confirmação em Continuar; consulte [../../application/README.md](../../application/README.md).

Validação restrita desta fase: `pnpm test src/domain/calendar/calendar.test.ts src/application/temporalGame.test.ts src/competitions/league.test.ts`, lint e build. São nove testes novos e oito da liga diretamente afetados; a suíte histórica completa e o analyzer não são executados nesta fase, conforme o pedido. Checkpoint completo fica após Fase 9.
