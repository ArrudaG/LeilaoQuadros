const test = require('node:test');
const assert = require('node:assert/strict');

const caminhoModuloPool = require.resolve('../src/db/pool');
const caminhoModuloServico = require.resolve('../src/services/servico-leiloes');

function limparCaches() {
  delete require.cache[caminhoModuloServico];
  delete require.cache[caminhoModuloPool];
}

function carregarServicoComQueryMock(queryMock) {
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

  return require('../src/services/servico-leiloes');
}

test.afterEach(() => {
  limparCaches();
});

test('sincronizarLeiloesPorHorario executa todas as consultas esperadas', async () => {
  const consultas = [];
  const servico = carregarServicoComQueryMock(async (sql) => {
    consultas.push(sql);
    return { rowCount: 0, rows: [] };
  });

  await servico.sincronizarLeiloesPorHorario();

  assert.equal(consultas.length, 5);
  assert.match(consultas[0], /SET status = 'active'/);
  assert.match(consultas[1], /WITH ranked AS/);
  assert.match(consultas[2], /UPDATE leilao_users u/);
  assert.match(consultas[3], /INSERT INTO leilao_wallet_transactions/);
  assert.match(consultas[4], /AND NOT EXISTS/);
});

test('sincronizarLeiloesPorHorario ignora chamada concorrente e volta a executar depois', async () => {
  let resolverPrimeiraConsulta;
  let chamadasQuery = 0;

  const servico = carregarServicoComQueryMock(async () => {
    chamadasQuery += 1;

    if (chamadasQuery === 1) {
      await new Promise((resolve) => {
        resolverPrimeiraConsulta = resolve;
      });
    }

    return { rowCount: 0, rows: [] };
  });

  const primeiraExecucao = servico.sincronizarLeiloesPorHorario();
  const segundaExecucao = servico.sincronizarLeiloesPorHorario();

  await Promise.resolve();
  assert.equal(chamadasQuery, 1);

  resolverPrimeiraConsulta();
  await Promise.all([primeiraExecucao, segundaExecucao]);

  assert.equal(chamadasQuery, 5);

  await servico.sincronizarLeiloesPorHorario();
  assert.equal(chamadasQuery, 10);
});

test('sincronizarLeiloesPorHorario libera trava mesmo quando ocorre erro', async () => {
  let chamadasQuery = 0;

  const servico = carregarServicoComQueryMock(async () => {
    chamadasQuery += 1;

    if (chamadasQuery === 3) {
      throw new Error('falha no banco');
    }

    return { rowCount: 0, rows: [] };
  });

  await assert.rejects(() => servico.sincronizarLeiloesPorHorario(), /falha no banco/);

  const chamadasAteErro = chamadasQuery;
  await servico.sincronizarLeiloesPorHorario();

  assert.equal(chamadasQuery, chamadasAteErro + 5);
});
