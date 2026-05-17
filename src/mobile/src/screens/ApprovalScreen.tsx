import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  Platform,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, ShieldAlert, CheckCircle2, ChevronRight, Terminal, RefreshCw } from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { approveJob } from '../services/approvalService';

const { width } = Dimensions.get('window');

const SIMULATED_RUN_LOGS = [
  '🔑 Initializing authorization keys via OAuth gateway...',
  '⚙️ Compiling payload matching simulated REST schema...',
  '📡 Authenticating handshake with remote REST endpoint...',
  '🚀 Dispatching POST request to /api/v1/operational-gate...',
  '🟢 HTTP/1.1 200 OK — Action handshake verified.',
  '📨 Packaging Slack / SMS templates from message drafts...',
  '📲 Notification sent successfully to operational leads.',
  '🔒 Locking system states. Transitions successfully committed.'
];

export default function ApprovalScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const result = useAnalysisStore((state) => state.result);
  const currentJobId = useAnalysisStore((state) => state.currentJobId);
  const { executeStatus, executionLogs, setExecuteStatus, addExecutionLog, resetExecutionState } = useAnalysisStore();

  const [isLoading, setIsLoading] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  
  const scrollRef = useRef<ScrollView | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Auto-scroll execution logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [executionLogs]);

  // Entrance animations on success
  useEffect(() => {
    if (executeStatus === 'SUCCESS') {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [executeStatus]);

  if (!result || !result.action.recommended_actions || result.action.recommended_actions.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Missing recommended actions for approval.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('HOME')}>
          <Text style={styles.backBtnText}>Return Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const primaryAction = result.action.recommended_actions[0];

  const handleApproveAction = async () => {
    if (isLoading || executeStatus === 'RUNNING') return;
    
    setIsLoading(true);
    resetExecutionState();
    setExecuteStatus('RUNNING');
    addExecutionLog('🛡️ Human confirmation verified. Initiating simulated action...');

    try {
      // Call actual backend approve endpoint
      await approveJob(result.job_id || currentJobId || '');
      setIsLoading(false);
      
      // Animate the log streaming sequentially
      runSimulatedLogs();
    } catch (err: any) {
      setIsLoading(false);
      setExecuteStatus('FAILED');
      addExecutionLog(`❌ Critical Authorization Failure: ${err.message}`);
    }
  };

  const runSimulatedLogs = () => {
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < SIMULATED_RUN_LOGS.length) {
        addExecutionLog(SIMULATED_RUN_LOGS[index]);
        index++;
      } else {
        clearInterval(interval);
        setExecuteStatus('SUCCESS');
      }
    }, 450);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0F172A']}
        style={styles.gradient}
      >
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigate('RESULT')}>
            <ChevronLeft size={20} color="#94A3B8" />
            <Text style={styles.headerBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Human Approval Gate</Text>
          <View style={styles.badgePlaceholder} />
        </View>

        {executeStatus !== 'SUCCESS' ? (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* Warning Banner */}
            <View style={styles.warnBanner}>
              <ShieldAlert size={20} color="#EF4444" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.warnTitle}>Security Clearance Required</Text>
                <Text style={styles.warnText}>Approving this gate triggers a live simulation API dispatch.</Text>
              </View>
            </View>

            {/* Action Details Card */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Corporate Recommended Action</Text>
              <Text style={styles.actionTitle}>{primaryAction.action}</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>Executive Rationale</Text>
              <Text style={styles.actionText}>{primaryAction.rationale}</Text>
            </View>

            {/* API target info */}
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Simulated Gateway IP:</Text>
                <Text style={styles.metaValue}>127.0.0.1:8000/approve</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Execution Method:</Text>
                <Text style={styles.metaValue}>Double Handshake HTTPS</Text>
              </View>
            </View>

            {/* Execution logs during run */}
            {(executeStatus === 'RUNNING' || executeStatus === 'FAILED' || executionLogs.length > 0) && (
              <View style={styles.consoleContainer}>
                <View style={styles.consoleHeader}>
                  <Terminal size={12} color="#64748B" style={{ marginRight: 6 }} />
                  <Text style={styles.consoleTitle}>Simulated Deployer Console</Text>
                  {executeStatus === 'RUNNING' && <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 'auto' }} />}
                </View>
                <ScrollView ref={scrollRef} style={styles.consoleBody} contentContainerStyle={styles.consoleContent}>
                  {executionLogs.map((log, idx) => (
                    <Text key={idx} style={styles.consoleLogText}>{log}</Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Confirm Button */}
            {executeStatus !== 'RUNNING' && (
              <TouchableOpacity style={styles.approveBtnWrapper} onPress={handleApproveAction}>
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.approveBtn}
                >
                  <Play size={16} color="#FFFFFF" style={{ marginRight: 8 }} fill="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Confirm and Authorize Action</Text>
                  <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          /* SUCCESS STATE CARD (Holographic WOW Presentation) */
          <View style={styles.successWrapper}>
            <Animated.View style={[styles.successCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
              {/* Outer pulsing emerald ring */}
              <View style={styles.successRing}>
                <CheckCircle2 size={48} color="#10B981" />
              </View>
              
              <Text style={styles.successTitle}>Deployment Confirmed</Text>
              <Text style={styles.successSubtitle}>Simulated steps executed successfully through the operational gateway sandbox.</Text>

              <View style={styles.successDivider} />

              <View style={styles.successConsole}>
                <Text style={styles.successConsoleHeader}>SANDBOX LOG DISPATCH RECORD:</Text>
                {SIMULATED_RUN_LOGS.slice(-3).map((log, idx) => (
                  <Text key={idx} style={styles.successConsoleLog}>✔ {log.substring(2)}</Text>
                ))}
              </View>

              <TouchableOpacity style={styles.homeBtn} onPress={() => { resetExecutionState(); navigate('HOME'); }}>
                <Text style={styles.homeBtnText}>Return to Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryTraceBtn} onPress={() => { resetExecutionState(); navigate('TRACE'); }}>
                <Text style={styles.secondaryTraceText}>Review Final Decision Trace</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
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
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#312E81',
    borderRadius: 8,
  },
  backBtnText: {
    color: '#E0E7FF',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#020617',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  badgePlaceholder: {
    width: 50,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  warnBanner: {
    flexDirection: 'row',
    backgroundColor: '#4C0519',
    borderColor: '#9F1239',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  warnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FECDD3',
  },
  warnText: {
    fontSize: 11,
    color: '#FDA4AF',
    marginTop: 2,
    lineHeight: 14,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  actionTitle: {
    fontSize: 14.5,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 14,
  },
  actionText: {
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    fontWeight: '500',
  },
  metaCard: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaKey: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  consoleContainer: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    height: 160,
    overflow: 'hidden',
    marginBottom: 20,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  consoleTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  consoleBody: {
    flex: 1,
  },
  consoleContent: {
    padding: 12,
  },
  consoleLogText: {
    fontSize: 10.5,
    color: '#10B981',
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  approveBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B98135',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 8,
  },
  successRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  successSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    width: '100%',
    marginVertical: 10,
  },
  successConsole: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 24,
  },
  successConsoleHeader: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 1,
  },
  successConsoleLog: {
    fontSize: 10.5,
    color: '#10B981',
    lineHeight: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  homeBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  secondaryTraceBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  secondaryTraceText: {
    color: '#94A3B8',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
