import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { 
  Workflow, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Code2, 
  ListTodo, 
  ArrowRight,
  TrendingUp
} from 'lucide-react-native';

interface SimulationObject {
  action_taken: string;
  mock_api_call: Record<string, any>;
  notification_draft: string;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  execution_log: string[];
}

interface SimulationCardProps {
  simulation: SimulationObject;
}

// Custom lightweight JSON Tokenizer for beautiful syntax highlighting (keys colored blue, values green)
const tokenizeJson = (jsonStr: string) => {
  const regex = /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)|([{}[\]:,])|(\s+)/g;
  
  let match;
  const tokens: Array<{ type: 'key' | 'string_val' | 'number' | 'boolean' | 'null' | 'punctuation' | 'whitespace' | 'text'; value: string }> = [];
  
  let lastIndex = 0;
  while ((match = regex.exec(jsonStr)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: jsonStr.substring(lastIndex, match.index) });
    }
    
    const [
      fullMatch,
      strToken,
      _,
      numToken,
      boolNullToken,
      puncToken,
      wsToken
    ] = match;
    
    if (strToken !== undefined) {
      tokens.push({ type: 'string_val', value: strToken });
    } else if (numToken !== undefined) {
      tokens.push({ type: 'number', value: numToken });
    } else if (boolNullToken !== undefined) {
      if (boolNullToken === 'null') {
        tokens.push({ type: 'null', value: boolNullToken });
      } else {
        tokens.push({ type: 'boolean', value: boolNullToken });
      }
    } else if (puncToken !== undefined) {
      tokens.push({ type: 'punctuation', value: puncToken });
    } else if (wsToken !== undefined) {
      tokens.push({ type: 'whitespace', value: wsToken });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < jsonStr.length) {
    tokens.push({ type: 'text', value: jsonStr.substring(lastIndex) });
  }
  
  // Label keys vs string values
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'string_val') {
      let isKey = false;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'whitespace') continue;
        if (tokens[j].type === 'punctuation' && tokens[j].value === ':') {
          isKey = true;
        }
        break;
      }
      if (isKey) {
        tokens[i].type = 'key';
      }
    }
  }
  
  return tokens;
};

