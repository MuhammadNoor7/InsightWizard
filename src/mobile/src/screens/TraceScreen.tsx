import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  Alert,
  ActivityIndicator,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { 
  ChevronLeft, 
  FileJson, 
  ChevronDown, 
  ChevronUp, 
  BrainCircuit, 
  UserCheck, 
  Eye, 
  Share2 
} from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';

export default function TraceScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const trace = useAnalysisStore((state) => state.trace);
  const result = useAnalysisStore((state) => state.result);

  // Local state to track which step cards are expanded
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    0: true, // Expand first step by default
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleExpand = (index: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // High-fidelity JSON file export and share
  const handleExportTraceJson = async () => {
    if (trace.length === 0) {
      Alert.alert('Empty Trace', 'No decision logs are available to export.');
      return;
    }
    
    setIsExporting(true);
    try {
      const fileName = `nexus_trace_${result?.job_id.substring(0, 8) || 'run'}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      const serializedData = JSON.stringify(trace, null, 2);
      await FileSystem.writeAsStringAsync(fileUri, serializedData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Agent Trace Logs',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing services are not supported.');
      }
    } catch (err: any) {
      console.error('Trace export error:', err);
      Alert.alert('Export Failed', 'An error occurred during report compilation: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (trace.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No decision trace logs found in the session store.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('RESULT')}>
          <Text style={styles.backBtnText}>Return to Brief</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            <Text style={styles.headerBackText}>Brief</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Logic Trace</Text>
          
          <TouchableOpacity 
            style={styles.exportHeaderBtn} 
            onPress={handleExportTraceJson}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#818CF8" />
            ) : (
              <Share2 size={16} color="#818CF8" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {/* Dashboard Description Card */}
          <View style={styles.introCard}>
            <BrainCircuit size={20} color="#818CF8" style={{ marginBottom: 8 }} />
            <Text style={styles.introTitle}>Multi-Agent Orchestration Log</Text>
            <Text style={styles.introText}>
              Review the sequential reasoning pathways. Each agent’s output is guaranteed through Pydantic-validated LLM schemas.
            </Text>
          </View>

          {/* Timeline Deck */}
          <View style={styles.timelineDeck}>
            {trace.map((step, index) => {
              const isExpanded = !!expandedSteps[index];
              const isLast = index === trace.length - 1;

              return (
                <View key={index} style={styles.timelineNode}>
                  {/* Vertical Flow Line */}
                  <View style={styles.flowColumn}>
                    <View style={styles.stepOrb}>
                      <Text style={styles.stepOrbText}>{index + 1}</Text>
                    </View>
                    {!isLast && <View style={styles.flowLine} />}
                  </View>

                  {/* Panel Card */}
                  <View style={styles.nodeCard}>
                    <TouchableOpacity 
                      style={styles.cardHeader} 
                      onPress={() => toggleExpand(index)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.agentName}>{step.agent}</Text>
                        <Text style={styles.agentScope}>Progress Checkpoint: {step.progress}%</Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#64748B" />
                      ) : (
                        <ChevronDown size={16} color="#64748B" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.cardBody}>
                      <Text style={styles.summaryTitle}>Objective Output:</Text>
                      <Text style={styles.summaryText}>{step.output_summary}</Text>

                      {isExpanded && (
                        <Animated.View style={styles.expandedContent}>
                          <View style={styles.expandedDivider} />
                          
                          {/* Chain of Thought Reasoning */}
                          <Text style={styles.detailsLabel}>Internal Reasoning Chain:</Text>
                          <Text style={styles.detailsText}>{step.reasoning}</Text>

                          {/* Critical Decisions List */}
                          {step.key_decisions && step.key_decisions.length > 0 && (
                            <View style={styles.decisionsBox}>
                              <Text style={styles.detailsLabel}>Critical Filtering Decisions:</Text>
                              {step.key_decisions.map((decision, dIdx) => (
                                <View key={dIdx} style={styles.decisionRow}>
                                  <UserCheck size={10} color="#10B981" style={{ marginRight: 6, marginTop: 4 }} />
                                  <Text style={styles.decisionText}>{decision}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </Animated.View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  exportHeaderBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  introText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  timelineDeck: {
    paddingLeft: 4,
  },
  timelineNode: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  flowColumn: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  stepOrb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#818CF8',
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  stepOrbText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  flowLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#1E293B',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 4,
  },
  nodeCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B40',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  agentName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  agentScope: {
    fontSize: 10,
    color: '#818CF8',
    marginTop: 2,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 17,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 12,
  },
  expandedDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
    fontWeight: '500',
    marginBottom: 12,
  },
  decisionsBox: {
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  decisionText: {
    flex: 1,
    fontSize: 11.5,
    color: '#A5B4FC',
    lineHeight: 15,
    fontWeight: '600',
  },
});
