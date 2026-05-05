============================================================
   LORETTO SCARPA · CENTRAL DE DASHBOARDS
   v2.0 — Firebase + PWA
============================================================

Hub central com sincronização em tempo real via Firebase.
Edição de URLs feita pelo admin reflete instantaneamente em
todos os dispositivos da equipe.

------------------------------------------------------------
ARQUIVOS DESTE PACOTE
------------------------------------------------------------

  index.html          → Hub principal (vai como index.html no GitHub)
  manifest.json       → Configuração do PWA (instalável como app)
  sw.js               → Service Worker (cache + atualização)
  firestore.rules     → Regras de segurança (colar no Firebase Console)
  README.txt          → Este arquivo (não precisa subir no GitHub)

------------------------------------------------------------
JÁ ESTÁ CONFIGURADO
------------------------------------------------------------

  ✓ Firebase config do projeto loretto-scarpa-l-icr embutida
  ✓ Email admin: lorettoscarpa@gmail.com
  ✓ Estrutura de dados: collection "hub_config", documento "links"
  ✓ Sync em tempo real (onSnapshot do Firestore)
  ✓ Persistência offline ativada
  ✓ Camada extra de segurança: só o email admin acessa

------------------------------------------------------------
VOCÊ PRECISA FAZER 3 COISAS
------------------------------------------------------------

### PASSO 1 · Cadastrar o email no Firebase Authentication

  1. Console Firebase → Authentication → aba "Users"
  2. Verifique se "lorettoscarpa@gmail.com" já existe
  3. Se NÃO existir:
     - Clique "Add user"
     - Email: lorettoscarpa@gmail.com
     - Senha: defina uma senha forte (NÃO use a mesma de
       outros serviços, e prefira algo que NUNCA tenha usado)
     - Add user
  4. Se JÁ existir e você não lembra a senha:
     - Selecione o usuário → "Reset password" → segue email

  IMPORTANTE: A senha vive APENAS no Firebase, nunca no código.
  Não compartilhe a senha com ninguém, nem por print/chat.

### PASSO 2 · Aplicar regras de segurança no Firestore

  1. Console Firebase → Firestore Database → aba "Rules"
  2. Você verá as regras atuais (provavelmente do ICR)
  3. NÃO apague o que já existe
  4. Abra o arquivo "firestore.rules" deste pacote
  5. Copie SOMENTE o bloco "match /hub_config/..." (linhas 14-20):

     match /hub_config/{document} {
       allow read: if true;
       allow write: if request.auth != null
                 && request.auth.token.email == "lorettoscarpa@gmail.com";
     }

  6. Cole esse bloco DENTRO do match já existente, junto com
     as regras do ICR (que ficam intocadas)
  7. Clique em "Publicar" / "Publish"

### PASSO 3 · Subir 5 arquivos no GitHub Pages

  Estrutura final:

    lorettoscarpa-icr.github.io/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── ASSINATURA_HORIZONTAL_10.png
    └── SI_MBOLO_10.png

  Os arquivos firestore.rules e README.txt NÃO precisam ir
  para o GitHub — são só para você.

------------------------------------------------------------
COMO TESTAR APÓS PUBLICAR
------------------------------------------------------------

  1. Abra https://lorettoscarpa-icr.github.io/

  2. Os 3 cards online (Metas, ICR, Suprimentos) devem
     funcionar normalmente.

  3. Clique no botão "Admin" no topo direito.
     → Modal de login deve abrir.

  4. Entre com:
     Email: lorettoscarpa@gmail.com
     Senha: a que você cadastrou no Passo 1

  5. Após login, modal de edição abre com os 6 cards listados.

  6. Edite uma URL → "Salvar Tudo" → toast "Salvo" aparece.

  7. TESTE DA SINCRONIZAÇÃO:
     - Abra o site em outro navegador (ou aba anônima)
     - SEM fazer login, a URL editada já deve aparecer no card
     - Se isso funcionar, a sync está OK ✓

