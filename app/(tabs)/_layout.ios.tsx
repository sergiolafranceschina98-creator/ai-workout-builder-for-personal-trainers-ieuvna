
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Clients</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} drawable="group" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
