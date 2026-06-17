import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EstadoVazio, HeroLeilao, PillStatus } from '@/components/ui/leilao-design';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';
import { API_BASE_URL } from '../../src/auth/services/servico-api';
import { buscarDetalheLeilao, enviarLance, listarLeiloes } from '../../src/auth/services/servico-leilao';

const filtrosStatus = ['active', 'scheduled', 'closed', 'cancelled'];
const statusLabel = {
  active: 'Ativo',
  scheduled: 'Agendados',
  closed: 'Encerrados',
  cancelled: 'Cancelados',
};

function traduzirStatus(status) {
  return statusLabel[String(status || '').toLowerCase()] || 'Indefinido';
}

function montarUrlImagem(url) {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toFixed(2);
}

function formatarData(valor) {
  if (!valor) {
    return '-';
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return '-';
  }

  return data.toLocaleString('pt-BR');
}

function nomeLider(leilao) {
  return leilao?.highestBidderName || [leilao?.highestBidderFirstName, leilao?.highestBidderLastName].filter(Boolean).join(' ') || 'Sem lances';
}

function situacaoUsuario(leilao, usuarioId) {
  if (!leilao?.highestBidderUserId) {
    return 'Aberto para o primeiro lance';
  }

  if (String(leilao.highestBidderUserId) === String(usuarioId || '')) {
  return 'Você lidera este item';
  }

  return 'Você não está ganhando';
}

function tempoRestante(endsAt) {
  const fim = new Date(endsAt).getTime();
  const diff = fim - Date.now();

  if (!Number.isFinite(fim) || diff <= 0) {
    return 'Encerrando';
  }

  const minutos = Math.floor(diff / 60000);
  const segundos = Math.floor((diff % 60000) / 1000);

  if (minutos >= 60) {
    const horas = Math.floor(minutos / 60);
    return `${horas}h ${minutos % 60}m`;
  }

  return `${minutos}m ${String(segundos).padStart(2, '0')}s`;
}

