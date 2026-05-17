import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions, 
  Platform,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Terminal, Shield, Cpu, Activity, ArrowRight } from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useSSEStream } from '../hooks/useSSEStream';
import { API_BASE_URL } from '../services/api';

const { width } = Dimensions.get('window');

const PIPELINE_STAGES = [
  { key: 'ingest', name: 'Document Ingestion', desc: 'Facts, entities, and signal extraction', progressMin: 0, progressMax: 25 },
  { key: 'insight', name: 'Strategic Insight', desc: 'Confidence assessment & interpretations', progressMin: 26, progressMax: 50 },
  { key: 'impact', name: 'Impact & Risk Assessment', desc: 'Consequence modeling & severity ratings', progressMin: 51, progressMax: 75 },
  { key: 'action', name: 'Action & Simulation', desc: 'Mock API outputs and before/after states', progressMin: 76, progressMax: 95 },
];

export default function ProcessingScreen() {
  const { currentJobId, logs, progress, jobStatus } = useAnalysisStore();
  
  // Activate the real-time SSE listener
  useSSEStream(API_BASE_URL);

  const scrollRef = useRef<ScrollView | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [logs]);

  // Pulse animation for active glowing indicator
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0F172A']}
        style={styles.gradient}
      >
        {/* Progress Bar Header */}
        <View style={styles.topProgress}>
          <View style={styles.progressHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Activity size={14} color="#818CF8" style={{ marginRight: 6 }} />
              <Text style={styles.processingText}>DECISION PIPELINE RUNNING</Text>
            </View>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <LinearGradient
              colors={['#4F46E5', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progress}%` }]}
            />
          </View>
        </View>

        {/* Orbit Orb Visualizer */}
        <View style={styles.visualizerContainer}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#6366F1', '#EC4899']}
              style={styles.glowRingInner}
            />
          </Animated.View>
          <View style={styles.orbCenter}>
            <Cpu size={24} color="#FFFFFF" />
          </View>
        </View>

        {/* Pipeline Pipeline Stage Cards */}
        <View style={styles.pipelineTrace}>
          {PIPELINE_STAGES.map((stage) => {
            const isCompleted = progress > stage.progressMax;
            const isActive = progress >= stage.progressMin && progress <= stage.progressMax;
            const isPending = progress < stage.progressMin;

            return (
              <View 
                key={stage.key}
                style={[
                  styles.stageRow,
                  isActive && styles.stageRowActive,
                  isCompleted && styles.stageRowCompleted
                ]}
              >
                {/* Timeline connector dot */}
                <View style={styles.timelineColumn}>
                  <View style={[
                    styles.timelineDot,
                    isCompleted && styles.timelineDotCompleted,
                    isActive && styles.timelineDotActive
                  ]}>
                    {isActive ? (
                      <ActivityIndicator size="small" color="#818CF8" />
                    ) : isCompleted ? (
                      <View style={styles.dotCheck} />
                    ) : null}
                  </View>
                  <View style={[
                    styles.timelineLine,
                    isCompleted && styles.timelineLineCompleted
                  ]} />
                </View>

                {/* Stage Info */}
                <View style={styles.stageContent}>
                  <Text style={[
                    styles.stageName, 
                    isActive && { color: '#818CF8', fontWeight: '700' },
                    isCompleted && { color: '#F1F5F9' }
                  ]}>
                    {stage.name}
                  </Text>
                  <Text style={styles.stageDesc}>{stage.desc}</Text>
                </View>
                
                {isCompleted && (
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyText}>READY</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Terminal Logger */}
        <View style={styles.terminalContainer}>
          <View style={styles.terminalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Terminal size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.terminalTitle}>System Logs</Text>
            </View>
            <View style={styles.terminalDotRow}>
              <View style={[styles.termDot, { backgroundColor: '#EF4444' }]} />
              <View style={[styles.termDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.termDot, { backgroundColor: '#10B981' }]} />
            </View>
          </View>
          
          <ScrollView 
            ref={scrollRef}
            style={styles.terminalBody}
            contentContainerStyle={styles.terminalContent}
            showsVerticalScrollIndicator={true}
          >
            {logs.length === 0 ? (
              <Text style={styles.terminalPlaceholder}>Awaiting socket gateway connection...</Text>
            ) : (
              logs.map((log, idx) => (
                <View key={idx} style={styles.logRow}>
                  <Text style={styles.terminalPrompt}>$</Text>
                  <Text style={styles.logText}>{log}</Text>
                </View>
              ))
            )}
          </ScrollView>
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topProgress: {
    width: '100%',
    marginBottom: 20,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  processingText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  progressPercent: {
    color: '#818CF8',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  visualizerContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  glowRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  glowRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
  },
  orbCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  pipelineTrace: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginVertical: 10,
  },
  stageRow: {
    flexDirection: 'row',
    height: 52,
    opacity: 0.4,
  },
  stageRowActive: {
    opacity: 1,
  },
  stageRowCompleted: {
    opacity: 0.9,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#818CF8',
    borderWidth: 1,
  },
  timelineDotCompleted: {
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCheck: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#818CF8',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#1E293B',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#312E81',
  },
  stageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stageName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  stageDesc: {
    fontSize: 10,
    color: '#475569',
    marginTop: 2,
  },
  readyBadge: {
    backgroundColor: '#064E3B',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'center',
  },
  readyText: {
    color: '#34D399',
    fontSize: 8,
    fontWeight: '800',
  },
  terminalContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  terminalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  terminalTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  terminalDotRow: {
    flexDirection: 'row',
  },
  termDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  terminalBody: {
    flex: 1,
  },
  terminalContent: {
    padding: 12,
  },
  terminalPlaceholder: {
    color: '#475569',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  terminalPrompt: {
    color: '#818CF8',
    fontSize: 11,
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
  },
  logText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
