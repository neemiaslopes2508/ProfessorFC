# Vertical slice — validação da Fase 9

Protótipo exclusivamente fictício, com seis clubes e uma temporada. Sem alterações nos parâmetros do MatchEngine, dependências novas ou mudanças em GDD, TECHNICAL_SPEC, ROADMAP e DECISIONS.

## Checkpoint

- Suíte completa executada uma vez: 20 arquivos, 256 testes aprovados (249 históricos + 7 novos).
- Lint: encontrou export de helper em arquivo de componentes; helper movido para `ui/components/presentation.ts`. Verificação corrigida passou sem avisos.
- Build: TypeScript e Vite aprovados; reexecutado após a correção de organização de imports.
- `pnpm demo:calendar 2026`: 30 partidas, dez rodadas, edição FINISHED em 07/06/2026; campeão Porto das Nuvens. Resultados em `../development-calendar/`.
- Analyzer estatístico não executado.

## Fluxo no navegador

Novo jogo → Aurora Inventada → dashboard → elenco → filtro GK → atributos de Ari Nuvem 1 → escalação → limpar slot de zagueiro e visualizar erro → restaurar slot → táticas 4-2-3-1, Ofensiva, Posse → avançar ao início e primeira rodada → preparar → jogar → resultado/timeline/estatísticas → tabela antes de confirmar → Continuar → calendário com rodada concluída → repetir até a décima rodada.

Antes de Continuar, Aurora tinha zero jogos na tabela e o resultado estava pendente. Depois da confirmação, calendário ficou liberado. No fim, 07/06/2026: Porto das Nuvens campeão; Aurora 6º, seis pontos e dez partidas. Essa temporada usa tática humana alterada, portanto não é a mesma amostra da demonstração com tática equilibrada. Console do navegador sem erros/avisos. Captura em `season-end.png`.

## Limites para o playtest

Sem persistência: refresh perde progresso. Uma temporada, sem transição à próxima. Escalações CPU fixas, dados fictícios, sem desgaste/progressão, suspensões por cartões ou movimentação financeira. Mudar formação preenche novamente o elenco. Operações rápidas e síncronas, sem loading artificial. Porta de teste 5174 porque 5173 já estava ocupada; usar a URL informada pelo Vite.
