# Professor FC — Roadmap v1.0

## Fase 0 — Fundação documental

Status: concluída quando AGENTS, GDD, TECHNICAL_SPEC, ROADMAP e DECISIONS estiverem definidos.

Objetivos:

- consolidar escopo;
- consolidar arquitetura;
- registrar decisões;
- evitar implementação sem direção.

## Fase 1 — Bootstrap técnico

Objetivo:
criar a aplicação web e a base de desenvolvimento.

Entregas:

- React + TypeScript + Vite;
- configuração de lint;
- testes;
- estrutura inicial de diretórios;
- scripts de desenvolvimento;
- primeiro build funcionando;
- README atualizado com instruções locais.

Critério de conclusão:

- projeto inicia;
- build funciona;
- testes executam;
- estrutura respeita TECHNICAL_SPEC.

## Fase 2 — Domínio mínimo

Objetivo:
representar corretamente os principais conceitos do jogo sem interface complexa.

Entregas:

- IDs;
- money helpers;
- Player;
- PlayerAttributes;
- Position;
- Club;
- Coach;
- Competition;
- CompetitionSeason;
- Match;
- Tactics;
- Lineup;
- contratos básicos.

Critério:

- entidades validadas;
- invariantes principais testadas;
- sem dependência de React.

## Fase 3 — Dados mínimos de teste

Objetivo:
permitir desenvolvimento do motor sem depender ainda da base real completa.

Entregas:

- dataset fictício exclusivo de teste/desenvolvimento;
- 4 a 8 clubes fictícios;
- jogadores fictícios;
- validadores de dados;
- loaders/mappers internos.

IMPORTANTE:
dados fictícios são apenas de desenvolvimento.
O produto final deve utilizar dados reais conforme o GDD.

## Fase 4 — Escalação e táticas

Entregas:

- validação de lineup;
- titulares;
- banco;
- posições;
- formação;
- mentalidade;
- estilo;
- indisponibilidade;
- alertas básicos.

Critério:

- uma escalação válida pode ser criada e rejeitar estados inválidos.

## Fase 5 — Match Engine v0.1

Objetivo:
produzir uma partida simulada completa.

Entregas:

- RandomSource;
- força dos jogadores;
- força por setor;
- mando;
- influência básica de tática;
- criação de chances;
- gols;
- cartões;
- estatísticas;
- MatchSimulationResult.

Critério:

- partida pode ser simulada sem UI;
- testes reproduzíveis com seed;
- não usar Math.random espalhado.

## Fase 6 — Testes estatísticos do motor

Entregas:

- script/testes de milhares de partidas;
- análise de média de gols;
- frequência de empate;
- vantagem do time mais forte;
- mando;
- zebras;
- cartões;
- distribuição básica.

Objetivo:
evitar balancear apenas “no feeling”.

## Fase 7 — Competições

Entregas:

- liga;
- tabela;
- pontos;
- critérios de desempate;
- fixtures;
- rodada;
- classificação;
- campeão;
- promoção/rebaixamento.

Primeiro foco:
competição genérica de pontos corridos.

Depois:
mata-mata básico.

## Fase 8 — Calendário

Entregas:

- GameCalendar;
- data atual;
- avanço de dia;
- rodada;
- eventos;
- início/fim de temporada.

Critério:

- temporada simples pode avançar do começo ao fim.

## Fase 9 — Vertical Slice de gameplay

Objetivo:
primeira experiência jogável mínima.

Fluxo:

escolher clube
→ visualizar elenco
→ escalar
→ escolher tática
→ jogar
→ ver timeline/estatísticas
→ atualizar tabela
→ avançar rodada.

UI deve ser simples.

Não priorizar design visual avançado.

## Fase 10 — Base real 2026

Objetivo:
substituir o dataset fictício do produto por dados reais.

Entregas:

- pipeline de importação;
- clubes reais;
- jogadores reais;
- valores reais de referência;
- Série A;
- Série B;
- metadados de origem;
- validação.

IMPORTANTE:
não acoplar domínio ao formato da fonte externa.

## Fase 11 — Copa do Brasil

Entregas:

- competição mata-mata;
- sorteio/chave;
- avanço;
- regras configuráveis;
- campeão.

Começar simplificado.

## Fase 12 — Mercado v1

Entregas:

- busca;
- oferta;
- contraproposta;
- aceitação;
- rejeição;
- transferência;
- atualização de elenco;
- movimentação financeira.

Critério:

- jogador não pode pertencer a dois clubes permanentemente.

