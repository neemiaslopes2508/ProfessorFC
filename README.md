# Professor FC

Professor FC é um jogo web single-player de gerenciamento de futebol, no qual o jogador terá uma carreira como treinador.

O projeto está na Fase 9.2 — polimento do gerenciamento visual da equipe sobre o primeiro vertical slice jogável. No navegador é possível escolher um dos seis clubes fictícios e jogar uma temporada completa da Development League: 10 rodadas, 30 partidas. A fixture é exclusiva de desenvolvimento e nunca é a base oficial do Professor FC.

## Requisitos

- Node.js 22.13 ou superior (recomendado: Node.js 24 LTS).
- pnpm 11.19.0. Caso não esteja disponível, instale com `npm install --global pnpm@11.19.0`.

Execute os comandos abaixo na pasta `Professor-FC/`, onde está o `package.json`.

## Instalar dependências

```sh
pnpm install
```

O arquivo `pnpm-lock.yaml` registra as versões instaladas para reproduzir o ambiente.

## Executar em desenvolvimento

```sh
pnpm dev
```

Abra o endereço exibido no terminal (normalmente `http://localhost:5173`).

## Rodar testes

```sh
pnpm test
```

Para acompanhar alterações durante o desenvolvimento: `pnpm test:watch`.
O Vitest executa em ambiente Node. Os testes de sessão exercem gameplay na camada de aplicação e verificam a apresentação do pré-jogo/estatísticas via renderização React no servidor, sem dependências adicionais de DOM. O fluxo interativo também foi percorrido no navegador até o fim da temporada.
Os testes unitários de domínio cobrem IDs, dinheiro, atributos, jogadores, clubes, treinadores, táticas, escalações, competições, partidas e contratos.

## Rodar lint

```sh
pnpm lint
```

## Gerar build

```sh
pnpm build
```

O comando verifica os tipos com TypeScript e gera os arquivos em `dist/`.
Para conferir o build localmente: `pnpm preview`.

## Organização inicial

`src/main.tsx` apenas monta a aplicação React. A apresentação fica em `src/ui/`; `src/application/prototypeSession.ts` coordena o protótipo sobre domínio, calendário, liga e motor existentes.

`src/core/` contém IDs tipados, Money e validações comuns. `src/domain/` contém módulos por conceito, com exports locais. As escalas, representações e limites desta etapa estão em [src/domain/README.md](src/domain/README.md).

`src/data/` contém a fixture exclusiva de desenvolvimento; `src/simulation/` contém o MatchEngine. Os demais sistemas permanecem reservados para desenvolvimento incremental. Diretórios vazios possuem `.gitkeep` para serem versionados.

## Avaliar o motor

```sh
pnpm analyze:simulation
```

Executa sete cenários determinísticos com 10.000 partidas cada, sem React/renderização, e gera `REPORT.md` e `results.json` em `reports/match-engine-v0.1/latest/`. Para alterar tamanho, seed e destino: `pnpm analyze:simulation 10000 2026 reports/minha-avaliacao`.

Método e API estão em [src/simulation/README.md](src/simulation/README.md). A comparação inicial está em [reports/match-engine-v0.1/REVIEW.md](reports/match-engine-v0.1/REVIEW.md). Fixtures fictícias nunca são a base oficial do Professor FC.

Antes de implementar funcionalidades, consulte `AGENTS.md`, `docs/GDD.md`, `docs/TECHNICAL_SPEC.md` e `docs/DECISIONS.md`.

## Executar a liga fictícia

```sh
pnpm demo:league 2026
```

Simula 30 partidas em dez rodadas e grava classificação, campeão e placares em `reports/development-league/`. Consulte [src/competitions/README.md](src/competitions/README.md). Não utiliza dados reais nem altera o balanceamento do motor.

## Executar o fluxo temporal

```sh
pnpm demo:calendar 2026
```

Percorre a temporada fictícia de 01/04 a 07/06/2026, processa CPU e demonstra bloqueio PLAY_MATCH antes da ação humana explícita. Trilha e classificação são gravadas em `reports/development-calendar/`. Consulte [src/domain/calendar/README.md](src/domain/calendar/README.md).

## Jogar o protótipo

Novo jogo → selecionar clube → Assumir clube. A navegação reúne Dashboard, Equipe, Elenco, Calendário e Tabela. Em **Equipe**, as abas Escalação e Táticas compartilham campo visual, banco e configuração atual. Arraste uma reserva sobre um titular para substituí-lo, ou uma camisa titular sobre outra para trocar posições. Também é possível clicar/usar Enter em uma camisa e escolher a substituição pelo painel. Destinos inválidos não alteram o time; improvisações permitidas mostram alertas do domínio.

As 15 formações, escolhidas por cards com mini-campos, reorganizam os mesmos titulares, preservando suas escolhas e o banco. Mentalidade e estilo continuam utilizando as opções existentes. As posições são apresentadas em PT-BR. Elenco oferece busca, filtro, ordenação, resumo, rostos fictícios determinísticos e detalhes com posições principal/secundárias, overall derivado, atributos, valor, condição e forma. Nenhum desses indicadores é salvo como uma nova fonte de verdade. Os seis clubes têm escudos SVG próprios. Consulte [src/ui/README.md](src/ui/README.md) para funcionamento e limitações do arraste.

Editar a equipe cria um **rascunho**, sinalizado como Alterações pendentes. **SALVAR EQUIPE** valida e confirma juntos titulares, banco e táticas; somente a configuração confirmada é usada pelo próximo jogo. **DESCARTAR ALTERAÇÕES** restaura a última configuração salva na sessão. Ao navegar, reiniciar ou avançar com edições pendentes, escolha Salvar, Descartar ou Cancelar no aviso. Esta confirmação não é savegame: recarregar a página continua reiniciando a sessão, sem localStorage.

Use Avançar para processar o início da temporada e chegar à primeira rodada. Os jogos CPU são processados automaticamente; sua partida interrompe o avanço. Prepare a partida, confira a escalação e clique em Jogar partida. A tela apresenta placar, timeline e estatísticas do motor. **Continuar confirma o resultado uma única vez**, atualiza a tabela e libera o calendário. Ver tabela antes de Continuar mostra somente os resultados já confirmados.

Repita até a décima rodada. O encerramento mostra campeão, sua colocação e dez partidas disputadas. Não inicia a temporada seguinte. Novo jogo reinicia a sessão; recarregar a página perde o progresso. Sem save, dados reais, mercado, progressão, gestão financeira ou IA completa. Adversários usam seleções iniciais fixas de desenvolvimento; forma e condição não evoluem e cartões não geram suspensões temporais nesta fase.

## Ambiente local

Node e pnpm precisam estar no PATH do terminal. Se `pnpm` não for reconhecido, instale a versão indicada acima e reabra o terminal. No ambiente do Codex, os executáveis vêm do runtime empacotado e precisaram ser chamados por caminho explícito; isso não altera a configuração do projeto. Se a porta 5173 estiver ocupada, Vite escolhe outra: abra exatamente o endereço apresentado no terminal.
