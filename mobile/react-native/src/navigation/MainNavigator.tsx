import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProjectListScreen from '../screens/ProjectListScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import EditorScreen from '../screens/EditorScreen';
import TerminalScreen from '../screens/TerminalScreen';
import DeploymentScreen from '../screens/DeploymentScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { THEME } from '../utils/theme';

export type MainStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  Editor: { projectId: string; fileId?: string };
  Terminal: { projectId: string };
  Deployment: { projectId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: THEME.colors.surface },
  headerTintColor: THEME.colors.textPrimary,
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: THEME.colors.background },
};

export default function MainNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProjectList" component={ProjectListScreen} options={{ title: 'Projects' }} />
      <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} options={{ title: 'Project' }} />
      <Stack.Screen name="Editor" component={EditorScreen} options={{ title: 'Editor', headerShown: false }} />
      <Stack.Screen name="Terminal" component={TerminalScreen} options={{ title: 'Terminal' }} />
      <Stack.Screen name="Deployment" component={DeploymentScreen} options={{ title: 'Deployments' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
