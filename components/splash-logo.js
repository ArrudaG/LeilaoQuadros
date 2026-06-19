import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { MarcaLeilao, PulsoLogo } from './ui/leilao-design';

export function SplashLogo({ mensagem = 'Carregando leilões...' }) {
  return (
    <View style={styles.container}>
      <PulsoLogo style={styles.logoBox}>
        <MarcaLeilao claro />
      </PulsoLogo>
      <Text style={styles.subtitulo}>{mensagem}</Text>
      <ActivityIndicator color="#2563eb" style={styles.loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1020',
    padding: 24,
  },
  logoBox: {
    marginBottom: 18,
  },
  titulo: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
  },
  subtitulo: {
    color: '#c9d4e8',
    fontSize: 14,
    marginTop: 6,
  },
  loading: {
    marginTop: 18,
  },
});
