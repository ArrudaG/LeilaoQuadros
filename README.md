# Leilao de Quadros

Projeto universitario de leilao online de quadros, com aplicativo mobile em Expo/React Native e API em Node.js/Express.

O usuario cria conta, entra nos leiloes, faz lances em tempo real e acompanha seus itens vencidos. O administrador cria e gerencia leiloes, acompanha participantes, encerra leiloes e gerencia o fluxo de resgate/entrega.

## Fluxo do sistema

1. O usuario se cadastra ou faz login com CPF e senha.
2. O app tambem pode guardar login por biometria no aparelho, quando ativado pelo usuario.
3. O administrador acessa a area admin e cria leiloes com titulo, descricao, imagem, lance inicial, incremento minimo, status e duracao.
4. Um leilao ativo pode receber lances imediatamente, sem tempo extra de espera.
5. O mesmo usuario nao pode dar dois lances seguidos no mesmo leilao.
6. O leilao encerra automaticamente pelo horario final ou manualmente pelo admin.
7. Depois de vencer, o usuario paga o item em um checkout simulado.
8. Apos o pagamento, o usuario informa o endereco de entrega e pode usar mapa/localizacao para ajudar no preenchimento.
9. O admin acompanha resgates, confirma o envio e o usuario confirma o recebimento.

O fluxo atual nao exige deposito previo em carteira. O pagamento acontece somente depois que o usuario vence um leilao.

## Tecnologias usadas

- JavaScript
  Linguagem principal do app mobile e da API.

- React Native + Expo + Expo Router
  Interface mobile, navegacao por rotas/tabs e recursos nativos como camera, galeria, biometria e localizacao.

- Node.js + Express
  Backend REST para autenticacao, leiloes, lances, pagamentos simulados e resgates.

- PostgreSQL + pg
  Persistencia de usuarios, leiloes, lances, vencedores, pagamentos e resgates.

- JWT + Zod
  Sessao/autorizacao via JWT e validacao dos payloads da API.

- Multer + Supabase Storage
  Upload e armazenamento de imagens de perfil e midias dos leiloes. Se Supabase nao estiver configurado, o backend usa armazenamento local em `server/uploads`.

## Estrutura de pastas

- `app/`
  Rotas/telas do Expo Router, incluindo login, cadastro, tabs do usuario e area admin.

- `app/(tabs)/`
  Telas principais do usuario: inicio, leiloes, conquistas, perfil e configuracoes.

- `app/admin/`
  Telas do administrador: resumo, leiloes, participantes, vencedores e resgates.

- `src/auth/`
  Contexto de autenticacao, servicos de API, storage local e componentes de login/perfil.

- `server/`
  Backend Node.js/Express.

- `server/src/routes/`
  Endpoints da API: autenticacao, leiloes e administracao.

- `server/src/db/`
  Conexao com PostgreSQL, inicializacao e schema SQL.

- `server/src/services/`
  Regras auxiliares, como agendador de leiloes e storage.

## Variaveis de ambiente

Crie um `.env` na raiz do projeto para o frontend:

```env
EXPO_PUBLIC_API_URL=http://localhost:3333
```

Para testar no celular usando ngrok, use a URL HTTPS do tunnel:

```env
EXPO_PUBLIC_API_URL=https://seu-dominio-ngrok.ngrok-free.dev
```

Crie um `server/.env` para o backend:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/database
JWT_SECRET=sua_chave_jwt
PORT=3333
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
SUPABASE_STORAGE_BUCKET=fotos
```

O login admin padrao, se nenhuma variavel for alterada, usa:

```txt
ADMIN_LOGIN_ID=admin
ADMIN_PASSWORD=adminadmin
```

Os arquivos `.env` nao devem ser enviados para o Git.

## Como rodar

Instale as dependencias do frontend:

```bash
npm install
```

Instale as dependencias do backend:

```bash
cd server
npm install
```

Inicie o backend:

```bash
cd server
npm start
```

Em outro terminal, inicie o Expo:

```bash
npm start
```

Se o Expo tentar validar dependencias online e falhar, rode:

```powershell
$env:EXPO_NO_DEPENDENCY_VALIDATION="1"
npm start
```

Para usar o app pelo celular com ngrok:

```bash
ngrok http --domain=seu-dominio-ngrok.ngrok-free.dev 3333
```

## Testes

Os testes unitarios do backend ficam em `server/tests/`.

Para rodar:

```bash
cd server
npm test
```

Tambem e possivel validar o app com:

```bash
npm run lint
```

## Integrantes

- Bruno Lourenco Neves - 202312035
- Leonardo Motta dos Santos - 202222267
- Gabriel Oliveira Arruda Rodrigues - 202311407
