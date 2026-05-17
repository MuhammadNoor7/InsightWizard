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
  Dimensions,
  PanResponder
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, ShieldAlert, CheckCircle2, ChevronRight, Terminal } from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { approveJob } from '../services/approvalService';
import { triggerHaptic } from '../services/hapticService';

const { width } = Dimensions.get('window');

const DOMAINS: Record<string, { label: string; color: string; icon: string }> = {
  business: { label: 'Business Strategy', color: '#3B82F6', icon: '💼' },
  policy: { label: 'Public Policy', color: '#10B981', icon: '⚖️' },
  logistics: { label: 'Logistics & Ops', color: '#8B5CF6', icon: '📦' },
  finance: { label: 'Financial Risks', color: '#F59E0B', icon: '📈' },
  news: { label: 'Market Intelligence', color: '#EC4899', icon: '📰' },
};

const DOMAIN_PLAYBOOKS: Record<string, string[]> = {
  business: [
    '🔑 Initializing Shopify & Stripe API gateways...',
    '⚙️ Syncing HubSpot & Salesforce CRM contact indices...',
    '📡 Authenticating regional marketing promo compilation...',
    '🚀 Dispatching SMS & push notification templates...',
    '🟢 HTTP/1.1 200 OK — CRM & Stripe payment handshakes verified.',
    '📨 Formatting Shopify checkout success receipt templates...',
    '📲 Push notification dispatched to active retail accounts.',
    '🔒 CRM & Stripe ledger transitions successfully committed.'
  ],
  logistics: [
    '🔑 Initializing telemetry dispatch tower API clearance...',
    '⚙️ Re-routing real-time GPS paths via route-cost engine...',
    '📡 Authenticating terminal hardware endpoints for drivers...',
    '🚀 Locking regional delivery margins and invoice state machine...',
    '🟢 HTTP/1.1 200 OK — Telemetry grid authentications verified.',
    '📨 Dispatching route alerts to active vehicle driver terminals...',
    '📲 Delivery margin lock confirmation sent to operational leads.',
    '🔒 Logistics ledger and transit locks successfully committed.'
  ],
  policy: [
    '🔑 Handshaking with government regulatory & compliance portal...',
    '⚙️ Syncing legislative schemas with legislative database registers...',
    '📡 Compiling executive PDF brief drafts for cabinet review...',
    '🚀 Dispatching secure internal email alerts to legislative leads...',
    '🟢 HTTP/1.1 200 OK — Compliance portal handshake verified.',
    '📨 Finalizing regulatory briefing paper PDFs for distribution...',
    '📲 Email notifications dispatched to designated oversight policy leads.',
    '🔒 Regulatory database schema updates successfully committed.'
  ],
  finance: [
    '🔑 Handshaking with institutional ledger and clearinghouse node...',
    '⚙️ Fetching latest market liquidity schemas & ledger indexes...',
    '📡 Auditing escrow pools & hedging algorithm triggers...',
    '🚀 Securing multi-signature clearance for transaction execution...',
    '🟢 HTTP/1.1 200 OK — Clearinghouse gateway settlements verified.',
    '📨 Packaging compliance and risk report documents for auditors...',
    '📲 Alert dispatched to chief risk officer via encrypted channel.',
    '🔒 Financial transaction registers and ledger locks committed.'
  ],
  news: [
    '🔑 Handshaking with syndicate wire channels & RSS feeder API...',
    '⚙️ Indexing newswire feeds and matching thematic tags...',
    '📡 Checking editorial and plagiarism compliance engines...',
    '🚀 Triggering CDN invalidations for breaking stories worldwide...',
    '🟢 HTTP/1.1 200 OK — News Syndicate RSS handshake verified.',
    '📨 Formatting editorial templates and newsletter wire briefs...',
    '📲 Push alerts dispatched to global subscriber mobile network.',
    '🔒 Feed index database transactions successfully committed.'
  ]
};

