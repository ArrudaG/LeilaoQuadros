import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EstadoVazio, HeroLeilao, PillStatus } from '@/components/ui/leilao-design';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';
import { listarLeiloesAdmin, listarParticipantesAdmin } from '../../src/auth/services/servico-admin';

function formatarMoney(value) {
  return Number(value || 0).toFixed(2);
}

export default function AdminParticipantesScreen() {
  const { token } = useAutenticacao();
  const params = useLocalSearchParams();
  const [carregando, setCarregando] = useState(false);
  const [leiloes, setLeiloes] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [leilaoSelecionado, setLeilaoSelecionado] = useState('');

  const carregarLeiloes = useCallback(async () => {
    if (!token) {
      return [];
    }

    const listaLeiloes = await listarLeiloesAdmin(token);
    setLeiloes(listaLeiloes.auctions || []);
    return listaLeiloes.auctions || [];
  }, [token]);

  const carregarParticipantes = useCallback(
    async (auctionId) => {
      if (!token || !auctionId) {
        setParticipantes([]);
        return;
      }

      const resultado = await listarParticipantesAdmin(token, auctionId);
      setParticipantes(resultado.participants || []);
    },
    [token],
  );

  const carregar = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const lista = await carregarLeiloes();
      const auctionIdParam = String(params.auctionId || '').trim();
      const alvo = auctionIdParam || leilaoSelecionado || (lista?.[0]?.id ? String(lista[0].id) : '');

      if (alvo) {
        setLeilaoSelecionado(alvo);
        await carregarParticipantes(alvo);
      } else {
        setParticipantes([]);
      }
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Falha ao carregar participantes.');
    } finally {
      setCarregando(false);
    }
  }, [token, carregarLeiloes, params.auctionId, leilaoSelecionado, carregarParticipantes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const nomeLeilaoSelecionado = useMemo(() => {
    const encontrado = leiloes.find((item) => String(item.id) === String(leilaoSelecionado));
    return encontrado?.title || '';
  }, [leiloes, leilaoSelecionado]);

  async function selecionarLeilao(auctionId) {
    try {
      setCarregando(true);
      setLeilaoSelecionado(auctionId);
      await carregarParticipantes(auctionId);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível listar participantes.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      showsVerticalScrollIndicator={false}
    >
      <HeroLeilao
        eyebrow="Admin"
        title="Participantes"
        subtitle="Escolha o leilão e acompanhe quem entrou na disputa, quantos lances fez e qual foi o maior valor."
        icon="person.3.fill"
        accent="#11a7c8"
      />

      <CartaoLeilao style={styles.card}>
        <Text style={styles.cardTitulo}>Selecionar leilão</Text>
        <View style={styles.chipsLinha}>
          {leiloes.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.chip, String(leilaoSelecionado) === String(item.id) ? styles.chipAtivo : null]}
              onPress={() => selecionarLeilao(String(item.id))}
            >
              <Text style={[styles.chipTexto, String(leilaoSelecionado) === String(item.id) ? styles.chipTextoAtivo : null]} numberOfLines={1}>
                {item.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </CartaoLeilao>

      <View style={styles.secaoLinha}>
        <Text style={styles.tituloLista}>{nomeLeilaoSelecionado || 'Selecione um leilão'}</Text>
        <PillStatus tone="blue" icon="person.3.fill">{participantes.length} participantes</PillStatus>
      </View>

      <View style={styles.lista}>
        {participantes.map((item, index) => (
          <CartaoLeilao key={item.id} style={styles.itemLinha} delay={index * 35}>
            <View style={styles.itemTopo}>
              <View style={styles.posicao}>
                <Text style={styles.posicaoTexto}>{index + 1}</Text>
              </View>
              <View style={styles.itemNomeBox}>
                <Text style={styles.itemTitulo}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.itemInfo}>{item.email}</Text>
              </View>
            </View>

            <View style={styles.infoGrade}>
              <View style={styles.infoPonto}>
                <IconeSimbolo name="person.crop.circle.fill" color="#667085" size={17} />
                <Text style={styles.itemInfo}>CPF: {item.cpf}</Text>
              </View>
              <View style={styles.infoPonto}>
                <IconeSimbolo name="leaderboard.fill" color="#2457d6" size={17} />
                <Text style={styles.itemInfo}>Lances: {item.bidsCount}</Text>
              </View>
              <View style={styles.infoPonto}>
                <IconeSimbolo name="payments.fill" color="#0f9f6e" size={17} />
                <Text style={styles.itemInfo}>Maior: R$ {formatarMoney(item.maxBid)}</Text>
              </View>
            </View>
          </CartaoLeilao>
        ))}

        {!participantes.length ? (
          <EstadoVazio icon="person.3.fill" title="Sem participantes" text="Nenhum participante entrou no leilão selecionado ainda." />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  conteudo: {
    padding: 16,
    paddingTop: 18,
    gap: 14,
    paddingBottom: 24,
  },
  card: {
    padding: 14,
    gap: 10,
  },
  cardTitulo: {
    color: '#101828',
    fontSize: 17,
    fontWeight: '900',
  },
  chipsLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    maxWidth: '100%',
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8dee9',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipAtivo: {
    backgroundColor: '#0b1020',
    borderColor: '#0b1020',
  },
  chipTexto: {
    color: '#344054',
    fontWeight: '900',
    fontSize: 12,
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  secaoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  tituloLista: {
    flex: 1,
    color: '#101828',
    fontSize: 19,
    fontWeight: '900',
  },
  lista: {
    gap: 10,
  },
  itemLinha: {
    padding: 12,
    gap: 10,
  },
  itemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  posicao: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f0ff',
  },
  posicaoTexto: {
    color: '#2457d6',
    fontWeight: '900',
  },
  itemNomeBox: {
    flex: 1,
  },
  itemTitulo: {
    color: '#101828',
    fontWeight: '900',
    fontSize: 15,
  },
  itemInfo: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
  },
  infoGrade: {
    gap: 6,
  },
  infoPonto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