------------------------------------------------------------
COMO INSTALAR COMO APP NO CELULAR
------------------------------------------------------------

  Android (Chrome):
    - Abre o site
    - Botão "Instalar app" aparece dourado no header
    - Toca → confirma → ícone aparece na tela inicial

  iPhone (Safari):
    - Abre o site no Safari
    - Botão de Compartilhar (quadrado com seta para cima)
    - "Adicionar à Tela de Início"
    - Confirma → ícone "Loretto" aparece junto com outros apps

  Yuri e Larissa: instalam uma vez e abrem direto pelo ícone.
  NÃO precisam de login (só leitura, não edição).

------------------------------------------------------------
SE ALGO DER ERRADO
------------------------------------------------------------

ERRO: "Sem conexão"
  → Verifique a internet. Firebase precisa de net pra logar.

ERRO: "Usuário não encontrado"
  → O email não está cadastrado. Volte ao Passo 1.

ERRO: "Senha incorreta"
  → Errou a senha. Use "Reset password" no Firebase Console.

ERRO: "Esta conta não tem permissão de admin"
  → O email logado não bate com ADMIN_EMAIL no código.
    Confirme que está logando com lorettoscarpa@gmail.com.

ERRO: URLs não atualizam para a equipe
  → Confirme que as regras Firestore (Passo 2) foram publicadas.
  → Abra Console do navegador (F12) e veja erros vermelhos.

ERRO: "Missing or insufficient permissions"
  → As regras do Firestore não foram aplicadas, ou aplicadas
    com email diferente. Reveja o Passo 2.

ERRO: Aba do navegador trava após salvar
  → Bumpe a versão do CACHE no sw.js (linha 4) — ex: trocar
    'loretto-central-v5' para 'v6' — e dê push no GitHub.

------------------------------------------------------------
MANUTENÇÃO FUTURA
------------------------------------------------------------

TROCAR A SENHA DE LOGIN
  Firebase Console → Authentication → Users → Reset password.
  Não toque no código.

TROCAR O EMAIL ADMIN
  Mude em DOIS lugares:
    1) index.html → linha 72:
       const ADMIN_EMAIL = "novo@email.com";
    2) Regras Firestore (Console):
       allow write: ... == "novo@email.com";
  Garanta que o novo email exista em Authentication > Users.

DAR PERMISSÃO PRA OUTRA PESSOA EDITAR
  Não suportado nesta versão. Me chame que eu adapto o código
  e as regras pra aceitar uma lista de emails autorizados.

VER OS DADOS NO FIRESTORE DIRETAMENTE
  Console Firebase → Firestore Database → tab "Data"
  → Collection: hub_config
  → Document: links
  Você pode editar campos diretamente lá (atalho), mas o
  recomendado é usar o modo Admin do hub.

ATUALIZAR ALGO NO VISUAL DO HUB
  Mexe no index.html, faz commit e push pro GitHub.
  Bumpe a versão do CACHE no sw.js para forçar atualização
  nos celulares já instalados (senão pegam versão antiga
  por algumas horas).

------------------------------------------------------------
SOBRE SEGURANÇA
------------------------------------------------------------

  → A apiKey do Firebase no código É PÚBLICA POR DESIGN.
    Não é uma senha. Ela só identifica o projeto.
    A segurança real vem das REGRAS do Firestore.

  → A senha do admin NUNCA está no código.
    Vive apenas no Firebase Authentication.

  → Mesmo se alguém abrir DevTools e ver todo o código,
    não consegue editar URLs sem o login + senha do Firebase
    + email autorizado nas regras.

  → As 3 camadas de proteção:
    1) Firebase Auth: precisa ter conta + senha válida
    2) Verificação no JS: email logado tem que ser ADMIN_EMAIL
    3) Regras Firestore: só esse email tem permissão de escrita

============================================================
