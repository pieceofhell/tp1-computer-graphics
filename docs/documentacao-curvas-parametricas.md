# Documentacao Tecnica das Curvas Parametricas

## 1. Objetivo

Este documento descreve a implementacao das duas curvas parametricas adicionadas ao projeto:

- Curva de Hermite
- Curva de Bezier cubica

Tambem registra a organizacao do codigo, o modelo matematico utilizado, os refinamentos adotados e um manual de uso da interface.

## 2. Autoria e referencia

Implementacao original desenvolvida para este projeto, sem reaproveitamento direto de codigo externo para as curvas.

As formulas matematicas seguem as formas classicas apresentadas em disciplinas introdutorias de Computacao Grafica:

- forma cubica de Hermite
- forma cubica de Bezier nas bases de Bernstein

## 3. Organizacao do codigo

Os principais pontos da implementacao estao em [app.js](C:/Users/henri/Documents/New%20project/app.js):

- configuracao de ferramentas e estado global:
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L1)
- serializacao das estruturas para o painel interno:
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L152)
- rasterizacao basica de retas e circunferencia:
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L340)
- avaliacao e amostragem das curvas:
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L582)
- integracao das curvas com selecao, bounds e transformacoes:
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L577)
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L1129)
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L1168)
- criacao interativa por cliques:
  [app.js](C:/Users/henri/Documents/New%20project/app.js#L1847)

Os principais pontos da interface estao em:

- [index.html](C:/Users/henri/Documents/New%20project/index.html)
- [styles.css](C:/Users/henri/Documents/New%20project/styles.css)

## 4. Modelo matematico

### 4.1. Curva de Bezier cubica

A curva de Bezier foi implementada com quatro pontos de controle:

- P0: ponto inicial
- P1: primeiro ponto de controle
- P2: segundo ponto de controle
- P3: ponto final

A equacao usada e:

```text
B(t) = (1 - t)^3 P0
     + 3 (1 - t)^2 t P1
     + 3 (1 - t) t^2 P2
     + t^3 P3
```

com `0 <= t <= 1`.

Na implementacao:

- `evaluateBezierPoint(...)` calcula um ponto da curva para um valor de `t`
- `getCurveSamplePoints(...)` percorre varios valores de `t`
- `getCurvePixels(...)` liga as amostras consecutivas por pequenos segmentos de reta

### 4.2. Curva de Hermite cubica

A curva de Hermite foi implementada com:

- P0: ponto inicial
- P1: ponto final
- R0: vetor tangente inicial
- R1: vetor tangente final

As funcoes de base sao:

```text
h00(t) =  2t^3 - 3t^2 + 1
h10(t) =    t^3 - 2t^2 + t
h01(t) = -2t^3 + 3t^2
h11(t) =    t^3 -   t^2
```

e a equacao da curva e:

```text
H(t) = h00(t) P0 + h10(t) R0 + h01(t) P1 + h11(t) R1
```

com `0 <= t <= 1`.

Na interface, os vetores tangentes nao sao digitados numericamente. Em vez disso, o usuario informa dois pontos auxiliares:

- handle inicial
- handle final

Os vetores tangentes sao obtidos por:

```text
R0 = handleInicial - P0
R1 = handleFinal - P1
```

Esse refinamento permite definir a curva apenas com cliques no canvas, mantendo a proposta de interacao grafica do trabalho.

## 5. Refinamentos adotados

### 5.1. Amostragem adaptativa

As curvas nao sao desenhadas por uma formula implicita de pixel. Elas sao amostradas em varios pontos ao longo do parametro `t`.

O numero de amostras e definido pela funcao:

- [app.js](C:/Users/henri/Documents/New%20project/app.js#L582)

Essa funcao estima o comprimento da linha guia entre os pontos de controle e escolhe um numero de amostras dentro de um intervalo controlado. Com isso:

- curvas pequenas nao gastam processamento desnecessario
- curvas maiores ficam visualmente mais suaves

### 5.2. Rasterizacao por segmentos

Depois de amostrar a curva, cada par de amostras consecutivas e ligado por uma reta rasterizada.

O algoritmo usado nesses segmentos e o mesmo selecionado para retas na interface:

- DDA
- Bresenham

Isso reaproveita a infraestrutura de rasterizacao ja existente no projeto e mantem consistencia visual e didatica.

### 5.3. Precisao geometrica separada da grade de pixels

As curvas seguem a mesma ideia adotada nas transformacoes e no recorte:

- a geometria e mantida com precisao decimal
- o snap para inteiros ocorre apenas no momento da rasterizacao

Esse refinamento evita degradacao acumulada quando o usuario aplica varias transformacoes sucessivas.

### 5.4. Integracao com o restante do sistema

As curvas foram integradas com:

- painel de estrutura de dados
- painel de rastreamento algoritmico
- selecao retangular
- translacao
- escala
- rotacao
- reflexoes
- exclusao
- limpeza do projeto

## 6. Manual de uso

### 6.1. Curva de Hermite

1. Selecione a ferramenta `Hermite`.
2. Clique no ponto inicial.
3. Clique no ponto final.
4. Clique no controle da tangente inicial.
5. Clique no controle da tangente final.

Ao quarto clique, a curva e criada automaticamente.

### 6.2. Curva de Bezier

1. Selecione a ferramenta `Bezier`.
2. Clique em `P0`.
3. Clique em `P1`.
4. Clique em `P2`.
5. Clique em `P3`.

Ao quarto clique, a curva e criada automaticamente.

### 6.3. Selecao e transformacoes

Depois de criada, a curva pode ser:

- selecionada por regiao retangular
- transladada
- escalada
- rotacionada
- refletida

Os pontos de controle continuam disponiveis visualmente quando a curva esta selecionada.

### 6.4. Rastreamento

Ao criar uma curva, o painel `Rastreamento Algoritmico` mostra:

- tipo da curva
- algoritmo de rasterizacao usado nos segmentos
- quantidade de amostras
- alguns pontos calculados na curva

### 6.5. Observacao sobre recorte

O recorte pedido no trabalho continua aplicado a:

- retas
- poligonos

As curvas parametricas nao entram na rotina de recorte implementada para a janela retangular, porque o foco do requisito original de recorte do trabalho esta nos algoritmos de reta.

## 7. Resumo de implementacao

Em termos de fluxo interno, a implementacao funciona assim:

1. o usuario fornece os pontos por clique
2. a aplicacao armazena a curva como estrutura geometrica
3. a curva e avaliada para varios valores de `t`
4. os pontos amostrados sao ligados por retas rasterizadas
5. os pixels gerados sao desenhados na matriz do canvas

Esse modelo preserva a coerencia com a arquitetura ja existente do projeto e deixa explicito, para fins didaticos, onde entram:

- modelo matematico
- amostragem
- rasterizacao
- exibicao final em pixels
