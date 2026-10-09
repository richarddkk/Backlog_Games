# Atualizar seu Checkpoint publicado para 1.3.0

O ZIP contém o projeto completo. Preserve sua pasta atual como backup.
Não recrie o Firebase, as contas, os jogos ou o documento admins/{UID}.

## 1. Publicar as regras antes da atualização

Abra o arquivo firestore.rules deste ZIP, na pasta checkpoint, junto do
package.json. Ele é diferente de tests/firestore.rules.test.js.

No Firebase do seu site, abra Firestore Database → Regras. Substitua o texto
por todo o conteúdo desse firestore.rules e clique em Publicar.

As novas regras continuam compatíveis com seus jogos e acrescentam
atividades e amizades. Os pedidos pendentes não liberam acesso; só o
destinatário aceita. Amigos aceitos podem ler, mas não editar, a coleção.

## 2. Copiar os arquivos para seu repositório local

Dentro do ZIP existe a pasta checkpoint. Copie o CONTEÚDO dela sobre a
pasta do seu projeto existente, aquela que contém package.json.
Aceite substituir os arquivos do projeto. Isso inclui src, tests,
package.json, package-lock.json, firestore.rules, README.md e os guias.

Mantenha seu .env preenchido, a pasta .git e suas configurações de publicação.
O ZIP não contém .env, .git, node_modules ou dist. Não copie a pasta checkpoint
inteira para dentro de outra checkpoint; copie o conteúdo para o local correto.

A pasta .github incluída usa a mesma publicação entregue anteriormente.
Se o seu .github/workflows/deploy.yml já funciona, mantenha o existente.
Se não tiver o workflow, coloque .github na raiz do repositório, exatamente
em .github/workflows/deploy.yml. Se o repositório contém a pasta checkpoint,
a pasta .github deve ficar ao lado de checkpoint, não dentro dela.

## 3. Instalar e conferir localmente

No terminal da pasta que contém package.json:

```bash
npm install
npm test
npm run dev
```

Confira Biblioteca, Atividades e Amigos. Entre na conta e adicione um jogo
ou mude sua lista para conferir o registro. Um jogo platinado antes da
atualização não recebe uma data inventada; a próxima mudança gera o evento.

Para testar a página 404 local, abra http://localhost:5173/#/nao-existe.

## 4. Enviar ao GitHub

Depois de conferir, encerre o Vite com Ctrl + C e execute no repositório:

```bash
git add .
git status
```

Confira que .env, node_modules e dist não estão preparados para envio.

```bash
git commit -m "Adiciona atividades, amigos e página 404"
git push
```

Seu workflow atual Publicar Checkpoint fará o build e publicará automaticamente.
Não precisa recadastrar os seis secrets Firebase ou alterar o endereço do site.
Em Actions, aguarde build e deploy verdes. Abra o site e use Ctrl + F5.

## 5. Links do seu site

- Biblioteca: https://richarddkk.github.io/Backlog_Games/#/
- Atividades: https://richarddkk.github.io/Backlog_Games/#/atividades
- Amigos: https://richarddkk.github.io/Backlog_Games/#/amigos
- Teste 404: https://richarddkk.github.io/Backlog_Games/#/nao-existe

As rotas usam HashRouter para funcionar no Pages sem redirecionamento.
AppLayout mantém o menu e o cabeçalho; as páginas entram em Outlet.

## 6. Adicionar um amigo

As duas pessoas devem criar ou acessar suas próprias contas.
Em Amigos, copie Seu código de amigo e compartilhe com a outra pessoa.
Ela cola o código em Adicionar amigo e clica em Enviar pedido.
Você verá o pedido recebido e poderá aceitar ou recusar.
Depois de aceitar, use Ver biblioteca ou Atividades → Amigos.

Ao aceitar a amizade, vocês compartilham nome, foto, jogos, avaliações,
listas/gêneros pessoais e histórico. Só o dono edita seus documentos.
Remover amigo pede confirmação e revoga o acesso pelo site; conteúdo que
já foi visto ou copiado não pode ser recolhido.

## Requisitos de React

| Requisito | Implementação |
| --- | --- |
| Componentes, props e children | Componentes de jogo, perfil e Modal |
| useState e useEffect | Layout, páginas e hooks |
| Condicionais, map e key | Jogos, atividades, amigos e estados vazios |
| React Router DOM, ao menos duas páginas | Biblioteca, Atividades e Amigos |
| Outlet | src/layouts/AppLayout.jsx |
| Página 404 | src/pages/NotFoundPage.jsx e rota * |
| Pelo menos 3 testes unitários | tests/model.test.js e tests/activity.test.js |

## Se aparecer Sem permissão

Publique as regras novas no MESMO projeto usado pelos secrets do GitHub
e pelo .env local. Atualize a página. Não abra o banco em modo público.

O modo local continua separado da conta e do endereço publicado. Os jogos
que já estavam no Firebase e a permissão de administrador são preservados.
