import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AbaHaptica } from '@/components/aba-haptica';
import { SplashLogo } from '@/components/splash-logo';
import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { useAutenticacao } from '@/src/auth/context/contexto-autenticacao';

export default function LayoutAbas() {
  const { usuario, carregando } = useAutenticacao();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  if (carregando) {
    return <SplashLogo mensagem="Preparando sua sala de leilões..." />;
  }

  if (!usuario) {
    return <Redirect href="/login" />;
  }

  if (usuario?.role === 'admin') {
    return <Redirect href="/admin/resumo" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2457d6',
        tabBarInactiveTintColor: '#667085',
        tabBarActiveBackgroundColor: '#e8f0ff',
        headerShown: false,
        tabBarButton: AbaHaptica,
        tabBarShowLabel: true,
        sceneStyle: {
          backgroundColor: '#f4f7fb',
          paddingTop: insets.top,
        },
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: '#d8dee9',
          shadowColor: '#101828',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 8,
        },
        tabBarItemStyle: {
          borderRadius: 8,
          marginVertical: 7,
          marginHorizontal: 3,
          paddingVertical: 3,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leiloes"
        options={{
          title: 'Leilões',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="list.bullet.rectangle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="conquistas"
        options={{
          title: 'Conquistas',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="trophy.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="person.crop.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
