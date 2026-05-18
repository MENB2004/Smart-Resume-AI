import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { Splash } from '../screens/Splash';
import { Login } from '../screens/Login';
import { ForgotPassword } from '../screens/ForgotPassword';
import { Dashboard } from '../screens/Dashboard';
import { ResumeBuilder } from '../screens/ResumeBuilder';
import { ATSAnalysis } from '../screens/ATSAnalysis';
import { Resume } from '../types/resume';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  ResumeBuilder: { resume?: Resume } | undefined;
  ATSAnalysis: { resume: Resume };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <Splash />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        // User is signed in
        <Stack.Group>
          <Stack.Screen name="Dashboard" component={Dashboard} />
          <Stack.Screen name="ResumeBuilder" component={ResumeBuilder} />
          <Stack.Screen name="ATSAnalysis" component={ATSAnalysis} />
        </Stack.Group>
      ) : (
        // User is not signed in
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
