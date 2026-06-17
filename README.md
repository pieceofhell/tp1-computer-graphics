# TP1 de Computação Gráfica

Aplicação web interativa para o primeiro trabalho prático da disciplina de Computação Gráfica. O projeto foi estruturado para atender ao enunciado com uma área de desenho em matriz de pixels, interação principal por cliques e implementação explícita dos algoritmos pedidos.

## Funcionalidades implementadas

- Transformações geométricas 2D sobre elementos selecionados:
  - translação
  - rotação
  - escala
  - reflexões X, Y e XY
- Rasterização:
  - retas por DDA
  - retas por Bresenham
  - circunferências por Bresenham
- Recorte de retas:
  - Cohen-Sutherland
  - Liang-Barsky
- Estruturas gráficas:
  - pontos
  - retas
  - polígonos
  - circunferências
- Seleção por região retangular via interface
- Área de desenho em canvas com grade cartesiana e pixels explícitos

## Estrutura do projeto

- `index.html`: interface principal
- `styles.css`: identidade visual e layout
- `app.js`: estado da aplicação, interação e algoritmos gráficos
- `.github/workflows/deploy-pages.yml`: publicação automática no GitHub Pages

## Como executar

O projeto é estático e pode ser aberto diretamente no navegador.

1. Abra o arquivo `index.html`.
2. Use a barra lateral para escolher a ferramenta de desenho.
3. Faça os desenhos e seleções diretamente no canvas.
4. Aplique transformações e recortes pelos controles laterais.

Alternativamente, acesse https://pieceofhell.github.io/tp1-computer-graphics/, onde o site está publicado por meio do GitHub Pages.

## Fluxo de uso

### Desenho

- `Ponto`: um clique cria um ponto.
- `Reta`: clique no ponto inicial e depois no ponto final.
- `Circunferência`: clique no centro e depois em um ponto da borda.
- `Polígono`: clique para adicionar vértices e use `Finalizar polígono` para concluir.

### Seleção

- Escolha `Seleção`.
- Arraste uma região retangular sobre o canvas.
- A seleção é usada pelas transformações e pela exclusão.

### Transformações

- Informe os fatores nas caixas laterais.
- Clique no botão da transformação desejada.
- O pivô da rotação e escala pode ser o centro da seleção ou a origem.

### Recorte

1. Escolha `Janela de recorte` (em Ferramentas).
2. Arraste a região retangular de recorte.
3. Volte à seleção e selecione as retas desejadas.
4. Escolha `Cohen-Sutherland` ou `Liang-Barsky`.
5. Clique em `Aplicar recorte`.

## Observações acadêmicas

- O projeto evita depender de entrada por teclado para a construção dos elementos principais.
- Os algoritmos foram implementados manualmente em JavaScript, sem bibliotecas gráficas externas.
- A área de desenho usa uma grade cartesiana com origem no centro, o que facilita rotação e reflexões.