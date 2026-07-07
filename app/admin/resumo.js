import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';
import { listarLeiloesAdmin, listarResgatesAdmin, listarVencedoresAdmin } from '../../src/auth/services/servico-admin';

export default function AdminResumoScreen() {
  const { token, sair } = useAutenticacao();
  const [carregando, setCarregando] = useState(false);
  const [leiloes, setLeiloes] = useState([]);
  const [vencedores, setVencedores] = useState([]);
  const [resgates, setResgates] = useState([]);

  const carregar = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const [leiloesResp, vencedoresResp, resgatesResp] = await Promise.all([
        listarLeiloesAdmin(token),
        listarVencedoresAdmin(token),
        listarResgatesAdmin(token),
      ]);
      setLeiloes(leiloesResp.auctions || []);
      setVencedores(vencedoresResp.winners || []);
      setResgates(resgatesResp.redemptions || []);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Falha ao carregar resumo do admin.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const metricas = useMemo(() => {
    const solicitados = resgates.filter((item) => item.status === 'requested').length;
    const emCaminho = resgates.filter((item) => item.status === 'confirmed').length;
    const entregues = resgates.filter((item) => item.status === 'delivered').length;

    return {
      leiloes: leiloes.length,
      vencedores: vencedores.length,
      solicitados,
      emCaminho,
      entregues,
    };
  }, [leiloes, vencedores, resgates]);

  async function sairPainelAdmin() {
    await sair();
    router.replace('/admin-login');
  }

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcone}>
          <IconeSimbolo name="shield.fill" color="#2457d6" size={28} />
        </View>
        <Text style={styles.eyebrow}>Painel administrativo</Text>
        <Text style={styles.titulo}>Painel de leilões</Text>
        <Text style={styles.subtitulo}>Controle lotes ativos, resultados e entregas em poucos toques.</Text>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <IconeSimbolo name="gavel.fill" color="#2563eb" size={23} />
          <Text style={styles.kpiLabel}>Lotes</Text>
          <Text style={styles.kpiValue}>{metricas.leiloes}</Text>
        </View>
        <View style={styles.kpiCard}>
          <IconeSimbolo name="trophy.fill" color="#16a34a" size={23} />
          <Text style={styles.kpiLabel}>Vencedores</Text>
          <Text style={styles.kpiValue}>{metricas.vencedores}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Entregas</Text>
        <View style={styles.badgesRow}>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeNumero}>{metricas.solicitados}</Text>
            <Text style={styles.badgeLabel}>Solicitados</Text>
          </View>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeNumero}>{metricas.emCaminho}</Text>
            <Text style={styles.badgeLabel}>A caminho</Text>
          </View>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeNumero}>{metricas.entregues}</Text>
            <Text style={styles.badgeLabel}>Entregues</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Atalhos</Text>
        <View style={styles.atalhosRow}>
          <Pressable style={styles.atalho} onPress={() => router.push('/admin/leiloes')}>
            <IconeSimbolo name="gavel.fill" color="#fff" size={19} />
            <Text style={styles.atalhoTexto}>Gerenciar lotes</Text>
          </Pressable>
          <Pressable style={styles.atalho} onPress={() => router.push('/admin/resgates')}>
            <IconeSimbolo name="shippingbox.fill" color="#fff" size={19} />
            <Text style={styles.atalhoTexto}>Fluxo de entregas</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.botaoSair} onPress={sairPainelAdmin}>
        <IconeSimbolo name="logout" color="#fff" size={19} />
        <Text style={styles.botaoSairTexto}>Sair da conta admin</Text>
      </Pressable>
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
    gap: 14,
    paddingTop: 18,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    minHeight: 168,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#d8dee9',
  },
  heroIcone: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  titulo: {
    color: '#101828',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitulo: {
    color: '#667085',
    marginTop: 6,
    fontSize: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8dee9',
    padding: 12,
    gap: 5,
  },
  kpiLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  kpiValue: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8dee9',
    padding: 12,
    gap: 10,
  },
  cardTitulo: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '700',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeBox: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#f3f7ff',
    borderWidth: 1,
    borderColor: '#d8e2ff',
    paddingVertical: 10,
    alignItems: 'center',
  },
  badgeNumero: {
    color: '#1d4ed8',
    fontSize: 20,
    fontWeight: '800',
  },
  badgeLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  atalhosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  atalho: {
    flex: 1,
    backgroundColor: '#2457d6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  atalhoTexto: {
    color: '#fff',
    fontWeight: '700',
  },
  botaoSair: {
    marginTop: 6,
    backgroundColor: '#b91c1c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  botaoSairTexto: {
    color: '#fff',
    fontWeight: '700',
  },
});
