# Professor FC — Decision Log

## DEC-001 — Plataforma

Status: Approved

Decisão:
O Professor FC será inicialmente um jogo web.

Motivo:
facilidade de distribuição, desenvolvimento e evolução.

## DEC-002 — Stack

Status: Approved

Decisão:
React + TypeScript + Vite.

Observação:
a lógica do jogo deve permanecer independente do React.

## DEC-003 — Temporada inicial

Status: Mandatory

Decisão:
2026.

## DEC-004 — Dados reais

Status: Mandatory

Decisão:
o mundo inicial deve utilizar jogadores reais, clubes reais, competições reais e valores reais de referência.

## DEC-005 — Brasil primeiro

Status: Approved

Decisão:
primeiro núcleo: Série A, Série B e Copa do Brasil.

## DEC-006 — Expansibilidade

Status: Mandatory

Decisão:
a arquitetura deve permitir novas ligas, divisões, países e competições sem reescrita completa.

## DEC-007 — Carreira

Status: Mandatory

Decisão:
carreira de treinador com até 50 temporadas.

## DEC-008 — Mundo após início

Status: Mandatory

Decisão:
dados reais são apenas o seed inicial.
Depois do início, o universo evolui pela simulação.

## DEC-009 — Partidas

Status: Approved

Decisão:
partidas simuladas, sem controle direto.

## DEC-010 — Apresentação de partidas

Status: Approved

Decisão:
timeline + estatísticas.

## DEC-011 — Táticas iniciais

Status: Approved

Decisão:
formação + mentalidade + estilo.

## DEC-012 — Atributos

Status: Approved

Decisão:
escala 1–100 com base inicial:
Finalização, Passe, Técnica, Defesa, Velocidade, Físico, Resistência e Decisão.

## DEC-013 — Overall

Status: Approved

Decisão:
overall calculado internamente e dependente da posição sempre que apropriado.

## DEC-014 — Valores externos

Status: Approved

Decisão:
ratings externos podem servir como referência de construção, mas não como dependência estrutural.

## DEC-015 — Moeda

Status: Approved

Decisão:
Real brasileiro na experiência inicial.

## DEC-016 — Dinheiro internamente

Status: Approved

Decisão:
não usar float para valores monetários.
Preferir centavos inteiros ou representação segura equivalente.

## DEC-017 — Aleatoriedade

Status: Approved

Decisão:
não espalhar Math.random.
Utilizar abstração RandomSource.

## DEC-018 — Dados externos

Status: Approved

Decisão:
qualquer fonte externa deve passar por importer/mapper para o modelo interno.

## DEC-019 — Save

Status: Approved

Decisão:
saves versionados e com migração futura.

## DEC-020 — Dados fictícios

Status: Approved

Decisão:
permitidos apenas para testes/desenvolvimento técnico.
O mundo inicial do produto deve respeitar os dados reais obrigatórios.

## DEC-021 — Fotos e logos

Status: Approved

Decisão:
não podem ser dependências estruturais do funcionamento do jogo.

## DEC-022 — IA

Status: Approved

Decisão:
IA deve ser dividida por responsabilidade em vez de um único sistema gigante.

## DEC-023 — Domínio e UI

Status: Approved

Decisão:
React não deve executar regras fundamentais do futebol.

## DEC-024 — MVP

Status: Approved

Decisão:
primeiro vertical slice:

escolher clube
→ elenco
→ escalação
→ tática
→ partida
→ resultado
→ tabela
→ próxima rodada.

## DEC-025 — Filosofia de desenvolvimento

Status: Approved

Decisão:
implementar incrementalmente, evitar dependências desnecessárias e priorizar sistemas funcionais antes de polimento.

## DEC-026 — Regras específicas

Status: Approved

Decisão:
não hardcodar clubes, Brasileirão ou Brasil nas entidades genéricas.

## DEC-027 — Testes

Status: Approved

Decisão:
compilar não é prova de correção.
Devem existir testes unitários, de integração e simulação estatística conforme o sistema.

## DEC-028 — Mudanças futuras

Status: Approved

Decisão:
mudanças arquiteturais importantes devem ser justificadas e, quando afetarem decisões existentes, registradas neste documento.

## DEC-029 — Calendário civil e processamento explícito

Status: Approved

Contexto:
A Fase 8 exige tempo central, múltiplas competições e proteção de ações humanas sem acoplar calendário a simulação/UI.

Decisão:
Manter datas civis YYYY-MM-DD sem horário/fuso, com operações centralizadas em core/date. GameCalendar usa agenda ordenada e confirmação explícita por ID de evento, com snapshots imutáveis. Avanços não podem regredir nem ultrapassar evento pendente. A aplicação coordena processamento, MatchEngine e liga; partida humana exige PLAY_MATCH explícito. SeasonSchedule associa datas às fixtures, e Match/rodadas são projetados a partir da agenda e dos resultados existentes.

Motivo:
Evitar decisões humanas puladas, efeitos escondidos e duplicação de resultados/status, mantendo consultas temporais eficientes e reprodução por seeds estáveis por partida.

