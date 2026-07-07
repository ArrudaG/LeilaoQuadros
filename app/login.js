import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SplashLogo } from '@/components/splash-logo';
import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EntradaAnimada, marcaImagem } from '@/components/ui/leilao-design';
import { BotaoAutenticacao } from '@/src/auth/components/botao-autenticacao';
import { EntradaAutenticacao } from '@/src/auth/components/entrada-autenticacao';
import { useAutenticacao } from '@/src/auth/context/contexto-autenticacao';

export default function TelaLogin() {
  const { fazerLogin, entrarComBiometria, podeMostrarBiometria, usuario, carregando: carregandoSessao } = useAutenticacao();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (usuario) {
      router.replace('/(tabs)');
    }
  }, [usuario]);

  async function clicarEntrar() {
    try {
      setCarregando(true);
      const resultadoLogin = await fazerLogin({ cpf, password: senha }, false);

      if (resultadoLogin?.mensagemBiometria) {
        Alert.alert('Biometria', resultadoLogin.mensagemBiometria);
      }

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erro no login', error.message || 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  async function clicarBiometria() {
    try {
      setCarregando(true);
      await entrarComBiometria();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erro na biometria', error.message || 'Não foi possível autenticar.');
    } finally {
      setCarregando(false);
    }
  }

  if (carregandoSessao) {
    return <SplashLogo mensagem="Verificando sua sessão..." />;
  }

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.conteudo}
        enableOnAndroid
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topo}>
          <Pressable style={styles.adminChip} onPress={() => router.push('/admin-login')}>
            <IconeSimbolo name="shield.fill" size={17} color="#2457d6" />
            <Text style={styles.adminChipTexto}>Admin</Text>
          </Pressable>
        </View>

        <EntradaAnimada style={styles.apresentacao}>
          <View style={styles.apresentacaoLogoBox}>
            <Image source={marcaImagem} style={styles.apresentacaoLogo} resizeMode="cover" />
          </View>
          <Text style={styles.apresentacaoTitulo}>Leilão Mania</Text>
          <Text style={styles.apresentacaoTexto}>
            Participe de leilões de quadros, acompanhe os lances e finalize sua compra pelo app.
          </Text>
        </EntradaAnimada>

        <CartaoLeilao style={styles.formulario} delay={120}>
          <View style={styles.formTopo}>
            <View>
              <Text style={styles.formTitulo}>Entrar no leilão</Text>
              <Text style={styles.formSubtitulo}>Use seu CPF para voltar à disputa.</Text>
            </View>
            <View style={styles.formIcone}>
              <IconeSimbolo name="gavel.fill" color="#2457d6" size={23} />
            </View>
          </View>

          <EntradaAutenticacao
            label="CPF"
            value={cpf}
            onChangeText={setCpf}
            placeholder="Somente números"
            keyboardType="number-pad"
            returnKeyType="next"
          />

          <EntradaAutenticacao
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Sua senha"
            secureTextEntry
            returnKeyType="done"
          />

          <BotaoAutenticacao
            title="Entrar agora"
            onPress={() => {
              clicarEntrar();
              Keyboard.dismiss();
            }}
            loading={carregando}
          />

          {podeMostrarBiometria ? (
            <BotaoAutenticacao
              title="Entrar com biometria"
              onPress={() => {
                clicarBiometria();
                Keyboard.dismiss();
              }}
              loading={carregando}
              variant="secondary"
            />
          ) : null}

          <Link href="/register" style={styles.linkCadastro} onPress={() => Keyboard.dismiss()}>
            Criar conta de participante
          </Link>
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
    gap: 14,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  adminChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e8f0ff',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#c9dafc',
  },
  adminChipTexto: {
    color: '#2457d6',
    fontSize: 12,
    fontWeight: '900',
  },
  apresentacao: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8dee9',
    padding: 20,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  apresentacaoLogoBox: {
    width: 92,
    height: 92,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 5,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    overflow: 'hidden',
  },
  apresentacaoLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  apresentacaoTitulo: {
    color: '#101828',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  apresentacaoTexto: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
  },
  formulario: {
    padding: 18,
  },
  formTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  formTitulo: {
    color: '#101828',
    fontSize: 23,
    fontWeight: '900',
  },
  formSubtitulo: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  formIcone: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCadastro: {
    marginTop: 16,
    color: '#2457d6',
    textAlign: 'center',
    fontWeight: '900',
  },
});
