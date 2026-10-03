# Centro Financeiro — Fases 12A e 12B

`types.ts` define o ledger comum: salários, compra/venda de jogadores, bilheteria, patrocínio e premiação. Valores positivos em centavos; direção deriva do tipo. Caixa e orçamento vêm de ClubFinances. O saldo inicial não é lançamento.

`revenueConfig.ts` centraliza a configuração fictícia: ingresso de R$ 45, patrocínio no dia 1 (dias 1–28 suportados), mensalidade por reputação e prêmios da Development League por colocação (R$ 2 milhões, 1,25 milhão, 800 mil, 500 mil, 300 mil e 200 mil). Esses valores não são dados oficiais nem balanceamento definitivo. Competições sem configuração não pagam prêmio.

`application/seasonRevenue.ts` credita apenas o caixa, preservando o orçamento de transferências. Bilheteria usa o mesmo público determinístico/capacidade do Match Day, sem consumir RNG do motor, e é paga somente ao mandante após confirmação do resultado. IDs por partida, clube/mês e clube/edição impedem duplicações. O prêmio exige liga encerrada com todos os resultados confirmados e datas alcançadas; deriva da classificação final. Não há bônus por vitória/empate.

`advancePrototype` visita datas de futebol, contratos e patrocínio; integra salários/receitas e liquida partidas CPU confirmadas. `continuePrototypeMatch` liquida a partida humana e a eventual premiação final. GameCalendar e MatchEngine não recebem regras financeiras. Helpers de processamento de intervalos não movem o relógio por conta própria.

`financeOverview` deriva receitas/despesas/saldo mensal, receitas da temporada, categorias e histórico até a data atual. Temporada usa o ano da edição atual (janeiro–dezembro). Filtros afetam histórico; categorias acompanham o período selecionado. Dashboard mostra saldo mensal. Não há negociação de patrocínio, direitos de TV, impostos, despesas de estádio ou persistência.

Validação 12B: dois testes novos (bilheteria e patrocínio/premiação), mais três testes afetados; prêmio verificado em snapshot encerrado, sem executar temporada completa. Fluxo manual: Aurora recebe R$ 60.000 de patrocínio, paga R$ 79.000 de folha e recebe R$ 756.180 de bilheteria (16.804 pessoas × R$ 45). Caixa resultante: R$ 5.737.180.

## Saúde financeira — Fase 12C

`application/financialHealth.ts` entrega FinancialHealthSnapshot derivado, sem modificar caixa/ledger. Projeções de 3 e 6 meses mantêm patrocínio e folha atuais constantes; não simulam partidas nem antecipam bilheteria/prêmios/negócios ou vencimentos. Salários ausentes produzem alerta de estimativa parcial. A tendência mostra mês atual (parcial) e dois anteriores, com aviso quando não há registros.

Configuração central FINANCIAL_HEALTH_CONFIG: reserva de um mês de folha; mínimo adicional zero; situação crítica se caixa <= 0 ou projeção de 3 meses negativa; atenção se folha excede teto, projeção de 6 meses negativa ou caixa abaixo da reserva; excelente se caixa cobre 6 meses de folha; saudável nos demais casos. O saldo registrado do mês aparece como contexto, sem projetar receitas ocasionais como recorrentes.

Disponível = max(0, min(orçamento aprovado, caixa − reserva)); crítico retorna zero. A regra não altera o orçamento nominal. Ofertas, contrapropostas CPU, escolha de comprador e assinatura revalidam o disponível; na assinatura a reserva considera a nova folha. Novos contratos que aumentam a folha são bloqueados se excederem teto ou produzirem situação crítica. Reduções/manutenção de salário não são impedidas pelo teto excedido; continuam sujeitas ao aceite do jogador. Contratos existentes não são cancelados. Caixa negativo ainda pode resultar das despesas obrigatórias existentes, sem insolvência ou dívida bancária.

QA local (somente Vite DEV): iniciar novo jogo em `/?financeScenario=critical` configura caixa inicial fictício de R$ 500; `/?financeScenario=payroll` configura teto salarial inicial de R$ 10.000. Não gera lançamentos artificiais nem representa despesa: muda a configuração inicial do cenário. Parâmetros são ignorados no build de produção. Nenhuma ferramenta de edição financeira é exposta no produto.

Validação 12C: dois testes novos e testes diretamente afetados (11 passaram), build e lint; cenário crítico bloqueia compra sem desconto e cenário de folha excessiva bloqueia aumento contratual na interface. Sem temporada completa, analyzer, benchmark ou novas dependências.

## Estádio e setores — Fase 12D

A bilheteria por preço único da 12B foi substituída pela soma de público × preço de cada setor. `finance/stadium.ts` contém tipos, validação e demanda; `data/fixtures/stadiums.ts` centraliza os quatro setores fictícios (Popular 10.000/R$ 35, Arquibancada 9.000/R$ 60, Central 4.000/R$ 100, VIP 2.000/R$ 250). Total: 25.000 lugares. Preços salvos são estado da sessão, separado de GameData.

