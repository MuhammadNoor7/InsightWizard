import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TraceStep {
  agent: string;
  output_summary: string;
  reasoning: string;
  key_decisions: string[];
  progress: number;
}

export interface AnalysisResult {
  job_id: string;
  domain: string;
  ingest: any;
  insight: any;
  impact: any;
  action: any;
}

interface AnalysisState {
  currentJobId: string | null;
  jobStatus: 'IDLE' | 'PENDING' | 'RUNNING' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'FAILED';
  logs: string[];
  trace: TraceStep[];
  progress: number;
  result: AnalysisResult | null;
  error: string | null;
  
  // Navigation & Multi-screen State
  currentScreen: 'SPLASH' | 'HOME' | 'PROCESSING' | 'RESULT' | 'APPROVAL' | 'TRACE' | 'ERROR';
  currentDomain: string;
  currentContent: string;
  history: any[];
  
  // Simulated Action Execution State
  executeStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  executionLogs: string[];

  // Basic Actions
  setCurrentJobId: (jobId: string | null) => void;
  setJobStatus: (status: AnalysisState['jobStatus']) => void;
  addLog: (log: string) => void;
  addTrace: (step: TraceStep) => void;
  setProgress: (val: number) => void;
  setResult: (res: AnalysisResult) => void;
  setError: (err: string | null) => void;
  reset: () => void;
  
  // Navigation & Multi-screen Actions
  navigate: (screen: AnalysisState['currentScreen']) => void;
  setCurrentJobParams: (content: string, domain: string) => void;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  saveJobToHistory: (job: any) => Promise<void>;
  
  // Simulated Action Execution Actions
  setExecuteStatus: (status: AnalysisState['executeStatus']) => void;
  addExecutionLog: (log: string) => void;
  resetExecutionState: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentJobId: null,
  jobStatus: 'IDLE',
  logs: [],
  trace: [],
  progress: 0,
  result: null,
  error: null,
  
  // Navigation & Multi-screen State
  currentScreen: 'SPLASH',
  currentDomain: 'business',
  currentContent: '',
  history: [],
  
  // Simulated Action Execution State
  executeStatus: 'IDLE',
  executionLogs: [],
  
  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),
  setJobStatus: (status) => set((state) => {
    let nextScreen = state.currentScreen;
    if (status === 'RUNNING') {
      nextScreen = 'PROCESSING';
    } else if (status === 'AWAITING_APPROVAL') {
      nextScreen = 'APPROVAL';
    }
    return { jobStatus: status, currentScreen: nextScreen };
  }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  addTrace: (step) => set((state) => ({ trace: [...state.trace, step] })),
  setProgress: (val) => set({ progress: val }),
  setResult: (res) => set((state) => {
    const nextStatus = state.jobStatus === 'AWAITING_APPROVAL' ? 'AWAITING_APPROVAL' : 'COMPLETED';
    const nextScreen = nextStatus === 'AWAITING_APPROVAL' ? 'APPROVAL' : 'RESULT';
    
    // Save new analysis session to local storage history
    const historyItem = {
      job_id: res.job_id || state.currentJobId || '',
      content: state.currentContent || '[Text Content Upload]',
      domain: res.domain || state.currentDomain,
      status: 'COMPLETED',
      result: res,
      date: new Date().toISOString()
    };
    
    setTimeout(() => {
      state.saveJobToHistory(historyItem);
    }, 0);

    return { 
      result: res, 
      jobStatus: nextStatus, 
      progress: 100, 
      currentScreen: nextScreen 
    };
  }),
  setError: (err) => set((state) => ({ 
    error: err, 
    jobStatus: 'FAILED', 
    currentScreen: err ? 'ERROR' : state.currentScreen 
  })),
  reset: () => set({ 
    currentJobId: null, 
    jobStatus: 'IDLE', 
    logs: [], 
    trace: [], 
    progress: 0, 
    result: null, 
    error: null,
    executeStatus: 'IDLE',
    executionLogs: []
  }),
  
  // Navigation & Multi-screen Actions
  navigate: (screen) => set({ currentScreen: screen }),
  setCurrentJobParams: (content, domain) => set({ currentContent: content, currentDomain: domain }),
  
  loadHistory: async () => {
    try {
      const stored = await AsyncStorage.getItem('nexus_history');
      if (stored) {
        set({ history: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  },
  clearHistory: async () => {
    try {
      await AsyncStorage.removeItem('nexus_history');
      set({ history: [] });
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  },
  saveJobToHistory: async (job) => {
    try {
      const stored = await AsyncStorage.getItem('nexus_history');
      let currentHistory = stored ? JSON.parse(stored) : [];
      // Remove any existing job with the same job_id
      currentHistory = currentHistory.filter((item: any) => item.job_id !== job.job_id);
      const newHistory = [job, ...currentHistory];
      await AsyncStorage.setItem('nexus_history', JSON.stringify(newHistory));
      set({ history: newHistory });
    } catch (e) {
      console.error('Failed to save job to history:', e);
    }
  },
  
  // Simulated Action Execution Actions
  setExecuteStatus: (status) => set({ executeStatus: status }),
  addExecutionLog: (log) => set((state) => ({ executionLogs: [...state.executionLogs, log] })),
  resetExecutionState: () => set({ executeStatus: 'IDLE', executionLogs: [] }),
}));
