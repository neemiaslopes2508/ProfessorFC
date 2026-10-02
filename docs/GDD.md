# Professor FC — Game Design Document

## 1. Visão

Professor FC é um jogo web single-player de gerenciamento de futebol focado na carreira de um treinador.

O jogador assume um clube, administra o elenco, define escalações e táticas, participa do mercado, desenvolve jogadores, disputa competições e constrói uma carreira que pode durar até 50 temporadas.

Não haverá controle direto dos jogadores durante as partidas. As partidas serão simuladas.

A filosofia central é:

"Decisões simples, consequências profundas e carreira longa."

O jogo deve ser fácil de compreender, mas possuir profundidade suficiente para gerar histórias diferentes a cada carreira.

## 2. Requisitos obrigatórios

Estes requisitos foram definidos pelo criador do projeto e não podem ser removidos sem decisão explícita dele:

- jogadores reais no mundo inicial;
- clubes reais;
- ligas e competições reais;
- valores de mercado reais como referência inicial;
- temporada inicial 2026;
- Brasil como primeiro país;
- mundo dinâmico após o início da carreira;
- carreira de treinador com duração máxima de 50 temporadas;
- possibilidade de expansão para novas divisões, competições e países;
- arquitetura não pode ficar presa especificamente ao Brasileirão.

## 3. Mundo inicial

O núcleo inicial terá:

- Campeonato Brasileiro Série A;
- Campeonato Brasileiro Série B;
- Copa do Brasil.

Série A e Série B terão os clubes reais correspondentes à temporada utilizada pela base do jogo.

O objetivo inicial é aproximadamente 40 clubes entre as duas divisões.

O mundo começa baseado na realidade.

Depois que a carreira é criada, a simulação passa a controlar sua evolução.

Isso significa:

2026 = ponto de partida real.

2027 em diante = história daquela carreira.

## 4. Carreira do treinador

O jogador controla um treinador e não diretamente um clube durante toda a carreira.

Antes da carreira:

- criação do treinador;
- nome;
- nacionalidade;
- informações básicas;
- três perguntas de perfil.

As respostas às perguntas serão utilizadas para sugerir clubes adequados.

As sugestões NÃO bloqueiam escolhas.

O jogador poderá escolher qualquer clube disponível.

O treinador terá:

- reputação;
- experiência;
- salário;
- contrato;
- clube atual;
- histórico.

Poderá:

- ser demitido;
- receber propostas;
- recusar propostas;
- aceitar propostas;
- trocar de clube;
- permanecer sem clube;
- construir uma carreira de até 50 temporadas.

As propostas podem surgir durante ou entre temporadas.

## 5. Diretoria

Cada clube possuirá expectativas.

Exemplos:

- evitar rebaixamento;
- terminar no meio da tabela;
- conseguir acesso;
- disputar posições superiores;
- classificar para competições;
- conquistar títulos;
- desenvolver jovens.

O desempenho do treinador será avaliado principalmente por:

- resultados;
- posição;
- objetivos;
- desempenho recente.

O treinador poderá ser demitido durante a temporada.

## 6. Clubes

Cada clube poderá possuir:

- identidade;
- reputação;
- divisão;
- elenco;
- orçamento;
- folha salarial;
- estádio;
- capacidade;
- treinador;
- objetivos;
- histórico;
- perfil administrativo/esportivo.

Clubes controlados pela IA continuarão funcionando independentemente do jogador.

Eles deverão contratar, vender, renovar contratos, escalar, evoluir e mudar ao longo das temporadas.

## 7. Jogadores

O mundo inicial utilizará jogadores reais.

Cada jogador deverá possuir dados como:

- nome;
- idade;
- nacionalidade;
- posição;
- posições secundárias;
- pé dominante;
- atributos;
- overall calculado;
- potencial;
- forma;
- condição física;
- clube;
- salário;
- contrato;
- valor de mercado;
- histórico.

## 8. Atributos

Escala planejada: 1 a 100.

A primeira versão utilizará como base:

- Finalização;
- Passe;
- Técnica;
- Defesa;
- Velocidade;
- Físico;
- Resistência;
- Decisão.

O modelo poderá ser refinado durante o desenvolvimento caso o motor de partidas demonstre necessidade.

## 9. Overall

O overall deverá ser calculado pelo jogo.

Não deverá ser simplesmente uma média dos atributos.

Cada posição possuirá pesos diferentes.

Um mesmo jogador poderá ter avaliações diferentes dependendo da posição utilizada.

Ratings de jogos ou bancos externos podem ser utilizados como referência durante a construção inicial dos dados, mas a arquitetura do Professor FC não pode depender deles.

## 10. Potencial e desenvolvimento

Jogadores terão potencial.

Potencial não significa que o jogador obrigatoriamente atingirá determinado overall.

Desenvolvimento poderá considerar:

- idade;
- potencial;
- minutos;
- desempenho;
- treinamento;
- ambiente;
- clube;
- condição.

Jogadores deverão:

