import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AbaHaptica } from '@/components/aba-haptica';
import { SplashLogo } from '@/components/splash-logo';
import { IconeSimbolo } from '@/components/ui/icone-simbolo';
import { useAutenticacao } from '@/src/auth/context/contexto-autenticacao';

export default function LayoutAdmin() {
  const { usuario, ehAdmin, carregando } = useAutenticacao();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  if (carregando) {
    return <SplashLogo mensagem="Abrindo painel administrativo..." />;
  }

  if (!usuario) {
    return <Redirect href="/admin-login" />;
  }

  if (!ehAdmin) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: AbaHaptica,
        tabBarActiveTintColor: '#2457d6',
        tabBarInactiveTintColor: '#667085',
        tabBarActiveBackgroundColor: '#e8f0ff',
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
          marginHorizontal: 2,
          paddingVertical: 3,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="resumo"
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="leiloes"
        options={{
          title: 'Lotes',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="gavel.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="participantes"
        options={{
          title: 'Participantes',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="person.3.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vencedores"
        options={{
          title: 'Vencedores',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="rosette" color={color} />,
        }}
      />
      <Tabs.Screen
        name="resgates"
        options={{
          title: 'Entregas',
          tabBarIcon: ({ color }) => <IconeSimbolo size={24} name="shippingbox.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="painel" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
