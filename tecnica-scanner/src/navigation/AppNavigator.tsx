import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingScreen   from '@/screens/LandingScreen';
import HomeScreen      from '@/screens/HomeScreen';
import ScanningScreen  from '@/screens/ScanningScreen';
import ResultScreen    from '@/screens/ResultScreen';
import LoginScreen     from '@/screens/LoginScreen';
import AdminScreen     from '@/screens/AdminScreen';
import BatchScreen     from '@/screens/BatchScreen';
import RegisterScreen  from '@/screens/RegisterScreen';
import LanciosScreen   from '@/screens/LanciosScreen';
import LancioDetail    from '@/screens/LancioDetailScreen';
import ListafaScreen   from '@/screens/ListafaScreen';
import BollaScreen     from '@/screens/BollaScreen';

export type RootStackParamList = {
  Landing:      undefined;
  Home:         undefined;
  Scanning:     { mode?: 'view' | 'reg-material' | 'reg-location' };
  Result:       { assetId: string; fromScan?: boolean };
  Login:        { returnTo?: keyof RootStackParamList };
  Admin:        undefined;
  Batch:        undefined;
  Register:     undefined;
  Lancios:      undefined;
  LancioDetail: { lancioIdx: number; fromScan?: boolean };
  Listafa:      { lancioIdx: number };
  Bolla:        { lancioIdx: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Landing"      component={LandingScreen} />
        <Stack.Screen name="Home"         component={HomeScreen} />
        <Stack.Screen name="Scanning"     component={ScanningScreen} />
        <Stack.Screen name="Result"       component={ResultScreen} />
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="Admin"        component={AdminScreen} />
        <Stack.Screen name="Batch"        component={BatchScreen} />
        <Stack.Screen name="Register"     component={RegisterScreen} />
        <Stack.Screen name="Lancios"      component={LanciosScreen} />
        <Stack.Screen name="LancioDetail" component={LancioDetail} />
        <Stack.Screen name="Listafa"      component={ListafaScreen} />
        <Stack.Screen name="Bolla"        component={BollaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