export default function TelaLeiloes() {
  const { token, usuario } = useAutenticacao();
  const [statusAtivo, setStatusAtivo] = useState('active');
  const [leiloes, setLeiloes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [detalheLeilao, setDetalheLeilao] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [enviandoLance, setEnviandoLance] = useState(false);
  const [valorLance, setValorLance] = useState('');

  const carregarLeiloes = useCallback(async (status) => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const resposta = await listarLeiloes(token, status);
      setLeiloes(resposta.auctions || []);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível carregar os leilões.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarLeiloes(statusAtivo);
  }, [carregarLeiloes, statusAtivo]);

  async function abrirStory(auctionId) {
    if (!token) {
      return;
    }

    try {
      setCarregandoDetalhe(true);
      const resposta = await buscarDetalheLeilao(token, auctionId);
      setDetalheLeilao(resposta);

      const minimo = Math.max(
        Number(resposta?.auction?.currentBid || 0) + Number(resposta?.auction?.minIncrement || 0),
        Number(resposta?.auction?.startingBid || 0),
      );
      setValorLance(String(minimo.toFixed(2)));
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível abrir o detalhe do leilão.');
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  const lanceMinimo = useMemo(() => {
    if (!detalheLeilao?.auction) {
      return 0;
    }

    const atual = Number(detalheLeilao.auction.currentBid || 0);
    const incremento = Number(detalheLeilao.auction.minIncrement || 0);
    const inicial = Number(detalheLeilao.auction.startingBid || 0);
    return Math.max(atual + incremento, inicial);
  }, [detalheLeilao]);

  const usuarioAtualLidera = useMemo(() => {
    const liderId = detalheLeilao?.auction?.highestBidderUserId;
    return Boolean(liderId) && String(liderId) === String(usuario?.id || '');
  }, [detalheLeilao?.auction?.highestBidderUserId, usuario?.id]);

  const podeLancar = useMemo(() => {
    if (!detalheLeilao?.auction) {
      return false;
    }

    const leilao = detalheLeilao.auction;
    const agora = Date.now();
    const inicio = new Date(leilao.startsAt).getTime();
    const fim = new Date(leilao.endsAt).getTime();
    return leilao.status === 'active' && agora >= inicio && agora < fim && !usuarioAtualLidera;
  }, [detalheLeilao, usuarioAtualLidera]);

  async function confirmarLance() {
    if (!token || !detalheLeilao?.auction) {
      return;
    }

    const amount = Number(valorLance);

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Lance inválido', 'Informe um valor válido.');
      return;
    }

    if (amount < lanceMinimo) {
      Alert.alert('Lance inválido', `O valor mínimo para esse leilão é R$ ${lanceMinimo.toFixed(2)}.`);
      return;
    }

    if (usuarioAtualLidera) {
      Alert.alert('Aguarde outro lance', 'Você já tem o maior lance neste leilão.');
      return;
    }

    try {
      setEnviandoLance(true);
      const resposta = await enviarLance(token, detalheLeilao.auction.id, amount);
      const auctionAtualizado = resposta.auction;

      setLeiloes((anterior) => anterior.map((item) => (item.id === auctionAtualizado.id ? { ...item, ...auctionAtualizado } : item)));
      await abrirStory(auctionAtualizado.id);
      Alert.alert('Sucesso', 'Lance enviado com sucesso.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível enviar o lance.');
    } finally {
      setEnviandoLance(false);
    }
  }

  function renderLeilao({ item }) {
    const imagem = montarUrlImagem(item.mediaUrl);
    const situacao = situacaoUsuario(item, usuario?.id);
    const perdendo = situacao.includes('nao');

    return (
      <CartaoLeilao style={styles.card} delay={40}>
        <Pressable style={styles.cardPress} onPress={() => abrirStory(item.id)}>
        {imagem ? <Image source={{ uri: imagem }} style={styles.cardImagem} /> : <View style={[styles.cardImagem, styles.semImagem]} />}

        <View style={styles.cardTexto}>
          <View style={styles.cardCabecalho}>
            <Text style={styles.cardTitulo} numberOfLines={1}>{item.title}</Text>
            <PillStatus tone={item.status === 'active' ? 'blue' : 'dark'}>{traduzirStatus(item.status)}</PillStatus>
          </View>

          <Text style={styles.valorAtual}>R$ {formatarMoeda(item.currentBid)}</Text>
          <Text style={styles.cardMeta}>Vencedor momentâneo: {nomeLider(item)}</Text>

          <View style={styles.cardRodape}>
            <Text style={[styles.situacao, perdendo ? styles.situacaoPerdendo : styles.situacaoOk]}>{situacao}</Text>
            <Text style={styles.tempo}>{item.status === 'active' ? tempoRestante(item.endsAt) : formatarData(item.endsAt)}</Text>
          </View>
        </View>
        </Pressable>
      </CartaoLeilao>
    );
  }

  return (
    <View style={styles.tela}>
      <View style={styles.topo}>
        <HeroLeilao
          eyebrow="Sala de disputa"
          title="Leilões"
          subtitle="Filtre por status, abra o item e acompanhe os lances recentes antes de ofertar."
          icon="gavel.fill"
          accent="#2457d6"
        />
      </View>

      <View style={styles.filtros}>
        {filtrosStatus.map((status) => (
          <Pressable
            key={status}
            style={[styles.filtro, statusAtivo === status ? styles.filtroAtivo : null]}
            onPress={() => setStatusAtivo(status)}
          >
            <Text style={[styles.filtroTexto, statusAtivo === status ? styles.filtroTextoAtivo : null]}>{traduzirStatus(status)}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={leiloes}
        keyExtractor={(item) => item.id}
        renderItem={renderLeilao}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={() => carregarLeiloes(statusAtivo)} />}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={<EstadoVazio icon="timer" title="Nada por aqui" text="Não há leilões nesta categoria." />}
      />

      <Modal
        visible={Boolean(detalheLeilao)}
        animationType="slide"
        transparent
        onRequestClose={() => setDetalheLeilao(null)}
      >
        <View style={styles.storyOverlay}>
          <View style={styles.storyCard}>
            {carregandoDetalhe ? (
              <Text style={styles.storyTitulo}>Carregando...</Text>
            ) : (
              <>
                {detalheLeilao?.auction?.mediaUrl ? (
                  <ImageBackground source={{ uri: montarUrlImagem(detalheLeilao.auction.mediaUrl) }} style={styles.storyImagem}>
                    <View style={styles.storyEscuro} />
                    <Text style={styles.storyTitulo}>{detalheLeilao?.auction?.title}</Text>
                  </ImageBackground>
                ) : (
                  <View style={[styles.storyImagem, styles.semImagem]}>
                    <Text style={styles.storyTitulo}>{detalheLeilao?.auction?.title}</Text>
                  </View>
                )}

                <View style={styles.painelLider}>
                  <View>
                    <Text style={styles.painelLabel}>Vencedor momentâneo</Text>
                    <Text style={styles.painelNome}>{nomeLider(detalheLeilao?.auction)}</Text>
                  </View>
                  <Text style={styles.painelValor}>R$ {formatarMoeda(detalheLeilao?.auction?.currentBid)}</Text>
                </View>

                <View style={styles.infoGrade}>
                  <Text style={styles.storyInfo}>Status: {traduzirStatus(detalheLeilao?.auction?.status)}</Text>
                  <Text style={styles.storyInfo}>Mínimo: R$ {formatarMoeda(lanceMinimo)}</Text>
                  <Text style={styles.storyInfo}>Início: {formatarData(detalheLeilao?.auction?.startsAt)}</Text>
                  <Text style={styles.storyInfo}>Fim: {formatarData(detalheLeilao?.auction?.endsAt)}</Text>
                </View>

                <View style={styles.lancesRecentes}>
                  <Text style={styles.lancesTitulo}>Últimos lances</Text>
                  {(detalheLeilao?.recentBids || []).slice(0, 4).map((bid) => (
                    <View key={bid.id} style={styles.lanceLinha}>
                      <Text style={styles.lanceNome}>{[bid.firstName, bid.lastName].filter(Boolean).join(' ') || 'Participante'}</Text>
                      <Text style={styles.lanceValor}>R$ {formatarMoeda(bid.amount)}</Text>
                    </View>
                  ))}
                  {!detalheLeilao?.recentBids?.length ? <Text style={styles.lanceVazio}>Ainda não houve lances.</Text> : null}
                </View>

                <TextInput
                  style={styles.inputLance}
                  value={valorLance}
                  onChangeText={setValorLance}
                  keyboardType="decimal-pad"
                  placeholder="Digite seu valor de lance"
                  placeholderTextColor="#94a3b8"
                />

                <View style={styles.linhaBotoes}>
                  <Pressable
                    style={[styles.botaoLance, !podeLancar ? styles.botaoDesabilitado : null]}
                    disabled={!podeLancar || enviandoLance}
                    onPress={confirmarLance}
                  >
                    <IconeSimbolo name="gavel.fill" color="#fff" size={18} />
                    <Text style={styles.textoBotao}>{enviandoLance ? 'Enviando...' : 'Dar lance'}</Text>
                  </Pressable>

                  <Pressable style={styles.botaoFechar} onPress={() => setDetalheLeilao(null)}>
                    <IconeSimbolo name="xmark" color="#fff" size={18} />
                  </Pressable>
                </View>

                {!podeLancar ? (
                  <Text style={styles.aviso}>
                    {usuarioAtualLidera ? 'Você já lidera este leilão. Aguarde outro participante.' : 'Esse leilão não está apto para receber lances agora.'}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  topo: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  titulo: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitulo: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 3,
  },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  filtro: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d8dee9',
  },
  filtroAtivo: {
    backgroundColor: '#0b1020',
    borderColor: '#0b1020',
  },
  filtroTexto: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 12,
  },
  filtroTextoAtivo: {
    color: '#fff',
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    overflow: 'hidden',
  },
  cardPress: {
    overflow: 'hidden',
  },
  cardImagem: {
    width: '100%',
    height: 190,
    backgroundColor: '#d8dee9',
  },
  semImagem: {
    backgroundColor: '#cbd5e1',
  },
  cardTexto: {
    padding: 14,
    gap: 9,
  },
  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitulo: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
    flex: 1,
  },
  statusPill: {
    color: '#075985',
    backgroundColor: '#e0f2fe',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '900',
  },
  valorAtual: {
    color: '#2457d6',
    fontSize: 25,
    fontWeight: '900',
  },
  cardMeta: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  cardRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  situacao: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '900',
  },
  situacaoOk: {
    color: '#047857',
    backgroundColor: '#dff7ea',
  },
  situacaoPerdendo: {
    color: '#b45309',
    backgroundColor: '#fff4d6',
  },
  tempo: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  vazio: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 24,
  },
  storyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,10,24,0.88)',
    justifyContent: 'flex-end',
  },
  storyCard: {
    backgroundColor: '#0b1020',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
    padding: 14,
    gap: 10,
    maxHeight: '94%',
  },
  storyImagem: {
    height: 250,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: '#334155',
  },
  storyEscuro: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.45)',
  },
  storyTitulo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    zIndex: 1,
  },
  painelLider: {
    backgroundColor: '#121a2f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  painelLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  painelNome: {
    color: '#f8fafc',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 3,
  },
  painelValor: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 18,
    alignSelf: 'center',
  },
  infoGrade: {
    gap: 3,
  },
  storyInfo: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  lancesRecentes: {
    backgroundColor: '#121a2f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    gap: 6,
  },
  lancesTitulo: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  lanceLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  lanceNome: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  lanceValor: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
  },
  lanceVazio: {
    color: '#94a3b8',
    fontSize: 12,
  },
  inputLance: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#f8fafc',
    backgroundColor: '#121a2f',
  },
  linhaBotoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoLance: {
    flex: 1,
    backgroundColor: '#2457d6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  botaoFechar: {
    width: 48,
    backgroundColor: '#475569',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  aviso: {
    color: '#fbbf24',
    fontSize: 12,
    marginTop: 2,
  },
});
