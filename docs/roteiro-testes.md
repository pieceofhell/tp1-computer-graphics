# Roteiro de Testes e Gravacao

Este roteiro foi pensado para a entrega com captura de tela e audio explicativo, cobrindo os requisitos do trabalho de forma clara e objetiva.

## Objetivo do video

Demonstrar que a aplicacao:
- usa uma area de desenho baseada em matriz de pixels
- permite criar e selecionar pontos, retas, circunferencias e poligonos
- implementa rasterizacao de retas com DDA e Bresenham
- implementa rasterizacao de circunferencia com Bresenham
- aplica transformacoes geometricas 2D
- realiza recorte com Cohen-Sutherland e Liang-Barsky
- exibe e organiza a estrutura de dados interna

## Preparacao antes de gravar

1. Abra o site ja publicado ou a versao local final.
2. Deixe o zoom da pagina do navegador em 100 por cento.
3. Feche abas ou notificacoes que possam distrair durante a gravacao.
4. Abra o projeto com a interface limpa.
5. Deixe o painel de estrutura de dados e o rastreamento algoritmico visiveis.

## Estrutura recomendada do video

Tempo sugerido: 6 a 10 minutos.

### 1. Abertura

Mostre a tela inicial e explique em poucas frases:

Exemplo de fala:
"Este trabalho pratico implementa os algoritmos pedidos na primeira unidade de Computacao Grafica. A aplicacao funciona em uma area de desenho baseada em pixels, permite interacao grafica por cliques e demonstra rasterizacao, transformacoes geometricas, selecao retangular e recorte."

### 2. Apresentacao da interface

Mostre rapidamente:
- cabecalho com identificacao do trabalho
- painel de ferramentas
- selecao dos algoritmos
- area de desenho
- painel de estrutura de dados
- painel de rastreamento algoritmico

Exemplo de fala:
"Nesta lateral estao as ferramentas de desenho e transformacao. No topo e ao lado ficam os controles de zoom, os dados da aplicacao e o painel que mostra o passo a passo de alguns algoritmos."

### 3. Teste de criacao de primitives

Execute nesta ordem:
1. Crie um ponto.
2. Crie uma reta com DDA.
3. Troque o algoritmo e crie uma reta com Bresenham.
4. Crie uma circunferencia.
5. Crie um poligono com pelo menos quatro vertices.

Exemplo de fala:
"Agora vou demonstrar a criacao das estruturas graficas basicas. Primeiro um ponto, depois uma reta rasterizada por DDA, em seguida outra reta com Bresenham, uma circunferencia usando Bresenham e por fim um poligono."

Observacao importante:
- Ao criar as retas, mostre que o algoritmo selecionado muda no painel correspondente.
- Ao finalizar o poligono, mencione que a criacao ocorre por cliques na area de desenho.

### 4. Teste da estrutura de dados

Abra o painel de estrutura de dados e mostre:
- tipos dos objetos armazenados
- vertices do poligono
- pontos inicial e final das retas
- centro e raio da circunferencia
- IDs selecionados

Exemplo de fala:
"Aqui esta a estrutura de dados interna da aplicacao. Cada objeto possui seu tipo e os atributos geometricos correspondentes, como vertices, pontos extremos, centro e raio."

### 5. Teste de selecao retangular

1. Ative a ferramenta de selecao.
2. Arraste uma regiao retangular abrangendo mais de um elemento.
3. Mostre a quantidade de selecionados.
4. Se possivel, alterne o painel para mostrar apenas a selecao.

Exemplo de fala:
"A selecao dos objetos e feita por regiao retangular, como solicitado no enunciado. Ao arrastar a area, a aplicacao identifica quais elementos intersectam essa regiao."

### 6. Teste de transformacoes geometricas 2D

Com pelo menos dois objetos selecionados, demonstre:
1. Translacao
2. Escala
3. Rotacao
4. Reflexao em X
5. Reflexao em Y
6. Reflexao em XY

