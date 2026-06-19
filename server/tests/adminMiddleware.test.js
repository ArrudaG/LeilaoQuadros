const test = require('node:test');
const assert = require('node:assert/strict');

const caminhoModuloPool = require.resolve('../src/db/pool');
const caminhoModuloMiddleware = require.resolve('../src/middleware/adminMiddleware');

function limparCaches() {
  delete require.cache[caminhoModuloMiddleware];
  delete require.cache[caminhoModuloPool];
}

function carregarMiddlewareComPoolMock(queryMock) {
  limparCaches();

  require.cache[caminhoModuloPool] = {
    id: caminhoModuloPool,
    filename: caminhoModuloPool,
    loaded: true,
    exports: {
      pool: {
        query: queryMock,
      },
    },
  };

  return require('../src/middleware/adminMiddleware');
}

function criarRespostaMock() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      return this;
    },
  };
}

test.afterEach(() => {
  limparCaches();
});

test('adminMiddleware retorna 401 quando token nao possui sub', async () => {
  const { adminMiddleware } = carregarMiddlewareComPoolMock(async () => {
    throw new Error('nao deveria chamar o banco');
  });

  const req = { user: {} };
  const res = criarRespostaMock();
  let nextChamado = false;

  await adminMiddleware(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { message: 'Token inválido.' });
});

test('adminMiddleware passa direto quando role ja e admin', async () => {
  const { adminMiddleware } = carregarMiddlewareComPoolMock(async () => {
    throw new Error('nao deveria chamar o banco');
  });

  const req = { user: { sub: 1, role: 'admin' } };
  const res = criarRespostaMock();
  let nextChamado = false;

  await adminMiddleware(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, true);
  assert.equal(res.statusCode, null);
});

test('adminMiddleware promove usuario para admin quando banco confirma permissao', async () => {
  const { adminMiddleware } = carregarMiddlewareComPoolMock(async () => ({
    rowCount: 1,
    rows: [{ user_role: 'admin' }],
  }));

  const req = { user: { sub: 7, role: 'user' } };
  const res = criarRespostaMock();
  let nextChamado = false;

  await adminMiddleware(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, true);
  assert.equal(req.user.role, 'admin');
});

test('adminMiddleware retorna 401 quando usuario nao existe', async () => {
  const { adminMiddleware } = carregarMiddlewareComPoolMock(async () => ({
    rowCount: 0,
    rows: [],
  }));

  const req = { user: { sub: 99, role: 'user' } };
  const res = criarRespostaMock();
  let nextChamado = false;

  await adminMiddleware(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { message: 'Usuário não encontrado.' });
});

test('adminMiddleware retorna 403 quando usuario nao e admin', async () => {
  const { adminMiddleware } = carregarMiddlewareComPoolMock(async () => ({
    rowCount: 1,
    rows: [{ user_role: 'user' }],
  }));

  const req = { user: { sub: 11, role: 'user' } };
  const res = criarRespostaMock();
  let nextChamado = false;

  await adminMiddleware(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.payload, { message: 'Acesso restrito ao administrador.' });
});

test('adminMiddleware retorna 500 quando ocorre erro no banco', async () => {
  const { adminMiddleware } = carregarMiddlewareComPoolMock(async () => {
    throw new Error('erro de conexao');
  });

  const req = { user: { sub: 55, role: 'user' } };
  const res = criarRespostaMock();
  let nextChamado = false;

  await adminMiddleware(req, res, () => {
    nextChamado = true;
  });

  assert.equal(nextChamado, false);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.payload, { message: 'Erro ao validar permissões de administrador.' });
});
