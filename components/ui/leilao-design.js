import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconeSimbolo } from './icone-simbolo';

export const marcaImagem = require('../../assets/images/icon.png');

export const LeilaoCores = {
  fundo: '#f4f7fb',
  tinta: '#101828',
  texto: '#172033',
  textoSuave: '#667085',
  linha: '#d8dee9',
  painel: '#0b1020',
  painel2: '#121a2f',
  azul: '#2457d6',
  ciano: '#11a7c8',
  verde: '#0f9f6e',
  ouro: '#d99b20',
  vermelho: '#c2413a',
  branco: '#ffffff',
};

export function EntradaAnimada({ children, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translate, {
        toValue: 0,
        delay,
        damping: 16,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translate]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY: translate }] }]}>
      {children}
    </Animated.View>
  );
}

export function PulsoLogo({ children, style }) {
  const scale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 1150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.94, duration: 1150, useNativeDriver: true }),
      ]),
    ).start();
  }, [scale]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

export function MarcaLeilao({ compact = false, claro = false, style }) {
  return (
    <View style={[styles.marca, compact ? styles.marcaCompacta : null, style]}>
      <View style={[styles.logoMoldura, compact ? styles.logoMolduraCompacta : null]}>
        <Image source={marcaImagem} style={[styles.logo, compact ? styles.logoCompacta : null]} resizeMode="cover" />
      </View>
      <View style={styles.marcaTextoBox}>
        <Text style={[styles.marcaNome, claro ? styles.textoClaro : null]}>Leilão Mania</Text>
        {!compact ? <Text style={[styles.marcaSub, claro ? styles.textoClaroSuave : null]}>quadros em disputa ao vivo</Text> : null}
      </View>
    </View>
  );
}