Consequências:
Conflitos de jogos são validados por clube/data enquanto não existem horários. Eventos na mesma data usam prioridade lógica e ID estável. Providers de escalação e RNG são recebidos explicitamente; novas categorias de evento exigirão comportamento concreto na aplicação. Não define formato de save, nova temporada automática ou sistemas futuros de mercado/contratos.

## DEC-030 — Rascunho e confirmação da equipe

Status: Approved

Contexto:
A Fase 9.2 solicita Salvar equipe, Descartar e aviso de saída para diferenciar a edição da configuração usada na partida.

Decisão:
A sessão confirmada mantém a única configuração efetiva consumida pelo MatchEngine. Um TeamSetup separado na camada de aplicação representa o rascunho de escalação, banco e táticas; a UI apresenta sua projeção. Salvar valida pelo domínio e confirma o conjunto atomicamente. Erros impedem o commit; alertas permitem. Descartar remove o rascunho e recupera a última configuração confirmada. Navegação ou avanço com edições pendentes oferece Salvar, Descartar e Cancelar.

Motivo:
Evitar aplicação acidental de mudanças e divergência entre a equipe mostrada no pré-jogo e a recebida pelo motor, preservando regras independentes de React.

Consequências:
Esta confirmação existe apenas na sessão e não implementa savegame, localStorage ou persistência de carreira. DEC-019 continua válida para o futuro save versionado. Imagens/cores são metadados de apresentação opcionais, sem dependência estrutural no domínio. Novas formações da Fase 9.2 entram no catálogo existente com distribuição de posições e coordenadas visuais separadas; seus modificadores adicionais começam neutros, sem alterar os parâmetros das formações anteriores ou realizar balanceamento estatístico nesta fase.

## DEC-031 — Partida incremental e motor único

Status: Approved

Contexto:
A Fase 10B exige relógio de jogo, eventos parciais, intervalo explícito e ajustes táticos sem divergir das partidas CPU existentes.

Decisão:
MatchSession mantém estado privado e uma RandomSource exclusiva por partida. Avanços processam somente minutos solicitados e param no intervalo; startSecondHalf é explícito. Snapshots imutáveis são a interface de leitura. MatchEngine.simulate mantém o contrato anterior e executa a mesma sessão até FULL_TIME, usando as mesmas regras por minuto. Não existem timers no motor; pausa e futura velocidade pertencem à apresentação/aplicação.

Motivo:
Preservar determinismo e uma única implementação das regras, impedir antecipação de eventos e separar execução da apresentação.

Consequências:
A aplicação controla a sessão ativa sem expor estado mutável ao React. FULL_TIME produz o resultado pendente; somente Continuar o registra na liga/calendário. Táticas ao vivo afetam apenas minutos futuros e esta partida, sem sobrescrever a equipe confirmada de DEC-030. Escalação permanece fixa nesta fase. A sessão é exclusivamente em memória, sem definir persistência/RNG serializado; DEC-019 permanece válida. Os controles de velocidade e simulação rápida dos itens 35–41 ficam para a próxima etapa conforme a orientação do usuário.

## DEC-032 — Alterações ao vivo e substituições simples

Status: Approved

Contexto:
A Fase 10B.2 amplia a sessão incremental de DEC-031 com reprodução automática, rascunho de equipe e substituições funcionais.

Decisão:
Timer e estado PLAYING/PAUSED pertencem à UI; velocidades alteram somente a frequência de advance(1). A UI reutiliza a tela Equipe em um dialog pausado. Formação, posições, mentalidade, estilo e substituições são confirmados atomicamente pela aplicação e MatchSession, após validação. Cancelar não executa comandos na sessão. A equipe pré-jogo permanece separada das alterações desta partida, conforme DEC-030.

Motivo:
Garantir um único motor determinístico, reaproveitar o gerenciamento existente e impedir configuração parcial ou retorno indevido de atletas.

Consequências:
MatchSessionRules centraliza maxSubstitutions (padrão 5 por equipe). Trocas confirmadas removem definitivamente o atleta e consomem um limite por entrada; reposicionamento dos mesmos titulares não consome troca. Lineup e banco disponíveis, atletas que entraram/saíram e histórico de trocas integram snapshots imutáveis. SUBSTITUTION usa clubId, playerInId/playerOutId e os campos compatíveis playerId/secondaryPlayerId. Novas forças são usadas somente nos minutos futuros. Atalhos de intervalo/fim/rápido usam a mesma sessão; futuras pendências obrigatórias deverão bloquear canAdvance/canStartSecondHalf. Não há janelas de substituição, desgaste progressivo ou persistência. Esta decisão estende a restrição de lineup fixa da Fase 10B; o restante de DEC-031 continua vigente.

## Como registrar novas decisões

Cada decisão nova deve ter:

- ID sequencial;
- título;
- status;
- contexto;
- decisão;
- motivo;
- consequências, quando relevante.

Nunca apagar silenciosamente decisões antigas.
Se uma decisão mudar, marque a anterior como superseded e referencie a nova.
