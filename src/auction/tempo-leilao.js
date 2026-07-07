const SEGUNDO_MS = 1000;
const MINUTO_MS = 60 * SEGUNDO_MS;
const HORA_MS = 60 * MINUTO_MS;
const DIA_MS = 24 * HORA_MS;

function calcularTempoLeilao(endsAt, agoraMs = Date.now()) {
  const fimMs = new Date(endsAt).getTime();
  const agoraNormalizado = Number(agoraMs);

  if (!Number.isFinite(fimMs) || !Number.isFinite(agoraNormalizado)) {
    return {
      valido: false,
      encerrado: true,
      restanteMs: 0,
      texto: 'Tempo indisponível',
    };
  }

  const restanteMs = Math.max(0, fimMs - agoraNormalizado);

  if (restanteMs === 0) {
    return {
      valido: true,
      encerrado: true,
      restanteMs,
      texto: 'Encerrado',
    };
  }

  const totalSegundos = Math.ceil(restanteMs / SEGUNDO_MS);
  const dias = Math.floor(restanteMs / DIA_MS);
  const horas = Math.floor(restanteMs / HORA_MS);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  let texto;

  if (dias > 0) {
    texto = `${dias}d ${horas % 24}h`;
  } else if (horas > 0) {
    texto = `${horas}h ${minutos % 60}m`;
  } else {
    texto = `${minutos}m ${String(segundos).padStart(2, '0')}s`;
  }

  return {
    valido: true,
    encerrado: false,
    restanteMs,
    texto,
  };
}

module.exports = {
  calcularTempoLeilao,
};
