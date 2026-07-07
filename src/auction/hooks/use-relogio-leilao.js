import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export function useRelogioLeilao(intervaloMs = 1000) {
  const [agoraMs, setAgoraMs] = useState(() => Date.now());

  useEffect(() => {
    let intervaloId = null;

    function atualizar() {
      setAgoraMs(Date.now());
    }

    function iniciar() {
      if (intervaloId) {
        return;
      }

      atualizar();
      intervaloId = setInterval(atualizar, intervaloMs);
    }

    function parar() {
      if (!intervaloId) {
        return;
      }

      clearInterval(intervaloId);
      intervaloId = null;
    }

    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') {
        iniciar();
      } else {
        parar();
      }
    });

    iniciar();

    return () => {
      parar();
      assinatura.remove();
    };
  }, [intervaloMs]);

  return agoraMs;
}

export function useAtualizacaoAoExpirarLeiloes(leiloes, agoraMs, atualizar) {
  const expiracoesTratadas = useRef(new Set());
  const temporizadores = useRef(new Set());
  const atualizarRef = useRef(atualizar);

  useEffect(() => {
    atualizarRef.current = atualizar;
  }, [atualizar]);

  useEffect(() => {
    const expiradosNovos = (leiloes || []).filter((item) => {
      if (item.status !== 'active' || expiracoesTratadas.current.has(item.id)) {
        return false;
      }

      const fimMs = new Date(item.endsAt).getTime();
      return Number.isFinite(fimMs) && agoraMs >= fimMs;
    });

    if (!expiradosNovos.length) {
      return;
    }

    expiradosNovos.forEach((item) => expiracoesTratadas.current.add(item.id));
    atualizarRef.current?.();

    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      atualizarRef.current?.();
    }, 11000);

    temporizadores.current.add(temporizador);
  }, [agoraMs, leiloes]);

  useEffect(
    () => () => {
      temporizadores.current.forEach((temporizador) => clearTimeout(temporizador));
      temporizadores.current.clear();
    },
    [],
  );
}
