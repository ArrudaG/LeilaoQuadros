import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export function EntradaAutenticacao({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  autoComplete = 'off',
  autoCorrect = false,
  importantForAutofill = 'no',
  keyboardType = 'default',
  textContentType = 'none',
  ...props
}) {
  return (
    <View style={styles.caixaCampo}>
      <Text style={styles.rotulo}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        importantForAutofill={importantForAutofill}
        keyboardType={keyboardType}
        textContentType={textContentType}
        style={styles.entrada}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  caixaCampo: {
    width: '100%',
    marginBottom: 14,
  },
  rotulo: {
    marginBottom: 7,
    fontSize: 13,
    color: '#344054',
    fontWeight: '800',
  },
  entrada: {
    borderWidth: 1,
    borderColor: '#cfd7e6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f9fbff',
    color: '#101828',
    minHeight: 48,
  },
});
