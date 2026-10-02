# Domínio fundamental — Fases 2 e 4

Os módulos `players`, `clubs`, `coaches`, `tactics`, `competitions`, `matches` e `contracts` expõem tipos, valores controlados, validadores e construtores por seus `index.ts`. Não há barrel global do domínio. As dependências seguem domínio → core; não há dependência de React, navegador, persistência ou simulação.

Os construtores `create*` validam antes de retornar. Os modelos usam campos `readonly`; os construtores congelam o objeto e copiam/congelam suas coleções e valores de domínio. Metadados são opacos e não possuem garantia de imutabilidade profunda. Para alterar o estado futuramente, reconstruir o valor com validação. Validadores não substituem um futuro parser de dados externos: recebem modelos tipados, não JSON arbitrário.

## Convenções locais

- IDs: strings com marca nominal por entidade, construídas por `createId('Player', 'id-externo')`, por exemplo. Permanecem strings em JSON. Não geram UUID, não comprovam existência nem unicidade global. Não aceitam vazio ou espaços nas extremidades; não usar nomes como identificadores. A marca é de compilação, sem informação de tipo em runtime.
- Money: `{ cents }` com inteiro seguro entre `Number.MIN_SAFE_INTEGER` e `Number.MAX_SAFE_INTEGER`. Rejeita frações, NaN, infinito e overflow nas operações. Negativos são permitidos para saldos e resultados de subtração; valor de mercado, salário e orçamentos devem ser não negativos. Não formata valores. Nesta fase os montantes são em BRL, conforme DEC-015; multicurrency fica fora do escopo.
- Atributos e potencial: inteiros de **1 a 100**. Potencial é uma medida de desenvolvimento possível, sem garantir um overall futuro. Nenhum overall é persistido ou calculado nesta fase.
- Forma e fitness: inteiros de **0 a 100** (0 = mínimo; 100 = máximo). Não existem regras de evolução/desgaste ainda.
- Reputação de clubes/treinadores: inteiro de **0 a 100**. Experiência: pontos inteiros não negativos, limitados a inteiro seguro; ainda sem fórmula de ganho ou conversão em temporadas.
- ClubProfile: cada tendência é um inteiro independente de **0 a 100** (0 = mínima; 100 = máxima); não precisa somar 100. São dados, sem IA.
- Datas: data civil válida em **YYYY-MM-DD**, anos de 0001 a 9999, sem hora/fuso. Comparação entre datas canônicas independe do relógio. Nascimento não é convertido em idade ainda. Data de partida não representa horário de início.
- `Player.clubId = null` representa jogador livre. Referências opcionais de treinador/estádio/clube do treinador podem ser omitidas. Sobrenome pode ser vazio para nomes únicos; nacionalidade e país são identificadores textuais não vazios, sem catálogo nacional nesta fase.
- Lineup: 11 IDs de titulares, banco e 11 associações `{ playerId, position }`. Cada titular possui exatamente uma associação, com exatamente um GK. Banco não recebe posição nesse modelo e não possui limite fixo. `validateLineup` verifica a estrutura; `validateTeamSelection` acrescenta contexto de clube/jogadores e coerência com a formação.
- CompetitionFormat: `legs` (1 ou 2 confrontos por par na etapa representada) e `groupCount` opcional positivo. É configuração mínima, não o regulamento completo de uma competição. A edição fica em CompetitionSeason, com participantes únicos; campeão, quando informado, precisa ser participante.
- Partidas: rodada a partir de 1, clubes diferentes, placares inteiros não negativos e resultado obrigatório no estado FINISHED, conforme TECHNICAL_SPEC. Eventos usam minuto inteiro não negativo, sem limite de 90 para permitir acréscimos; o clube do evento deve estar na partida.
- Estatísticas: cada campo tem `{ home, away }`. Posse usa percentuais finitos de 0 a 100 somando 100 (tolerância numérica de 1e-9). Demais contagens são inteiros não negativos; finalizações no alvo não podem exceder as finalizações. Não há geração de estatísticas ou validação contra o placar ainda.
- Contract: fim estritamente posterior ao início; salário não negativo. Periodicidade salarial, renovação e mudanças automáticas de status ficam para definição futura.

## Limites e pontos pendentes

Integridade da base inicial e unicidade dos IDs são verificadas por `src/data/`. A validação contextual da escalação verifica os jogadores selecionados contra um snapshot do clube e dos jogadores. Integridade de contratos entre agregados e mudanças ao longo da carreira permanecem para etapas futuras. Tipos controlados não equivalem a implementação dos sistemas correspondentes.

O GDD exige overall interno com pesos por posição; a especificação ainda contém a formulação preferencial já sinalizada em sua seção de revisão. O pedido desta fase determina expressamente não persistir overall fixo. As escalas locais acima preenchem detalhes antes indefinidos, sem alterar escopo ou decisões arquiteturais. O formato completo de competições e a periodicidade de salários permanecem em aberto.

As seções acima descrevem o domínio inicial. O MatchEngine está em `src/simulation/`, a liga em `src/competitions/` e o calendário da Fase 8 em `src/domain/calendar/`, coordenado por `src/application/`. Mercado, IA, progressão, carreira completa, dados reais e persistência permanecem para fases posteriores. A fixture fictícia da Fase 3 permanece isolada em `src/data/fixtures/`.

## Escalação contextual — Fase 4

`validateTeamSelection(lineup, tactics, { club, players })` é uma função pura de domínio. O contexto deve conter entidades válidas com IDs únicos (por exemplo, vindas da base validada ou de um snapshot futuro da carreira). Não importa repositórios, UI ou fixtures; a ausência de um jogador no contexto é um impedimento, mesmo que o ID apareça no elenco.

