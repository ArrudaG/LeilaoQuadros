import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EstadoVazio, HeroLeilao, PillStatus } from '@/components/ui/leilao-design';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';
import { listarVencedoresAdmin } from '../../src/auth/services/servico-admin';

function formatarDataHora(value) {
  if (!value) {
    return '-';
  }

  const data = new Date(value);
  if (Number.isNaN(data.getTime())) {
    return '-';
  }

  return data.toLocaleString('pt-BR');
}

function formatarMoney(value) {
  return Number(value || 0).toFixed(2);
}

function traduzirPagamento(status) {
  return status === 'paid' ? 'Pago' : 'Pendente';
}

export default function AdminVencedoresScreen() {
  const { token } = useAutenticacao();
  const [carregando, setCarregando] = useState(false);
  const [vencedores, setVencedores] = useState([]);

  const carregar = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const resultado = await listarVencedoresAdmin(token);
      setVencedores(resultado.winners || []);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Falha ao carregar vencedores.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      showsVerticalScrollIndicator={false}
    >
      <HeroLeilao
        eyebrow="Admin"
        title="Vencedores"
        subtitle="Resumo dos lotes encerrados, com vencedor, lance final e pagamento."
        icon="trophy.fill"
        accent="#d99b20"
      />

      <View style={styles.lista}>
        {vencedores.map((item, index) => {
          const vencedor = item.winnerFirstName ? `${item.winnerFirstName} ${item.winnerLastName}` : 'Sem vencedor';
          const pago = item.paymentStatus === 'paid';

          return (
            <CartaoLeilao key={item.id} style={styles.itemLinha} delay={index * 40}>
              <View style={styles.itemTopo}>
                <View style={styles.iconeVencedor}>
                  <IconeSimbolo name="trophy.fill" color="#d99b20" size={25} />
                </View>
                <View style={styles.itemTituloBox}>
                  <Text style={styles.itemTitulo}>{item.title}</Text>
                  <Text style={styles.itemInfo}>Encerrado: {formatarDataHora(item.endsAt)}</Text>
                </View>
              </View>

              <View style={styles.resultadoBox}>
                <Text style={styles.label}>Vencedor</Text>
                <Text style={styles.vencedor}>{vencedor}</Text>
              </View>

              <View style={styles.rodape}>
                <View>
                  <Text style={styles.label}>Lance final</Text>
                  <Text style={styles.valor}>R$ {formatarMoney(item.winnerBid || 0)}</Text>
                </View>
                <PillStatus tone={pago ? 'green' : 'amber'} icon={pago ? 'check.circle.fill' : 'payments.fill'}>
                  {traduzirPagamento(item.paymentStatus)}
                </PillStatus>
              </View>
            </CartaoLeilao>
          );
        })}

        {!vencedores.length ? (
          <EstadoVazio icon="trophy.fill" title="Nenhum vencedor ainda" text="Quando um lote for encerrado, o resultado aparecerá aqui." />
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
  iconeVencedor: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#fff4d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTituloBox: {
    flex: 1,
  },
  itemTitulo: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '900',
  },
  itemInfo: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  resultadoBox: {
    backgroundColor: '#f9fbff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8dee9',
    padding: 11,
  },
  label: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  vencedor: {
    color: '#101828',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  valor: {
    color: '#2457d6',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 2,
  },
});
