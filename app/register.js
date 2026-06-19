import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Image, Keyboard, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EntradaAnimada, marcaImagem } from '@/components/ui/leilao-design';
import { BotaoAutenticacao } from '@/src/auth/components/botao-autenticacao';
import { EntradaAutenticacao } from '@/src/auth/components/entrada-autenticacao';
import { useAutenticacao } from '@/src/auth/context/contexto-autenticacao';

function validarEmail(valor) {
  const emailLimpo = String(valor || '').trim().toLowerCase();
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexEmail.test(emailLimpo);
}

function formatarDataComMascara(valor) {
  const digitos = String(valor || '').replace(/\D/g, '').slice(0, 8);

  if (digitos.length <= 2) {
    return digitos;
  }

  if (digitos.length <= 4) {
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  }

  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function dateParaBr(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = String(data.getFullYear());
  return `${dia}/${mes}/${ano}`;
}

function dataParaIso(valor) {
  const texto = String(valor || '').trim();

  const matchBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (matchBr) {
    return `${matchBr[3]}-${matchBr[2]}-${matchBr[1]}`;
  }

  const matchIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchIso) {
    return texto;
  }

  return '';
}

function dataTextoParaDate(valor) {
  const textoMascara = formatarDataComMascara(valor);
  const iso = dataParaIso(textoMascara);
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const data = new Date(ano, mes - 1, dia);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function idadeMinimaAtingida(dataIso) {
  const dataNormalizada = dataParaIso(dataIso);
  const match = String(dataNormalizada || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return false;
  }

  const ano = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);
  const nascimento = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    nascimento.getUTCFullYear() !== ano
    || nascimento.getUTCMonth() !== mes - 1
    || nascimento.getUTCDate() !== dia
  ) {
    return false;
  }

  const hoje = new Date();
  const limite = new Date(Date.UTC(hoje.getUTCFullYear() - 18, hoje.getUTCMonth(), hoje.getUTCDate()));
  return nascimento <= limite;
}

