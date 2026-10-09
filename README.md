# Checkpoint — Biblioteca de jogos

**Organize sua coleção, avalie suas experiências e acompanhe cada conquista.**

Checkpoint é uma aplicação web para registrar jogos, organizar o que você está jogando e guardar suas avaliações. Cada conta possui sua própria biblioteca e pode compartilhar a coleção com amigos após aceitar um pedido de amizade.

O projeto utiliza **React, JavaScript e CSS**, com **Firebase Authentication** para as contas e **Cloud Firestore** para salvar os dados. O visual tem vermelho como cor principal, tema escuro por padrão e opção de tema claro.

[Acessar a aplicação](https://richarddkk.github.io/Backlog_Games/) · [Repositório](https://github.com/richarddkk/Backlog_Games)

## Objetivo

Ajudar jogadores a manter uma biblioteca organizada, decidir o que jogar depois e consultar o histórico das próprias experiências. Também permite acompanhar jogos e conquistas de amigos, mantendo o compartilhamento sob controle de cada pessoa.

## Funcionalidades

- Adicionar, editar e excluir jogos, com confirmação antes da exclusão.
- Avaliar de **0,5 a 5 estrelas**, incluindo notas como **4,5**. A nota zero representa um jogo sem avaliação.
- Escrever uma avaliação ou comentário sobre cada jogo.
- Escolher o gênero e a lista à qual o jogo pertence.
- Organizar os jogos arrastando suas capas ou usando os controles de movimentação.
- Usar capas automáticas dos **32 jogos do catálogo incluído**, ou informar uma URL de imagem para outros títulos.
- Criar uma conta, entrar e recuperar a senha por e-mail.
- Editar o nome de exibição e enviar uma foto de perfil.
- Consultar atividades com nome do jogador, jogo, ação, data e hora.
- Enviar, aceitar, recusar e cancelar pedidos de amizade.
- Consultar a biblioteca e as atividades dos amigos aceitos.
- Criar listas e gêneros pessoais; administradores também gerenciam opções globais.
- Alternar entre tema escuro e claro, com layout adaptado a computadores e celulares.
- Acessar uma página 404 quando a rota não existe.

## Como usar

### 1. Entrar ou experimentar

Abra a aplicação e clique em **Minha conta** para entrar ou criar uma conta. Com uma conta, seus jogos e perfil ficam salvos no Firebase e podem ser acessados em outros dispositivos.

Também é possível experimentar no **modo local**. Nesse modo, os dados ficam somente no navegador e no endereço utilizado. A biblioteca local não é enviada automaticamente para uma conta.

### 2. Adicionar um jogo

Clique em **Adicionar jogo**, informe o nome e escolha uma sugestão do catálogo, quando disponível. Depois, selecione o gênero e a lista, dê uma nota e escreva sua avaliação, se desejar.

A capa é preenchida para os títulos do catálogo. Para outros jogos, você pode usar uma URL direta de imagem ou salvar sem capa.

### 3. Organizar a coleção

As listas padrão representam o andamento de cada jogo:

| Lista | Uso |
| --- | --- |
| **Jogando** | Jogos que você está jogando atualmente. |
| **Zerado** | Jogos cuja campanha ou objetivo principal você concluiu. |
| **Desistiu** | Jogos que você decidiu parar de jogar. |
| **Planejo jogar** | Jogos que você pretende jogar no futuro. |
| **Platinado** | Jogos em que você concluiu todas as conquistas que considera necessárias. |

Selecione uma lista no menu e use o filtro de gênero para encontrar jogos. Para mudar a ordem, arraste pelo puxador da capa ou utilize os botões para mover antes ou depois. A ordem escolhida pertence à sua própria biblioteca.

### 4. Avaliar ou editar

Clique na capa, no nome ou no controle de edição do jogo. No formulário, altere a lista, o gênero, a capa, a nota ou o comentário.

Para notas fracionadas, clique na metade esquerda da estrela correspondente. Por exemplo, a metade esquerda da quinta estrela representa **4,5**. Use **Limpar** para retirar a nota.

### 5. Personalizar o perfil e as opções

Clique no seu nome ou avatar no cabeçalho para editar o perfil. Você pode escolher uma imagem JPG, PNG ou WebP de até **5 MB**. A aplicação recorta e reduz a foto automaticamente; confirme a mudança em **Salvar perfil**.

Na engrenagem de **Configurações**, crie, renomeie ou arquive suas listas e gêneros pessoais. Administradores podem escolher **Opções globais** para gerenciar categorias disponíveis a todas as contas. Arquivar uma opção preserva os jogos já associados a ela.

### 6. Acompanhar atividades

Abra **Atividades** no menu. Os registros mostram ações como:

- “Richard adicionou Hades.”
- “Richard começou a jogar Hollow Knight.”
- “Richard zerou God of War.”
- “Richard platinou Hades.”

Cada registro inclui data e hora. Use **Todas**, **Minhas** ou **Amigos** para escolher quais atividades consultar.

O histórico começa com as ações realizadas a partir da versão **1.3.0**. Jogos antigos continuam na coleção, sem criar datas fictícias para conquistas anteriores. Editar apenas nota, texto ou capa e reordenar jogos não cria uma atividade. Os registros guardam o nome e o título usados no momento da ação.

Na conta, a página mostra até **100 atividades recentes por pessoa**. No modo local, são preservadas as últimas **500 atividades**.

### 7. Adicionar amigos

1. Abra **Amigos** e copie **Seu código de amigo**.
2. Compartilhe o código com a outra pessoa.
3. Ela informa esse código em **Adicionar amigo** e envia um pedido.
4. Você decide **Aceitar** ou **Recusar** o pedido recebido.
5. Após aceitar, use **Ver biblioteca** ou **Atividades → Amigos**.

As duas pessoas precisam de uma conta. Um pedido pendente não libera acesso à coleção. Confira o código antes de enviar: não há busca pública de usuários por nome ou e-mail.

## Contas e compartilhamento

Cada pessoa edita somente os próprios jogos, perfil, listas e gêneros. Uma amizade aceita permite que ambas consultem nome, foto, jogos, avaliações, opções pessoais e atividades uma da outra.

Amigos têm acesso de **leitura** à coleção compartilhada. Remover a amizade encerra esse acesso pelo aplicativo e pelas regras do banco; informações já vistas ou copiadas não podem ser recolhidas.

O administrador gerencia opções globais, mas essa permissão não libera acesso automático às bibliotecas de outras contas.

## Tecnologias e estrutura

| Tecnologia | Finalidade |
| --- | --- |
| React | Componentes e interface da aplicação. |
| JavaScript e CSS | Comportamento, estilos e layout responsivo. |
| Vite | Desenvolvimento local e compilação. |
| React Router DOM | Navegação entre páginas. |
| Outlet | Layout compartilhado com menu e cabeçalho. |
| Firebase Authentication | Cadastro, login e recuperação de senha. |
| Cloud Firestore | Jogos, perfil, opções, atividades e amizades. |
| dnd-kit | Reordenação dos jogos por arraste e teclado. |
| Vitest e Testing Library | Testes de dados, componentes e fluxos. |
| GitHub Pages e Actions | Hospedagem e publicação automática. |

As páginas **Biblioteca**, **Atividades**, **Amigos** e **404** são rotas filhas do layout `AppLayout`, renderizadas pelo `Outlet`. O projeto utiliza componentes, props, `children`, `useState`, `useEffect`, renderização condicional e listas com `.map()` e `key`.

## Executar localmente

Com **Node.js 22.12 ou superior**, abra o terminal na pasta que contém `package.json`:

```bash
npm install
npm run dev
```

Acesse **http://localhost:5173**. Para usar as contas e o banco, copie `.env.example` para `.env`, preencha a configuração do seu aplicativo Web Firebase e publique `firestore.rules` no mesmo projeto. O modo local funciona sem essa configuração.

Mantenha `.env`, `node_modules` e `dist` fora do repositório; o `.gitignore` do projeto já exclui esses arquivos.

## Rotas e página 404

O projeto usa **HashRouter**, mantendo o `#` nos links para permitir navegação e atualização de páginas no GitHub Pages.

| Página | Link |
| --- | --- |
| Biblioteca | [Abrir biblioteca](https://richarddkk.github.io/Backlog_Games/#/) |
| Atividades | [Abrir atividades](https://richarddkk.github.io/Backlog_Games/#/atividades) |
| Amigos | [Abrir amigos](https://richarddkk.github.io/Backlog_Games/#/amigos) |
| Teste da página 404 | [Abrir rota inexistente](https://richarddkk.github.io/Backlog_Games/#/nao-existe) |

Localmente, teste a página 404 em **http://localhost:5173/#/nao-existe**. Ela oferece um botão para voltar à biblioteca.

## Testes e compilação

```bash
# Testes da aplicação
npm test

# Testes das regras no emulador Firebase; requer Java 17 ou superior
npm run test:rules

# Compilar a aplicação
npm run build
```

Os testes verificam validações, ordenação, persistência, navegação, atividades, amizades e permissões. Os testes das regras usam um projeto de demonstração, separado do banco real.

**Versão descrita: 1.3.0.** Para atualizar uma instalação anterior, siga o arquivo `ATUALIZAR_1.3.0.md` do projeto.
