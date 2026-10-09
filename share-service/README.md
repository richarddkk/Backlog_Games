# Serviço de compartilhamento do Checkpoint

Este projeto separado fornece HTML Open Graph e imagens PNG para reviews públicas. O aplicativo React continua no GitHub Pages.

O guia completo está em [../COMPARTILHAMENTO.md](../COMPARTILHAMENTO.md).

- Runtime: Node.js 22 ou superior.
- Instalação: `npm ci` nesta pasta.
- Testes: `npm test`.
- Desenvolvimento: copie `.env.example` para `.env`, configure os dois campos e use `npm run dev`.
- Vercel: Root Directory apontando para esta pasta, Framework Other, sem build Vite.
- Variáveis obrigatórias: `FIREBASE_PROJECT_ID` e `PUBLIC_APP_URL`.
- Opcional: `SHARE_ORIGIN`, URL HTTPS do próprio serviço; caso ausente, usa o host da requisição.
- Opcional: `PREVIEW_IMAGE_HOSTS`, domínios HTTPS extras de provedores de imagens confiáveis.

Rotas: `/r/UID/ID_JOGO` para HTML e `/card/UID/ID_JOGO.png` para a imagem. Só publicReviews é consultado, sem credencial administrativa. A ausência da publicação retorna 404 sem metadados anteriores. Não há cache próprio, banco adicional, upload ou envio automático a redes sociais.

As fontes incluídas em assets têm sua licença em FONT-LICENSE.txt. O desenho usa caminhos vetoriais e Sharp para gerar o PNG, sem depender de fontes instaladas no provedor.