function validarCadastro({ nome, sobrenome, cpf, email, telefone, dataNascimento, senha, senhaConfirmacao }) {
  if (!nome.trim() || nome.trim().length < 2) return 'Informe um nome válido.';
  if (!sobrenome.trim() || sobrenome.trim().length < 2) return 'Informe um sobrenome válido.';
  if (String(cpf || '').replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 dígitos.';
  if (!validarEmail(email)) return 'Informe um email válido.';
  if (!telefone.trim() || telefone.trim().length < 8) return 'Informe um telefone válido.';
  if (!idadeMinimaAtingida(dataNascimento)) return 'É necessário ter no mínimo 18 anos. Use data no formato DD/MM/AAAA.';
  if (!senha || senha.length < 6) return 'Senha deve ter pelo menos 6 caracteres.';
  if (senha !== senhaConfirmacao) return 'As senhas não coincidem.';
  return null;
}

export default function TelaCadastro() {
  const { fazerCadastro } = useAutenticacao();
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataNascimentoSelecionada, setDataNascimentoSelecionada] = useState(new Date(2000, 0, 1));
  const [mostrarCalendarioNascimento, setMostrarCalendarioNascimento] = useState(false);
  const [senha, setSenha] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [ativarBiometriaNoAparelho, setAtivarBiometriaNoAparelho] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function abrirCalendarioNascimento() {
    const dataAtual = dataTextoParaDate(dataNascimento) || dataNascimentoSelecionada;
    setDataNascimentoSelecionada(dataAtual);
    setMostrarCalendarioNascimento(true);
  }

  function aoTrocarDataNascimento(event, dataSelecionada) {
    if (Platform.OS === 'android') {
      setMostrarCalendarioNascimento(false);
    }

    if (event?.type === 'dismissed' || !dataSelecionada) {
      return;
    }

    setDataNascimentoSelecionada(dataSelecionada);
    setDataNascimento(dateParaBr(dataSelecionada));
  }

  async function clicarCadastrar() {
    const erroValidacao = validarCadastro({
      nome,
      sobrenome,
      cpf,
      email,
      telefone,
      dataNascimento,
      senha,
      senhaConfirmacao,
    });

    if (erroValidacao) {
      Alert.alert('Erro', erroValidacao);
      return;
    }

    const payload = {
      firstName: nome.trim(),
      lastName: sobrenome.trim(),
      cpf,
      email: email.trim().toLowerCase(),
      phone: telefone.trim(),
      birthDate: dataParaIso(dataNascimento),
      password: senha,
      passwordConfirmation: senhaConfirmacao,
      biometricEnabled: ativarBiometriaNoAparelho,
    };

    try {
      setCarregando(true);
      const resultadoCadastro = await fazerCadastro(payload, ativarBiometriaNoAparelho);

      if (resultadoCadastro?.mensagemBiometria) {
        Alert.alert('Biometria', resultadoCadastro.mensagemBiometria);
      }

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Erro no cadastro', error.message || 'Não foi possível cadastrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.conteudoTeclado}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <EntradaAnimada style={styles.convite}>
          <View style={styles.conviteLogoBox}>
            <Image source={marcaImagem} style={styles.conviteLogo} resizeMode="cover" />
          </View>
          <Text style={styles.titulo}>Crie sua conta no Leilão Mania</Text>
          <Text style={styles.subtitulo}>
            Cadastre seus dados para participar de leilões, acompanhar lances e receber seus quadros.
          </Text>
        </EntradaAnimada>

        <CartaoLeilao style={styles.card} delay={120}>
          <View style={styles.cardCabecalho}>
            <View style={styles.cardIcone}>
              <IconeSimbolo name="person.crop.circle.fill" size={24} color="#2457d6" />
            </View>
            <View style={styles.cardTituloBox}>
              <Text style={styles.cardTitulo}>Criar conta</Text>
              <Text style={styles.cardSubtitulo}>Preencha uma vez e participe dos próximos lotes.</Text>
            </View>
          </View>

          <View style={styles.secaoCabecalho}>
            <Text style={styles.secaoTitulo}>Dados pessoais</Text>
            <Text style={styles.secaoMeta}>identificação do participante</Text>
          </View>

          <View style={styles.gradeDuasColunas}>
            <View style={styles.campoMetade}>
              <EntradaAutenticacao label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" autoCapitalize="words" returnKeyType="next" />
            </View>
            <View style={styles.campoMetade}>
              <EntradaAutenticacao label="Sobrenome" value={sobrenome} onChangeText={setSobrenome} placeholder="Seu sobrenome" autoCapitalize="words" returnKeyType="next" />
            </View>
          </View>

          <EntradaAutenticacao label="CPF" value={cpf} onChangeText={setCpf} placeholder="Somente números" keyboardType="number-pad" returnKeyType="next" />
          <EntradaAutenticacao label="Email" value={email} onChangeText={setEmail} placeholder="seuemail@dominio.com" keyboardType="email-address" returnKeyType="next" />
          <EntradaAutenticacao label="Telefone" value={telefone} onChangeText={setTelefone} placeholder="Seu telefone" keyboardType="phone-pad" returnKeyType="next" />

          <View style={styles.caixaCampoData}>
            <Text style={styles.rotuloData}>Data de nascimento</Text>
            <Pressable onPress={abrirCalendarioNascimento} style={styles.entradaData}>
              <View style={styles.dataConteudo}>
                <IconeSimbolo name="timer" size={19} color={dataNascimento ? '#2457d6' : '#98a2b3'} />
                <Text style={dataNascimento ? styles.textoEntradaData : styles.placeholderEntradaData}>
                  {dataNascimento || 'DD/MM/AAAA'}
                </Text>
              </View>
            </Pressable>

            {mostrarCalendarioNascimento && (
              <View style={styles.boxCalendario}>
                <DateTimePicker
                  value={dataNascimentoSelecionada}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={aoTrocarDataNascimento}
                />

                {Platform.OS === 'ios' && (
                  <Pressable style={styles.botaoCalendario} onPress={() => setMostrarCalendarioNascimento(false)}>
                    <Text style={styles.textoBotaoCalendario}>Fechar calendário</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View style={styles.divisor} />

          <View style={styles.secaoCabecalho}>
            <Text style={styles.secaoTitulo}>Acesso e segurança</Text>
            <Text style={styles.secaoMeta}>senha e biometria opcional</Text>
          </View>

          <EntradaAutenticacao label="Senha" value={senha} onChangeText={setSenha} placeholder="Crie uma senha" secureTextEntry returnKeyType="next" />
          <EntradaAutenticacao label="Confirmação de senha" value={senhaConfirmacao} onChangeText={setSenhaConfirmacao} placeholder="Repita a sua senha" secureTextEntry returnKeyType="done" />

          <View style={styles.linhaOpcao}>
            <View style={styles.opcaoIcone}>
              <IconeSimbolo name="shield.fill" size={22} color="#0f9f6e" />
            </View>
            <View style={styles.opcaoTextoBox}>
              <Text style={styles.textoOpcao}>Cadastrar biometria</Text>
              <Text style={styles.textoOpcaoAjuda}>Use a digital deste aparelho no próximo login.</Text>
            </View>
            <Switch
              value={ativarBiometriaNoAparelho}
              onValueChange={setAtivarBiometriaNoAparelho}
              trackColor={{ false: '#d0d5dd', true: '#9ee5c6' }}
              thumbColor={ativarBiometriaNoAparelho ? '#0f9f6e' : '#f8fafc'}
            />
          </View>

          <BotaoAutenticacao
            title="Finalizar cadastro"
            onPress={() => {
              clicarCadastrar();
              Keyboard.dismiss();
            }}
            loading={carregando}
          />

          <Link href="/login" style={styles.linkLogin} onPress={() => Keyboard.dismiss()}>
            Já tem conta? Entrar
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
  conteudoTeclado: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  convite: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d8dee9',
    overflow: 'hidden',
  },
  conviteLogoBox: {
    width: 92,
    height: 92,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    padding: 5,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    overflow: 'hidden',
  },
  conviteLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  titulo: {
    color: '#101828',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitulo: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
  },
  card: {
    padding: 18,
  },
  cardCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  cardIcone: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e8f0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTituloBox: {
    flex: 1,
  },
  cardTitulo: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '900',
  },
  cardSubtitulo: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2,
  },
  secaoCabecalho: {
    marginBottom: 12,
  },
  secaoTitulo: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '900',
  },
  secaoMeta: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  gradeDuasColunas: {
    flexDirection: 'row',
    gap: 10,
  },
  campoMetade: {
    flex: 1,
  },
  caixaCampoData: {
    width: '100%',
    marginBottom: 14,
  },
  rotuloData: {
    marginBottom: 7,
    fontSize: 13,
    color: '#344054',
    fontWeight: '800',
  },
  entradaData: {
    borderWidth: 1,
    borderColor: '#cfd7e6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9fbff',
    minHeight: 48,
    justifyContent: 'center',
  },
  dataConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  textoEntradaData: {
    color: '#101828',
    fontWeight: '700',
  },
  placeholderEntradaData: {
    color: '#98a2b3',
    fontWeight: '700',
  },
  boxCalendario: {
    marginTop: 6,
  },
  botaoCalendario: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  textoBotaoCalendario: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
  divisor: {
    height: 1,
    backgroundColor: '#e4e9f2',
    marginVertical: 8,
  },
  linhaOpcao: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#f0fff7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b8f0d1',
    padding: 12,
    gap: 12,
  },
  opcaoIcone: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoTextoBox: {
    flex: 1,
  },
  textoOpcao: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '900',
  },
  textoOpcaoAjuda: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },
  linkLogin: {
    marginTop: 16,
    color: '#2457d6',
    textAlign: 'center',
    fontWeight: '900',
  },
});
