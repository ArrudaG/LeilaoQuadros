import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { CartaoLeilao, EntradaAnimada } from '@/components/ui/leilao-design';
import { useAutenticacao } from '@/src/auth/context/contexto-autenticacao';
import { API_BASE_URL } from '@/src/auth/services/servico-api';
import { escolherFotoDaGaleria, tirarFotoAgora } from '@/src/auth/services/servico-foto';

function montarUrlImagem(url) {
  if (!url) {
    return null;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function dataIsoParaBr(valor) {
  const texto = String(valor || '').trim();
  const matchBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (matchBr) {
    return texto;
  }

  const matchIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!matchIso) {
    return texto;
  }

  return `${matchIso[3]}/${matchIso[2]}/${matchIso[1]}`;
}

export default function TelaPerfil() {
  const {
    usuario,
    atualizarDadosPerfil,
    atualizarFotoPerfil,
    removerFotoPerfilUsuario,
    ativarBiometriaNaContaAtual,
    desativarBiometriaNoAparelho,
    excluirContaAtual,
  } = useAutenticacao();
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [acaoFoto, setAcaoFoto] = useState('');
  const [previewFoto, setPreviewFoto] = useState(null);
  const [menuFotoVisivel, setMenuFotoVisivel] = useState(false);

  useEffect(() => {
    setNome(usuario?.firstName || '');
    setSobrenome(usuario?.lastName || '');
    setEmail(usuario?.email || '');
    setTelefone(usuario?.phone || '');
    setDataNascimento(dataIsoParaBr(usuario?.birthDate || ''));
  }, [usuario?.firstName, usuario?.lastName, usuario?.email, usuario?.phone, usuario?.birthDate]);

  const iniciais = useMemo(() => {
    const a = (usuario?.firstName?.[0] || '').toUpperCase();
    const b = (usuario?.lastName?.[0] || '').toUpperCase();
    return `${a}${b}`;
  }, [usuario?.firstName, usuario?.lastName]);

  const fotoPerfil = montarUrlImagem(usuario?.profileImageUrl);
  const fotoOcupada = acaoFoto !== '';

  async function salvarPerfil() {
    const nomeFinal = nome.trim();
    const sobrenomeFinal = sobrenome.trim();
    const emailFinal = email.trim().toLowerCase();
    const telefoneFinal = telefone.trim();

    if (!nomeFinal || !sobrenomeFinal || !emailFinal || !telefoneFinal) {
      Alert.alert('Atenção', 'Nome, sobrenome, email e telefone são obrigatórios.');
      return;
    }

    try {
      setSalvandoDados(true);
      await atualizarDadosPerfil({
        firstName: nomeFinal,
        lastName: sobrenomeFinal,
        email: emailFinal,
        phone: telefoneFinal,
      });
      Alert.alert('Sucesso', 'Perfil atualizado no banco de dados.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar seu perfil.');
    } finally {
      setSalvandoDados(false);
    }
  }

  async function enviarFoto(fotoSelecionada) {
    if (!fotoSelecionada?.uri) {
      return;
    }

    try {
      setAcaoFoto('enviando');
      await atualizarFotoPerfil(fotoSelecionada);
      Alert.alert('Sucesso', 'Foto de perfil atualizada.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível atualizar a foto.');
    } finally {
      setAcaoFoto('');
    }
  }

  async function escolherDaGaleria() {
    try {
      setMenuFotoVisivel(false);
      setAcaoFoto('galeria');
      const fotoSelecionada = await escolherFotoDaGaleria();
      if (fotoSelecionada?.uri) {
        setPreviewFoto(fotoSelecionada);
      }
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Falha ao abrir galeria.');
    } finally {
      setAcaoFoto('');
    }
  }

  async function tirarFoto() {
    try {
      setMenuFotoVisivel(false);
      setAcaoFoto('camera');
      const fotoSelecionada = await tirarFotoAgora();
      if (fotoSelecionada?.uri) {
        setPreviewFoto(fotoSelecionada);
      }
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Falha ao abrir camera.');
    } finally {
      setAcaoFoto('');
    }
  }

  async function confirmarPreview() {
    const fotoFinal = previewFoto;
    setPreviewFoto(null);
    await enviarFoto(fotoFinal);
  }

  function removerFoto() {
    setMenuFotoVisivel(false);
    Alert.alert('Remover foto', 'Deseja remover sua foto de perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            setAcaoFoto('removendo');
            await removerFotoPerfilUsuario();
            Alert.alert('Sucesso', 'Foto de perfil removida.');
          } catch (error) {
            Alert.alert('Erro', error?.message || 'Não foi possível remover a foto.');
          } finally {
            setAcaoFoto('');
          }
        },
      },
    ]);
  }

  async function cadastrarBiometria() {
    try {
      await ativarBiometriaNaContaAtual();
      Alert.alert('Sucesso', 'Biometria cadastrada nesta conta.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível cadastrar biometria.');
    }
  }

  async function removerBiometria() {
    if (!usuario?.biometricEnabled) {
      Alert.alert('Biometria', 'Esta conta nao possui biometria ativa.');
      return;
    }

    try {
      await desativarBiometriaNoAparelho();
      Alert.alert('Sucesso', 'Biometria removida desta conta.');
    } catch {
      Alert.alert('Erro', 'Não foi possível remover biometria.');
    }
  }

  function excluirConta() {
    Alert.alert('Excluir conta', 'Essa acao remove sua conta, foto e dados de biometria. Deseja continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await excluirContaAtual();
            Alert.alert('Conta excluida', 'Sua conta foi removida com sucesso.', [
              {
                text: 'OK',
                onPress: () => router.replace('/login'),
              },
            ]);
          } catch (error) {
            Alert.alert('Erro', error?.message || 'Não foi possível excluir sua conta.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.telaConteudo}>
      <EntradaAnimada style={styles.cartaoAvatar}>
        <View style={styles.heroTextoBox}>
          <Text style={styles.eyebrow}>Minha conta</Text>
          <Text style={styles.titulo}>Perfil</Text>
          <Text style={styles.heroDescricao}>Atualize seus dados, foto e segurança de acesso.</Text>
        </View>

        <Pressable style={styles.avatarArea} onPress={() => setMenuFotoVisivel(true)} disabled={fotoOcupada}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={styles.imagemAvatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.textoIniciais}>{iniciais || 'U'}</Text>
            </View>
          )}

          <View style={styles.avatarEditar}>
            <IconeSimbolo name="camera.fill" size={18} color="#fff" />
          </View>
        </Pressable>

        <Pressable style={styles.botaoEditarFoto} onPress={() => setMenuFotoVisivel(true)} disabled={fotoOcupada}>
          <IconeSimbolo name="pencil" size={16} color="#0f766e" />
          <Text style={styles.textoEditarFoto}>{acaoFoto ? 'Processando...' : 'Editar foto'}</Text>
        </Pressable>

        <Text style={styles.email}>CPF: {usuario?.cpf}</Text>
      </EntradaAnimada>

      <CartaoLeilao style={styles.cartaoDados} delay={120}>
        <Text style={styles.label}>Nome</Text>
        <TextInput value={nome} onChangeText={setNome} style={styles.input} placeholder="Seu nome" autoCapitalize="words" />

        <Text style={styles.label}>Sobrenome</Text>
        <TextInput value={sobrenome} onChangeText={setSobrenome} style={styles.input} placeholder="Seu sobrenome" autoCapitalize="words" />

        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Seu email" autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Telefone</Text>
        <TextInput value={telefone} onChangeText={setTelefone} style={styles.input} placeholder="Seu telefone" keyboardType="phone-pad" />

        <Text style={styles.label}>Data de nascimento</Text>
        <View style={[styles.input, styles.inputSomenteLeitura]}>
          <Text style={dataNascimento ? styles.inputTexto : styles.inputPlaceholder}>{dataNascimento || 'Não informada'}</Text>
        </View>

        <Pressable onPress={salvarPerfil} style={styles.botaoPrincipal} disabled={salvandoDados}>
          <IconeSimbolo name="check.circle.fill" size={18} color="#fff" />
          <Text style={styles.textoBotaoPrincipal}>{salvandoDados ? 'Salvando...' : 'Salvar alteracoes'}</Text>
        </Pressable>
      </CartaoLeilao>

      <CartaoLeilao style={styles.cartaoSeguranca} delay={180}>
        <Text style={styles.secaoTitulo}>Seguranca da conta</Text>
        <Text style={styles.secaoTexto}>Gerencie biometria e acesso da sua conta por aqui.</Text>

        {!usuario?.biometricEnabled ? (
          <Pressable style={styles.acaoSeguranca} onPress={cadastrarBiometria}>
            <View style={[styles.acaoIcone, styles.acaoIconeVerde]}>
              <IconeSimbolo name="check.circle.fill" size={21} color="#fff" />
            </View>
            <View style={styles.acaoTextoBox}>
              <Text style={styles.acaoTitulo}>Ativar biometria</Text>
              <Text style={styles.acaoDescricao}>Entrar usando a digital deste aparelho.</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable style={styles.acaoSeguranca} onPress={removerBiometria}>
            <View style={[styles.acaoIcone, styles.acaoIconeAzul]}>
              <IconeSimbolo name="shield.fill" size={21} color="#fff" />
            </View>
            <View style={styles.acaoTextoBox}>
              <Text style={styles.acaoTitulo}>Remover biometria</Text>
              <Text style={styles.acaoDescricao}>Desvincular este aparelho da conta.</Text>
            </View>
          </Pressable>
        )}

        <Pressable style={styles.acaoSeguranca} onPress={excluirConta}>
          <View style={[styles.acaoIcone, styles.acaoIconeVermelho]}>
            <IconeSimbolo name="trash.fill" size={21} color="#fff" />
          </View>
          <View style={styles.acaoTextoBox}>
            <Text style={styles.acaoTitulo}>Excluir conta</Text>
            <Text style={styles.acaoDescricao}>Remover conta, foto e sessão local.</Text>
          </View>
        </Pressable>
      </CartaoLeilao>

      <Modal transparent visible={menuFotoVisivel} animationType="slide" onRequestClose={() => setMenuFotoVisivel(false)}>
        <View style={styles.overlayMenuFoto}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuFotoVisivel(false)} />
          <View style={styles.menuFoto}>
            <View style={styles.menuAlca} />

            <View style={styles.menuTopo}>
              <Pressable style={styles.menuIconeTopo} onPress={() => setMenuFotoVisivel(false)}>
                <IconeSimbolo name="xmark" size={26} color="#f8fafc" />
              </Pressable>

              <Text style={styles.menuTitulo}>Foto do perfil</Text>

              <Pressable style={styles.menuIconeTopo} onPress={fotoPerfil ? removerFoto : undefined} disabled={!fotoPerfil || fotoOcupada}>
                <IconeSimbolo name="trash.fill" size={25} color={fotoPerfil ? '#f8fafc' : '#475569'} />
              </Pressable>
            </View>

            <Pressable style={styles.menuOpcao} onPress={tirarFoto} disabled={fotoOcupada}>
              <IconeSimbolo name="camera.fill" size={28} color="#94a3b8" />
              <Text style={styles.menuOpcaoTexto}>Camera</Text>
            </Pressable>

            <Pressable style={styles.menuOpcao} onPress={escolherDaGaleria} disabled={fotoOcupada}>
              <IconeSimbolo name="photo.fill" size={28} color="#94a3b8" />
              <Text style={styles.menuOpcaoTexto}>Galeria</Text>
            </Pressable>

            {!!fotoPerfil && (
              <Pressable style={styles.menuOpcao} onPress={removerFoto} disabled={fotoOcupada}>
                <IconeSimbolo name="trash.fill" size={28} color="#fca5a5" />
                <Text style={[styles.menuOpcaoTexto, styles.menuOpcaoPerigo]}>{acaoFoto === 'removendo' ? 'Removendo...' : 'Excluir foto'}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(previewFoto)} animationType="fade" onRequestClose={() => setPreviewFoto(null)}>
        <View style={styles.overlayModal}>
          <View style={styles.caixaModal}>
            <Text style={styles.tituloModal}>Preview da foto</Text>

            {!!previewFoto?.uri && <Image source={{ uri: previewFoto.uri }} style={styles.imagemPreview} />}

            <View style={styles.linhaModalBotoes}>
              <Pressable style={styles.botaoCancelar} onPress={() => setPreviewFoto(null)}>
                <Text style={styles.textoBotaoCancelar}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.botaoConfirmar} onPress={confirmarPreview}>
                <Text style={styles.textoBotaoConfirmar}>{acaoFoto === 'enviando' ? 'Enviando...' : 'Usar foto'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  telaConteudo: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  heroTextoBox: {
    width: '100%',
    gap: 4,
  },
  eyebrow: {
    color: '#2457d6',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 30,
    color: '#101828',
    fontWeight: '900',
  },
  heroDescricao: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 260,
  },
  cartaoAvatar: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#d8dee9',
  },
  avatarArea: {
    width: 108,
    height: 108,
  },
  avatarFallback: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#2457d6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagemAvatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#d8dee9',
  },
  avatarEditar: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2457d6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  textoIniciais: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 32,
  },
  botaoEditarFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoEditarFoto: {
    color: '#2457d6',
    fontSize: 14,
    fontWeight: '900',
  },
  email: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '700',
  },
  cartaoDados: {
    padding: 16,
    gap: 8,
  },
  label: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd7e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#0f172a',
    marginBottom: 4,
    minHeight: 42,
    justifyContent: 'center',
  },
  inputSomenteLeitura: {
    backgroundColor: '#f9fbff',
  },
  inputTexto: {
    color: '#0f172a',
  },
  inputPlaceholder: {
    color: '#94a3b8',
  },
  botaoPrincipal: {
    marginTop: 8,
    backgroundColor: '#2457d6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  textoBotaoPrincipal: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
  },
  cartaoSeguranca: {
    padding: 16,
    gap: 10,
  },
  secaoTitulo: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  secaoTexto: {
    color: '#64748b',
    fontSize: 13,
    marginTop: -4,
  },
  acaoSeguranca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  acaoIcone: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoIconeVerde: {
    backgroundColor: '#16a34a',
  },
  acaoIconeAzul: {
    backgroundColor: '#2457d6',
  },
  acaoIconeVermelho: {
    backgroundColor: '#b91c1c',
  },
  acaoTextoBox: {
    flex: 1,
  },
  acaoTitulo: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  acaoDescricao: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  overlayMenuFoto: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.62)',
  },
  menuFoto: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 34,
    gap: 12,
  },
  menuAlca: {
    alignSelf: 'center',
    width: 64,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#64748b',
    marginBottom: 8,
  },
  menuTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menuIconeTopo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitulo: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '900',
  },
  menuOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 12,
  },
  menuOpcaoTexto: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  menuOpcaoPerigo: {
    color: '#fecaca',
  },
  overlayModal: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  caixaModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  imagemPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  linhaModalBotoes: {
    flexDirection: 'row',
    gap: 8,
  },
  botaoCancelar: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoBotaoCancelar: {
    color: '#0f172a',
    fontWeight: '800',
  },
  botaoConfirmar: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  textoBotaoConfirmar: {
    color: '#fff',
    fontWeight: '800',
  },
});
