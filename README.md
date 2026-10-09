# Checkpoint — Biblioteca de jogos

**Organize sua coleção, avalie suas experiências e compartilhe sua jornada.**

Checkpoint é uma aplicação web para registrar jogos, organizar o que você está jogando e guardar suas avaliações. Cada pessoa possui sua própria biblioteca e pode descobrir opiniões de outros jogadores, visitar perfis e conversar com amigos.

O projeto utiliza **React, JavaScript e CSS**, com **Firebase Authentication** para as contas e **Cloud Firestore** para salvar os dados. O visual tem vermelho como cor principal, tema escuro por padrão, opção de tema claro e layout adaptado a computadores e celulares.

[Acessar a aplicação](https://richarddkk.github.io/Backlog_Games/) · [Repositório](https://github.com/richarddkk/Backlog_Games)

## Objetivo

Ajudar jogadores a manter uma biblioteca organizada, decidir o que jogar depois e registrar suas experiências. A aplicação também permite acompanhar conquistas de amigos e compartilhar reviews, com opções de privacidade para a coleção e para cada avaliação.

## Funcionalidades

- Adicionar, editar e excluir jogos, com confirmação antes da exclusão.
- Avaliar de **0,5 a 5 estrelas**, incluindo notas como **4,5**. Zero representa um jogo sem nota.
- Registrar **horas de jogo manualmente**, inclusive valores fracionados.
- Escolher o gênero e a lista de cada jogo.
- Organizar a biblioteca arrastando as capas, usando o teclado ou os botões de movimentação.
- Usar capas automáticas dos **32 jogos do catálogo incluído** ou informar uma URL de imagem para outros títulos.
- Criar uma conta, entrar e recuperar a senha por e-mail.
- Personalizar o perfil com nome de exibição, foto e uma bio sobre você.
- Visitar perfis e consultar bibliotecas e reviews conforme a privacidade escolhida.
- Ler reviews em uma página própria, com abas **Geral** e **Global**.
- Abrir uma página individual de cada review, com texto completo, nota, situação e horas de jogo.
- Clicar na capa ou no título de uma review para abri-la e no autor para visitar seu perfil.
- Enviar pedidos de amizade pelo perfil ou por código, com aceitação, recusa, cancelamento e remoção.
- Conversar em tempo real com amigos aceitos pela página **Conversas**.
- Acompanhar atividades com nome do jogador, jogo, ação, data e hora.
- Compartilhar um link direto para uma review.
- Gerar uma prévia personalizada de reviews públicas, após configurar o serviço de compartilhamento incluído.
- Criar listas e gêneros pessoais; administradores também gerenciam opções globais.
- Alternar entre os temas escuro e claro.
- Acessar uma página 404 quando a rota não existe.

## Como usar

### 1. Entrar ou experimentar

Abra a aplicação e clique em **Minha conta** para entrar ou criar uma conta. Com uma conta, seus jogos, perfil e mensagens ficam salvos no Firebase e podem ser acessados em outros dispositivos.

Também é possível experimentar no **modo local**. Nesse modo, os jogos ficam somente naquele navegador e endereço. A biblioteca local não é enviada automaticamente para uma conta, e nenhum conteúdo é publicado para outras pessoas.

### 2. Adicionar um jogo

Clique em **Adicionar jogo**, informe o nome e escolha uma sugestão do catálogo, quando disponível. Depois, selecione o gênero e a lista, informe suas horas de jogo, dê uma nota e escreva sua avaliação, se desejar.

A capa é preenchida para títulos do catálogo. Para outros jogos, você pode informar uma URL direta de imagem ou salvar sem capa.

As horas são preenchidas por você: não há leitura automática de Steam ou de outras plataformas. Um jogo sem horas cadastradas aparece com essa informação ausente na página da review.

### 3. Organizar a coleção

As listas padrão representam o andamento de cada jogo:

| Lista | Uso |
| --- | --- |
| **Jogando** | Jogos que você está jogando atualmente. |
| **Zerado** | Jogos cuja campanha ou objetivo principal você concluiu. |
| **Desistiu** | Jogos que você decidiu parar de jogar. |
| **Planejo jogar** | Jogos que você pretende jogar no futuro. |
| **Platinado** | Jogos em que você concluiu todas as conquistas que considera necessárias. |

Selecione uma lista no menu e use o filtro de gênero para encontrar jogos. Para mudar a ordem, arraste pelo puxador da capa ou use os botões para mover antes ou depois. Essa organização pertence à sua própria biblioteca.

### 4. Avaliar e escrever reviews

Na biblioteca, clique na capa, no nome ou no controle de edição do jogo. Atualize a lista, gênero, capa, nota, horas ou texto e salve.

Para notas fracionadas, clique na metade esquerda da estrela correspondente. Por exemplo, a metade esquerda da quinta estrela representa **4,5**. Use **Limpar** para retirar a nota.

O texto é opcional e pode ter até **3.000 caracteres**. É possível escrever em qualquer lista, inclusive Jogando ou Desistiu; não é obrigatório terminar o jogo para avaliar. Cada jogo possui uma review atual, que pode ser editada.

Em **Quem pode ler o texto?**, escolha:

| Opção | Quem pode ler |
| --- | --- |
| **Só eu** | Apenas você; é o padrão dos novos textos. |
| **Amigos** | Você e seus amigos aceitos. |
| **Todos** | Qualquer pessoa que acessar o site. |

Escolher Todos publica o texto e os dados daquela review, incluindo nome do autor, título, capa, nota, horas, situação e gênero. Dar uma nota sem escrever um texto não cria uma publicação nos feeds.

### 5. Explorar reviews

Abra **Reviews** no menu:

- **Geral:** suas avaliações, inclusive as privadas, e as compartilhadas pelos seus amigos aceitos.
- **Global:** avaliações que jogadores escolheram compartilhar com Todos, inclusive pessoas que não são suas amigas. A leitura de reviews públicas também funciona sem login.

Clique na capa ou no título para abrir a avaliação completa. A página individual mostra a opinião, as estrelas, a situação do jogo e as horas cadastradas. Clique no nome do autor para visitar seu perfil.

**Atividades** continua sendo uma tela de avisos, separada das reviews.

### 6. Personalizar e visitar perfis

Abra **Meu perfil → Editar perfil**, ou clique no seu nome/avatar no cabeçalho. Você pode alterar o nome, escrever uma bio de até **600 caracteres** e escolher uma foto JPG, PNG ou WebP de até **5 MB**.

A aplicação recorta e reduz a foto automaticamente. Confirme em **Salvar perfil**. Essa ação publica seu nome, foto e bio; o e-mail da conta não é publicado.

A biblioteca pode ser compartilhada com **Amigos**, opção padrão, ou com **Todos**. Tornar a coleção pública não altera a privacidade dos textos: uma review Só eu continua privada.

Os perfis possuem abas **Biblioteca** e **Reviews**, com o conteúdo permitido para quem está visitando. Quando a coleção é restrita, visitantes podem ler as reviews públicas e enviar um pedido de amizade para solicitar acesso aos jogos.

### 7. Adicionar amigos

No perfil de outro jogador, clique em **Adicionar amigo**. O destinatário escolhe se aceita ou recusa o pedido.

Também é possível usar códigos:

1. Abra **Amigos** e copie **Seu código de amigo**.
2. Compartilhe o código com a outra pessoa.
3. Ela informa esse código em **Adicionar amigo** e envia um pedido.
4. Você decide **Aceitar** ou **Recusar**.
5. Após aceitar, vocês podem consultar dados compartilhados com amigos e conversar.

As duas pessoas precisam de uma conta. Pedidos pendentes não liberam acesso a conteúdo exclusivo de amigos nem ao chat. Não há busca pública de usuários por nome ou e-mail.

### 8. Conversar

Com uma amizade aceita, clique em **Conversar** no perfil do amigo ou abra **Conversas** no menu e selecione a pessoa.

As mensagens aparecem em tempo real e ficam salvas no Firestore. Cada mensagem pode ter até **2.000 caracteres**. Pressione **Enter** para enviar ou **Shift + Enter** para quebrar a linha.

Somente os dois amigos participantes têm acesso pelo aplicativo. Remover a amizade bloqueia a leitura e novos envios; o histórico permanece salvo e volta a ficar acessível se ambos aceitarem uma nova amizade. O chat não possui criptografia de ponta a ponta.

### 9. Acompanhar atividades

Abra **Atividades** para consultar avisos como:

- “Richard adicionou Hades.”
- “Richard começou a jogar Hollow Knight.”
- “Richard zerou God of War.”
- “Richard platinou Hades.”

Cada registro inclui data e hora. Use **Todas**, **Minhas** ou **Amigos** para escolher quais atividades consultar.

Os registros representam ações realizadas a partir da versão 1.3.0; jogos anteriores continuam na biblioteca sem gerar datas fictícias. Editar apenas nota, texto, horas ou capa e reordenar jogos não cria uma atividade. O histórico guarda o nome e o título utilizados no momento da ação.

### 10. Compartilhar uma review

Na página individual da avaliação, clique em **Compartilhar → Copiar link**. Quem abrir o endereço será levado diretamente à review, respeitando sua privacidade.

Para reviews públicas, o projeto inclui um serviço opcional que gera uma prévia com **capa, autor, estrelas, situação e horas de jogo**. O aplicativo continua no GitHub Pages, enquanto esse serviço precisa ser publicado separadamente, por exemplo na Vercel. O guia `COMPARTILHAMENTO.md` explica a configuração.

Sem o serviço, o link direto continua funcionando, mas não há prévia personalizada. Reviews Amigos ou Só eu usam links protegidos e não expõem o texto ao serviço de prévias.

O Instagram e outras plataformas decidem se exibem uma prévia e como ela aparece. Esse recurso não publica Stories automaticamente nem força a exibição de um card no adesivo de link.

### 11. Personalizar listas e gêneros

Na engrenagem de **Configurações**, crie, renomeie, arquive ou reative listas e gêneros pessoais. Administradores podem escolher **Opções globais** para gerenciar categorias disponíveis a todas as contas.

Arquivar uma opção preserva os jogos associados a ela. Cada pessoa edita somente sua própria coleção e suas opções pessoais.

## Privacidade e acesso

| Informação | Quem pode ver |
| --- | --- |
| Nome, foto e bio publicados | Qualquer visitante. |
| Biblioteca em Amigos | Dono e amigos aceitos. |
| Biblioteca em Todos | Qualquer visitante, sem liberar reviews privadas. |
| Review Só eu | Apenas o dono. |
| Review Amigos | Dono e amigos aceitos. |
| Review Todos | Qualquer visitante. |
| Atividades | Dono e amigos aceitos. |
| Conversas | Os dois amigos aceitos participantes. |
| E-mail da conta | Não é publicado no perfil. |

Mudar uma review pública para Amigos/Só eu, apagar seu texto ou excluir o jogo retira a publicação pública na mesma operação. Informações já vistas, copiadas ou guardadas por redes sociais não podem ser recolhidas automaticamente.

O administrador do aplicativo gerencia opções globais. Essa função não libera acesso especial a bibliotecas restritas, textos privados ou conversas de outras pessoas.

## Tecnologias e estrutura

| Tecnologia | Finalidade |
| --- | --- |
| React | Componentes e interface da aplicação. |
| JavaScript e CSS | Comportamento, estilos e layout responsivo. |
| Vite | Desenvolvimento local e compilação. |
| React Router DOM | Navegação entre páginas. |
| Outlet | Layout compartilhado com menu e cabeçalho. |
| Firebase Authentication | Cadastro, login e recuperação de senha. |
| Cloud Firestore | Jogos, perfis, reviews, atividades, amizades e mensagens. |
| dnd-kit | Reordenação dos jogos por arraste e teclado. |
| Vitest e Testing Library | Testes de dados, componentes e fluxos. |
| GitHub Pages e Actions | Hospedagem e publicação do aplicativo. |
| Node.js e Sharp | Serviço opcional de metadados e geração de cards PNG. |

As páginas são rotas filhas de `AppLayout`, renderizadas pelo **Outlet**. O projeto utiliza componentes, props, `children`, `useState`, `useEffect`, renderização condicional e listas com `.map()` e `key`.

| Pasta | Conteúdo |
| --- | --- |
| `src/components` | Cards, formulários, estrelas, capas e modais. |
| `src/pages` | Páginas da aplicação. |
| `src/layouts` | Layout compartilhado. |
| `src/hooks` | Leitura em tempo real e operações de dados. |
| `src/lib` | Validações, modelos e configuração Firebase. |
| `public/covers` | Capas do catálogo incluído. |
| `tests` | Testes da aplicação e das regras de acesso. |
| `share-service` | Serviço separado de prévias e imagens de compartilhamento. |

## Executar localmente

Com **Node.js 22.12 ou superior**, abra o terminal na pasta que contém o `package.json` principal:

```bash
npm install
npm run dev
```

Acesse **http://localhost:5173**. Se essa porta estiver ocupada, execute `npm run dev -- --port 5174` e abra **http://localhost:5174**.

Para contas e dados na nuvem:

1. Copie `.env.example` para `.env` na pasta principal do projeto.
2. Preencha os valores da configuração do aplicativo Web Firebase.
3. Ative o login por E-mail/senha no Firebase Authentication.
4. Publique o conteúdo de `firestore.rules` no Firestore do mesmo projeto.
5. Reinicie o servidor após editar `.env`.

O modo local funciona sem essa configuração. Mantenha `.env`, `node_modules` e `dist` fora do repositório; o `.gitignore` incluído já os exclui.

## Rotas e página 404

A aplicação utiliza **HashRouter**, mantendo `#` nos endereços para permitir navegação e atualização de páginas no GitHub Pages.

| Rota após `#` | Página |
| --- | --- |
| `/` | Biblioteca pessoal. |
| `/atividades` | Avisos e histórico. |
| `/reviews` | Reviews: Geral e Global. |
| `/reviews/UID/ID_JOGO` | Review individual. |
| `/perfil/UID` | Perfil de um jogador. |
| `/amigos` | Pedidos e amigos. |
| `/conversas?com=UID` | Conversa com um amigo aceito. |
| Qualquer rota desconhecida | Página 404. |

Teste a página 404 em **http://localhost:5173/#/nao-existe** ou em [uma rota inexistente do site](https://richarddkk.github.io/Backlog_Games/#/nao-existe). Ela oferece um botão para voltar à biblioteca.

## Testes e compilação

```bash
# Testes da aplicação
npm test

# Testes das regras no emulador Firebase
npm run test:rules

# Compilar a aplicação
npm run build
```

Os testes verificam validações, ordenação, persistência, navegação, horas, perfis, reviews, atividades, amizades, conversas e permissões. Os testes das regras usam o projeto de demonstração `demo-checkpoint`, separado do banco real, e requerem Java 17 ou superior para a versão do Firebase CLI fixada no projeto.

Para testar o serviço de prévias separadamente:

```bash
cd share-service
npm ci
npm test
```

A versão 1.6.0 foi validada com **52 testes da aplicação, 24 testes de regras e 8 testes do serviço de compartilhamento**, totalizando **84 testes**, além da compilação para GitHub Pages.

## Limites e configuração adicional

A interface mostra até 100 atividades recentes por pessoa, 100 reviews públicas recentes no feed Global, 100 publicações na consulta de um perfil e as 100 mensagens mais recentes de cada conversa. O histórico local preserva 500 atividades.

Perfis de contas antigas são publicados quando a pessoa salva o perfil nesta versão. Jogos muito antigos com texto ainda embutido no documento do jogo permanecem restritos aos amigos até o dono abrir o editor e salvar novamente, separando o texto dos metadados.

Para configurar o Firebase e a conta administradora, consulte `GUIA_CONFIGURACAO.md`. Para atualizar o projeto existente, siga `ATUALIZAR_1.6.0.md`. Para ativar as prévias dos links, siga `COMPARTILHAMENTO.md`. Esses arquivos acompanham o projeto completo.

**Versão descrita: 1.6.0.**
