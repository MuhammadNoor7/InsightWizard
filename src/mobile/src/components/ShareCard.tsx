import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Share2, FileSpreadsheet, RotateCcw, FileText } from 'lucide-react-native';
import { useAnalysisStore, AnalysisResult } from '../store/useAnalysisStore';

interface ShareCardProps {
  result: AnalysisResult;
  onViewTrace: () => void;
  onRunAgain: () => void;
}

export default function ShareCard({ result, onViewTrace, onRunAgain }: ShareCardProps) {
  const [isExporting, setIsExporting] = useState(false);

  // High-fidelity JSON file export and share
  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const fileName = `nexus_decision_${result.job_id.substring(0, 8)}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      
      const serializedData = JSON.stringify(result, null, 2);
      await FileSystem.writeAsStringAsync(fileUri, serializedData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Nexus Decision Report',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing services are not supported on this device.');
      }
    } catch (err: any) {
      console.error('File export error:', err);
      Alert.alert('Export Failed', 'An error occurred during report compilation: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Report Orchestration Utilities</Text>
      <Text style={styles.cardDesc}>Export decision schemas or review the internal multi-agent logic.</Text>

      <View style={styles.buttonGrid}>
        {/* View Trace Button */}
        <TouchableOpacity style={[styles.actionBtn, styles.traceBtn]} onPress={onViewTrace}>
          <FileText size={16} color="#A78BFA" style={{ marginBottom: 6 }} />
          <Text style={styles.btnText}>View Trace</Text>
        </TouchableOpacity>

        {/* Share JSON Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, styles.shareBtn]} 
          onPress={handleExportJson}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#38BDF8" style={{ marginBottom: 6 }} />
          ) : (
            <Share2 size={16} color="#38BDF8" style={{ marginBottom: 6 }} />
          )}
          <Text style={styles.btnText}>Share JSON</Text>
        </TouchableOpacity>

        {/* Restart/Run Again Button */}
        <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={onRunAgain}>
          <RotateCcw size={16} color="#EF4444" style={{ marginBottom: 6 }} />
          <Text style={styles.btnText}>Run Again</Text>
        </TouchableOpacity>
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 15,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  traceBtn: {
    backgroundColor: '#1E1B4B40',
    borderColor: '#4C1D95',
  },
  shareBtn: {
    backgroundColor: '#0C4A6E40',
    borderColor: '#0369A1',
  },
  resetBtn: {
    backgroundColor: '#7F1D1D30',
    borderColor: '#991B1B',
  },
  btnText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
});
