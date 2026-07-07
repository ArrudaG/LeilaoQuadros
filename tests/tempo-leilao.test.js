const assert = require('node:assert/strict');
const test = require('node:test');

const { calcularTempoLeilao } = require('../src/auction/tempo-leilao');

test('formata minutos e segundos de um lote ativo', () => {
  const agora = Date.parse('2026-06-19T12:00:00.000Z');
  const fim = '2026-06-19T12:05:00.000Z';

  assert.deepEqual(calcularTempoLeilao(fim, agora), {
    valido: true,
    encerrado: false,
    restanteMs: 300000,
    texto: '5m 00s',
  });
});

test('recalcula usando a data final sem reiniciar o cronometro', () => {
  const fim = '2026-06-19T12:05:00.000Z';
  const primeiroAcesso = Date.parse('2026-06-19T12:00:00.000Z');
  const novoAcesso = Date.parse('2026-06-19T12:02:00.000Z');

  assert.equal(calcularTempoLeilao(fim, primeiroAcesso).texto, '5m 00s');
  assert.equal(calcularTempoLeilao(fim, novoAcesso).texto, '3m 00s');
});

test('marca o lote como encerrado ao chegar na data final', () => {
  const fim = '2026-06-19T12:05:00.000Z';
  const agora = Date.parse(fim);

  assert.deepEqual(calcularTempoLeilao(fim, agora), {
    valido: true,
    encerrado: true,
    restanteMs: 0,
    texto: 'Encerrado',
  });
});

test('formata duracoes maiores em horas e dias', () => {
  const agora = Date.parse('2026-06-19T12:00:00.000Z');

  assert.equal(calcularTempoLeilao('2026-06-19T14:30:00.000Z', agora).texto, '2h 30m');
  assert.equal(calcularTempoLeilao('2026-06-21T15:00:00.000Z', agora).texto, '2d 3h');
});

test('trata data final invalida sem gerar valores incorretos', () => {
  assert.deepEqual(calcularTempoLeilao('data-invalida', Date.now()), {
    valido: false,
    encerrado: true,
    restanteMs: 0,
    texto: 'Tempo indisponível',
  });
});
