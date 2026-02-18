
import React from 'react';
import FloatingTabBar from '@/components/FloatingTabBar';
import { Href } from 'expo-router';
import { Stack } from 'expo-router';

export default function TabLayout() {
  const tabs = [
    {
      route: '/(tabs)/(home)' as Href,
      label: 'Clients',
      ios_icon_name: 'person.2.fill',
      android_material_icon_name: 'group' as const,
    },
  ];

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(home)" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
