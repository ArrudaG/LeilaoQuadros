import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { EntradaAnimada } from '@/components/ui/leilao-design';
import { API_BASE_URL } from '../../src/auth/services/servico-api';
import {
  confirmarPagamentoLeilao,
  confirmarRecebimentoItem,
  listarLeiloesVencidos,
  resgatarItemLeilao,
} from '../../src/auth/services/servico-leilao';
import { useAutenticacao } from '../../src/auth/context/contexto-autenticacao';

function montarUrlImagem(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function traduzirStatusResgate(status) {
  const mapa = {
    pending_address: 'aguardando endereço',
    requested: 'solicitado',
    confirmed: 'a caminho',
    delivered: 'entregue',
  };

  return mapa[String(status || '').toLowerCase()] || 'pendente';
}

function traduzirPagamento(status) {
  return status === 'paid' ? 'pago' : 'pendente';
}

function traduzirMetodoPagamento(method) {
  const mapa = {
    pix_simulado: 'PIX',
    cartao_simulado: 'Cartão',
    deposito_simulado: 'Depósito',
  };

  return mapa[String(method || '').toLowerCase()] || 'Não informado';
}

function textoAcaoItem(item) {
  if (item.paymentStatus !== 'paid') {
    return 'Pagar item';
  }

  if (!item.redemptionStatus || item.redemptionStatus === 'pending_address') {
    return 'Informar endereço';
  }

  if (item.redemptionStatus === 'confirmed') {
    return 'Confirmar recebimento';
  }

  return '';
}

export default function TelaConquistas() {
  const { token } = useAutenticacao();
  const [carregando, setCarregando] = useState(false);
  const [wins, setWins] = useState([]);
  const [resgateModal, setResgateModal] = useState(null);
  const [etapaResgate, setEtapaResgate] = useState('payment');
  const [paymentMethod, setPaymentMethod] = useState('pix_simulado');
  const [pagando, setPagando] = useState(false);
  const [endereco, setEndereco] = useState({
    addressQuery: '',
    addressLine: '',
    addressNumber: '',
    district: '',
    city: '',
    state: '',
    zipCode: '',
    complement: '',
  });
  const [mapCoords, setMapCoords] = useState(null);
  const [sugestoesEndereco, setSugestoesEndereco] = useState([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const [localizandoAtual, setLocalizandoAtual] = useState(false);
  const [carregandoMapa, setCarregandoMapa] = useState(false);

  const carregar = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setCarregando(true);
      const winsRes = await listarLeiloesVencidos(token);
      setWins(winsRes.wins || []);
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível carregar os itens arrematados.');
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  useEffect(() => {
    const consulta = String(endereco.addressQuery || '').trim();

    if (!resgateModal || consulta.length < 4) {
      setSugestoesEndereco([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCarregandoSugestoes(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(consulta)}`,
        );

        const data = await response.json();
        const lista = Array.isArray(data)
          ? data
              .filter((item) => item?.lat && item?.lon)
              .map((item) => ({
                id: String(item.place_id || Math.random()),
                label: String(item.display_name || consulta),
                lat: Number(item.lat),
                lon: Number(item.lon),
                address: item.address || {},
              }))
              .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
          : [];

        setSugestoesEndereco(lista);
      } catch {
        setSugestoesEndereco([]);
      } finally {
        setCarregandoSugestoes(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [endereco.addressQuery, resgateModal]);

  const totalVitorias = useMemo(() => wins.length, [wins]);
  const metricas = useMemo(
    () => ({
      pagamentosPendentes: wins.filter((item) => item.paymentStatus !== 'paid').length,
      enderecosPendentes: wins.filter((item) => item.paymentStatus === 'paid' && (!item.redemptionStatus || item.redemptionStatus === 'pending_address')).length,
      entregues: wins.filter((item) => item.redemptionStatus === 'delivered').length,
    }),
    [wins],
  );

  function abrirResgate(item) {
    setResgateModal(item);
    setEtapaResgate(item.paymentStatus === 'paid' ? 'address' : 'payment');
    setPaymentMethod(item.paymentMethod === 'cartao_simulado' ? 'cartao_simulado' : 'pix_simulado');
    setMapCoords(null);
    setEndereco({
      addressQuery: '',
      addressLine: '',
      addressNumber: '',
      district: '',
      city: '',
      state: '',
      zipCode: '',
      complement: '',
    });
    setSugestoesEndereco([]);
  }

  async function confirmarPagamento() {
    if (!token || !resgateModal) {
      return;
    }

    try {
      setPagando(true);
      const resposta = await confirmarPagamentoLeilao(token, resgateModal.id, paymentMethod);
      const payment = resposta.payment || {};
      setResgateModal((atual) => ({
        ...atual,
        paymentStatus: payment.paymentStatus || 'paid',
        paymentMethod: payment.paymentMethod || paymentMethod,
        paymentReference: payment.paymentReference,
        paidAt: payment.paidAt,
        redemptionStatus: atual?.redemptionStatus || 'pending_address',
      }));
      setEtapaResgate('address');
      await carregar();
      Alert.alert('Pagamento confirmado', 'Pagamento registrado. Agora informe o endereço de entrega.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível confirmar o pagamento.');
    } finally {
      setPagando(false);
    }
  }

  function selecionarSugestao(sugestao) {
    const addr = sugestao.address || {};

    setMapCoords({ latitude: sugestao.lat, longitude: sugestao.lon });
    setEndereco((anterior) => ({
      ...anterior,
      addressQuery: sugestao.label,
      addressLine: String(addr.road || addr.pedestrian || sugestao.label),
      addressNumber: String(addr.house_number || 'S/N'),
      district: String(addr.suburb || addr.neighbourhood || ''),
      city: String(addr.city || addr.town || addr.village || 'Não informado'),
      state: String(addr.state || 'NI'),
      zipCode: String(addr.postcode || '00000000').replace(/\D/g, ''),
    }));
    setSugestoesEndereco([]);
  }

  async function geocodificarEnderecoComFallback(consulta) {
    try {
      const geocode = await Location.geocodeAsync(consulta);
      const primeiro = geocode?.[0];

      if (primeiro?.latitude && primeiro?.longitude) {
        return {
          latitude: Number(primeiro.latitude),
          longitude: Number(primeiro.longitude),
          address: {},
        };
      }
    } catch {
      // ignora e segue fallback HTTP
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(consulta)}&limit=1`,
    );
    const data = await response.json();
    const primeiro = data?.[0];

    if (!primeiro?.lat || !primeiro?.lon) {
      return null;
    }

    return {
      latitude: Number(primeiro.lat),
      longitude: Number(primeiro.lon),
      address: primeiro?.address || {},
    };
  }

  function pedirPermissaoLocalizacaoComMensagem() {
    return new Promise((resolve) => {
      Alert.alert(
        'Localização para facilitar o endereço',
        'Vamos usar sua localização apenas para preencher o endereço de entrega e mostrar no mapa.',
        [
          { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Permitir', onPress: () => resolve(true) },
        ],
      );
    });
  }

  async function visualizarMapa() {
    const consulta = String(endereco.addressQuery || '').trim();

    if (consulta.length < 6) {
      Alert.alert('Mapa', 'Digite um endereço completo para localizar no mapa.');
      return;
    }

    try {
      setCarregandoMapa(true);

      if (sugestoesEndereco.length > 0) {
        const primeiraSugestao = sugestoesEndereco[0];
        selecionarSugestao(primeiraSugestao);
        return;
      }

      const geocoded = await geocodificarEnderecoComFallback(consulta);

      if (!geocoded?.latitude || !geocoded?.longitude) {
        Alert.alert('Mapa', 'Não encontramos esse endereço no mapa.');
        return;
      }

      const latitude = Number(geocoded.latitude);
      const longitude = Number(geocoded.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        Alert.alert('Mapa', 'Coordenadas inválidas para esse endereço.');
        return;
      }

      const enderecoApi = geocoded?.address || {};

      setMapCoords({ latitude, longitude });
      setEndereco((anterior) => ({
        ...anterior,
        addressLine: String(enderecoApi.road || consulta),
        addressNumber: String(enderecoApi.house_number || 'S/N'),
        district: String(enderecoApi.suburb || enderecoApi.neighbourhood || ''),
        city: String(enderecoApi.city || enderecoApi.town || enderecoApi.village || 'Não informado'),
        state: String(enderecoApi.state || 'NI'),
        zipCode: String(enderecoApi.postcode || '00000000').replace(/\D/g, ''),
      }));
    } catch {
      Alert.alert('Mapa', 'Falha ao carregar mapa para esse endereço. Tente escolher uma sugestão ou usar sua localização atual.');
    } finally {
      setCarregandoMapa(false);
    }
  }

  async function abrirRotaExterna() {
    if (!mapCoords) {
        Alert.alert('Mapa', 'Primeiro visualize o endereço no mapa.');
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${mapCoords.latitude},${mapCoords.longitude}`;

    try {
      const podeAbrir = await Linking.canOpenURL(url);
      if (!podeAbrir) {
        Alert.alert('Mapa', 'Não foi possível abrir o app de mapas.');
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert('Mapa', 'Falha ao abrir rota no app de mapas.');
    }
  }

  async function usarLocalizacaoAtual() {
    if (localizandoAtual) {
      return;
    }

    try {
      setLocalizandoAtual(true);

      const confirmou = await pedirPermissaoLocalizacaoComMensagem();
      if (!confirmou) {
        return;
      }

      const permissao = await Location.requestForegroundPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert('Localizacao', 'Permita acesso a localizacao para usar esse recurso.');
        return;
      }

      const servicosLigados = await Location.hasServicesEnabledAsync();
      if (!servicosLigados) {
        Alert.alert('Localizacao', 'Ative o GPS/localização do aparelho para usar esse recurso.');
        return;
      }

      const posicao =
        (await Location.getLastKnownPositionAsync()) ||
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));

      if (!posicao?.coords) {
        Alert.alert('Localização', 'Não foi possível obter sua localização atual.');
        return;
      }

      const latitude = Number(posicao.coords.latitude);
      const longitude = Number(posicao.coords.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        Alert.alert('Localização', 'Não foi possível obter sua localização atual.');
        return;
      }

      setMapCoords({ latitude, longitude });

      let addr = {};
      let label = `${latitude}, ${longitude}`;

      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        const primeiro = reverse?.[0] || {};
        addr = {
          road: primeiro.street,
          house_number: primeiro.streetNumber,
          suburb: primeiro.subregion,
          city: primeiro.city,
          state: primeiro.region,
          postcode: primeiro.postalCode,
        };
        label = [primeiro.street, primeiro.streetNumber, primeiro.city, primeiro.region].filter(Boolean).join(', ') || label;
      } catch {
        // fallback final
      }

      setEndereco((anterior) => ({
        ...anterior,
        addressQuery: label,
        addressLine: String(addr.road || addr.pedestrian || label),
        addressNumber: String(addr.house_number || 'S/N'),
        district: String(addr.suburb || addr.neighbourhood || ''),
        city: String(addr.city || addr.town || addr.village || 'Não informado'),
        state: String(addr.state || 'NI'),
        zipCode: String(addr.postcode || '00000000').replace(/\D/g, ''),
      }));
      setSugestoesEndereco([]);
    } catch {
      Alert.alert('Localizacao', 'Falha ao buscar sua localizacao atual.');
    } finally {
      setLocalizandoAtual(false);
      setCarregandoMapa(false);
    }
  }

  async function confirmarResgate() {
    if (!token || !resgateModal) {
      return;
    }

    if (!endereco.addressQuery || !mapCoords) {
      Alert.alert('Endereço incompleto', 'Digite o endereço e clique em visualizar no mapa antes de confirmar.');
      return;
    }

    try {
      await resgatarItemLeilao(token, resgateModal.id, {
        ...endereco,
        mapQuery: endereco.addressQuery,
      });
      setResgateModal(null);
      await carregar();
      Alert.alert('Sucesso', 'Endereço enviado. A entrega foi solicitada.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível solicitar a entrega.');
    }
  }

  async function confirmarRecebimento(redemptionId) {
    if (!token || !redemptionId) {
      return;
    }

    try {
      await confirmarRecebimentoItem(token, redemptionId);
      await carregar();
      Alert.alert('Sucesso', 'Recebimento confirmado com sucesso.');
    } catch (error) {
      Alert.alert('Erro', error?.message || 'Não foi possível confirmar recebimento.');
    }
  }

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
    >
      <EntradaAnimada style={styles.hero}>
        <View style={styles.heroIcone}>
          <IconeSimbolo name="check.circle.fill" color="#047857" size={28} />
        </View>
        <Text style={styles.eyebrow}>Pós-leilão</Text>
        <Text style={styles.titulo}>Itens arrematados</Text>
        <Text style={styles.heroTexto}>Confira seus arremates, conclua o pagamento e acompanhe a entrega de cada lote.</Text>
      </EntradaAnimada>

      <View style={styles.metricas}>
        <View style={styles.metricaItem}>
          <Text style={styles.metricaNumero}>{totalVitorias}</Text>
          <Text style={styles.metricaLabel}>arremates</Text>
        </View>
        <View style={styles.metricaItem}>
          <Text style={styles.metricaNumero}>{metricas.pagamentosPendentes}</Text>
          <Text style={styles.metricaLabel}>a pagar</Text>
        </View>
        <View style={styles.metricaItem}>
          <Text style={styles.metricaNumero}>{metricas.enderecosPendentes}</Text>
          <Text style={styles.metricaLabel}>endereços</Text>
        </View>
        <View style={styles.metricaItem}>
          <Text style={styles.metricaNumero}>{metricas.entregues}</Text>
          <Text style={styles.metricaLabel}>entregues</Text>
        </View>
      </View>

      <View style={styles.secaoCabecalho}>
        <Text style={styles.subtitulo}>Seus arremates</Text>
        <Text style={styles.secaoMeta}>{totalVitorias} itens</Text>
      </View>

      <View style={styles.listaConquistas}>
        {wins.map((item) => {
          const imagem = montarUrlImagem(item.mediaUrl);
          const textoAcao = textoAcaoItem(item);
          const pagamentoPago = item.paymentStatus === 'paid';
          const entregue = item.redemptionStatus === 'delivered';

          return (
            <View key={item.id} style={styles.winItem}>
              {imagem ? (
                <Image source={{ uri: imagem }} style={styles.winImage} />
              ) : (
                <View style={[styles.winImage, styles.winImageVazia]}>
                  <IconeSimbolo name="gavel.fill" color="#64748b" size={30} />
                </View>
              )}

              <View style={styles.winCorpo}>
                <View style={styles.winTopo}>
                  <Text style={styles.winTitulo} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.winValor}>R$ {money(item.winnerBid)}</Text>
                </View>

                <View style={styles.statusLinha}>
                  <View style={[styles.statusPill, pagamentoPago ? styles.statusPago : styles.statusPendente]}>
                    <IconeSimbolo name={pagamentoPago ? 'check.circle.fill' : 'payments.fill'} color={pagamentoPago ? '#047857' : '#b45309'} size={15} />
                    <Text style={[styles.statusTexto, pagamentoPago ? styles.statusTextoPago : styles.statusTextoPendente]}>
                      {traduzirPagamento(item.paymentStatus)}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, entregue ? styles.statusPago : styles.statusNeutro]}>
                    <IconeSimbolo name={entregue ? 'check.circle.fill' : 'location.fill'} color={entregue ? '#047857' : '#2563eb'} size={15} />
                    <Text style={[styles.statusTexto, entregue ? styles.statusTextoPago : styles.statusTextoNeutro]}>
                      {traduzirStatusResgate(item.redemptionStatus)}
                    </Text>
                  </View>
                </View>

                {!!textoAcao && (
                  <Pressable
                    style={[styles.botaoAcao, item.redemptionStatus === 'confirmed' ? styles.botaoConfirmacao : null]}
                    onPress={() => (item.redemptionStatus === 'confirmed' ? confirmarRecebimento(item.redemptionId) : abrirResgate(item))}
                  >
                    <IconeSimbolo name={item.redemptionStatus === 'confirmed' ? 'check.circle.fill' : 'arrow.right'} color="#fff" size={18} />
                    <Text style={styles.textoBotao}>{textoAcao}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
        {!wins.length ? (
          <View style={styles.vazioBox}>
            <IconeSimbolo name="timer" color="#64748b" size={30} />
            <Text style={styles.vazioTitulo}>Nenhum item arrematado</Text>
            <Text style={styles.vazio}>Quando você vencer um lote, o pagamento e a entrega aparecerão aqui.</Text>
          </View>
        ) : null}
      </View>

      <Modal visible={Boolean(resgateModal)} transparent animationType="slide" onRequestClose={() => setResgateModal(null)}>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalConteudo} keyboardShouldPersistTaps="always">
            <View style={styles.modalTopo}>
              <View style={styles.modalIcone}>
                <IconeSimbolo name={etapaResgate === 'payment' ? 'payments.fill' : 'location.fill'} color="#fff" size={24} />
              </View>

              <View style={styles.modalTituloBox}>
                <Text style={styles.modalTitulo}>Finalizar arremate</Text>
                <Text style={styles.modalSubtitulo}>{resgateModal?.title}</Text>
              </View>
            </View>

            <View style={styles.resumoModal}>
              <Text style={styles.info}>Valor final: R$ {money(resgateModal?.winnerBid)}</Text>
              <Text style={styles.info}>Pagamento: {traduzirPagamento(resgateModal?.paymentStatus)}</Text>
            </View>

            {etapaResgate === 'payment' ? (
              <View style={styles.checkoutBox}>
                <Text style={styles.labelCheckout}>Metodo de pagamento</Text>
                <View style={styles.row}>
                  <Pressable
                    style={[styles.chip, paymentMethod === 'pix_simulado' ? styles.chipAtivo : null]}
                    onPress={() => setPaymentMethod('pix_simulado')}
                  >
                    <Text style={[styles.chipTexto, paymentMethod === 'pix_simulado' ? styles.chipTextoAtivo : null]}>PIX</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.chip, paymentMethod === 'cartao_simulado' ? styles.chipAtivo : null]}
                    onPress={() => setPaymentMethod('cartao_simulado')}
                  >
                    <Text style={[styles.chipTexto, paymentMethod === 'cartao_simulado' ? styles.chipTextoAtivo : null]}>Cartao</Text>
                  </Pressable>
                </View>

                <Text style={styles.info}>Metodo selecionado: {traduzirMetodoPagamento(paymentMethod)}</Text>

                <Pressable style={styles.botao} onPress={confirmarPagamento} disabled={pagando}>
                  <IconeSimbolo name="check.circle.fill" color="#fff" size={18} />
                  <Text style={styles.textoBotao}>{pagando ? 'Confirmando...' : 'Confirmar pagamento'}</Text>
                </Pressable>
              </View>
            ) : null}

            {etapaResgate === 'address' ? (
              <>
                <Text style={styles.info}>Metodo pago: {traduzirMetodoPagamento(resgateModal?.paymentMethod)}</Text>
                {!!resgateModal?.paymentReference && <Text style={styles.info}>Referencia: {resgateModal.paymentReference}</Text>}

                <TextInput
              style={styles.input}
              placeholder="Endereço completo"
              value={endereco.addressQuery}
              onChangeText={(v) => {
                setEndereco((s) => ({ ...s, addressQuery: v }));
                setMapCoords(null);
              }}
            />

            {carregandoSugestoes ? <Text style={styles.sugestaoInfo}>Buscando sugestões...</Text> : null}

            {sugestoesEndereco.length ? (
              <View style={styles.sugestoesBox}>
                {sugestoesEndereco.map((item) => (
                  <Pressable key={item.id} style={styles.sugestaoItem} onPress={() => selecionarSugestao(item)}>
                    <Text style={styles.sugestaoTexto}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <TextInput style={styles.input} placeholder="Complemento" value={endereco.complement} onChangeText={(v) => setEndereco((s) => ({ ...s, complement: v }))} />

            <Pressable style={styles.botaoSecundario} onPress={visualizarMapa}>
              <IconeSimbolo name="eye.fill" color="#fff" size={18} />
              <Text style={styles.textoBotao}>{carregandoMapa ? 'Buscando mapa...' : 'Visualizar endereço no mapa'}</Text>
            </Pressable>

            <Pressable style={styles.botaoSecundario} onPress={usarLocalizacaoAtual} disabled={localizandoAtual}>
              <IconeSimbolo name="location.fill" color="#fff" size={18} />
              <Text style={styles.textoBotao}>{localizandoAtual ? 'Localizando...' : 'Usar localizacao atual'}</Text>
            </Pressable>

            {!!mapCoords && (
              <>
                <MapView
                  style={styles.mapa}
                  initialRegion={{
                    latitude: mapCoords.latitude,
                    longitude: mapCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  region={{
                    latitude: mapCoords.latitude,
                    longitude: mapCoords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker coordinate={mapCoords} />
                </MapView>

                <Pressable style={styles.botaoSecundario} onPress={abrirRotaExterna}>
                  <IconeSimbolo name="location.fill" color="#fff" size={18} />
                  <Text style={styles.textoBotao}>Abrir rota no app de mapas</Text>
                </Pressable>
              </>
            )}

            <Pressable style={styles.botao} onPress={confirmarResgate}>
              <IconeSimbolo name="send.fill" color="#fff" size={18} />
              <Text style={styles.textoBotao}>Confirmar endereço de entrega</Text>
            </Pressable>
              </>
            ) : null}

            <Pressable style={styles.botaoFechar} onPress={() => setResgateModal(null)}>
              <IconeSimbolo name="xmark" color="#fff" size={20} />
              <Text style={styles.textoBotao}>Fechar</Text>
            </Pressable>
          </ScrollView>
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
  conteudo: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  hero: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    minHeight: 164,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#bbebd0',
  },
  heroIcone: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#dff7ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  titulo: {
    fontSize: 31,
    fontWeight: '900',
    color: '#101828',
  },
  heroTexto: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  subtitulo: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricas: {
    flexDirection: 'row',
    gap: 8,
  },
  metricaItem: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricaNumero: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
  metricaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  secaoMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  listaConquistas: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  info: {
    color: '#334155',
    fontSize: 13,
  },
  checkoutBox: {
    backgroundColor: '#eef6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfe2ff',
    padding: 10,
    gap: 8,
  },
  labelCheckout: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#0f172a',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipAtivo: {
    backgroundColor: '#2457d6',
  },
  chipTexto: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextoAtivo: {
    color: '#fff',
  },
  botao: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  botaoSecundario: {
    backgroundColor: '#2457d6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  botaoFechar: {
    backgroundColor: '#475569',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: '900',
  },
  winItem: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    gap: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
  },
  winImage: {
    width: 104,
    height: 132,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  winImageVazia: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCorpo: {
    flex: 1,
    gap: 8,
  },
  winTopo: {
    gap: 3,
  },
  winTitulo: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
  },
  winValor: {
    color: '#2457d6',
    fontSize: 18,
    fontWeight: '900',
  },
  statusLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusPago: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  statusPendente: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  statusNeutro: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statusTexto: {
    fontSize: 11,
    fontWeight: '900',
  },
  statusTextoPago: {
    color: '#047857',
  },
  statusTextoPendente: {
    color: '#b45309',
  },
  statusTextoNeutro: {
    color: '#2563eb',
  },
  botaoAcao: {
    backgroundColor: '#2457d6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  botaoConfirmacao: {
    backgroundColor: '#0f9f6e',
  },
  vazio: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  vazioBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  vazioTitulo: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.75)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#f4f7fb',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '88%',
  },
  modalConteudo: {
    gap: 10,
    padding: 16,
    paddingBottom: 24,
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  modalIcone: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#2457d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTituloBox: {
    flex: 1,
  },
  modalTitulo: {
    color: '#0f172a',
    fontSize: 21,
    fontWeight: '900',
  },
  modalSubtitulo: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
  },
  resumoModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 4,
  },
  mapa: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    backgroundColor: '#cbd5e1',
  },
  sugestaoInfo: {
    color: '#64748b',
    fontSize: 12,
    marginTop: -2,
  },
  sugestoesBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sugestaoItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sugestaoTexto: {
    color: '#0f172a',
    fontSize: 12,
  },
});
