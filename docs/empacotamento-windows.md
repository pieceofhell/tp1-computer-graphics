# Empacotamento para Windows

Este projeto já atende ao requisito funcional como aplicação gráfica interativa. Para a entrega do item de executável/instalador no Windows, o caminho mais prático é empacotar a interface web em um contêiner desktop.

## Opção recomendada

Use um empacotador baseado em WebView2 ou Electron para gerar:

- executável `.exe`
- instalador `.msi` ou `.exe`

## Caminho sugerido

1. Criar um contêiner desktop simples que carregue `index.html`.
2. Gerar o executável.
3. Empacotar com Inno Setup ou WiX.

## Entregáveis finais esperados

- Código-fonte completo deste repositório
- Vídeo de testes com áudio
- Executável gerado do contêiner desktop
- Instalador do Windows

## Sugestão prática de apresentação

Se o professor aceitar um correspondente ao executável, você pode entregar também:

- link publicado no GitHub Pages
- repositório público no GitHub

Isso não substitui automaticamente o instalador, mas ajuda como canal adicional de demonstração e download.
