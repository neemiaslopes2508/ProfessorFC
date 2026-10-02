# Professor FC — Fase 9.2: validação

## Implementação

- Posições em PT-BR e abreviações centralizadas em presentation.ts, inclusive alertas/erros; códigos internos preservados.
- Dez formações novas, totalizando 15: 4-1-4-1, 4-3-2-1, 4-2-2-2, 4-1-2-1-2, 3-4-3, 3-4-2-1, 5-2-3, 5-4-1, 4-3-1-2 e 4-5-1. Slots de domínio, coordenadas de apresentação e cards com mini-campos. Catálogo expande no fluxo em tela estreita.
- Rascunho de TeamSetup separado da sessão confirmada. Alterações pendentes, commit conjunto após validação e descarte para a última configuração salva. Aviso Salvar/Descartar/Cancelar na navegação, reinício ou avanço. Somente a sessão confirmada é recebida pelo motor.
- Principal/secundárias em chips no perfil, com mensagem explícita quando não há secundárias. Centroavantes da fixture têm RW/LW para exercitar esse caso; posições principais e seleção inicial mantidas.
- Seis escudos geométricos originais SVG em public/crests. primaryColor, secondaryColor e crestPath em configuração única de apresentação; fallback de iniciais para falta de asset/erro de carregamento. Camisas seguem a cor do clube.
- Retratos SVG inline fictícios e determinísticos por playerId, sem imagem externa/RNG da simulação. Aparecem em elenco, perfil, banco e reservas do pré-jogo; sem ID há silhueta genérica.
- Seleção, sidebar, dashboard, Equipe, Elenco, tabela, calendário, pré-jogo e resultado atualizados. Nenhuma dependência adicionada.

## Validação manual

Em uma aba de teste separada, com Aurora Inventada:

1. Os seis escudos carregaram na seleção; Equipe mostrou os 11 jogadores e posições em PT-BR.
2. Nova formação 4-2-2-2, mentalidade Ofensiva e Contra-ataque marcaram Alterações pendentes. Arraste real de Davi Nuvem 4 do banco para titular alterou apenas a projeção do editor.
3. Descartar restaurou 4-3-3, mentalidade/estilo equilibrados, titulares e nove reservas originais.
4. O aviso de saída apareceu; Cancelar preservou o rascunho e a página. Descartar navegou para Elenco sem confirmar mudanças.
5. Nova edição em 4-1-2-1-2, Ofensiva/Contra-ataque. Perfil de João Nuvem 20 apresentou rosto, Centroavante principal e Ponta direita/Ponta esquerda secundárias. Substituição por painel colocou João entre os titulares.
6. Salvar equipe confirmou o conjunto e exibiu Equipe salva. Depois, mudar para 5-4-1/Defensiva e remover uma reserva foi descartado: retornou ao último 4-1-2-1-2 salvo, com João titular e nove reservas, sem voltar à seleção inicial.
7. Salvar no aviso de saída confirmou e navegou. Salvar antes de Avançar também confirmou primeiro e processou o calendário usando a sessão retornada pelo commit.
8. Calendário apresentou escudos carregados em todos os confrontos; tabela exibiu os seis escudos. Dashboard e pré-jogo apresentaram a mesma identidade visual.
9. Pré-jogo mostrou a configuração salva, com Ivo Nuvem 19 e João Nuvem 20 no ataque. Simulada somente UMA partida humana: Aurora Inventada 0 × 1 Serra dos Ventos. João apareceu na timeline; escudos apareceram no resultado. O teste de integração compara as forças/debug do motor com a equipe confirmada.
10. Confirmado o resultado, sem avançar para outra rodada. Console sem warnings/errors capturados ao final do gameplay.
11. Viewport 390 × 844: catálogo e conteúdo utilizáveis, sem overflow horizontal da página (largura do documento/rolável 375 px). Override de viewport removido. Não houve teste em aparelho touch físico.

Evidências: [equipe salva](equipe-salva.png), [formações](formacoes.png), [perfil](perfil.png), [escudos](clubes.png), [aviso de saída](aviso-saida.png), [calendário](calendario.png), [pré-jogo](pre-jogo.png), [resultado](resultado.png) e [viewport estreito](catalogo-estreito.png).

## Validação automatizada final

Nove novos testes abrangentes em teamSetup.test.tsx. A parametrização existente de táticas também contempla o catálogo expandido. Comando final:

```sh
pnpm test src/application/teamSetup.test.tsx src/application/teamManagement.test.tsx src/domain/tactics/tactics.test.ts src/domain/tactics/teamSelection.test.ts src/data/data.test.ts
```

**74 testes passaram em cinco arquivos**, duração Vitest 1,24 s. Cobrem rascunho/dirty/undo, commit e envio ao motor, descarte, erros e alertas, novas formações, tradução/perfil, avatares e fallback sem asset. O primeiro teste de força omitiu o modificador de mando obrigatório; foi corrigida somente a chamada do teste para usar 1 (neutro).

- Lint: passou com --max-warnings 0.
- Build: TypeScript e Vite passaram; 90 módulos, JS 317,02 kB (gzip 97,71 kB), CSS 24,61 kB (gzip 6,22 kB).
- NÃO foram executados suíte histórica completa, temporada completa, analyzer ou benchmarks nesta fase.

## Decisões e limites

DEC-030 documenta rascunho/commit da equipe, sem persistência. GDD, TECHNICAL_SPEC e ROADMAP foram preservados. Nenhum parâmetro das cinco formações anteriores foi alterado; as novas usam modificadores adicionais neutros, e as posições continuam determinando contribuições por setor. Não foi realizado balanceamento estatístico específico dos novos esquemas.

Confirmação da equipe dura apenas na sessão. Recarregar reinicia o protótipo. Sem dados reais, savegame/localStorage, API, mercado, transferências, finanças ou progressão. Avatares são ilustrações de desenvolvimento, e escudos não são dependências estruturais. O arraste mantém a limitação anterior de não auto-rolar; há alternativa por clique/teclado. Teste em dispositivo touch físico permanece pendente. Não avançamos para a Fase 10.
