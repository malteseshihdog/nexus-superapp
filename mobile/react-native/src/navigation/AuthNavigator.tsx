import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';
import { THEME } from '../utils/theme';

export type AuthStackParamList = {
  Auth: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: THEME.colors.background } }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
    </Stack.Navigator>
  );
}
