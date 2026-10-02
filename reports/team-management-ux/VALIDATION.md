# Professor FC — Validação da Fase 9.1

## Escopo e arquitetura

Navegação Dashboard / Equipe / Elenco / Calendário / Tabela. Equipe reúne escalação e táticas sobre a mesma sessão. UI apresenta e recebe gestos; application realiza trocas/reorganização; domain mantém validação. MatchEngine, GameCalendar, classificação, fixture, documentos oficiais, dependências e lockfile não foram alterados nesta fase.

Pointer Events nativos foram suficientes para o gesto, com captura, cancelamento, destaques e rejeição de destino fora do campo. Não foi adicionada biblioteca. Coordenadas de apresentação não repetem posições/regras de formação. Overall, resumo e histórico são derivados. A mudança de formação preserva a seleção humana, em vez de selecionar novamente a partir de todo o elenco.

## Validação interativa

Realizada no navegador local em `http://127.0.0.1:5173/`, com Aurora Inventada:

- Início, escolha de clube e nova navegação funcionaram.
- Campo apresentou 11 titulares e banco apresentou 9 reservas.
- Arraste real: Davi Nuvem 4 do banco sobre Ivo Nuvem 19 em ST. Reserva virou titular; Ivo retornou ao banco. Improvisação mostrou alerta, sem bloquear.
- Arraste real entre titulares: Davi Nuvem 4 e Gil Nuvem 17 trocaram slots, preservando o banco.
- Drop fora do campo mostrou destino inválido e manteve 11 titulares.
- Clique/Enter abriu o painel com idade, posições, overall, valor, forma, condição e oito atributos. Substituição pela lista escolheu João Nuvem 20; Escape fechou e restaurou foco.
- Abas responderam ao teclado; formação, mentalidade Ofensiva e estilo Contra-ataque atualizaram o resumo/campo. As cinco formações conservaram o mesmo conjunto de jogadores selecionados e o banco.
- Elenco: busca `joao` encontrou nomes com acento; filtro ST, ordenação e painel funcionaram.
- Viewport de 390 × 844: campo/banco/painel empilhados; largura do documento e largura rolável ambas 375 px (barra de rolagem incluída no viewport). Sem overflow horizontal da página. Override temporário removido após a verificação.
- Pré-jogo mostrou os mesmos titulares, formação 4-2-3-1, mentalidade Ofensiva e estilo Contra-ataque. João Nuvem 20 participou da timeline. O teste de integração também compara as forças/debug do motor com o time editado.
- Primeira partida: Aurora Inventada 0 × 1 Serra dos Ventos; posse 37,8/62,2%, finalizações 9/18, no alvo 4/11, escanteios 1/3, faltas 15/9, amarelos 0/0 e vermelhos 0/0. Sem alterar balanceamento.
- Tabela manteve a partida humana fora da contagem até Continuar. Confirmação atualizou tabela e liberou o avanço.
- Temporada completa percorrida pela interface: 10 rodadas, encerramento em 07/06/2026, campeão Porto das Nuvens; Aurora em 6º, com 2 pontos e 10 partidas. Nenhuma temporada seguinte iniciada.
- Console do navegador: nenhum warning/error capturado ao final.

Evidências: [Equipe desktop](equipe-desktop.png), [viewport estreito](equipe-estreita.png) e [encerramento da temporada](temporada-concluida.png).

## Testes e checkpoint final

Durante o desenvolvimento, somente os testes novos/afetados foram executados: 14 passaram nos dois arquivos de sessão/equipe. Sete novos testes abrangentes cobrem operações, validação, preservação, projeções e renderização/integração com o estado real; não há testes de CSS por pixel.

Checkpoint completo executado uma única vez após a implementação:

- `pnpm test`: 263 testes passaram, 21 arquivos; duração reportada pelo Vitest 2,86 s.
- `pnpm lint`: passou com `--max-warnings 0`.
- `pnpm build`: TypeScript e Vite passaram; 84 módulos, bundle JS 305,00 kB (gzip 94,09 kB), CSS 20,12 kB (gzip 5,32 kB).

Nenhum analyzer estatístico executado e nenhuma dependência adicionada.

## Limites mantidos

Não há auto-scroll enquanto se arrasta: role antes de iniciar o gesto ou utilize a substituição por clique/teclado. Pointer Events consideram toque, mas não houve teste em dispositivo físico. Em telas baixas, o campo completo exige rolagem vertical. Não há substituição durante partida nem reorganização banco → banco; esta última era opcional e não altera a utilidade esportiva.

Condição/forma seguem fixas, números são visuais temporários e a fixture continua exclusiva de desenvolvimento. Sessão em memória, sem save e com uma única temporada, conforme o protótipo existente. Nenhuma funcionalidade da próxima fase foi implementada.
