import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Eye, ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react-native';

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
});
