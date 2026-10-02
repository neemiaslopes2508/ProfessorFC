# Professor FC — Technical Specification v1.0

## 1. Objetivo arquitetural

Professor FC será uma aplicação web single-player de gerenciamento de futebol.

A arquitetura deve suportar:

- temporadas longas;
- até 50 temporadas por carreira;
- milhares de partidas simuladas;
- evolução independente dos clubes;
- jogadores reais como seed inicial;
- jogadores gerados futuramente;
- expansão para novas ligas e países;
- saves versionados;
- simulação independente da interface.

Prioridades:

1. correção;
2. modularidade;
3. testabilidade;
4. performance;
5. manutenção;
6. expansibilidade.

Evitar abstrações prematuras.

---

## 2. Stack planejada

Frontend:

- React;
- TypeScript;
- Vite.

A lógica principal do jogo deve ser TypeScript independente do React.

React será responsável principalmente por:

- interface;
- navegação;
- apresentação;
- interação do usuário.

O React NÃO deverá conter diretamente regras fundamentais da simulação.

---

## 3. Princípio fundamental

A aplicação deverá separar:

DATA
→ DOMAIN
→ GAME SYSTEMS
→ SIMULATION
→ APPLICATION
→ UI

A interface não deve ser responsável pelas regras do futebol.

Exemplo:

ERRADO:

um componente React calcular o resultado de uma partida.

CORRETO:

MatchEngine.simulate(matchContext)

retorna um MatchResult.

React apenas apresenta esse resultado.

---

## 4. Estrutura conceitual

Planejar aproximadamente:

src/

core/
domain/
simulation/
ai/
progression/
competitions/
transfers/
finance/
career/
data/
save/
application/
ui/
utils/

Não criar esses diretórios ainda.

Esta é apenas a organização arquitetural planejada.

---

## 5. IDs

Todas as entidades persistentes deverão possuir identificadores estáveis.

Não utilizar nomes como chave primária.

Exemplos:

playerId
clubId
competitionId
seasonId
matchId
coachId

IDs deverão continuar válidos mesmo que o nome exibido seja alterado.

---

## 6. Entidade Player

Planejar Player aproximadamente com:

id
firstName
lastName
displayName
birthDate
nationality
preferredFoot

primaryPosition
secondaryPositions

attributes

potential
form
fitness

clubId
contractId

marketValue

careerStats

status

metadata

Não tratar overall como fonte primária obrigatória.

Overall deve preferencialmente ser derivado.

---

## 7. PlayerAttributes

Primeira estrutura conceitual:

finishing
passing
technique
defending
pace
physical
stamina
decision

Escala:

1–100.

O sistema deve permitir evolução futura sem quebrar necessariamente todos os jogadores existentes.

---

## 8. Position

Posições não devem depender de textos espalhados pelo código.

Planejar identificadores controlados.

Exemplo conceitual:

GK
RB
LB
CB
DM
CM
AM
RW
LW
ST

Permitir posições primária e secundárias.

---

## 9. Entidade Club

Planejar:

id
name
shortName
country
reputation

stadiumId

squad

coachId

finances

profile

history

metadata

Evitar armazenar informações calculáveis desnecessariamente.

Exemplo:

força atual do elenco pode ser calculada em vez de persistida permanentemente.

---

## 10. ClubProfile

Representará tendências utilizadas pela IA.

Exemplos:

youthPreference
transferAggressiveness
sellingPreference
financialRisk
experiencedPlayerPreference

Esses parâmetros deverão ser dados/configuração.

Não criar dezenas de ifs específicos:

if club === "X"

---

## 11. Coach

Planejar:

id
name
nationality
reputation
experience

currentClubId

contract

careerHistory

statistics

O jogador humano e treinadores da IA devem utilizar o mesmo modelo conceitual sempre que possível.

Adicionar um indicador de controle:

humanControlled

ou solução equivalente.

---

## 12. Competition

Competition deve ser genérica.

Planejar:

id
name
country
type

format

participants

rules

calendarRules

promotionRules

relegationRules

prizeRules

O código NÃO pode assumir:

competition === brasileirao

para executar regras fundamentais.

---

## 13. CompetitionType

Suportar conceitualmente:

LEAGUE
KNOCKOUT
GROUP_AND_KNOCKOUT

Mesmo que inicialmente apenas parte seja implementada.

---

## 14. Season

Season representa uma edição temporal.

Exemplo:

Brasileirão 2026

não deve ser a mesma entidade conceitual que:

Brasileirão

Separar:

Competition
de
CompetitionSeason

Competition = definição.

CompetitionSeason = edição daquela temporada.

---

## 15. CompetitionSeason

Planejar:

id
competitionId
year

participants

fixtures

standings

status

statistics

championId

---

## 16. Match

Planejar:

id
competitionSeasonId
round

date

homeClubId
awayClubId

status

homeLineup
awayLineup

result

events

statistics

Evitar salvar dados duplicados sem necessidade.

---

## 17. MatchStatus

Planejar:

SCHEDULED
IN_PROGRESS
FINISHED
POSTPONED
CANCELLED

Ainda que alguns estados não sejam utilizados inicialmente.

---

## 18. MatchEngine

MatchEngine será um dos componentes mais importantes.

Deverá ser independente de:

- React;
- banco de dados;
- arquivos;
- navegador;
- interface.

Entrada conceitual:

MatchSimulationInput

contendo:

home team
away team
lineups
tactics
player state
context
random source

Saída:

MatchSimulationResult

contendo:

score
events
statistics
player performances
injuries
cards

---

## 19. Aleatoriedade

NÃO utilizar Math.random() espalhado pelas regras do jogo.

Criar posteriormente uma abstração:

RandomSource

Isso permitirá:

- testes reproduzíveis;
- seeds;
- debugging;
- simulações determinísticas quando necessário.

Exemplo conceitual:

RandomSource.next()

Em testes será possível utilizar seed fixa.

---

## 20. Tactics

Planejar:

formation
mentality
style

Possivelmente:

instructions

Formação, mentalidade e estilo devem usar valores controlados.

---

## 21. Lineup

Lineup deve representar:

startingPlayers
bench
positions
captain, futuramente

O motor deve conseguir validar:

- jogadores repetidos;
- jogadores inexistentes;
- jogadores indisponíveis;
- posições;
- goleiro.

---

## 22. Match Events

Criar modelo genérico.

Tipos previstos:

GOAL
YELLOW_CARD
RED_CARD
SUBSTITUTION
INJURY
SHOT
SHOT_ON_TARGET
SAVE
CORNER
FOUL
PENALTY

Evento poderá possuir:

minute
type
clubId
playerId
secondaryPlayerId
metadata

---

## 23. Estatísticas

MatchStatistics deverá suportar:

possession
shots
shotsOnTarget
corners
fouls
yellowCards
redCards

Estatísticas devem ser consequência coerente da simulação.

Não gerar placar e estatísticas como sistemas completamente desconectados.

---

## 24. Calendar

Criar futuramente um GameCalendar.

Responsabilidades:

- data atual da carreira;
- avanço do tempo;
- eventos;
- partidas;
- janelas;
- contratos;
- temporadas.

O calendário NÃO deverá conhecer detalhes da interface.

---

## 25. Game World

Planejar uma entidade/agregado de alto nível:

GameWorld

Representará o estado vivo da carreira.

Pode referenciar:

currentDate
currentSeason

clubs
players
coaches
competitions
competitionSeasons
matches
transfers

humanCoachId

Não necessariamente tudo deverá ficar fisicamente em um único objeto gigante.

GameWorld é conceito de domínio/aplicação.

---

## 26. Career

Career representa especificamente a trajetória do treinador humano.

Planejar:

coachId
startDate
currentClubId
history
achievements
statistics

Não confundir Career com todo o GameWorld.

---

## 27. Transfer

Planejar:

id
playerId

fromClubId
toClubId

type

fee

date

status

TransferType:

PERMANENT
FREE

LOAN poderá ser adicionado depois.

---

## 28. Transfer Negotiation

Separar negociação da transferência concluída.

Planejar:

TransferNegotiation

buyerClubId
sellerClubId
playerId

askingPrice
currentOffer

status

history

Estados conceituais:

OPEN
COUNTERED
ACCEPTED
REJECTED
CANCELLED

---

## 29. Contract

Contrato não deve existir apenas como campos soltos em Player.

Planejar entidade/value object apropriado:

id
playerId
clubId

startDate
endDate

salary

status

Isso facilitará posteriormente:

- renovação;
- fim de contrato;
- histórico.

CoachContract poderá reutilizar conceitos sem necessariamente ser exatamente a mesma entidade.

---

## 30. Finance

Valores monetários devem possuir convenção clara.

