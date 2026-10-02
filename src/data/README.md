# Dados mínimos de desenvolvimento — Fase 3

**Fixtures fictícias nunca são a base oficial do Professor FC.** O produto continua exigindo dados reais de 2026 (DEC-004 e DEC-020).

`fixtures/development.ts` cria uma base determinística com **6 clubes, 120 jogadores (20 por clube), 6 treinadores, 1 competição e 1 edição de 2026**. Cada elenco contém 2 GK e atletas de todas as posições controladas. IDs têm prefixo `dev-`; nomes, atributos e valores são inventados. A função monta um dataset fixo, sem aleatoriedade, IA ou geração de novas gerações.

Os centroavantes fictícios possuem RW/LW como posições secundárias para exercitar o perfil e a edição da Fase 9.2. Isso não altera suas posições principais nem a seleção inicial. Escudos, cores e retratos são recursos de apresentação em `src/ui/`/`public/`, sem novos campos obrigatórios no domínio ou fontes externas.

## Uso explícito

```ts
import { createDevelopmentFixture } from './fixtures/development'
import { loadGameData } from './index'

const result = loadGameData(createDevelopmentFixture(), 'development')
if (result.ok) {
  const clubs = result.repositories.clubs.getAll()
  const players = result.repositories.players.getAll()
  // Consultar dados no desenvolvimento; ainda não há gameplay.
}
```

A fixture não é exportada pelo barrel principal. Na Fase 9, a camada de aplicação a carrega explicitamente para o protótipo de desenvolvimento; componentes React não importam a fixture. Solicitar `'official'` com origem `DEVELOPMENT_FIXTURE` retorna erro `DEVELOPMENT_DATA_NOT_OFFICIAL`. `REAL_BASE` apenas identifica uma futura base real: a marca não certifica a veracidade ou licença dos dados. Não existe importador real nesta fase.

## GameData e repositórios

`GameData` representa exclusivamente a base inicial e sua proveniência. Não inclui relógio da carreira, treinador humano escolhido, eventos de simulação ou save. O carregador recebe dados já tipados no formato interno, valida e cria um snapshot independente usando os construtores do domínio. Não é parser de JSON arbitrário nem mapper de fornecedor externo.

Os repositórios in-memory são síncronos e de leitura (`getById`, `getAll`), com IDs tipados e índices `Map`. ID desconhecido retorna `undefined`; duplicados não são sobrescritos silenciosamente. Tanto a entrada quanto os resultados de consulta são copiados, inclusive metadados serializáveis, para impedir que alterações do consumidor atinjam o repositório ou a seed. Metadados devem ser compatíveis com `structuredClone`. Não há escrita, persistência, backend ou estado de carreira; esses conceitos não são antecipados aqui.

## Validação de integridade

`validateGameData` retorna `ValidationResult` com `valid` e `errors`. Cada erro inclui `code`, `path` (por exemplo `clubs[0].playerIds[2]`) e uma mensagem com os IDs envolvidos.

Verifica invariantes locais pelos validadores existentes, IDs únicos entre todas as coleções, referências a entidades válidas, vínculo jogador↔elenco, jogador em mais de um clube, vínculo treinador↔clube e competição/participantes das edições. Jogadores livres (`clubId: null`) e treinadores sem clube são válidos quando não listados por um clube. Entidades inválidas são relatadas e não usadas como destinos válidos de referências. O carregamento rejeita toda a base se houver erros, sem expor repositórios parciais.

Regras próprias da fixture (6 clubes e 20 atletas por clube) não restringem o validador genérico. Não são implementados MatchEngine, mercado, IA, tabela, calendário ou dados reais nesta camada. A validação contextual da Fase 4 está em `src/domain/tactics/`; consulte `src/domain/README.md` para montar explicitamente uma seleção usando esta fixture.
