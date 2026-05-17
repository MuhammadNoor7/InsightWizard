import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Eye, ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface InsightCardProps {
  insight: {
    insights: string[];
    confidence: 'high' | 'medium' | 'low';
    summary: string;
    reasoning: string;
    key_decisions: string[];
  };
}

export default function InsightCard({ insight }: InsightCardProps) {
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return { text: '#10B981', bg: '#064E3B', icon: ShieldCheck };
      case 'medium': return { text: '#F59E0B', bg: '#78350F', icon: HelpCircle };
      default: return { text: '#EF4444', bg: '#7A1C1C', icon: AlertTriangle };
    }
  };

  const confMeta = getConfidenceColor(insight.confidence);
  const IconComponent = confMeta.icon;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Eye size={18} color="#818CF8" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Strategic Insights</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: confMeta.bg }]}>
          <IconComponent size={10} color={confMeta.text} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: confMeta.text }]}>
            {insight.confidence.toUpperCase()} CONFIDENCE
          </Text>
        </View>
      </View>

      <Text style={styles.summaryText}>{insight.summary}</Text>

      {/* Dynamic Confidence Meter Bar */}
      <View style={styles.confidenceGaugeContainer}>
        <View style={styles.gaugeLabelRow}>
          <Text style={styles.gaugeLabel}>Analytical Confidence Score</Text>
          <Text style={[styles.gaugeValue, { color: confMeta.text }]}>
            {insight.confidence.toUpperCase()} ({insight.confidence === 'high' ? '92%' : insight.confidence === 'medium' ? '65%' : '35%'})
          </Text>
        </View>
        <View style={styles.gaugeTrack}>
          <LinearGradient
            colors={insight.confidence === 'high' ? ['#10B981', '#059669'] : insight.confidence === 'medium' ? ['#F59E0B', '#D97706'] : ['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.gaugeFill, 
              { width: insight.confidence === 'high' ? '92%' : insight.confidence === 'medium' ? '65%' : '35%' }
            ]}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.subTitle}>Core Findings</Text>
      <View style={styles.list}>
        {insight.insights.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.bullet} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 10,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  list: {
    marginTop: 4,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginTop: 6,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
    fontWeight: '500',
  },
  confidenceGaugeContainer: {
    marginBottom: 16,
    backgroundColor: '#0A0F1D',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  gaugeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  gaugeValue: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 3,
  },
});
