# Checkpoint

Uma biblioteca pessoal de jogos feita com **React + JavaScript + CSS**, usando Vite, Firebase Authentication e Cloud Firestore.

## O que está pronto

- Avaliação de **0,5 a 5 estrelas**, em passos de 0,5. Zero significa “sem nota”.
- Tema escuro por padrão e tema claro, com vermelho como cor principal e a preferência salva no navegador.
- Gêneros como RPG, ação, aventura, terror, puzzle e outros.
- Listas **Jogando, Zerado, Desistiu, Planejo jogar e Platinado**.
- Capas em formato de coleção, com reordenação por arraste usando mouse ou toque.
- Reordenação também por teclado e pelos botões de mover para antes/depois.
- Cadastro, edição, exclusão com confirmação e comentário de avaliação.
- Catálogo com **32 jogos e capas incluídas nos arquivos**, sem precisar de uma chave de API.
- Capa manual por URL para qualquer outro jogo.
- Conta por e-mail e senha, recuperação de senha e biblioteca individual no Firebase.
- Salvamento e atualização da biblioteca em tempo real quando conectado à conta.
- Modo local para experimentar antes de configurar o Firebase.
- Configurações para criar, renomear, arquivar e reativar listas/categorias e gêneros.
- Opções pessoais para cada conta e opções globais gerenciadas pelo administrador.
- Cor, ícone e contagem de jogos concluídos configuráveis por lista.
- Perfil pessoal com nome de exibição e upload de foto, com recorte e redução automáticos.

## 1. Executar no seu computador

