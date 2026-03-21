# Roteiro de testes e vídeo

Use este roteiro para validar o trabalho e gravar o vídeo de entrega com captura de tela e áudio.

## Sequência recomendada

1. Apresente rapidamente a interface e a área de desenho.
2. Crie pelo menos:
   - dois pontos
   - duas retas, uma com DDA e outra com Bresenham
   - uma circunferência
   - um polígono
3. Faça uma seleção retangular contendo mais de um tipo de elemento.
4. Demonstre as transformações:
   - translação
   - rotação
   - escala
   - reflexão X
   - reflexão Y
   - reflexão XY
5. Crie uma janela de recorte.
6. Selecione retas parcialmente internas e externas à janela.
7. Execute o recorte com Cohen-Sutherland.
8. Recrie um cenário equivalente e execute o recorte com Liang-Barsky.
9. Mostre a exclusão da seleção e a limpeza completa do projeto.

## Pontos a mencionar no áudio

- A rasterização das retas é configurável entre DDA e Bresenham.
- A circunferência usa Bresenham.
- A seleção é feita por região retangular.
- Os fatores de transformação são definidos pelo usuário.
- O recorte foi implementado com os dois algoritmos exigidos.
- A saída final é exibida em uma matriz de pixels no canvas.
