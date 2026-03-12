import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector } from '../store/store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
