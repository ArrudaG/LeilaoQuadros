import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EstadoVazio, HeroLeilao, PillStatus } from '@/components/ui/leilao-design';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';
import { atualizarStatusResgateAdmin, listarResgatesAdmin } from '../../src/auth/services/servico-admin';

function traduzirStatusResgate(status) {
  const mapa = {
    pending_address: 'Aguardando endereço',
    requested: 'Solicitado',
    confirmed: 'A caminho',
    delivered: 'Entregue',
  };

  return mapa[String(status || '').toLowerCase()] || 'Pendente';
}

function traduzirPagamento(method) {
  const mapa = {
    pix_simulado: 'PIX simulado',
    cartao_simulado: 'Cartao simulado',
    deposito_simulado: 'Deposito simulado',
  };

  return mapa[String(method || '').toLowerCase()] || 'Não informado';
}

function toneStatus(status) {
  if (status === 'delivered') {
    return 'green';
  }

  if (status === 'requested') {
    return 'amber';
  }

  return 'blue';
}

export default function AdminResgatesScreen() {
  const { token } = useAutenticacao();
  const [carregando, setCarregando] = useState(false);
  const [resgates, setResgates] = useState([]);

  const carregar = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const resultado = await listarResgatesAdmin(token);
      setResgates(resultado.redemptions || []);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Falha ao carregar resgates.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function liberarResgate(redemptionId) {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      await atualizarStatusResgateAdmin(token, redemptionId, 'confirmed');
      await carregar();
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar status do resgate.');
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
        title="Resgates"
        subtitle="Acompanhe pagamento, endereço e entrega dos itens vencidos."
        icon="shippingbox.fill"
        accent="#0f9f6e"
      />

      <View style={styles.lista}>
        {resgates.map((item, index) => (
          <CartaoLeilao key={item.id} style={styles.itemLinha} delay={index * 40}>
            <View style={styles.itemTopo}>
              <View style={styles.iconeEntrega}>
                <IconeSimbolo name="shippingbox.fill" color="#2457d6" size={24} />
              </View>
              <View style={styles.itemTituloBox}>
                <Text style={styles.itemTitulo}>{item.auctionTitle}</Text>
                <Text style={styles.itemInfo}>{item.userFirstName} {item.userLastName}</Text>
              </View>
              <PillStatus tone={toneStatus(item.status)} icon="shippingbox.fill">{traduzirStatusResgate(item.status)}</PillStatus>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoLinha}>
                <IconeSimbolo name="payments.fill" color="#0f9f6e" size={18} />
                <Text style={styles.itemInfo}>Pagamento: {traduzirPagamento(item.paymentMethod)} - {item.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}</Text>
              </View>
              <View style={styles.infoLinha}>
                <IconeSimbolo name="location.fill" color="#d99b20" size={18} />
                <Text style={styles.itemInfo}>{item.addressLine}, {item.addressNumber} - {item.city}/{item.state}</Text>
              </View>
            </View>

            {item.status === 'requested' ? (
              <Pressable style={styles.acaoLiberar} onPress={() => liberarResgate(item.id)}>
                <IconeSimbolo name="check.circle.fill" color="#fff" size={18} />
                <Text style={styles.textoAcao}>Liberar resgate</Text>
              </Pressable>
            ) : null}
          </CartaoLeilao>
        ))}

        {!resgates.length ? (
          <EstadoVazio icon="shippingbox.fill" title="Sem resgates" text="Quando um vencedor informar o endereço, a solicitação aparece aqui." />
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
  lista: {
    gap: 10,
  },
  itemLinha: {
    padding: 13,
    gap: 12,
  },
  itemTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconeEntrega: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTituloBox: {
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
    flex: 1,
  },
  infoBox: {
    backgroundColor: '#f9fbff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8dee9',
    padding: 10,
    gap: 7,
  },
  infoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  acaoLiberar: {
    backgroundColor: '#0f9f6e',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  textoAcao: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
});