Evitar números de ponto flutuante representando dinheiro.

Preferência:

armazenar dinheiro em centavos usando inteiro seguro quando possível.

Exemplo:

R$ 1.000.000,00

internamente:

100000000 centavos.

Criar posteriormente helpers de formatação.

---

## 31. ClubFinances

Planejar:

cashBalance
transferBudget
wageBudget

income
expenses

transactions

FinanceTransaction deverá registrar movimentações importantes.

---

## 32. Progression

PlayerProgressionSystem será responsável por evolução.

Entrada:

player
age
minutes
performance
training
context

Saída:

alterações nos atributos.

Separar progressão do Player.

Player é estado.

ProgressionSystem é comportamento.

---

## 33. Aging

AgingSystem deverá cuidar de:

- idade;
- curva de evolução;
- auge;
- declínio;
- aposentadoria.

Não criar regra:

idade X = aposentadoria obrigatória.

Usar probabilidades/faixas configuráveis posteriormente.

---

## 34. Newgen

NewgenGenerator será responsável por novos jogadores.

Deverá utilizar configuração e RandomSource.

Nunca depender da interface.

Deve permitir testes estatísticos sobre:

- quantidade;
- posições;
- atributos;
- potencial;
- nacionalidades.

---

## 35. IA

Separar diferentes responsabilidades.

Planejar:

LineupAI
TacticsAI
TransferAI
ContractAI
ClubManagementAI

Evitar uma classe gigantesca:

ClubAI

fazendo tudo.

---

## 36. IA baseada em avaliação

Sempre que possível, decisões da IA deverão usar:

candidatos
→ scoring
→ prioridades
→ decisão.

Exemplo de contratação:

necessidade da posição
+
qualidade
+
idade
+
potencial
+
preço
+
salário
+
perfil do clube.

Isso facilita balanceamento.

---

## 37. Data Layer

Dados iniciais reais deverão ficar separados da lógica.

Planejar:

repositories
loaders
mappers
validators

Dados externos deverão ser convertidos para o formato interno.

O domínio NÃO deverá depender do formato de Transfermarkt, FBref, CSV específico ou qualquer fornecedor.

Fluxo:

External data
→ Importer/Mapper
→ Professor FC data model
→ Game.

---

## 38. Proveniência dos dados

Como o projeto exige dados reais, registrar origem e data de referência quando possível.

Metadata poderá incluir:

source
sourceDate
externalId

Esses campos não devem ser necessários para a simulação.

Servem para manutenção da base.

---

## 39. Save

Separar:

GameData

de:

SaveGame.

GameData:
base inicial.

SaveGame:
estado daquela carreira.

Save deverá possuir:

saveVersion
gameVersion
createdAt
updatedAt

worldState
careerState

---

## 40. Save Migration

Planejar:

SaveMigration

Exemplo:

v1 → v2
v2 → v3

Nunca modificar silenciosamente formato de save sem alterar saveVersion quando houver incompatibilidade estrutural.

---

## 41. Repositories

A lógica do domínio não deverá saber se os dados vieram de:

JSON
IndexedDB
backend
arquivo.

Planejar interfaces de repositório quando elas forem realmente necessárias.

Evitar criar abstrações vazias prematuramente.

---

## 42. Application Layer

A camada application coordenará casos de uso.

Exemplos futuros:

CreateCareer
SelectClub
SetLineup
SetTactics
AdvanceDate
PlayMatch
MakeTransferOffer
AcceptTransferOffer
RenewContract

Application coordena.

Domain executa regras.

UI solicita ações.

---

## 43. UI

React ficará principalmente em:

ui/

Planejar:

pages
components
layouts
hooks

Evitar colocar regras fundamentais dentro de hooks/componentes.

---

## 44. Estado da UI

Não escolher biblioteca global de estado neste momento.

Começar simples.

Somente adicionar biblioteca quando a complexidade justificar.

Evitar dependência desnecessária.

---

## 45. Validação

Dados reais importados devem passar por validação.

Exemplos:

- jogador sem posição;
- clube inexistente;
- player apontando para clubId inválido;
- valor negativo;
- atributo fora de 1–100;
- competição com participante inexistente.

Falhar cedo é preferível a corromper uma carreira.

---

## 46. Testes

Planejar pelo menos três níveis.

### Unitários

Exemplos:

overall
valor
progressão
tática
regras.

### Integração

Exemplos:

