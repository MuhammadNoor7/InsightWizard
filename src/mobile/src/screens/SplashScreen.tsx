import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalysisStore } from '../store/useAnalysisStore';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const loadHistory = useAnalysisStore((state) => state.loadHistory);
  
  // Animation hooks
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const logoSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Proactively pre-load past job history from local storage
    loadHistory();

    // Sequence the premium entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoSpin, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ]).start();

    // Transition to Home after brand presentation delay
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => navigate('HOME'));
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const spin = logoSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#020617']}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.brandWrapper, 
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Glowing brand backdrop bubble */}
          <View style={styles.glowBubble} />
          
          <Animated.View style={[styles.hexShield, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={['#6366F1', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoHex}
            >
              <Text style={styles.logoChar}>N</Text>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>N E X U S</Text>
          <Text style={styles.subtitle}>AUTONOMOUS DECISION GATEWAY</Text>
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.footerText}>POWERED BY GEMINI 2.5 FLASH</Text>
          <View style={styles.spinnerTrack}>
            <LinearGradient
              colors={['#6366F1', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.spinnerBar}
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowBubble: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#6366F1',
    opacity: 0.1,
  },
  hexShield: {
    width: 90,
    height: 90,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  logoHex: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoChar: {
    fontSize: 38,
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue-CondensedBold' : 'sans-serif-condensed',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 24,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    letterSpacing: 4,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 2,
    fontWeight: '700',
  },
  spinnerTrack: {
    width: width * 0.4,
    height: 3,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  spinnerBar: {
    width: '50%',
    height: '100%',
  },
});