Demanda é base + reputações + importância da rodada + colocação nas rodadas anteriores, dividida por um fator gradual de preço relativo ao valor de referência. Ocupação limitada entre 8% e 98%; preço dobrado não zera demanda. Aviso acima de 1,5× referência, sem impedir escolha. Preço zero é permitido e gera receita zero. STADIUM_DEMAND_CONFIG centraliza parâmetros; fórmula fictícia sem calibração econômica profunda.

Público final varia em até 4 pontos percentuais por setor usando RandomSource separado, seed estável da partida, sem consumir aleatoriedade do MatchEngine. lockMatchAdmission fixa preços/público ao iniciar a sessão humana (live ou batch). Liquidação CPU usa os preços vigentes; posição vem somente de rodadas anteriores. Uma MATCH_TICKETS contém snapshot imutável dos setores, público e receita finais, usado também pelo histórico e pela última bilheteria. Reprocessamento não altera valores antigos. Somente mandante recebe, após confirmação.

Tela Estádio: rascunho de preços, estimativa atualizada durante edição, SALVAR PREÇOS e DESCARTAR. Navegar fora descarta rascunho; não há persistência. Alterações bloqueadas durante partida/resultado pendente. Match Day mostra previsão; resultado mostra público/receita final; Finanças continua derivando agregados do mesmo ledger. Próximo jogo em casa ausente é apresentado sem inventar uma estimativa.

Validação: um teste novo abrangente e quatro afetados passaram; build/lint. Manual: Popular R$ 70 e VIP R$ 300, previsão 13.592 pessoas/R$ 1.235.580, final 13.300 pessoas/R$ 1.225.160, lançamento único e caixa R$ 6.206.160. Sem temporada completa ou fase 12E. Sem manutenção, expansão, sócio-torcedor ou novos patrocinadores.

## Infraestrutura — Fase 12E

`finance/facilities.ts` configura CT, Base, DM, Loja e Estádio, cada um com níveis 1–5. Estado de nível/obra fica na sessão, separado de GameData. Custos, prazo, manutenção e receita são definidos por nível. O valor de upgrade pertence ao nível de destino. Prazo padrão: 30/60/90/120 dias. Manutenção vigente permanece durante obra; muda após conclusão.

`application/clubFacilities.ts` inicia obra com custo imediato FACILITY_UPGRADE, caixa suficiente e um único upgrade ativo por instalação; instalações diferentes podem construir simultaneamente. Nível não muda antes de completionDate. `advancePrototype` escolhe também datas de conclusão/pagamento, coordena processamento e GameCalendar, sem reescrever calendário ou simular partidas extras. Conclusão é idempotente e não cobra novamente. Em conclusão no dia de pagamento, novo nível entra antes da cobrança/receita.

No dia 1 (configurável 1–28), cada clube recebe uma manutenção consolidada FACILITY_MAINTENANCE e receita MERCHANDISING da Loja, com IDs por clube/mês. A cobrança mensal é integral, sem proporcionalidade; despesas obrigatórias podem deixar caixa negativo conforme regra existente. Helpers de intervalo não movem relógio, como salários/patrocínio. Saúde financeira inclui manutenção e Loja nas projeções constantes, preservando a reserva salarial já existente.

Loja tem receita ativa R$ 12.000 × nível/mês. CT/Base/DM aplicam os efeitos documentados em suas fases. O nível estrutural do Estádio libera expansões de setores, sem alterar capacidade automaticamente. Ilustrações SVG próprias; sem biblioteca/imagem externa.

QA local: `/?financeScenario=facilities-short`, novo jogo, reduz prazos a um dia apenas em DEV. Não pula eventos/partidas: melhoria em 31/03 conclui no primeiro avanço para 01/04. Produção ignora o parâmetro. Manual da Loja 1→2: R$ 250.000 de investimento, caixa imediato R$ 4.750.000; manutenção total R$ 22.000 e receita Loja R$ 24.000 no mês; após patrocínio R$ 60.000 e folha R$ 79.000, caixa R$ 4.733.000.

Validação: dois testes novos e oito afetados passaram; build/lint. Sem suíte completa, temporada, analyzer, benchmark ou fase 12F. Sem persistência, funcionários ou efeitos completos de instalações futuras.

## Expansão do estádio — Fase 12E.4

`finance/stadium.ts` concentra os incrementos, custos, prazos e manutenção adicional dos setores. O nível estrutural do Estádio permite até um nível de expansão por setor para cada nível concluído (1–5); upgrade estrutural nunca altera capacidade sozinho. `stadiumManagement.ts` inicia uma obra por setor, debita o caixa e registra `STADIUM_EXPANSION`. Capacidade antiga permanece até a conclusão do projeto integrado ao processamento de instalações/calendário.

Após a conclusão, capacidade total é recalculada pela soma dos setores e estimativas/receitas de bilheteria consomem a nova capacidade sem bônus de demanda. Manutenção das novas áreas entra na mesma rotina mensal e é lançada em `STADIUM_MAINTENANCE`, com categoria própria no Centro Financeiro; saúde financeira considera o custo. `?financeScenario=stadium-expansion-short` encurta a obra para um dia somente em desenvolvimento. Não há construção de novo estádio ou recursos de hospitalidade.
