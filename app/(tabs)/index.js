import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import {
  CabecalhoSecao,
  CartaoLeilao,
  EstadoVazio,
  HeroLeilao,
  LeilaoCores,
  MetricaLeilao,
  PillStatus,
  TelaComFundo,
} from '@/components/ui/leilao-design';
import { useAtualizacaoAoExpirarLeiloes, useRelogioLeilao } from '../../src/auction/hooks/use-relogio-leilao';
import { calcularTempoLeilao } from '../../src/auction/tempo-leilao';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';
import { API_BASE_URL } from '../../src/auth/services/servico-api';
import { listarLeiloes } from '../../src/auth/services/servico-leilao';

function montarUrlImagem(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toFixed(2);
}

function nomeLider(leilao) {
  return leilao?.highestBidderName || [leilao?.highestBidderFirstName, leilao?.highestBidderLastName].filter(Boolean).join(' ') || 'Sem lances';
}

function textoSituacao(leilao, usuarioId) {
  if (!leilao?.highestBidderUserId) {
    return 'Aguardando primeiro lance';
  }

  if (String(leilao.highestBidderUserId) === String(usuarioId || '')) {
    return 'Você está liderando';
  }

  return 'Você não está ganhando';
}

export default function TelaInicio() {
  const { usuario, token, sair } = useAutenticacao();
  const agoraMs = useRelogioLeilao();
  const [leiloesAtivos, setLeiloesAtivos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregarPainel = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const resposta = await listarLeiloes(token, 'active');
      setLeiloesAtivos(resposta.auctions || []);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível carregar os leilões ativos.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarPainel();
  }, [carregarPainel]);

  useAtualizacaoAoExpirarLeiloes(leiloesAtivos, agoraMs, carregarPainel);

  const metricas = useMemo(() => {
    const liderando = leiloesAtivos.filter((item) => String(item.highestBidderUserId || '') === String(usuario?.id || '')).length;
    const perdendo = leiloesAtivos.filter((item) => item.highestBidderUserId && String(item.highestBidderUserId) !== String(usuario?.id || '')).length;

    return {
      ativos: leiloesAtivos.length,
      liderando,
      perdendo,
    };
  }, [leiloesAtivos, usuario?.id]);

  async function aoClicarSair() {
    try {
      await sair();
      router.replace('/login');
    } catch {
      Alert.alert('Erro', 'Não foi possível sair da conta.');
    }
  }

  return (
    <TelaComFundo
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregarPainel} />}
    >
      <HeroLeilao
        eyebrow={`Olá, ${usuario?.firstName || 'participante'}`}
        title="Sala de leilões"
        subtitle="Acompanhe os lotes ativos, veja quem está liderando e entre na disputa."
        icon="gavel.fill"
        accent={LeilaoCores.ouro}
        right={
          <Pressable style={styles.botaoIconeSair} onPress={aoClicarSair}>
            <IconeSimbolo name="logout" color="#8a5a00" size={21} />
          </Pressable>
        }
      >
        <View style={styles.heroResumo}>
          <View style={styles.heroResumoItem}>
            <Text style={styles.heroResumoValor}>{metricas.ativos}</Text>
            <Text style={styles.heroResumoLabel}>itens ativos</Text>
          </View>
          <View style={styles.heroResumoDivisor} />
          <View style={styles.heroResumoItem}>
            <Text style={styles.heroResumoValor}>{metricas.liderando}</Text>
            <Text style={styles.heroResumoLabel}>liderando</Text>
          </View>
        </View>
      </HeroLeilao>

      <View style={styles.metricas}>
        <MetricaLeilao icon="gavel.fill" value={metricas.ativos} label="ativos" color={LeilaoCores.azul} delay={80} />
        <MetricaLeilao icon="leaderboard.fill" value={metricas.liderando} label="liderando" color={LeilaoCores.verde} delay={120} />
        <MetricaLeilao icon="warning.fill" value={metricas.perdendo} label="perdendo" color={LeilaoCores.ouro} delay={160} />
      </View>

      <CabecalhoSecao
        title="Itens em disputa"
        meta="toque em um item para abrir os lances"
        action={
          <Pressable style={styles.linkIcone} onPress={() => router.push('/(tabs)/leiloes')}>
            <IconeSimbolo name="arrow.right" color="#101828" size={22} />
          </Pressable>
        }
      />

      <View style={styles.lista}>
        {leiloesAtivos.slice(0, 5).map((item, index) => {
          const imagem = montarUrlImagem(item.mediaUrl);
          const situacao = textoSituacao(item, usuario?.id);
          const perdendo = situacao.includes('nao');
          const liderando = situacao.includes('liderando');
          const tempo = calcularTempoLeilao(item.endsAt, agoraMs);

          return (
            <Pressable key={item.id} onPress={() => router.push('/(tabs)/leiloes')}>
              <CartaoLeilao style={styles.cardLeilao} delay={180 + index * 45}>
                {imagem ? (
                  <Image source={{ uri: imagem }} style={styles.cardImagem} />
                ) : (
                  <View style={[styles.cardImagem, styles.cardImagemVazia]}>
                    <IconeSimbolo name="gavel.fill" color="#8a94a6" size={30} />
                  </View>
                )}

                <View style={styles.cardCorpo}>
                  <View style={styles.cardCabecalho}>
                    <Text style={styles.cardTitulo} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.cardValor}>R$ {formatarMoeda(item.currentBid)}</Text>
                  </View>

                  <View style={styles.liderLinha}>
                    <IconeSimbolo name="leaderboard.fill" color="#2457d6" size={17} />
                    <Text style={styles.cardMeta} numberOfLines={1}>Líder atual: {nomeLider(item)}</Text>
                  </View>

                  <View style={styles.cardStatusLinha}>
                    <PillStatus tone={perdendo ? 'amber' : liderando ? 'green' : 'blue'} icon={liderando ? 'check.circle.fill' : 'timer'}>
                      {situacao}
                    </PillStatus>
                    <View style={[styles.tempoPill, tempo.encerrado ? styles.tempoPillEncerrado : null]}>
                      <IconeSimbolo name="timer" color={tempo.encerrado ? '#b42318' : '#475467'} size={15} />
                      <Text style={[styles.tempoTexto, tempo.encerrado ? styles.tempoTextoEncerrado : null]}>{tempo.texto}</Text>
                    </View>
                  </View>
                </View>
              </CartaoLeilao>
            </Pressable>
          );
        })}
      </View>

      {!leiloesAtivos.length ? (
        <EstadoVazio
          icon="timer"
          title="Nenhum lote ativo agora"
          text="Quando o administrador iniciar um lote, ele aparecerá aqui automaticamente."
        />
      ) : null}
    </TelaComFundo>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    paddingTop: 18,
    paddingBottom: 24,
  },
  botaoIconeSair: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#fff8e6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f4d88b',
  },
  heroResumo: {
    marginTop: 16,
    backgroundColor: '#fffaf0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f4d88b',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroResumoItem: {
    flex: 1,
  },
  heroResumoValor: {
    color: '#101828',
    fontSize: 23,
    fontWeight: '900',
  },
  heroResumoLabel: {
    color: '#8a5a00',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  heroResumoDivisor: {
    width: 1,
    height: 34,
    backgroundColor: '#f4d88b',
    marginHorizontal: 12,
  },
  metricas: {
    flexDirection: 'row',
    gap: 10,
  },
  linkIcone: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8dee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    gap: 12,
  },
  cardLeilao: {
    overflow: 'hidden',
  },
  cardImagem: {
    width: '100%',
    height: 178,
    backgroundColor: '#d8dee9',
  },
  cardImagemVazia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCorpo: {
    padding: 13,
    gap: 10,
  },
  cardCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitulo: {
    flex: 1,
    color: '#101828',
    fontWeight: '900',
    fontSize: 17,
    lineHeight: 21,
  },
  cardValor: {
    color: '#2457d6',
    fontSize: 20,
    fontWeight: '900',
  },
  liderLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMeta: {
    flex: 1,
    color: '#475467',
    fontSize: 12,
    fontWeight: '800',
  },
  cardStatusLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  tempoPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: '#f2f4f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tempoPillEncerrado: {
    backgroundColor: '#fee4e2',
  },
  tempoTexto: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '900',
  },
  tempoTextoEncerrado: {
    color: '#b42318',
  },
});