export default function ApprovalScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const result = useAnalysisStore((state) => state.result);
  const currentJobId = useAnalysisStore((state) => state.currentJobId);
  const currentDomain = useAnalysisStore((state) => state.currentDomain);
  const { executeStatus, executionLogs, setExecuteStatus, addExecutionLog, resetExecutionState } = useAnalysisStore();

  const selectedDomain = result?.domain || currentDomain || 'business';
  const domainInfo = DOMAINS[selectedDomain.toLowerCase()] || DOMAINS.business;
  const activePlaybook = DOMAIN_PLAYBOOKS[selectedDomain.toLowerCase()] || DOMAIN_PLAYBOOKS.business;

  const [isLoading, setIsLoading] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  
  const scrollRef = useRef<ScrollView | null>(null);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Swipe to deploy state and animations
  const pan = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const containerWidth = trackWidth || (Dimensions.get('window').width - 40);
  const sliderWidth = 54;
  const maxSlideDistance = containerWidth - sliderWidth - 10; // 5px padding on each side
  const hasTriggeredSelection = useRef(false);

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

  // Reset swipe position when execution resets or fails
  useEffect(() => {
    if (executeStatus !== 'RUNNING' && executeStatus !== 'SUCCESS') {
      Animated.spring(pan, {
        toValue: 0,
        friction: 5,
        useNativeDriver: false,
      }).start();
    }
  }, [executeStatus]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLoading && executeStatus !== 'RUNNING',
      onMoveShouldSetPanResponder: () => !isLoading && executeStatus !== 'RUNNING',
      onPanResponderGrant: () => {
        hasTriggeredSelection.current = false;
        triggerHaptic.selection().catch(() => {});
      },
      onPanResponderMove: (evt, gestureState) => {
        const newX = Math.min(Math.max(0, gestureState.dx), maxSlideDistance);
        pan.setValue(newX);

        // Light feedback tick at 50% swipe
        if (newX > maxSlideDistance * 0.5 && !hasTriggeredSelection.current) {
          triggerHaptic.selection().catch(() => {});
          hasTriggeredSelection.current = true;
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx >= maxSlideDistance * 0.8) {
          Animated.timing(pan, {
            toValue: maxSlideDistance,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            handleApproveAction();
          });
        } else {
          // Smooth spring reset
          Animated.spring(pan, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Interpolations for beautiful slider animations
  const fillWidth = pan.interpolate({
    inputRange: [0, maxSlideDistance || 1],
    outputRange: [0, containerWidth],
    extrapolate: 'clamp'
  });

  const textOpacity = pan.interpolate({
    inputRange: [0, maxSlideDistance * 0.4, maxSlideDistance * 0.8 || 1],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp'
  });

  const textScale = pan.interpolate({
    inputRange: [0, maxSlideDistance || 1],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });

  const thumbScale = pan.interpolate({
    inputRange: [0, maxSlideDistance || 1],
    outputRange: [1, 1.05],
    extrapolate: 'clamp'
  });

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
    
    // Trigger security warning double-buzz haptic
    triggerHaptic.warningAlert();
    
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
      // Trigger error haptic
      triggerHaptic.errorAlert();
      setExecuteStatus('FAILED');
      addExecutionLog(`❌ Critical Authorization Failure: ${err.message}`);
    }
  };

  const runSimulatedLogs = () => {
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < activePlaybook.length) {
        addExecutionLog(activePlaybook[index]);
        index++;
      } else {
        clearInterval(interval);
        // Trigger reassuring success haptic on sandbox transition
        triggerHaptic.reassuringPulse();
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
          <Text style={styles.headerTitle}>Approval Gate</Text>
          <View style={[styles.headerDomainBadge, { backgroundColor: `${domainInfo.color}15`, borderColor: `${domainInfo.color}40` }]}>
            <Text style={{ fontSize: 10 }}>{domainInfo.icon}</Text>
            <Text style={[styles.headerDomainText, { color: domainInfo.color }]}>
              {domainInfo.label.split(' ')[0]}
            </Text>
          </View>
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

            {/* Elegant Swipe to Deploy Slider */}
            {executeStatus !== 'RUNNING' && (
              <View 
                style={styles.swipeContainer}
                onLayout={(event) => {
                  const { width: measuredWidth } = event.nativeEvent.layout;
                  if (measuredWidth > 0) {
                    setTrackWidth(measuredWidth);
                  }
                }}
              >
                {/* Background Track with Danger/Clearance Styling */}
                <View style={styles.swipeTrack}>
                  {/* Dynamic Progress Fill */}
                  <Animated.View style={[styles.progressFill, { width: fillWidth }]}>
                    <LinearGradient
                      colors={['#7F1D1D', '#EF4444']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>

                  {/* Centered Instructions Text */}
                  <Animated.View 
                    pointerEvents="none"
                    style={[styles.swipeTextContainer, { opacity: textOpacity, transform: [{ scale: textScale }] }]}
                  >
                    <Text style={styles.swipeText}>SWIPE TO CONFIRM & DEPLOY</Text>
                  </Animated.View>

                  {/* Guide Chevron Indications */}
                  <View style={styles.guideContainer}>
                    <ChevronRight size={16} color="#EF4444" style={styles.guideChevron1} />
                    <ChevronRight size={16} color="#EF4444" style={styles.guideChevron2} />
                  </View>

                  {/* Sliding Handle */}
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.sliderHandle,
                      {
                        transform: [{ translateX: pan }, { scale: thumbScale }]
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={['#FF5F5F', '#EF4444', '#991B1B']}
                      style={styles.handleGradient}
                    >
                      <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                    </LinearGradient>
                  </Animated.View>
                </View>
              </View>
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
              
              {/* Sleek Domain Badge */}
              <View style={[styles.successDomainBadge, { backgroundColor: `${domainInfo.color}15`, borderColor: `${domainInfo.color}40` }]}>
                <Text style={styles.successDomainEmoji}>{domainInfo.icon}</Text>
                <Text style={[styles.successDomainText, { color: domainInfo.color }]}>{domainInfo.label}</Text>
              </View>
              
              <Text style={styles.successSubtitle}>Simulated steps executed successfully through the operational gateway sandbox.</Text>

              <View style={styles.successDivider} />

              <View style={styles.successConsole}>
                <Text style={styles.successConsoleHeader}>SANDBOX LOG DISPATCH RECORD:</Text>
                {activePlaybook.slice(-3).map((log, idx) => (
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
  headerDomainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerDomainText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
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
  swipeContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
  },
  swipeTrack: {
    height: 64,
    borderRadius: 32,
    backgroundColor: '#020617',
    borderWidth: 1.5,
    borderColor: '#EF444444',
    overflow: 'hidden',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 32,
  },
  swipeTextContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 2,
  },
  swipeText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  guideContainer: {
    position: 'absolute',
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  guideChevron1: {
    opacity: 0.25,
  },
  guideChevron2: {
    opacity: 0.55,
    marginLeft: -8,
  },
  sliderHandle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    position: 'absolute',
    left: 5,
    top: 5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  handleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
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
  successDomainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  successDomainEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  successDomainText: {
    fontSize: 12,
    fontWeight: '800',
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
