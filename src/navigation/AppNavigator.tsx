import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Splash } from '../screens/Splash';
import { Login } from '../screens/Login';
import { ForgotPassword } from '../screens/ForgotPassword';
import { Dashboard } from '../screens/Dashboard';
import { ResumeBuilder } from '../screens/ResumeBuilder';
import { ATSAnalysis } from '../screens/ATSAnalysis';
import { Account } from '../screens/Account';
import { SmartImport } from '../screens/SmartImport';
import { Resume } from '../types/resume';
import { WebShell } from '../components/WebShell';
import { useResponsive } from '../utils/responsive';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  ResumeBuilder: { resume?: Resume } | undefined;
  ATSAnalysis: { resume: Resume };
  Account: undefined;
  SmartImport: { resume: Resume; onImportCallback?: (updated: Resume) => void };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * HOC: wraps each authenticated screen with the sidebar on desktop web.
 * On mobile/app the shell is a no-op pass-through.
 */
const withWebShell = (
  ScreenComponent: React.ComponentType<any>,
  routeName: string
) => {
  const Wrapped = (props: any) => (
    <WebShell navigation={props.navigation} currentRoute={routeName}>
      <ScreenComponent {...props} />
    </WebShell>
  );
  Wrapped.displayName = `WithShell(${routeName})`;
  return Wrapped;
};

const WebDashboard     = withWebShell(Dashboard,     'Dashboard');
const WebResumeBuilder = withWebShell(ResumeBuilder, 'ResumeBuilder');
const WebATSAnalysis   = withWebShell(ATSAnalysis,   'ATSAnalysis');
const WebAccount       = withWebShell(Account,       'Account');
const WebSmartImport   = withWebShell(SmartImport,   'SmartImport');

export const AppNavigator = () => {
  const { session, loading } = useAuth();
  const { isWeb, isDesktop } = useResponsive();

  const useSidebar = isWeb && isDesktop;

  if (loading) {
    return <Splash />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Group>
          <Stack.Screen
            name="Dashboard"
            component={useSidebar ? WebDashboard : Dashboard}
          />
          <Stack.Screen
            name="ResumeBuilder"
            component={useSidebar ? WebResumeBuilder : ResumeBuilder}
          />
          <Stack.Screen
            name="ATSAnalysis"
            component={useSidebar ? WebATSAnalysis : ATSAnalysis}
          />
          <Stack.Screen
            name="Account"
            component={useSidebar ? WebAccount : Account}
          />
          <Stack.Screen
            name="SmartImport"
            component={useSidebar ? WebSmartImport : SmartImport}
          />
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPassword}
            options={{ presentation: 'modal' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};
