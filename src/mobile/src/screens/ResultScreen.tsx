import React from 'react';
import { StyleSheet, Text, View, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, ChevronLeft, Layers, ShieldCheck } from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';
import InsightCard from '../components/InsightCard';
import ImpactCard from '../components/ImpactCard';
import SimulationCard from '../components/SimulationCard';
import ActionsCard from '../components/ActionsCard';
import ShareCard from '../components/ShareCard';

export default function ResultScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const result = useAnalysisStore((state) => state.result);
  const currentJobId = useAnalysisStore((state) => state.currentJobId);
  const currentDomain = useAnalysisStore((state) => state.currentDomain);
  const resetStore = useAnalysisStore((state) => state.reset);

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No analytical results found in the session store.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('HOME')}>
          <Text style={styles.backBtnText}>Return to Gateway</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleNavigateToApproval = () => {
    navigate('APPROVAL');
  };

  const handleNavigateToTrace = () => {
    navigate('TRACE');
  };

  const handleRunAgain = () => {
    resetStore();
    navigate('HOME');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#020617', '#0F172A']}
        style={styles.gradient}
      >
        {/* Sticky Dashboard Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={handleRunAgain}>
            <ChevronLeft size={20} color="#94A3B8" />
            <Text style={styles.headerBackText}>Reset</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Layers size={14} color="#818CF8" style={{ marginRight: 6 }} />
            <Text style={styles.headerTitle}>Decision Brief</Text>
          </View>
          <View style={styles.statusBadge}>
            <CheckCircle2 size={10} color="#10B981" style={{ marginRight: 3 }} />
            <Text style={styles.statusBadgeText}>PARSED</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollDeck} 
          contentContainerStyle={styles.scrollDeckContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Job ID Tag */}
          <View style={styles.jobTagRow}>
            <Text style={styles.jobTagLabel}>JOB RESOLVED:</Text>
            <Text style={styles.jobTagValue} numberOfLines={1}>{result.job_id || currentJobId}</Text>
          </View>

          {/* 1. Insight Card */}
          <InsightCard insight={result.insight} />

          {/* 2. Impact Card */}
          <ImpactCard impact={result.impact} />

          {/* 3. Actions Card */}
          <ActionsCard 
            actions={result.action.recommended_actions} 
            onExecute={handleNavigateToApproval} 
          />

          {/* 4. Simulation Card */}
          <SimulationCard simulation={result.action.simulation} />

          {/* 5. Utility Share Card */}
          <ShareCard 
            result={result} 
            onViewTrace={handleNavigateToTrace} 
            onRunAgain={handleRunAgain} 
          />
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#34D399',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollDeck: {
    flex: 1,
  },
  scrollDeckContent: {
    padding: 20,
    paddingBottom: 40,
  },
  jobTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  jobTagLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  jobTagValue: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 6,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