Exemplo de fala:
"Agora vou aplicar as transformacoes geometricas 2D. Os fatores sao informados pelo usuario nos campos da interface, sem uso de valores fixos no codigo."

Ao narrar cada uma:
- Translacao: "Desloca os objetos pelos valores informados em X e Y."
- Escala: "Altera proporcionalmente ou nao o tamanho do objeto."
- Rotacao: "Gira os elementos em torno do pivô escolhido."
- Reflexoes: "Espelham os objetos em relacao aos eixos X, Y ou aos dois eixos."

### 7. Teste de rasterizacao com apoio do rastreamento

Crie ou selecione uma reta e mostre o painel de rastreamento algoritmico.

Exemplo de fala:
"O painel de rastreamento mostra o passo a passo da rasterizacao, evidenciando como os pixels sao determinados para o desenho da reta."

Se quiser deixar a demonstracao mais forte:
- crie uma reta com DDA e mostre o rastreio
- depois crie outra com Bresenham e compare

### 8. Teste de recorte com retas

Monte um caso visual simples:
1. Crie uma reta que atravesse uma regiao central.
2. Crie uma janela de recorte.
3. Selecione a reta.
4. Aplique Cohen-Sutherland.
5. Recrie um caso semelhante.
6. Aplique Liang-Barsky.

Exemplo de fala:
"Agora vou demonstrar o recorte de retas. A janela de recorte preserva apenas o trecho interno da reta. O trecho fora da janela e removido."

Fala complementar importante:
"Neste primeiro teste uso Cohen-Sutherland, baseado em codificacao de regioes. No segundo, uso Liang-Barsky, baseado na equacao parametrica."

### 9. Teste de recorte com poligono

Monte um caso facil de enxergar:
1. Desenhe um quadrado ou outro poligono simples.
2. Posicione a janela de recorte pegando apenas parte da figura.
3. Selecione o poligono.
4. Aplique o recorte.

Exemplo de fala:
"Quando um poligono e recortado, a aplicacao reconstrói a figura restante. Por exemplo, se um quadrado e cortado pela metade, o resultado passa a ser um novo poligono correspondente apenas a area preservada."

Se o resultado virar figura menor:
- destaque os novos vertices no painel de estrutura de dados

### 10. Teste de comandos finais

Mostre rapidamente:
- exclusao de elementos selecionados
- limpeza da janela de recorte
- limpeza total do projeto

Exemplo de fala:
"Por fim, a aplicacao tambem permite excluir a selecao atual e limpar completamente o projeto, retornando o canvas ao estado inicial."

## Checklist de requisitos para confirmar durante a gravacao

Antes de encerrar, confirme verbalmente ou visualmente:
- area de desenho em pixels
- criacao de ponto, reta, circunferencia e poligono
- retas com DDA e Bresenham
- circunferencia com Bresenham
- selecao por regiao retangular
- translacao
- escala
- rotacao
- reflexao X
- reflexao Y
- reflexao XY
- recorte com Cohen-Sutherland
- recorte com Liang-Barsky
- estrutura de dados interna visivel

## Ordem de gravacao mais segura

Se quiser um fluxo direto, grave nesta sequencia:
1. apresentacao da interface
2. criacao das figuras
3. estrutura de dados
4. selecao retangular
5. transformacoes
6. rasterizacao com rastreamento
7. recorte com retas
8. recorte com poligono
9. exclusao e limpeza

## Dicas para o audio explicativo

- Fale de forma objetiva, como se estivesse apresentando para avaliacao.
- Nomeie os algoritmos corretamente.
- Evite termos vagos como "essa coisa aqui".
- Sempre que possivel, diga o que entra e o que sai da operacao.
- Mostre confianca na ordem dos testes para nao parecer improvisado.

## Sugestao de encerramento

Exemplo de fala:
"Com isso, finalizei a demonstracao da aplicacao. Foram apresentados os algoritmos de rasterizacao, transformacoes geometricas, selecao retangular, recorte e a visualizacao da estrutura de dados utilizada internamente, atendendo aos requisitos propostos no trabalho."
