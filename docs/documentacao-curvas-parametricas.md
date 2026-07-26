# Documentação das Curvas Paramétricas

## 1. Organização do código

As curvas paramétricas foram integradas ao mesmo núcleo geométrico utilizado pelos demais elementos da aplicação, como pontos, retas, circunferências e polígonos.

De forma geral, a implementação foi organizada nas seguintes etapas:

- definição das ferramentas disponíveis na interface
- representação das curvas como estruturas geométricas
- avaliação matemática da curva a partir do parâmetro `t`
- amostragem de pontos ao longo da curva
- rasterização da curva por segmentos de reta
- integração com seleção, transformações e painel de inspeção

A curva interpolada é armazenada como um conjunto de quatro pontos de referência. A curva de Bézier é armazenada com ponto inicial, dois pontos de controle e ponto final.

As curvas não são desenhadas diretamente por uma equação de pixels. Primeiro a aplicação calcula vários pontos ao longo da curva. Depois, cada par consecutivo de amostras é ligado por um segmento de reta rasterizado com o algoritmo selecionado para retas.

## 2. Explicação do modelo matemático

### 2.1. Curva interpolada cúbica

A curva interpolada cúbica foi implementada com quatro pontos informados pelo usuário: `P0`, `P1`, `P2` e `P3`.

Diferentemente da curva de Bézier, os quatro pontos pertencem à curva.

Para isso, foi utilizada interpolação polinomial de Lagrange com os seguintes parâmetros:

```text
t0 = 0
t1 = 1/3
t2 = 2/3
t3 = 1
```

A curva é definida por:

```text
C(t) = L0(t)P0 + L1(t)P1 + L2(t)P2 + L3(t)P3
```

em que cada base de Lagrange é dada por:

```text
Li(t) = produto, para j diferente de i, de (t - tj) / (ti - tj)
```

Com essa formulação, a curva satisfaz:

```text
C(0)   = P0
C(1/3) = P1
C(2/3) = P2
C(1)   = P3
```

Logo, a curva passa exatamente pelos quatro pontos fornecidos.

### 2.2. Curva de Bézier cúbica

A curva de Bézier cúbica foi implementada com quatro pontos:

- `P0`: ponto inicial
- `P1`: primeiro ponto de controle
- `P2`: segundo ponto de controle
- `P3`: ponto final

A equação utilizada foi:

```text
B(t) = (1 - t)^3 P0
     + 3(1 - t)^2 t P1
     + 3(1 - t) t^2 P2
     + t^3 P3
```

Nesse modelo, a curva passa obrigatoriamente por `P0` e `P3`. Já `P1` e `P2` não precisam pertencer à curva, pois controlam sua forma.

### 2.3. Rasterização das curvas

As curvas são avaliadas em vários valores de `t` e convertidas em uma sequência de amostras geométricas.

Depois disso, cada par consecutivo de amostras é ligado por uma reta rasterizada. Para esse processo, a aplicação reutiliza os algoritmos de reta já existentes no projeto:

- DDA
- Bresenham

## 3. Manual de uso

### 3.1. Curva interpolada

Para criar uma curva interpolada:

1. selecionar a ferramenta `Interpolated`
2. clicar em `P0`
3. clicar em `P1`
4. clicar em `P2`
5. clicar em `P3`

Após o quarto clique, a curva é criada automaticamente.

### 3.2. Curva de Bézier

Para criar uma curva de Bézier:

1. selecionar a ferramenta `Bezier`
2. clicar em `P0`
3. clicar em `P1`
4. clicar em `P2`
5. clicar em `P3`

Após o quarto clique, a curva é criada automaticamente.

### 3.3. Seleção e transformações

Depois de criada, a curva pode ser:

- selecionada
- transladada
- escalada
- rotacionada
- refletida

A aplicação mantém a estrutura geométrica da curva e atualiza sua rasterização após cada transformação.