partida completa;
rodada;
transferência;
fim de temporada.

### Simulação estatística

Exemplos:

10.000 partidas;
100 temporadas;
mercado por décadas.

---

## 47. Invariantes importantes

Documentar regras que nunca devem ser violadas.

Exemplos:

- um jogador não pode pertencer simultaneamente a dois clubes em contrato permanente;
- uma partida finalizada precisa possuir resultado;
- IDs precisam ser únicos;
- atributos devem respeitar limites;
- dinheiro não pode gerar NaN;
- escalação não pode repetir jogador;
- clube não pode jogar contra si mesmo.

---

## 48. Performance

Não otimizar prematuramente.

Mas considerar desde o início:

- dezenas/centenas de clubes futuramente;
- milhares de jogadores;
- milhares de partidas;
- 50 temporadas.

Evitar arquiteturas que exijam renderizar ou processar toda a UI para realizar simulações.

---

## 49. Expansão internacional

Country e Competition devem ser conceitos genéricos.

Não colocar regras brasileiras dentro das entidades genéricas.

Regras específicas deverão ser configuração ou implementação especializada quando necessário.

Exemplo:

BrazilianLeagueRules

poderá existir futuramente.

Mas:

Club

não deve depender de Brazil.

---

## 50. Configuração

Parâmetros de balanceamento deverão preferencialmente ficar fora de regras hardcoded.

Exemplos futuros:

homeAdvantage
injuryRate
developmentRate
retirementProbability
transferActivity

Isso permitirá balanceamento sem reescrever sistemas.

---

## 51. Observabilidade de desenvolvimento

Motores importantes deverão permitir diagnóstico.

Especialmente:

MatchEngine
TransferAI
ProgressionSystem

Durante desenvolvimento/testes, deverá ser possível entender por que determinado resultado foi produzido.

Evitar sistemas completamente opacos.

---

## 52. Ordem técnica de implementação

Quando o desenvolvimento começar, seguir aproximadamente:

1. bootstrap do projeto;
2. tipos fundamentais;
3. Player;
4. Club;
5. Competition;
6. Match;
7. dados mínimos fictícios de TESTE;
8. lineup;
9. tactics;
10. primeiro MatchEngine;
11. testes do motor;
12. competição;
13. calendário;
14. UI mínima;
15. dados reais;
16. transferências;
17. finanças;
18. IA;
19. progressão;
20. carreira;
21. save;
22. simulações longas;
23. refinamento.

IMPORTANTE:

Dados fictícios poderão ser utilizados SOMENTE em testes/desenvolvimento técnico.

O produto/jogo deve respeitar o requisito de dados reais no mundo inicial.

---

## 53. Regra para implementação

Antes de implementar qualquer módulo relevante:

1. ler AGENTS.md;
2. consultar GDD;
3. consultar esta especificação;
4. consultar DECISIONS;
5. identificar dependências;
6. implementar menor unidade funcional;
7. testar;
8. só então avançar.

---

## 54. Evitar

Evitar desde o início:

- God Object;
- lógica dentro de componentes React;
- Math.random espalhado;
- strings mágicas;
- dinheiro com float;
- dependência direta de fornecedor de dados;
- regras específicas de clube;
- regras específicas do Brasileirão dentro de entidades genéricas;
- salvar dados calculáveis sem necessidade;
- dependências npm para problemas triviais;
- otimização prematura;
- implementar dezenas de funcionalidades simultaneamente.

---

## 55. Objetivo técnico do MVP

O primeiro vertical slice deverá conseguir executar:

dados
→ clube
→ elenco
→ escalação
→ tática
→ partida
→ resultado
→ classificação
→ próxima rodada.

Esse fluxo deverá funcionar antes de expandir significativamente o escopo.

---

## 56. Princípio final

A arquitetura deve permitir que:

o Professor FC de 2026 com aproximadamente 40 clubes

possa crescer futuramente para:

centenas de clubes, várias ligas e décadas simuladas

sem exigir reescrita completa do núcleo.

## Pontos que exigem revisão

- **Overall (seção 6):** a expressão "Overall deve preferencialmente ser derivado" admite uma alternativa que o GDD, nas seções 7 e 9, não prevê: o overall deverá ser calculado pelo jogo, com pesos por posição, e não como simples média. Na implementação, prevalece essa exigência do GDD; revisar a formulação desta especificação para tornar o cálculo obrigatório, mantendo o overall fora dos dados primários.
