
import { Stack } from 'expo-router';
import React from 'react';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: true,
          title: 'My Clients',
          headerLargeTitle: true,
        }} 
      />
    </Stack>
  );
}
