
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Clients</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} drawable="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} drawable="account-circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