- desenvolver;
- atingir auge;
- declinar;
- se aposentar.

## 11. Novas gerações

Como a carreira pode durar 50 temporadas, novos jogadores deverão entrar no mundo.

O sistema deverá gerar novos atletas considerando:

- idade;
- posição;
- nacionalidade;
- atributos;
- potencial;
- distribuição equilibrada de talento.

A geração deve evitar inflação de jogadores extremamente fortes.

## 12. Elenco

O jogador poderá:

- visualizar elenco;
- ordenar e filtrar jogadores;
- escolher titulares;
- escolher banco;
- alterar posições;
- consultar condição;
- consultar forma;
- acessar informações individuais.

O sistema deverá alertar sobre:

- suspensão;
- lesão;
- desgaste;
- jogador fora de posição.

## 13. Táticas

Primeira versão:

Formações, incluindo inicialmente opções como:

- 4-4-2;
- 4-3-3;
- 4-2-3-1;
- 3-5-2;
- 5-3-2.

Mentalidade:

- defensiva;
- equilibrada;
- ofensiva.

Estilo:

- posse;
- equilibrado;
- contra-ataque;
- pressão.

Configurações táticas mais detalhadas poderão ser adicionadas posteriormente se aumentarem decisões relevantes.

## 14. Treinamento

O treinamento será inicialmente simplificado.

Possíveis focos:

- equilibrado;
- físico;
- técnico;
- ofensivo;
- defensivo;
- jovens.

Treinamento deverá interagir com desenvolvimento, condição e desgaste.

## 15. Condição e lesões

Jogadores possuirão condição física.

Minutos e sequência de jogos provocam desgaste.

O jogo terá lesões, mas a intenção não é transformar o gameplay em gerenciamento médico excessivo.

Estados possíveis incluem:

- disponível;
- cansado;
- lesionado;
- recuperação.

## 16. Motor de partidas

O motor será independente da interface.

A partida será determinada por uma combinação de:

- atributos individuais;
- força coletiva;
- escalação;
- posições;
- tática;
- forma;
- condição;
- mando de campo;
- contexto;
- aleatoriedade controlada.

O time melhor deve possuir vantagem, mas nunca vitória garantida.

Zebras devem acontecer com frequência plausível.

## 17. Simulação

Conceitualmente:

pré-jogo
→ cálculo das equipes
→ oportunidades
→ eventos
→ intervalo
→ ajustes
→ segundo tempo
→ resultado
→ estatísticas.

O jogador poderá realizar ajustes durante a partida, especialmente no intervalo.

## 18. Eventos de partida

O motor deverá ser capaz de produzir:

- gols;
- finalizações;
- defesas;
- cartões;
- faltas;
- escanteios;
- substituições;
- lesões;
- pênaltis.

## 19. Apresentação das partidas

Formato principal:

TIMELINE + ESTATÍSTICAS.

Exemplo:

Clube A 2 x 1 Clube B

12' Gol
31' Cartão
57' Gol
74' Substituição
82' Gol

Estatísticas como:

- posse;
- finalizações;
- finalizações no alvo;
- escanteios;
- cartões;
- faltas.

Não haverá necessidade de partida 3D ou controle direto.

## 20. Competições

O sistema de competições deverá ser genérico.

Deve ser capaz de representar:

- pontos corridos;
- grupos;
- mata-mata;
- jogo único;
- ida e volta;
- promoção;
- rebaixamento.

Nenhuma regra central deve depender especificamente do nome "Brasileirão".

## 21. Promoção e rebaixamento

Inicialmente haverá movimentação entre Série A e Série B.

A arquitetura deverá permitir posteriormente:

Série A
↕
Série B
↕
Série C
↕
Série D.

## 22. Calendário

O calendário será um sistema central.

Deverá organizar:

- partidas;
- rodadas;
- competições;
- janelas;
- contratos;
- temporadas;
- treinamento;
- evolução;
- aposentadorias;
- eventos.

## 23. Mercado

Clubes poderão:

- comprar;
- vender;
- receber ofertas;
- fazer ofertas;
- renovar;
- dispensar;
- procurar jogadores.

A IA também participa do mercado.

## 24. Negociação

O modelo inicial será simples.

Exemplo:

Clube pede R$20 milhões.
Comprador oferece R$15 milhões.
Vendedor aceita, rejeita ou apresenta contraproposta.

Não implementar inicialmente um sistema de negociação excessivamente complexo.

## 25. Valor de mercado

O valor inicial será baseado em valores reais.

Depois do início da carreira, será recalculado pelo jogo.

Poderá considerar:

- idade;
- atributos;
- overall;
- potencial;
- desempenho;
- contrato;
- reputação;
- demanda.

Valor de mercado e preço pedido NÃO são necessariamente iguais.

## 26. Contratos

Jogadores terão:

- salário;
- duração;
- clube;
- situação contratual.

O sistema deverá posteriormente suportar:

- renovação;
- fim de contrato;
- jogadores livres.

