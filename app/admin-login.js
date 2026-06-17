import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EntradaAnimada, MarcaLeilao } from '@/components/ui/leilao-design';
import { BotaoAutenticacao } from '../src/auth/components/botao-autenticacao';
import { EntradaAutenticacao } from '../src/auth/components/entrada-autenticacao';
import { useAutenticacao } from '../src/auth/context/contexto-autenticacao';

export default function TelaLoginAdmin() {
  const { fazerLoginAdmin, usuario, ehAdmin } = useAutenticacao();
  const [adminId, setAdminId] = useState('admin');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (usuario && ehAdmin) {
      router.replace('/admin/resumo');
    }
  }, [usuario, ehAdmin]);

  async function entrarAdmin() {
    try {
      setCarregando(true);
      await fazerLoginAdmin({ adminId, password: senha });
      router.replace('/admin/resumo');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível entrar como administrador.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAwareScrollView contentContainerStyle={styles.conteudo} enableOnAndroid keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <EntradaAnimada style={styles.painel}>
          <View style={styles.painelTopo}>
            <MarcaLeilao claro compact />
            <View style={styles.seloRestrito}>
              <IconeSimbolo name="shield.fill" size={16} color="#fff" />
              <Text style={styles.seloRestritoTexto}>restrito</Text>
            </View>
          </View>

          <View style={styles.terminalBox}>
            <View style={styles.terminalIcone}>
              <IconeSimbolo name="chart.bar.fill" size={25} color="#2457d6" />
            </View>
            <View style={styles.terminalLinhas}>
              <View style={styles.linhaTerminalLonga} />
              <View style={styles.linhaTerminalMedia} />
              <View style={styles.linhaTerminalCurta} />
            </View>
          </View>

          <Text style={styles.titulo}>Central de operação</Text>
          <Text style={styles.subtitulo}>Acesse o painel para criar lotes, acompanhar líderes, encerrar disputas e liberar entregas.</Text>

          <View style={styles.metricasAdmin}>
            <View style={styles.metricaAdmin}>
              <Text style={styles.metricaNumero}>24h</Text>
              <Text style={styles.metricaLabel}>controle</Text>
            </View>
            <View style={styles.metricaAdmin}>
              <Text style={styles.metricaNumero}>100%</Text>
              <Text style={styles.metricaLabel}>rastreável</Text>
            </View>
          </View>
        </EntradaAnimada>

        <CartaoLeilao style={styles.card} delay={120}>
          <View style={styles.formCabecalho}>
            <View style={styles.formIcone}>
              <IconeSimbolo name="shield.fill" size={22} color="#2457d6" />
            </View>
            <View>
              <Text style={styles.formTitulo}>Entrar como admin</Text>
              <Text style={styles.formSubtitulo}>Use as credenciais do painel.</Text>
            </View>
          </View>

          <EntradaAutenticacao label="ID Admin" value={adminId} onChangeText={setAdminId} placeholder="admin" autoCapitalize="none" />
          <EntradaAutenticacao label="Senha" value={senha} onChangeText={setSenha} placeholder="Senha do admin" secureTextEntry />

          <BotaoAutenticacao title="Abrir painel" onPress={entrarAdmin} loading={carregando} />
          <BotaoAutenticacao title="Voltar ao login do usuário" onPress={() => router.replace('/login')} variant="secondary" />
        </CartaoLeilao>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  conteudo: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
    justifyContent: 'center',
    gap: 14,
  },
  painel: {
    backgroundColor: '#0b1020',
    borderRadius: 8,
    padding: 18,
    gap: 15,
    borderWidth: 1,
    borderColor: '#26344f',
  },
  painelTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  seloRestrito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2457d6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  seloRestritoTexto: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  terminalBox: {
    backgroundColor: '#151f35',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2f3d57',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  terminalIcone: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminalLinhas: {
    flex: 1,
    gap: 7,
  },
  linhaTerminalLonga: {
    width: '88%',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d8e5ff',
  },
  linhaTerminalMedia: {
    width: '68%',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#8fb3ff',
  },
  linhaTerminalCurta: {
    width: '44%',
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d99b20',
  },
  titulo: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '900',
  },
  subtitulo: {
    color: '#c9d4e8',
    fontSize: 14,
    lineHeight: 20,
  },
  metricasAdmin: {
    flexDirection: 'row',
    gap: 10,
  },
  metricaAdmin: {
    flex: 1,
    backgroundColor: '#121a2f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2f3d57',
    padding: 10,
  },
  metricaNumero: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  metricaLabel: {
    color: '#9fb0cc',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  card: {
    padding: 18,
  },
  formCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  formIcone: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitulo: {
    color: '#101828',
    fontSize: 22,
    fontWeight: '900',
  },
  formSubtitulo: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