export function TelaComFundo({ children, contentContainerStyle, scroll = true, refreshControl, keyboardShouldPersistTaps = 'handled' }) {
  if (!scroll) {
    return <View style={styles.tela}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={[styles.conteudo, contentContainerStyle]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function HeroLeilao({ eyebrow, title, subtitle, icon = 'gavel.fill', right, children, style, accent = LeilaoCores.azul }) {
  return (
    <EntradaAnimada style={[styles.hero, style]}>
      <View style={[styles.heroBarra, { backgroundColor: accent }]} />
      <View style={styles.heroLinha}>
        <View style={[styles.heroIcone, { backgroundColor: `${accent}18` }]}>
          <IconeSimbolo name={icon} size={25} color={accent} />
        </View>
        {right}
      </View>
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.heroTitulo}>{title}</Text>
      {!!subtitle && <Text style={styles.heroSubtitulo}>{subtitle}</Text>}
      {children}
    </EntradaAnimada>
  );
}

export function CartaoLeilao({ children, style, delay = 0 }) {
  return <EntradaAnimada delay={delay} style={[styles.cartao, style]}>{children}</EntradaAnimada>;
}

export function MetricaLeilao({ icon, value, label, color = LeilaoCores.azul, delay = 0 }) {
  return (
    <CartaoLeilao delay={delay} style={styles.metrica}>
      <View style={[styles.metricaIcone, { backgroundColor: `${color}18` }]}>
        <IconeSimbolo name={icon} size={21} color={color} />
      </View>
      <Text style={styles.metricaValor}>{value}</Text>
      <Text style={styles.metricaLabel}>{label}</Text>
    </CartaoLeilao>
  );
}

export function CabecalhoSecao({ title, meta, action }) {
  return (
    <View style={styles.cabecalhoSecao}>
      <View>
        <Text style={styles.tituloSecao}>{title}</Text>
        {!!meta && <Text style={styles.metaSecao}>{meta}</Text>}
      </View>
      {action}
    </View>
  );
}

export function PillStatus({ children, tone = 'blue', icon }) {
  const estilo = {
    green: styles.pillGreen,
    amber: styles.pillAmber,
    red: styles.pillRed,
    dark: styles.pillDark,
    blue: styles.pillBlue,
  }[tone] || styles.pillBlue;

  const cor = {
    green: '#047857',
    amber: '#b45309',
    red: '#b42318',
    dark: '#f8fafc',
    blue: '#155eef',
  }[tone] || '#155eef';

  return (
    <View style={[styles.pill, estilo]}>
      {!!icon && <IconeSimbolo name={icon} size={14} color={cor} />}
      <Text style={[styles.pillTexto, { color: cor }]}>{children}</Text>
    </View>
  );
}

export function BotaoIcone({ icon, children, onPress, disabled, tone = 'primary', style }) {
  const estilo = {
    primary: styles.botaoPrimario,
    secondary: styles.botaoSecundario,
    danger: styles.botaoPerigo,
    dark: styles.botaoEscuro,
  }[tone] || styles.botaoPrimario;

  return (
    <Pressable style={[styles.botao, estilo, disabled ? styles.botaoDesabilitado : null, style]} onPress={onPress} disabled={disabled}>
      {!!icon && <IconeSimbolo name={icon} size={18} color="#fff" />}
      <Text style={styles.botaoTexto}>{children}</Text>
    </Pressable>
  );
}

export function EstadoVazio({ icon = 'timer', title, text }) {
  return (
    <CartaoLeilao style={styles.vazio}>
      <IconeSimbolo name={icon} color={LeilaoCores.textoSuave} size={32} />
      <Text style={styles.vazioTitulo}>{title}</Text>
      {!!text && <Text style={styles.vazioTexto}>{text}</Text>}
    </CartaoLeilao>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: LeilaoCores.fundo,
  },
  conteudo: {
    padding: 16,
    paddingTop: 22,
    paddingBottom: 34,
    gap: 14,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marcaCompacta: {
    gap: 8,
  },
  logoMoldura: {
    width: 78,
    height: 78,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 4,
    borderWidth: 1,
    borderColor: '#ffffff66',
    overflow: 'hidden',
  },
  logoMolduraCompacta: {
    width: 42,
    height: 42,
    padding: 2,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  logoCompacta: {
    borderRadius: 5,
  },
  marcaTextoBox: {
    flexShrink: 1,
  },
  marcaNome: {
    color: LeilaoCores.texto,
    fontSize: 25,
    fontWeight: '900',
  },
  marcaSub: {
    color: LeilaoCores.textoSuave,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  textoClaro: {
    color: '#fff',
  },
  textoClaroSuave: {
    color: '#cbd5e1',
  },
  hero: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
    minHeight: 168,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: LeilaoCores.linha,
    overflow: 'hidden',
  },
  heroBarra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  heroLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroIcone: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: LeilaoCores.azul,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroTitulo: {
    color: LeilaoCores.texto,
    fontSize: 31,
    fontWeight: '900',
    marginTop: 6,
  },
  heroSubtitulo: {
    color: LeilaoCores.textoSuave,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  cartao: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LeilaoCores.linha,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  metrica: {
    flex: 1,
    padding: 12,
    gap: 5,
  },
  metricaIcone: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricaValor: {
    color: LeilaoCores.texto,
    fontSize: 23,
    fontWeight: '900',
  },
  metricaLabel: {
    color: LeilaoCores.textoSuave,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  tituloSecao: {
    color: LeilaoCores.texto,
    fontSize: 20,
    fontWeight: '900',
  },
  metaSecao: {
    color: LeilaoCores.textoSuave,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pillBlue: {
    backgroundColor: '#e8f0ff',
    borderColor: '#c9dafc',
  },
  pillGreen: {
    backgroundColor: '#dff7ea',
    borderColor: '#bbebd0',
  },
  pillAmber: {
    backgroundColor: '#fff4d6',
    borderColor: '#f4d88b',
  },
  pillRed: {
    backgroundColor: '#fee4e2',
    borderColor: '#fecdca',
  },
  pillDark: {
    backgroundColor: '#243047',
    borderColor: '#34415b',
  },
  pillTexto: {
    fontSize: 11,
    fontWeight: '900',
  },
  botao: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoPrimario: {
    backgroundColor: LeilaoCores.azul,
  },
  botaoSecundario: {
    backgroundColor: LeilaoCores.ciano,
  },
  botaoPerigo: {
    backgroundColor: LeilaoCores.vermelho,
  },
  botaoEscuro: {
    backgroundColor: LeilaoCores.painel,
  },
  botaoDesabilitado: {
    opacity: 0.48,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  vazio: {
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  vazioTitulo: {
    color: LeilaoCores.texto,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  vazioTexto: {
    color: LeilaoCores.textoSuave,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