export default function SimulationCard({ simulation }: SimulationCardProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'json'>('table');
  const [showJson, setShowJson] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Helper to safely format JSON
  const prettyPrintJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return '{}';
    }
  };

  const renderHighlightedJson = (obj: any) => {
    const jsonStr = prettyPrintJson(obj);
    const tokens = tokenizeJson(jsonStr);

    return (
      <Text style={styles.consoleCode}>
        {tokens.map((token, index) => {
          let tokenColor = '#94A3B8'; // default punctuation/whitespace color (slate)
          
          if (token.type === 'key') {
            tokenColor = '#38BDF8'; // Key colored blue (neon sky blue)
          } else if (token.type === 'string_val' || token.type === 'number' || token.type === 'boolean' || token.type === 'null') {
            tokenColor = '#34D399'; // Value colored green (emerald)
          } else if (token.type === 'punctuation') {
            tokenColor = '#64748B'; // Muted slate for punctuation
          }

          return (
            <Text key={index} style={{ color: tokenColor }}>
              {token.value}
            </Text>
          );
        })}
      </Text>
    );
  };

  // Extract all keys from states for diff matching
  const beforeKeys = Object.keys(simulation.before_state || {});
  const afterKeys = Object.keys(simulation.after_state || {});
  const allStateKeys = Array.from(new Set([...beforeKeys, ...afterKeys]));

  const formatStateValue = (val: any) => {
    if (val === null || val === undefined) return 'None';
    if (typeof val === 'object') return JSON.stringify(val);
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    return String(val);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Workflow size={18} color="#A78BFA" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Simulated System Sandbox</Text>
      </View>

      <Text style={styles.actionLabel}>Simulated Target Action:</Text>
      <Text style={styles.actionValue}>{simulation.action_taken}</Text>

      <View style={styles.divider} />

      {/* BEFORE / AFTER STATE DIFF PANELS */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TrendingUp size={14} color="#818CF8" style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>State Transitions</Text>
        </View>
        
        {/* Sleek developer-grade segmented control tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'table' && styles.tabActiveButton]}
            onPress={() => setActiveTab('table')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'table' && styles.tabActiveText]}>Table View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'json' && styles.tabActiveButton]}
            onPress={() => setActiveTab('json')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'json' && styles.tabActiveText]}>Raw JSON</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {activeTab === 'table' ? (
        <View style={styles.diffTable}>
          <View style={styles.diffTableHeader}>
            <Text style={[styles.diffHeaderCell, { flex: 1.2 }]}>Variable Field</Text>
            <Text style={styles.diffHeaderCell}>Before</Text>
            <Text style={styles.diffHeaderCell}>After Expected</Text>
          </View>

          {allStateKeys.length === 0 ? (
            <Text style={styles.emptyDiffText}>No state transitions captured.</Text>
          ) : (
            allStateKeys.map((key) => {
              const beforeVal = formatStateValue(simulation.before_state?.[key]);
              const afterVal = formatStateValue(simulation.after_state?.[key]);
              const isChanged = beforeVal !== afterVal;

              const parsePercent = (valStr: string): number | null => {
                const match = valStr.match(/(-?\d+(?:\.\d+)?)\s*%/);
                return match ? parseFloat(match[1]) : null;
              };

              const parseCurrency = (valStr: string): number | null => {
                const match = valStr.replace(/,/g, '').match(/\$\s*(\d+(?:\.\d+)?)/);
                return match ? parseFloat(match[1]) : null;
              };

              let beforePercent = parsePercent(beforeVal);
              let afterPercent = parsePercent(afterVal);
              let isCurrency = false;

              if (beforePercent === null || afterPercent === null) {
                const beforeCurr = parseCurrency(beforeVal);
                const afterCurr = parseCurrency(afterVal);
                if (beforeCurr !== null && afterCurr !== null) {
                  const maxVal = Math.max(beforeCurr, afterCurr, 1);
                  beforePercent = (beforeCurr / maxVal) * 100;
                  afterPercent = (afterCurr / maxVal) * 100;
                  isCurrency = true;
                }
              }

              return (
                <View key={key} style={[styles.diffRowContainer, isChanged && styles.diffRowChanged]}>
                  <View style={styles.diffRow}>
                    <Text style={styles.diffKey} numberOfLines={1}>{key}</Text>
                    <Text style={styles.diffValBefore}>{beforeVal}</Text>
                    <View style={styles.arrowColumn}>
                      <ArrowRight size={10} color="#475569" />
                    </View>
                    <Text style={[styles.diffValAfter, isChanged && styles.diffValAfterChanged]}>
                      {afterVal}
                    </Text>
                  </View>
                  
                  {beforePercent !== null && afterPercent !== null && (
                    <View style={styles.visBarContainer}>
                      {/* Before bar (Crimson/Orange indicator) */}
                      <View style={styles.visBarRow}>
                        <Text style={styles.visBarLabel}>BEFORE</Text>
                        <View style={styles.visBarTrack}>
                          <View style={[styles.visBarFill, { width: `${Math.max(0, Math.min(beforePercent, 100))}%`, backgroundColor: '#F87171' }]} />
                        </View>
                        <Text style={styles.visBarValue}>
                          {isCurrency ? beforeVal.split(' ')[0] : `${beforePercent.toFixed(1)}%`}
                        </Text>
                      </View>
                      
                      {/* After bar (Emerald Green indicator) */}
                      <View style={styles.visBarRow}>
                        <Text style={[styles.visBarLabel, { color: '#34D399' }]}>AFTER</Text>
                        <View style={styles.visBarTrack}>
                          <View style={[styles.visBarFill, { width: `${Math.max(0, Math.min(afterPercent, 100))}%`, backgroundColor: '#34D399' }]} />
                        </View>
                        <Text style={[styles.visBarValue, { color: '#34D399' }]}>
                          {isCurrency ? afterVal.split(' ')[0] : `${afterPercent.toFixed(1)}%`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator style={styles.jsonSideBySideScroll}>
          <View style={styles.jsonSideBySideContainer}>
            {/* Before State Panel */}
            <View style={styles.jsonPanel}>
              <View style={styles.jsonPanelHeader}>
                <Text style={styles.jsonPanelTitle}>BEFORE STATE</Text>
              </View>
              <ScrollView nestedScrollEnabled style={styles.jsonContentScroll}>
                {renderHighlightedJson(simulation.before_state)}
              </ScrollView>
            </View>

            <View style={styles.jsonPanelDivider} />

            {/* After State Panel */}
            <View style={styles.jsonPanel}>
              <View style={styles.jsonPanelHeader}>
                <Text style={[styles.jsonPanelTitle, { color: '#34D399' }]}>AFTER EXPECTED</Text>
              </View>
              <ScrollView nestedScrollEnabled style={styles.jsonContentScroll}>
                {renderHighlightedJson(simulation.after_state)}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      )}

      {/* NOTIFICATION DRAFT SMS/SLACK */}
      <View style={styles.notificationWrapper}>
        <View style={styles.notificationHeader}>
          <Smartphone size={14} color="#818CF8" style={{ marginRight: 6 }} />
          <Text style={styles.notificationTitle}>Channel Notification Draft</Text>
        </View>
        <View style={styles.notificationBubble}>
          <View style={styles.bubbleTop}>
            <View style={styles.bubbleAppIcon} />
            <Text style={styles.bubbleAppName}>NEXUS WORKFLOWS</Text>
            <View style={styles.bubbleDot} />
            <Text style={styles.bubbleTime}>now</Text>
          </View>
          <Text style={styles.bubbleTitle}>Automated Dispatch</Text>
          <Text style={styles.bubbleBody}>{simulation.notification_draft || 'No notification drafted.'}</Text>
        </View>
      </View>

      {/* EXPANDABLE RAW MOCK API CALL */}
      <TouchableOpacity 
        style={styles.expandableToggle} 
        onPress={() => setShowJson(!showJson)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Code2 size={14} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={styles.toggleText}>API Payload Specs</Text>
        </View>
        {showJson ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </TouchableOpacity>

      {showJson && (
        <View style={styles.jsonConsole}>
          <View style={styles.consoleHeader}>
            <Text style={styles.consoleMethod}>{simulation.mock_api_call?.method || 'POST'}</Text>
            <Text style={styles.consoleUrl}>{simulation.mock_api_call?.url || '/api/v1/dispatch'}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator style={styles.consoleScroll}>
            {renderHighlightedJson(simulation.mock_api_call)}
          </ScrollView>
        </View>
      )}

      {/* EXPANDABLE EXECUTION CHECKLIST */}
      <TouchableOpacity 
        style={styles.expandableToggle} 
        onPress={() => setShowLogs(!showLogs)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ListTodo size={14} color="#10B981" style={{ marginRight: 6 }} />
          <Text style={styles.toggleText}>Execution Playbook Logs</Text>
        </View>
        {showLogs ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </TouchableOpacity>

      {showLogs && (
        <View style={styles.logList}>
          {simulation.execution_log?.length === 0 ? (
            <Text style={styles.emptyLogText}>No playbook steps defined.</Text>
          ) : (
            simulation.execution_log?.map((log, index) => (
              <View key={index} style={styles.logItem}>
                <View style={styles.logBullet}>
                  <Text style={styles.logBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.logItemText}>{log}</Text>
              </View>
            ))
          )}
        </View>
      )}
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
  actionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  actionValue: {
    fontSize: 13.5,
    color: '#E2E8F0',
    lineHeight: 18,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#818CF8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diffTable: {
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
    marginBottom: 16,
  },
  diffTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  diffHeaderCell: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    flex: 1,
  },
  emptyDiffText: {
    color: '#475569',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 15,
  },
  diffRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
  },
  diffRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  diffRowChanged: {
    backgroundColor: '#1E1B4B35', // Indigo tinted shift highlight
  },
  visBarContainer: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  visBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  visBarLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#F87171',
    width: 45,
    letterSpacing: 0.5,
  },
  visBarTrack: {
    height: 4,
    backgroundColor: '#0F172A',
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#1E293B',
  },
  visBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  visBarValue: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    width: 50,
    textAlign: 'right',
  },
  diffKey: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    flex: 1.2,
  },
  diffValBefore: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  arrowColumn: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffValAfter: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  diffValAfterChanged: {
    color: '#34D399', // Emerald green upgrade text
    fontWeight: '700',
  },
  notificationWrapper: {
    marginBottom: 14,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationBubble: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bubbleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bubbleAppIcon: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#6366F1',
    marginRight: 6,
  },
  bubbleAppName: {
    fontSize: 8,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  bubbleDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#475569',
    marginHorizontal: 6,
  },
  bubbleTime: {
    fontSize: 8,
    color: '#64748B',
  },
  bubbleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bubbleBody: {
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 15,
  },
  expandableToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 6,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  jsonConsole: {
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    marginBottom: 10,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
  },
  consoleMethod: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38BDF8',
    marginRight: 6,
    backgroundColor: '#0C4A6E',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  consoleUrl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  consoleScroll: {
    maxHeight: 150,
  },
  consoleCode: {
    color: '#34D399',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logList: {
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    marginBottom: 10,
  },
  emptyLogText: {
    color: '#475569',
    fontSize: 11.5,
    textAlign: 'center',
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logBullet: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logBulletText: {
    color: '#10B981',
    fontSize: 8,
    fontWeight: '800',
  },
  logItemText: {
    flex: 1,
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 2,
  },
  tabButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabActiveButton: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabActiveText: {
    color: '#F8FAFC',
  },
  jsonSideBySideScroll: {
    marginBottom: 16,
  },
  jsonSideBySideContainer: {
    flexDirection: 'row',
  },
  jsonPanel: {
    width: 275,
    backgroundColor: '#020617',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
    height: 220,
  },
  jsonPanelHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
    marginBottom: 8,
  },
  jsonPanelTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  jsonPanelDivider: {
    width: 12,
  },
  jsonContentScroll: {
    flex: 1,
  },
});
