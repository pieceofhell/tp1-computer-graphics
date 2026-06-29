# Documentacao Tecnica das Curvas Parametricas

## 1. Objetivo

Este documento descreve a implementacao das curvas adicionadas ao projeto:

- Curva interpolada cubica
- Curva de Bezier cubica

Tambem registra a organizacao do codigo, o modelo matematico utilizado, os refinamentos adotados e um manual de uso da interface.

## 2. Autoria e referencia

Implementacao original desenvolvida para este projeto, sem reaproveitamento direto de codigo externo para as curvas.

As formulas matematicas seguem os modelos classicos apresentados em Computacao Grafica:

- interpolacao polinomial de Lagrange
- forma cubica de Bezier nas bases de Bernstein

## 3. Organizacao do codigo

Os principais pontos da implementacao estao em:

- [app.js](C:/Users/henri/Documents/New%20project/app.js)
- [index.html](C:/Users/henri/Documents/New%20project/index.html)
- [styles.css](C:/Users/henri/Documents/New%20project/styles.css)

Dentro de [app.js](C:/Users/henri/Documents/New%20project/app.js), a organizacao relevante para as curvas ficou assim:

- estado global, ferramentas e serializacao das estruturas internas
- avaliacao das curvas e amostragem parametrica
- rasterizacao por segmentos de reta
- integracao com selecao, bounds e transformacoes
- criacao interativa por cliques no canvas

## 4. Modelo matematico

### 4.1. Curva interpolada cubica

A curva interpolada foi implementada com quatro pontos informados pelo usuario:

- P0
- P1
- P2
- P3

Ao contrario da Bezier, os quatro pontos pertencem a curva.

Foi adotada uma interpolacao cubica de Lagrange com os parametros:

```text
t0 = 0
t1 = 1/3
t2 = 2/3
t3 = 1
```

A curva e dada por:

```text
C(t) = L0(t) P0 + L1(t) P1 + L2(t) P2 + L3(t) P3
```

com `0 <= t <= 1`, em que cada base de Lagrange e:

```text
Li(t) = produto, para j != i, de (t - tj) / (ti - tj)
```

Com isso, a implementacao garante:

```text
C(0)   = P0
C(1/3) = P1
C(2/3) = P2
C(1)   = P3
```

Na pratica, isso produz uma curva cubica que passa exatamente pelos quatro cliques do usuario.

### 4.2. Curva de Bezier cubica

A curva de Bezier foi implementada com quatro pontos:

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

Nesse caso, apenas `P0` e `P3` sao garantidamente pontos da curva. `P1` e `P2` controlam sua forma.

## 5. Refinamentos adotados

### 5.1. Amostragem parametrica

As curvas nao sao desenhadas diretamente por uma equacao de pixels. Elas sao amostradas em varios valores de `t`.

O numero de amostras e calculado a partir do comprimento aproximado da poligonal de referencia, com limite minimo e maximo. Isso evita curvas serrilhadas em casos maiores e processamento excessivo em casos pequenos.

### 5.2. Rasterizacao por segmentos

Depois da amostragem, cada par de amostras consecutivas e ligado por uma reta rasterizada.

O algoritmo usado nesses trechos e o mesmo selecionado na interface para retas:

- DDA
- Bresenham

Isso mantem coerencia com os algoritmos exigidos no trabalho e reaproveita a infraestrutura ja implementada.

### 5.3. Precisao geometrica separada da grade

As curvas mantem coordenadas decimais internamente, e o arredondamento para a grade de pixels ocorre apenas no desenho final.

Esse refinamento evita perda acumulada de qualidade quando o usuario aplica multiplas transformacoes.

### 5.4. Integracao com o restante do sistema

As duas curvas foram integradas com:

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

### 6.1. Curva interpolada

1. Selecione a ferramenta `Interpolada`.
2. Clique em `P0`.
3. Clique em `P1`.
4. Clique em `P2`.
5. Clique em `P3`.

Ao quarto clique, a curva e criada automaticamente.

Os quatro pontos informados pertencem a curva.

### 6.2. Curva de Bezier

1. Selecione a ferramenta `Bezier`.
2. Clique em `P0`.
3. Clique em `P1`.
4. Clique em `P2`.
5. Clique em `P3`.

Ao quarto clique, a curva e criada automaticamente.

Nessa ferramenta, os pontos internos controlam a forma da curva, mas nao precisam pertencer a ela.

### 6.3. Selecao e transformacoes

Depois de criada, a curva pode ser:

- selecionada por regiao retangular
- transladada
- escalada
- rotacionada
- refletida

Quando selecionada, a aplicacao mostra os pontos de referencia e a poligonal guia correspondente.

### 6.4. Rastreamento

Ao criar uma curva, o painel `Rastreamento Algoritmico` mostra:

- tipo da curva
- algoritmo de rasterizacao usado nos trechos
- quantidade de amostras
- pontos de referencia usados
- algumas amostras calculadas ao longo do parametro `t`

### 6.5. Observacao sobre recorte

O recorte pedido no trabalho continua aplicado a:

- retas
- poligonos

As curvas parametricas nao entram na rotina de recorte implementada para a janela retangular, porque o foco do requisito original de recorte do trabalho esta nos algoritmos de reta.

## 7. Resumo de implementacao

Em termos de fluxo interno, a implementacao funciona assim:

1. o usuario informa os pontos por clique
2. a aplicacao armazena a curva como estrutura geometrica
3. a curva e avaliada para varios valores de `t`
4. os pontos amostrados sao ligados por retas rasterizadas
5. os pixels gerados sao desenhados no canvas

Esse modelo preserva a coerencia da arquitetura do projeto e deixa explicito, para fins didaticos, onde entram:

- modelo matematico
- amostragem
- rasterizacao
- exibicao final em pixels
