import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, RotateCcw, Home } from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';

export default function ErrorScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const error = useAnalysisStore((state) => state.error);
  const resetStore = useAnalysisStore((state) => state.reset);

  const handleRetry = () => {
    resetStore();
    navigate('HOME');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0F172A']}
        style={styles.gradient}
      >
        <View style={styles.body}>
          {/* Crimson Icon Frame */}
          <View style={styles.alertIconWrapper}>
            <AlertCircle size={40} color="#EF4444" />
          </View>

          <Text style={styles.errorTitle}>Pipeline Failure</Text>
          <Text style={styles.errorDesc}>
            An unexpected interrupt occurred during the autonomous reasoning pipeline execution.
          </Text>

          {/* Diagnostic Container */}
          <View style={styles.diagnosticContainer}>
            <Text style={styles.diagnosticLabel}>DIAGNOSTIC EXCEPTION INFO:</Text>
            <Text style={styles.diagnosticText}>
              {error || 'Connection interrupted. Remote FastAPI worker process returned an unexpected status.'}
            </Text>
          </View>

          {/* CTA Buttons */}
          <TouchableOpacity style={styles.retryBtnWrapper} onPress={handleRetry}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.retryBtn}
            >
              <RotateCcw size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>Re-initialize Gateway</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} onPress={handleRetry}>
            <Home size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <Text style={styles.homeBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
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
  body: {
    width: '100%',
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  alertIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7F1D1D30',
    borderWidth: 1,
    borderColor: '#991B1B40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  errorDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  diagnosticContainer: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 30,
  },
  diagnosticLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  diagnosticText: {
    fontSize: 11,
    color: '#FDA4AF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 15,
  },
  retryBtnWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
  },
  homeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
});