## Fase 13 — Contratos

Entregas:

- salário;
- duração;
- renovação;
- expiração;
- jogador livre.

Empréstimo fica para etapa posterior.

## Fase 14 — Finanças

Entregas:

- caixa;
- orçamento de transferências;
- folha;
- receita;
- despesa;
- transações;
- bilheteria;
- premiações.

Critério:

- dinheiro sempre tratado como inteiro/centavos ou solução segura equivalente.

## Fase 15 — IA de clubes

Separar:

- LineupAI;
- TacticsAI;
- TransferAI;
- ContractAI;
- ClubManagementAI.

Objetivo:
clubes funcionarem sem o jogador.

## Fase 16 — Carreira de treinador

Entregas:

- criação;
- perfil;
- clube;
- contrato;
- reputação;
- histórico;
- objetivos;
- demissão;
- propostas;
- troca de clube;
- ficar sem clube.

## Fase 17 — Progressão

Entregas:

- evolução;
- forma;
- condição;
- treinamento;
- auge;
- declínio.

## Fase 18 — Aposentadoria e newgens

Entregas:

- aposentadoria;
- geração de jogadores;
- equilíbrio por posição;
- potencial;
- distribuição de talento.

Critério:

- o mundo deve permanecer funcional por décadas.

## Fase 19 — Save v1

Entregas:

- saveVersion;
- salvar;
- carregar;
- exportar;
- importar;
- migração básica;
- validação de save.

## Fase 20 — Simulação de longo prazo

Simular:

- 5 temporadas;
- 10;
- 20;
- 50.

Verificar:

- inflação;
- finanças;
- mercado;
- quantidade de jogadores;
- força dos clubes;
- aposentadoria;
- newgens;
- integridade dos dados;
- performance.

## Fase 21 — UX e polimento

Entregas:

- melhorar navegação;
- dashboard;
- feedback;
- filtros;
- acessibilidade básica;
- responsividade;
- desempenho;
- mensagens de erro.

## Fase 22 — Expansão

Somente após o núcleo estar estável.

Possíveis:

- Série C;
- Série D;
- estaduais;
- Libertadores;
- Sul-Americana;
- outros países;
- empréstimos;
- sistemas adicionais.

## Regra de avanço

Não avançar de fase apenas porque o código foi escrito.

Uma fase só é concluída quando:

- funcionalidades principais funcionam;
- testes relevantes passam;
- invariantes são respeitadas;
- documentação é atualizada;
- não existem regressões críticas.

## Regra de escopo

Quando surgir uma ideia nova:

- verificar se pertence à fase atual;
- se não pertencer, registrar para fase futura;
- evitar interromper a implementação atual sem necessidade.

## Notas da revisão contra GDD e TECHNICAL_SPEC

- A Fase 0 ainda depende da definição de DECISIONS.md, atualmente um documento a preencher, e da revisão pendente sobre overall registrada em TECHNICAL_SPEC.md. A criação deste roadmap não declara a fundação documental concluída.
- O overall deverá ser calculado pelo jogo com pesos por posição, conforme o GDD. Essa regra orienta o domínio e o motor desde as fases iniciais.
- A experiência da Fase 9 é um protótipo de desenvolvimento enquanto utilizar dados fictícios. Na Fase 10, a substituição refere-se à base desse protótipo; dados fictícios não serão a base inicial do produto destinado ao jogador.
- As fases iniciais entregam versões mínimas, sem eliminar requisitos do GDD. O motor deverá evoluir para os demais eventos previstos e ajustes durante a partida, especialmente no intervalo; a versão 0.1 não representa o escopo completo do motor.
- O fluxo da Fase 9 exige escalações e táticas válidas para os adversários. Fornecer somente o comportamento mínimo necessário nesse estágio; a gestão autônoma completa dos clubes permanece na Fase 15.
- A movimentação financeira da Fase 12 utiliza os helpers monetários da Fase 2 e precisa validar saldos e registrar transações. A Fase 14 amplia as finanças, sem adiar a integridade monetária das transferências.
- A Fase 16 seguirá as três perguntas de perfil, sugestões sem bloquear a escolha de clubes e o limite de 50 temporadas definidos no GDD. O histórico relevante de competições, jogadores e transferências deve ser preservado pelos sistemas responsáveis, além do histórico do treinador.
- A Fase 19 mantém dados-base separados do estado da carreira e considera os campos de versão e metadados previstos na especificação, com migrações para alterações incompatíveis.