Instale o [Node.js](https://nodejs.org/) **22.12 ou mais recente**. Extraia o ZIP e abra a pasta `checkpoint` no VS Code.

No terminal do VS Code, dentro da pasta que contém `package.json`:

```bash
npm install
npm run dev
```

Abra **http://localhost:5173** no navegador. Se essa porta estiver ocupada, use o endereço mostrado pelo Vite no terminal.

O modo local já funciona sem `.env`. Na primeira abertura ele mostra oito jogos de exemplo. Use **Começar biblioteca vazia** para remover os exemplos e iniciar sua coleção. A confirmação avisa que suas alterações locais também serão removidas.

Mantenha o terminal aberto enquanto usa o site. Para encerrar, pressione `Ctrl + C`. Abra o projeto pelo servidor do Vite, pois o código JSX precisa ser processado.

## Atualizar de uma versão anterior para 1.2.1

Extraia o ZIP completo numa pasta nova e copie seu `.env` principal para dentro de `checkpoint`, junto de `package.json`. Execute `npm install` e publique o `firestore.rules` atualizado. Os jogos, as listas, os gêneros e a permissão em `admins/{UID}` continuam compatíveis; não precisa recriar a conta nem o banco.

Nome e foto acrescentam arquivos e regras: para esta atualização, use o projeto completo, não apenas `src/styles.css`. Se já criou um repositório, copie os arquivos do projeto sobre ele preservando seu `.env` e o diretório `.git`.

## 2. Configurar o Firebase

Use um projeto Firebase dedicado a esta biblioteca para manter seus outros aplicativos separados.

### Criar o projeto e registrar o app Web

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Crie um projeto, por exemplo `checkpoint-jogos`. Google Analytics é opcional para este aplicativo.
3. Na visão geral do projeto, adicione um aplicativo **Web** pelo ícone `</>`.
4. Dê um nome ao app e registre-o.
5. Copie os valores do objeto `firebaseConfig` mostrado pelo Firebase.

### Ativar o cadastro

1. Abra **Authentication** e inicie a configuração.
2. Em **Método de login / Sign-in method**, ative **E-mail/senha / Email/Password**.
3. Salve. O aplicativo usará e-mail e senha para cadastrar e entrar.
4. Em **Configurações → Domínios autorizados**, confira `localhost`. Adicione-o se estiver ausente. Se usar outro endereço para abrir o site, confira também esse domínio.

### Criar o banco e publicar as regras

1. Abra **Firestore Database** e crie o banco padrão `(default)`, na edição **Standard**, usando uma região adequada para você.
2. Inicie em **modo de produção**.
3. Abra a aba **Regras / Rules**.
4. Copie todo o conteúdo de `firestore.rules` deste projeto para o editor de regras.
5. Clique em **Publicar**.

As regras permitem que cada usuário leia e altere somente os documentos da própria biblioteca. Elas também validam as notas, os gêneros, as listas e os campos dos jogos. A coleção será criada automaticamente quando o primeiro jogo for salvo na conta.

### Preencher o arquivo `.env`

Na raiz da pasta `checkpoint`, faça uma cópia de `.env.example` e renomeie a cópia para **`.env`**.

Você pode fazer isso pelo VS Code ou com um destes comandos:

```powershell
# PowerShell no Windows
Copy-Item .env.example .env
```

```bash
# Git Bash, Linux ou macOS
cp .env.example .env
```

Preencha com os valores do SEU aplicativo Web. A correspondência é:

| Campo no Firebase | Campo no `.env` |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Exemplo de formato — substitua os valores ilustrativos:

```dotenv
VITE_FIREBASE_API_KEY=valor_da_apiKey
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=valor_do_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=valor_do_messagingSenderId
VITE_FIREBASE_APP_ID=valor_do_appId
VITE_USE_FIREBASE_EMULATORS=false
```

Os quatro campos `apiKey`, `authDomain`, `projectId` e `appId` ativam a integração. Os demais podem ser copiados da configuração, mas não são necessários para este app salvar os documentos. Este projeto armazena links de capas no Firestore e inclui as capas do catálogo em `public/covers`.

Salve o arquivo, encerre o servidor com `Ctrl + C` e execute `npm run dev` novamente. No site, abra **Minha conta → Criar conta**.

A biblioteca de uma conta nova começa vazia. Os exemplos e jogos do modo local continuam somente naquele navegador; não são enviados automaticamente à sua conta. Ao sair da conta, você volta à biblioteca local.

Use somente a configuração do aplicativo Web nesse arquivo. As regras do Firestore protegem os documentos. O `.gitignore` já exclui `.env`, dependências e arquivos de compilação.

### Tornar sua conta administradora

A permissão de administrador é definida no Firebase, vinculada ao UID da sua conta.

1. Publique a versão atual de `firestore.rules`, incluindo os caminhos `admins`, `taxonomy` e `users/{userId}/options`.
2. Crie sua conta normalmente pelo site.
3. No Firebase Console, vá a **Authentication → Usuários / Users** e copie o **UID** da sua conta.
4. No **Firestore Database → Dados / Data**, crie uma coleção chamada **`admins`**.
5. Dentro dela, crie um documento cujo **ID seja exatamente o UID copiado**.
6. Adicione o campo **`enabled`**, do tipo **boolean**, com o valor **`true`**, e salve.
7. Com essa conta conectada, o site mostrará o selo **Admin**. O acesso é atualizado automaticamente; recarregue a página se necessário.

Exemplo da estrutura:

```text
admins/{UID_DA_SUA_CONTA}
  enabled: true
```

Crie esse documento pelo Console do Firebase, usando sua conta proprietária do projeto. As regras impedem qualquer usuário do site, inclusive administradores do aplicativo, de criar ou alterar permissões de administrador pelo cliente. Para remover essa permissão, altere `enabled` para `false` no Console.

Não existe promoção automática para a primeira conta criada. As demais contas continuam com acesso padrão enquanto não receberem essa permissão pelo Console.

### Permissões das configurações

Neste projeto, **listas e categorias são o mesmo conceito**: Jogando, Zerado, Planejo jogar e outras listas que você criar. Os **gêneros** classificam o tipo de jogo, como RPG ou Soulslike.

| Ação | Conta padrão | Administrador |
| --- | --- | --- |
| Adicionar, avaliar, editar e organizar seus jogos | Sim | Sim |
| Criar e editar listas/categorias pessoais | Sim | Sim |
| Criar e editar gêneros pessoais | Sim | Sim |
| Usar as listas e os gêneros globais | Sim | Sim |
| Criar, editar e arquivar opções globais | Não | Sim |
| Ler ou editar a biblioteca de outra pessoa | Não | Não |
| Promover uma conta pelo site | Não | Não |

Os controles são acompanhados pelas regras do Firestore: uma conta padrão também não consegue alterar opções globais usando chamadas diretas ao banco.

Se você já usava a versão anterior, publique as novas regras e substitua os arquivos do projeto, preservando seu `.env`. Os jogos existentes continuam compatíveis e não precisam de migração. As opções padrão aparecem automaticamente, sem cadastrar documentos no banco.

## 3. Usar a biblioteca

**Adicionar:** clique em **Adicionar jogo**, digite o nome e escolha uma sugestão do catálogo. Quando o nome corresponde exatamente a um jogo do catálogo, a capa também é preenchida automaticamente. Você pode trocar o gênero, escolher a lista e inserir sua avaliação.

**Capas:** os 32 jogos cadastrados usam imagens que já acompanham o projeto. Para outros títulos, cole uma URL direta de imagem, começando com `https://` ou `http://`. Se uma imagem não carregar, um espaço com o nome do jogo aparece no lugar. Você pode salvar um jogo sem capa.

**Avaliar:** clique na metade esquerda de uma estrela para uma nota fracionada, ou na direita para uma nota inteira. Por exemplo, a metade esquerda da quinta estrela corresponde a **4,5**. Use **Limpar** para deixar o jogo sem nota.

**Editar:** clique na capa, no nome ou no ícone de edição. Nesse formulário também é possível excluir o jogo após confirmar.

**Organizar:** use o puxador no canto superior direito da capa. No computador ele aparece ao passar o mouse; no celular fica visível. Arraste o jogo para antes ou depois de outro. Também existem botões abaixo de cada jogo para mover uma posição.

**Teclado:** dê foco ao puxador, pressione `Espaço`, use as setas e pressione `Espaço` para confirmar. `Escape` cancela.

**Listas e gêneros:** selecione uma lista na navegação lateral, ou na faixa horizontal do celular. O filtro de gênero refina essa lista. A ordem pertence à sua biblioteca: cada lista e filtro mostra os jogos na ordem escolhida por você. Outras contas mantêm suas próprias ordens e seus próprios jogos.

**Configurações:** clique na engrenagem no topo. Em **Listas / categorias** ou **Gêneros**, escolha **Minha conta** para criar opções pessoais. Você pode renomear as opções que criou, escolher a cor e o ícone das listas e marcar se seus jogos contam como concluídos.

**Opções globais:** são compartilhadas entre todas as contas. Usuários comuns podem consultá-las. Com sua conta administradora, escolha **Opções globais** e use **Nova lista**, **Novo gênero** ou os controles de edição. Isso também permite renomear os padrões, como Jogando e RPG.

**Arquivar:** retira uma opção do cadastro de novos jogos. Os jogos já associados continuam nas suas listas, com a nota e a avaliação preservadas, e podem ser editados. Você pode reativar a opção depois. Uma opção global arquivada vale para todas as contas; uma opção pessoal afeta só sua biblioteca.

**Renomear:** os vínculos usam IDs estáveis. Mudar o nome da lista ou do gênero atualiza sua apresentação sem reescrever ou apagar os jogos. Listas arquivadas com jogos associados continuam acessíveis na navegação.

**Salvamento:** no modo local os dados ficam no armazenamento deste navegador e endereço. Limpar os dados do navegador remove essa biblioteca. Ao entrar, os documentos são salvos no Firestore e podem ser acessados em outro dispositivo usando a mesma conta. Aguarde o indicador de salvamento terminar antes de fechar uma alteração. A conexão à nuvem precisa de internet.

## Perfil pessoal

Quando estiver conectado à sua conta, clique no nome ou avatar no topo para abrir **Seu perfil**. Edite o nome, escolha uma foto JPG/PNG/WebP de até 5 MB e clique em **Salvar perfil**. **Remover foto** também precisa ser confirmado em Salvar perfil. Sem nome personalizado, o site usa a parte do e-mail antes do `@`.

A foto é recortada ao centro, reduzida para 256 × 256 e salva como JPEG em um documento privado do Firestore de até 180.000 caracteres. Assim não depende do Firebase Storage, que exige o plano Blaze. É um avatar pequeno; não é armazenamento de fotos originais. O perfil é específico deste app, separado dos dados do Firebase Authentication. As regras só permitem que o proprietário leia e altere o perfil.

O nome e a foto ficam salvos no Firebase e acompanham sua conta nos outros dispositivos. Nenhum servidor adicional é necessário para o perfil.

## 4. Arquivos principais

| Arquivo | Função |
| --- | --- |
| `src/App.jsx` | Biblioteca, navegação, temas e reordenação |
| `src/styles.css` | Visual escuro/claro e layout responsivo |
| `src/components/GameCard.jsx` | Capa, nota e controles de cada jogo |
| `src/components/GameEditor.jsx` | Formulário para adicionar, editar e excluir |
| `src/components/Rating.jsx` | Estrelas com notas de meia estrela |
| `src/components/AuthDialog.jsx` | Cadastro, entrada e recuperação de senha |
| `src/components/SettingsDialog.jsx` | Configurações pessoais e globais, conforme a permissão |
| `src/components/Modal.jsx` | Janela com controle de foco e teclado |
| `src/components/Cover.jsx` | Imagens e substituição de capas indisponíveis |
| `src/hooks/useLibrary.js` | Leitura e salvamento local ou no Firestore |
| `src/components/ProfileDialog.jsx` | Nome e upload de foto |
| `src/hooks/useProfile.js` | Perfil privado no Firestore |
| `src/lib/profile.js` | Validação e redução da foto |
| `src/hooks/useTaxonomy.js` | Listas, gêneros e reconhecimento do administrador |
| `src/lib/firebase.js` | Configuração de Authentication e Firestore |
| `src/lib/model.js` | Gêneros, listas, validação e ordem dos jogos |
| `src/lib/taxonomy.js` | Opções padrão, validação e combinação das configurações |
| `src/data/catalog.json` | Catálogo de títulos, gêneros e capas |
| `src/data/examples.js` | Jogos de exemplo do modo local |
| `public/covers/` | As 32 capas incluídas |
| `.env.example` | Modelo da configuração do Firebase |
| `firestore.rules` | Regras de acesso e validação do banco |
| `firebase.json` | Configuração das regras e dos emuladores locais |
| `tests/` | Testes dos fluxos, dados e regras |

### Estrutura no Firestore

Cada jogo ocupa um documento em:

```text
users/{uid_da_conta}/games/{id_do_jogo}
```

Campos: `title`, `genre`, `status`, `rating`, `coverUrl`, `review`, `rank`, `createdAt` e `updatedAt`. O `rank` define a posição da capa. Datas são armazenadas como milissegundos desde 1970. O ID do jogo vem do caminho do documento.

Listas e gêneros personalizados ficam em:

```text
taxonomy/{id_da_opcao_global}
users/{uid_da_conta}/options/{id_da_opcao_pessoal}
admins/{uid_da_conta_administradora}
```

Cada opção tem `kind` (`list` ou `genre`), `label`, `color`, `icon`, `completed`, `active`, `createdAt` e `updatedAt`. Nos jogos, `status` aponta para o ID da lista e `genre` para o ID do gênero. Os IDs dos padrões são compatíveis com a primeira versão do projeto. Os documentos globais substituem a apresentação dos padrões mantendo seus IDs; as opções pessoais se somam às globais. Documentos de opções são arquivados em vez de excluídos.

Para ampliar o catálogo, adicione uma imagem em `public/covers` e uma entrada em `src/data/catalog.json`, seguindo o formato existente. As capas e nomes são de seus respectivos titulares. Os links oficiais de origem estão em `sourceUrl` em cada entrada do catálogo.

Perfil: `users/{uid}/profile/main`, com `displayName`, `photoData` e `updatedAt`. Um administrador continua sem acesso ao perfil ou à biblioteca de outras contas pelo cliente.

## 5. Testes e versão de produção

```bash
# Testar validação, reordenação e os fluxos da biblioteca local
npm test

# Gerar os arquivos prontos em dist/
npm run build

# Conferir essa versão localmente
npm run preview
```

O Firebase usa as variáveis presentes no momento da compilação. Depois de alterar `.env`, gere `dist/` novamente caso queira usar a versão de produção.

### Testar as regras sem usar seu banco real

Com Java 17 ou mais recente instalado:

```bash
npm run test:rules
```

Esse comando baixa a CLI de testes e inicia um emulador para o projeto fictício `demo-checkpoint`. Ele confere permissões de duas contas, bloqueio a visitantes, notas de meia estrela e validação dos documentos. Nenhum projeto real é usado. A CLI está fixada numa versão compatível com Java 17 para esse fluxo.

Os testes incluem a separação das opções pessoais, uso das globais por contas comuns, edição global exclusiva do administrador, revogação da permissão e bloqueio de promoção pelo cliente. Também conferem que arquivar opções preserva a edição dos jogos já existentes.

Para experimentar também a autenticação local com emuladores, preencha `.env` com valores de demonstração (`projectId=demo-checkpoint`, uma `apiKey` fictícia, `authDomain=demo-checkpoint.firebaseapp.com` e um `appId` fictício), mude `VITE_USE_FIREBASE_EMULATORS=true` e execute:

```bash
npx firebase-tools@14.22.0 emulators:start --only auth,firestore --project demo-checkpoint
```

Em outro terminal, inicie `npm run dev`. Essa opção é para abrir no próprio computador: os serviços usam `127.0.0.1`. Para o seu Firebase real, volte `VITE_USE_FIREBASE_EMULATORS` para `false` e restaure os valores do app Web.

## Problemas comuns

### Avisos durante `npm install`

Desde a versão 1.1.1, o projeto fixa `@grpc/grpc-js` em `1.14.5` pelo campo `overrides`, corrigindo os alertas conhecidos dessa dependência do Firebase. Para aplicar a mesma correção numa cópia anterior, execute dentro de `checkpoint`:

```powershell
npm pkg set "overrides.@grpc/grpc-js=1.14.5"
npm install
npm audit
```

Não use `npm audit fix --force` para esses alertas: a sugestão pode trocar o Firebase por uma versão principal antiga e incompatível. A auditoria considera os avisos disponíveis no momento e deve ser repetida ao atualizar dependências.

Se aparecer `npm warn allow-scripts`, a versão do npm que imprime esse aviso ainda executa os scripts por padrão; o aviso indica que a revisão não foi registrada. Você pode iniciar o site com `npm run dev`. Para consultar os scripts pendentes sem alterar o projeto, use `npm approve-scripts --allow-scripts-pending` nas versões do npm que oferecem esse comando.

| Problema | Como resolver |
| --- | --- |
| `npm` não é reconhecido | Instale o Node.js e reabra o VS Code |
| Erro de versão do Node | Use Node 22.12 ou superior |
| Contas continuam desativadas | Confira os quatro campos obrigatórios no `.env` e reinicie o Vite |
| Cadastro não permitido | Ative E-mail/senha no Authentication |
| Sem permissão para carregar/salvar | Publique `firestore.rules` no mesmo projeto indicado no `.env` |
| Configurações não carregam depois de atualizar o projeto | Publique a versão nova completa de `firestore.rules` |
| Minha conta não aparece como Admin | Confira `admins/{UID}` e o campo boolean `enabled: true` no mesmo projeto |
| Capa por URL não aparece | Confira se o link abre diretamente uma imagem; alguns sites bloqueiam acesso externo |
| Dados locais sumiram ao trocar de endereço | O armazenamento local é separado por navegador e endereço; use uma conta para acessar em outros lugares |
| Meu perfil não carrega | Publique o `firestore.rules` da versão 1.2.1 e atualize a página |
| Teste das regras não inicia | Confira Java, conexão para baixar o emulador e portas 8080/4000 livres |

## Documentação usada

- [Configurar Firebase no app Web](https://firebase.google.com/docs/web/setup)
- [Autenticação por e-mail e senha](https://firebase.google.com/docs/auth/web/password-auth)
- [Gerenciar usuários e recuperar senha](https://firebase.google.com/docs/auth/web/manage-users)
- [Começar com Cloud Firestore](https://firebase.google.com/docs/firestore/quickstart)
- [Regras por usuário](https://firebase.google.com/docs/firestore/security/rules-conditions)

O projeto foi preparado para execução local. Configure seu Firebase para ativar as contas e a biblioteca na nuvem.
