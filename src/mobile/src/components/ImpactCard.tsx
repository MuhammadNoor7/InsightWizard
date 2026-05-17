import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertOctagon, Flame } from 'lucide-react-native';

interface ImpactItem {
  insight: string;
  consequence: string;
  severity: 'high' | 'medium' | 'low';
}

interface ImpactCardProps {
  impact: {
    impacts: ImpactItem[];
    summary: string;
    reasoning: string;
    key_decisions: string[];
  };
}

export default function ImpactCard({ impact }: ImpactCardProps) {
  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'high':
        return {
          colors: ['#EF4444', '#B91C1C'] as [string, string],
          text: '#FCA5A5',
          bg: '#7F1D1D',
          width: '100%',
        };
      case 'medium':
        return {
          colors: ['#F59E0B', '#D97706'] as [string, string],
          text: '#FDE68A',
          bg: '#78350F',
          width: '65%',
        };
      default:
        return {
          colors: ['#3B82F6', '#1D4ED8'] as [string, string],
          text: '#BFDBFE',
          bg: '#1E3A8A',
          width: '35%',
        };
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AlertOctagon size={18} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Downstream Impacts & Risks</Text>
      </View>

      <Text style={styles.summaryText}>{impact.summary}</Text>
      <View style={styles.divider} />

      <View style={styles.impactsList}>
        {impact.impacts.map((item, idx) => {
          const style = getSeverityStyle(item.severity);
          
          return (
            <View key={idx} style={styles.impactRow}>
              <View style={styles.impactMeta}>
                <Text style={styles.impactInsight} numberOfLines={1}>{item.insight}</Text>
                <View style={[styles.severityBadge, { backgroundColor: style.bg }]}>
                  <Flame size={8} color={style.text} style={{ marginRight: 2 }} />
                  <Text style={[styles.severityText, { color: style.text }]}>
                    {item.severity.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.consequenceText}>{item.consequence}</Text>
              
              {/* Dynamic Fill Bar */}
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={style.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barFill, { width: style.width as any }]}
                />
              </View>
            </View>
          );
        })}
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
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  impactsList: {
    marginTop: 4,
  },
  impactRow: {
    marginBottom: 16,
  },
  impactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  impactInsight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A5B4FC',
    flex: 1,
    paddingRight: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  consequenceText: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 17,
    fontWeight: '500',
    marginBottom: 8,
  },
  barTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
