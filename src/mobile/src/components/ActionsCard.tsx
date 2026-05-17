import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Play, ChevronRight, AlertCircle } from 'lucide-react-native';

interface ActionItem {
  action: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

interface ActionsCardProps {
  actions: ActionItem[];
  onExecute: () => void;
}

export default function ActionsCard({ actions, onExecute }: ActionsCardProps) {
  const getPriorityColor = (pri: string) => {
    switch (pri) {
      case 'high': return { text: '#F43F5E', bg: '#4C0519', border: '#9F1239' };
      case 'medium': return { text: '#F59E0B', bg: '#451A03', border: '#78350F' };
      default: return { text: '#3B82F6', bg: '#1E3A8A', border: '#172554' };
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Zap size={18} color="#F59E0B" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Recommended Operational Actions</Text>
      </View>

      <View style={styles.actionsList}>
        {actions.map((item, idx) => {
          const badge = getPriorityColor(item.priority);
          
          return (
            <View key={idx} style={styles.actionRow}>
              <View style={styles.actionMeta}>
                <View style={styles.numBadge}>
                  <Text style={styles.numText}>{idx + 1}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.priorityText, { color: badge.text }]}>
                    {item.priority.toUpperCase()} PRIORITY
                  </Text>
                </View>
              </View>

              <Text style={styles.actionTitle}>{item.action}</Text>
              
              <View style={styles.rationaleBox}>
                <AlertCircle size={10} color="#94A3B8" style={{ marginRight: 4, marginTop: 2 }} />
                <Text style={styles.rationaleText}>
                  <Text style={{ fontWeight: '700', color: '#94A3B8' }}>Rationale: </Text>
                  {item.rationale}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Main Execution CTA */}
      <TouchableOpacity style={styles.executeButtonWrapper} onPress={onExecute}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.executeButton}
        >
          <Play size={14} color="#FFFFFF" style={{ marginRight: 6 }} fill="#FFFFFF" />
          <Text style={styles.executeButtonText}>Execute Recommended Action</Text>
          <ChevronRight size={16} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
        </LinearGradient>
      </TouchableOpacity>
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
  actionsList: {
    marginTop: 4,
  },
  actionRow: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  actionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionTitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 8,
  },
  rationaleBox: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 10,
    alignItems: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#1E293B',
  },
  rationaleText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 15,
    fontWeight: '500',
  },
  executeButtonWrapper: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  executeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  executeButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