Empréstimos poderão ser adicionados após o núcleo de transferências.

## 27. Finanças

Moeda inicial: Real brasileiro (R$).

O clube terá:

- caixa;
- orçamento de transferências;
- folha salarial;
- receitas;
- despesas.

Receitas podem incluir:

- bilheteria;
- premiação;
- venda de jogadores;
- direitos de competição.

Despesas:

- salários;
- transferências;
- custos operacionais.

## 28. IA

Clubes controlados pela IA deverão ser capazes de:

- montar escalação;
- escolher tática;
- contratar;
- vender;
- renovar;
- administrar orçamento;
- identificar posições deficientes;
- desenvolver elenco.

Decisões não devem ser puramente aleatórias.

## 29. Perfil dos clubes

Clubes poderão possuir tendências como:

- formador;
- comprador;
- vendedor;
- agressivo;
- conservador;
- preferência por jovens;
- preferência por experiência.

Esses perfis influenciam a IA.

## 30. Treinadores da IA

Clubes da IA também terão treinadores.

Eles poderão:

- ser contratados;
- ser demitidos;
- trocar de clube;
- construir histórico.

O jogador não será o único treinador existente no universo.

## 31. Mundo dinâmico

O mundo deverá continuar existindo sem intervenção do jogador.

Ao longo das décadas:

- jogadores mudam;
- jovens aparecem;
- veteranos se aposentam;
- treinadores mudam;
- clubes crescem;
- clubes entram em decadência;
- clubes sobem;
- clubes caem;
- novos campeões surgem.

Duas carreiras iniciadas em 2026 devem poder apresentar mundos bastante diferentes depois de várias temporadas.

## 32. Histórico

O jogo deverá preservar histórico relevante.

Exemplos:

- campeões;
- posições;
- artilheiros;
- temporadas;
- transferências;
- clubes treinados;
- títulos do treinador;
- estatísticas dos jogadores;
- recordes.

## 33. Interface

Telas previstas:

- Dashboard;
- Elenco;
- Jogador;
- Escalação;
- Táticas;
- Calendário;
- Partida;
- Classificação;
- Competições;
- Transferências;
- Finanças;
- Diretoria;
- Carreira;
- Histórico.

A interface deverá priorizar clareza, velocidade e poucos cliques.

## 34. Save

O jogo deverá possuir save versionado.

O estado da carreira deverá ser separado dos dados-base.

Cada save deverá possuir uma versão.

Alterações futuras deverão considerar migração de saves.

Nunca assumir que atualizar o jogo significa obrigatoriamente destruir carreiras antigas.

## 35. Dados reais

O mundo inicial deve utilizar:

- clubes reais;
- jogadores reais;
- ligas reais;
- competições reais;
- valores reais como referência.

Os dados reais são o SEED do universo.

Depois que a carreira começa, o próprio jogo controla a evolução.

## 36. Fotos, logos e licenciamento

Fotos e logos não podem ser dependências estruturais.

O jogo deverá funcionar mesmo utilizando:

- avatar;
- silhueta;
- iniciais;
- identificadores visuais alternativos.

Antes de distribuição pública, direitos de marcas, imagens, bancos de dados e outros conteúdos deverão ser analisados separadamente.

## 37. Expansão

A arquitetura deve permitir futuramente adicionar:

Brasil:
- Série C;
- Série D;
- estaduais;
- outras competições.

América do Sul:
- Libertadores;
- Sul-Americana;
- outros países.

Posteriormente:
- Europa;
- outras regiões;
- competições internacionais.

Não implementar tudo no MVP.

Apenas garantir que a arquitetura não impeça expansão.

## 38. MVP

O primeiro objetivo jogável é:

Escolher clube
→ visualizar elenco
→ escalar
→ escolher tática
→ disputar partida
→ obter resultado
→ atualizar classificação
→ avançar calendário
→ disputar próxima partida.

Depois serão adicionados progressivamente:

- mercado;
- contratos;
- finanças;
- evolução;
- IA avançada;
- carreira;
- demissão;
- propostas;
- aposentadoria;
- novos jogadores;
- histórico.

## 39. Fora do escopo inicial

Não priorizar inicialmente:

- multiplayer;
- gráficos 3D;
- controle dos jogadores;
- aplicativo mobile nativo;
- centenas de ligas;
- imprensa complexa;
- estádio extremamente detalhado;
- comissão técnica extremamente detalhada;
- multiplayer online.

## 40. Regra de design

Antes de adicionar um sistema, perguntar:

"Isso cria uma decisão interessante para o treinador?"

Se a resposta for não e o sistema apenas aumentar complexidade, ele não deve receber prioridade.

## 41. Objetivo de longo prazo

Professor FC deve transformar uma base real de futebol em uma história emergente.

A carreira começa em:

2026 — realidade como ponto de partida.

Pode terminar aproximadamente em:

2076 — universo criado pela simulação.

A experiência começa real.

A história passa a pertencer à carreira do jogador.