O retorno tem `valid`, `errors` e `warnings`. Erros impedem a preparação: estrutura inválida, tática inválida, distribuição incompatível com a formação, jogador inexistente, vínculo de clube inconsistente ou jogador indisponível. Titulares e banco recebem as mesmas verificações de existência, vínculo nos dois sentidos e disponibilidade.

`INJURED`, `SUSPENDED` e `RECOVERING` bloqueiam a seleção; apenas `AVAILABLE` pode participar. A recuperação é tratada conservadoramente como indisponibilidade nesta etapa. Suspensão é aplicada conforme o status recebido no contexto, sem cálculo de cartões ou elegibilidade por competição. Condição física não recebe limiar de desgaste arbitrário; essa política ainda precisa ser definida junto aos sistemas correspondentes.

Fora da posição primária e das secundárias produz somente `OUT_OF_POSITION`, com ID, caminho e mensagem. Não aplica penalidade de desempenho nem impede improvisação, inclusive no GK. Jogadores ausentes, externos ou indisponíveis não recebem esse alerta para evitar diagnósticos derivados de um erro impeditivo. Posições secundárias válidas não geram alerta.

`prepareTeamSelection` só retorna `{ ok: true, selection, warnings }` se não houver impedimentos. `selection` contém `clubId`, `lineup` e `tactics`, com cópias validadas dos dois últimos. Em caso de erro retorna `{ ok: false, validation }`, sem entregar seleção parcial. Não escolhe jogadores automaticamente e não implementa IA.

### Distribuições iniciais

`FORMATION_POSITIONS` define uma distribuição explícita para cada formação. A ordem das associações não importa na validação; a quantidade de cada posição deve coincidir. Como o modelo atual não possui RM/LM nem posições próprias de ala, RW/LW representam os lados do meio no 4-4-2 e RB/LB os alas do 3-5-2. Essas são convenções locais iniciais, não novas posições ou funções táticas.

| Formação | Posições além do GK |
| --- | --- |
| 4-4-2 | RB, CB, CB, LB; RW, CM, CM, LW; ST, ST |
| 4-3-3 | RB, CB, CB, LB; DM, CM, CM; RW, LW, ST |
| 4-2-3-1 | RB, CB, CB, LB; DM, DM; RW, AM, LW; ST |
| 3-5-2 | CB, CB, CB; RB, DM, CM, AM, LB; ST, ST |
| 5-3-2 | RB, CB, CB, CB, LB; DM, CM, CM; ST, ST |
| 4-1-4-1 | RB, CB, CB, LB; DM; RW, CM, CM, LW; ST |
| 4-3-2-1 | RB, CB, CB, LB; DM, CM, CM; AM, AM; ST |
| 4-2-2-2 | RB, CB, CB, LB; DM, DM; AM, AM; ST, ST |
| 4-1-2-1-2 | RB, CB, CB, LB; DM; CM, CM; AM; ST, ST |
| 3-4-3 | CB, CB, CB; RB, CM, CM, LB; RW, LW, ST |
| 3-4-2-1 | CB, CB, CB; RB, CM, CM, LB; AM, AM; ST |
| 5-2-3 | RB, CB, CB, CB, LB; CM, CM; RW, LW, ST |
| 5-4-1 | RB, CB, CB, CB, LB; RW, CM, CM, LW; ST |
| 4-3-1-2 | RB, CB, CB, LB; DM, CM, CM; AM; ST, ST |
| 4-5-1 | RB, CB, CB, LB; RW, CM, DM, CM, LW; ST |

As dez últimas distribuições foram adicionadas na Fase 9.2. 4-1-4-1 concentra um volante atrás da linha de quatro; 4-5-1 recua o volante na linha de cinco, com coordenadas visuais próprias. Os códigos internos permanecem inalterados; nomes/abreviações PT-BR ficam na apresentação. Nenhuma função individual nova ou posição de ala foi introduzida. Os novos esquemas usam modificadores adicionais neutros em `simulation/config.ts`; os setores continuam recebendo as contribuições existentes de cada posição. Não houve alteração dos parâmetros dos cinco esquemas anteriores.

Mentalidade e estilo continuam os valores controlados do GDD; nenhuma influência em resultados é calculada nesta fase.

### Montagem explícita com a fixture de desenvolvimento

```ts
import { createDevelopmentFixture } from '../data/fixtures/development'
import { loadGameData } from '../data'
import { FORMATION_POSITIONS, prepareTeamSelection } from './tactics'

const loaded = loadGameData(createDevelopmentFixture(), 'development')
if (loaded.ok) {
  const club = loaded.repositories.clubs.getAll()[0]
  // Atletas explicitamente escolhidos para as posições do 4-3-3.
  const startingPlayers = [0, 2, 6, 7, 4, 10, 12, 13, 16, 17, 18]
    .map(index => club.playerIds[index])
  const result = prepareTeamSelection(
    {
      startingPlayers,
      bench: club.playerIds.filter(id => !startingPlayers.includes(id)),
      positions: FORMATION_POSITIONS['4-3-3'].map((position, index) => ({
        playerId: startingPlayers[index], position,
      })),
    },
    { formation: '4-3-3', mentality: 'BALANCED', style: 'POSSESSION' },
    { club, players: loaded.repositories.players.getAll() },
  )
  // result.ok indica ausência de impedimentos; alertas não tornam a seleção inválida.
}
```

Esse exemplo é exclusivo de desenvolvimento. Fixtures fictícias nunca são a base oficial do Professor FC. O validador de escalação não simula partidas e não implementa substituições ou interface. A integração temporal está documentada em [calendar/README.md](calendar/README.md).
