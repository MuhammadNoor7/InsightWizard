import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useAnalysisStore } from './src/store/useAnalysisStore';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import ApprovalScreen from './src/screens/ApprovalScreen';
import TraceScreen from './src/screens/TraceScreen';
import ErrorScreen from './src/screens/ErrorScreen';

export default function App() {
  const currentScreen = useAnalysisStore((state) => state.currentScreen);

  // Dynamic state-based screen selector (Zero-dependency navigation router)
  const renderScreen = () => {
    switch (currentScreen) {
      case 'SPLASH':
        return <SplashScreen />;
      case 'HOME':
        return <HomeScreen />;
      case 'PROCESSING':
        return <ProcessingScreen />;
      case 'RESULT':
        return <ResultScreen />;
      case 'APPROVAL':
        return <ApprovalScreen />;
      case 'TRACE':
        return <TraceScreen />;
      case 'ERROR':
        return <ErrorScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Match dark premium background
  },
});
