import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions, 
  Platform,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { 
  Sparkles, 
  FileText, 
  Upload, 
  History, 
  Trash2, 
  ChevronRight, 
  Clock,
  CheckCircle,
  XCircle,
  FileDown
} from 'lucide-react-native';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { postAnalyze, postAnalyzeFile } from '../services/analyzeService';
import { triggerHaptic } from '../services/hapticService';

const { width } = Dimensions.get('window');

const DOMAINS = [
  { id: 'business', label: 'Business Strategy', color: '#3B82F6', icon: '💼' },
  { id: 'policy', label: 'Public Policy', color: '#10B981', icon: '⚖️' },
  { id: 'logistics', label: 'Logistics & Ops', color: '#8B5CF6', icon: '📦' },
  { id: 'finance', label: 'Financial Risks', color: '#F59E0B', icon: '📈' },
  { id: 'news', label: 'Market Intelligence', color: '#EC4899', icon: '📰' },
];

export default function HomeScreen() {
  const navigate = useAnalysisStore((state) => state.navigate);
  const setCurrentJobId = useAnalysisStore((state) => state.setCurrentJobId);
  const setCurrentJobParams = useAnalysisStore((state) => state.setCurrentJobParams);
  const setJobStatus = useAnalysisStore((state) => state.setJobStatus);
  const setError = useAnalysisStore((state) => state.setError);
  const addLog = useAnalysisStore((state) => state.addLog);
  const resetStore = useAnalysisStore((state) => state.reset);
  const history = useAnalysisStore((state) => state.history);
  const clearHistory = useAnalysisStore((state) => state.clearHistory);
  const setResult = useAnalysisStore((state) => state.setResult);

  // Local UI State
  const [content, setContent] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('business');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File picker handler
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
        setContent(''); // Clear manual text if uploading file
      }
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('File Picker Error', 'Could not open document selector.');
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  // Submit pipeline handler
  const handleInitiatePipeline = async () => {
    if (!content.trim() && !selectedFile) {
      Alert.alert('Empty Payload', 'Please type some text content or pick a PDF/TXT file to analyze.');
      return;
    }

    setIsSubmitting(true);
    resetStore(); // Clear previous session state
    setJobStatus('PENDING');

    const jobContent = selectedFile ? `[Document Upload: ${selectedFile.name}]` : content;
    setCurrentJobParams(jobContent, selectedDomain);
    
    try {
      let response;
      if (selectedFile) {
        // File analysis pipeline
        addLog(`Preparing file multipart stream for: ${selectedFile.name}`);
        response = await postAnalyzeFile(
          selectedFile.uri,
          selectedFile.name,
          selectedFile.mimeType || 'application/pdf',
          selectedDomain
        );
      } else {
        // Plain text analysis pipeline
        addLog(`Packaging plain-text payload. Length: ${content.length} characters`);
        response = await postAnalyze(content, selectedDomain);
      }

      if (response && response.job_id) {
        addLog(`Enqueued decision task successfully with Job ID: ${response.job_id}`);
        setCurrentJobId(response.job_id);
        setJobStatus('RUNNING');
        setIsSubmitting(false);
        // Navigate to Processing screen to view real-time logs
        navigate('PROCESSING');
      } else {
        throw new Error('Server returned an empty Job ID.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to connect to the backend API.');
      navigate('ERROR');
    }
  };

  // History reload handler
  const handleReloadHistoryItem = (item: any) => {
    resetStore();
    setCurrentJobParams(item.content, item.domain);
    setCurrentJobId(item.job_id);
    
    if (item.status === 'COMPLETED' && item.result) {
      setResult(item.result);
      navigate('RESULT');
    } else {
      setError('This job failed or did not complete. Loading error details.');
      navigate('ERROR');
    }
  };

  const formatBytes = (bytes: number = 0) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.brandBadge}>
          <Sparkles size={12} color="#818CF8" />
          <Text style={styles.brandBadgeText}>AI DECISION ENGINE</Text>
        </View>
        <Text style={styles.title}>InsightWizard</Text>
        <Text style={styles.subtitle}>Transform unstructured signals into approved system actions.</Text>
      </View>

      {/* Input Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Provide Content Signals</Text>
        
        {selectedFile ? (
          <View style={styles.fileDisplayBox}>
            <View style={styles.fileIconWrapper}>
              <FileDown size={28} color="#818CF8" />
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatBytes(selectedFile.size)}</Text>
            </View>
            <TouchableOpacity style={styles.clearFileBtn} onPress={handleClearFile}>
              <Text style={styles.clearFileText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={6}
            placeholder="Type or paste unstructured text (e.g. strategic briefs, cost adjustments, logistical reports, regulatory shifts) or attach a document below..."
            placeholderTextColor="#64748B"
            value={content}
            onChangeText={setContent}
          />
        )}

        <Text style={styles.dividerText}>— OR —</Text>

        <TouchableOpacity 
          style={[styles.uploadButton, selectedFile && styles.uploadButtonActive]}
          onPress={handlePickDocument}
        >
          <Upload size={16} color={selectedFile ? '#818CF8' : '#94A3B8'} style={{ marginRight: 8 }} />
          <Text style={[styles.uploadButtonText, selectedFile && styles.uploadButtonTextActive]}>
            {selectedFile ? 'Select a different file' : 'Upload PDF or TXT Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Domain Selection */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Choose Analysis Domain</Text>
        <Text style={styles.sectionDesc}>Contextualizes LLM agents for specialized reasoning schemas.</Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.domainScroll}
          contentContainerStyle={styles.domainContainer}
        >
          {DOMAINS.map((domain) => {
            const isSelected = selectedDomain === domain.id;
            return (
              <TouchableOpacity
                key={domain.id}
                style={[
                  styles.domainChip,
                  isSelected && { borderColor: domain.color, backgroundColor: `${domain.color}15` }
                ]}
                onPress={() => {
                  triggerHaptic.lightTap();
                  setSelectedDomain(domain.id);
                }}
              >
                <Text style={styles.domainEmoji}>{domain.icon}</Text>
                <Text style={[styles.domainLabel, isSelected && { color: domain.color, fontWeight: '700' }]}>
                  {domain.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CTA Button */}
      <TouchableOpacity 
        style={styles.submitBtnWrapper} 
        onPress={handleInitiatePipeline}
        disabled={isSubmitting}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.submitBtn}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Initiate Decision Pipeline</Text>
              <ChevronRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* History Panel */}
      <View style={[styles.card, { paddingBottom: 16 }]}>
        <View style={styles.historyHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <History size={16} color="#94A3B8" style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Recent Decisions</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity style={styles.clearAllBtn} onPress={clearHistory}>
              <Trash2 size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Clock size={24} color="#334155" />
            <Text style={styles.emptyHistoryText}>No past decisions found. Your analysis history is saved locally.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {history.map((item, idx) => {
              const domainMeta = DOMAINS.find(d => d.id === item.domain) || DOMAINS[0];
              const isCompleted = item.status === 'COMPLETED';
              
              return (
                <TouchableOpacity 
                  key={item.job_id + idx}
                  style={styles.historyItem}
                  onPress={() => handleReloadHistoryItem(item)}
                >
                  <View style={styles.historyItemMain}>
                    <View style={styles.historyItemMeta}>
                      <View style={[styles.miniDomainBadge, { backgroundColor: `${domainMeta.color}15` }]}>
                        <Text style={[styles.miniDomainText, { color: domainMeta.color }]}>{domainMeta.label}</Text>
                      </View>
                      <Text style={styles.historyTime}>
                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.historySummary} numberOfLines={1}>
                      {item.content}
                    </Text>
                  </View>
                  <View style={styles.historyStatusWrapper}>
                    {isCompleted ? (
                      <CheckCircle size={14} color="#10B981" />
                    ) : (
                      <XCircle size={14} color="#EF4444" />
                    )}
                    <ChevronRight size={16} color="#475569" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617', // Extremely deep premium slate dark
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 24,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderWidth: 1,
    borderColor: '#3730A3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  brandBadgeText: {
    color: '#A5B4FC',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -8,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 14,
    color: '#F1F5F9',
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginVertical: 12,
    letterSpacing: 2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  uploadButtonActive: {
    borderStyle: 'solid',
    borderColor: '#4F46E5',
    backgroundColor: '#1E1B4B',
  },
  uploadButtonText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  uploadButtonTextActive: {
    color: '#A5B4FC',
  },
  fileDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3730A3',
    padding: 12,
  },
  fileIconWrapper: {
    backgroundColor: '#312E81',
    borderRadius: 8,
    padding: 8,
  },
  fileMeta: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fileSize: {
    fontSize: 11,
    color: '#A5B4FC',
    marginTop: 2,
  },
  clearFileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#312E81',
    borderRadius: 6,
  },
  clearFileText: {
    fontSize: 11,
    color: '#E0E7FF',
    fontWeight: '700',
  },
  domainScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  domainContainer: {
    flexDirection: 'row',
    paddingBottom: 2,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
  },
  domainEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  domainLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  submitBtnWrapper: {
    marginBottom: 24,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
  },
  clearAllText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyHistoryText: {
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  historyList: {
    marginTop: 4,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  historyItemMain: {
    flex: 1,
    paddingRight: 12,
  },
  historyItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniDomainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniDomainText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  historyTime: {
    fontSize: 10,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '600',
  },
  historySummary: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  historyStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
