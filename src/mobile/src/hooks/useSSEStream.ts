import { useEffect, useRef } from 'react';
import EventSource from 'react-native-sse';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { triggerHaptic } from '../services/hapticService';

// Polyfill EventSource for React Native environment
if (!(window as any).EventSource) {
  (window as any).EventSource = EventSource;
}
if (!(global as any).EventSource) {
  (global as any).EventSource = EventSource;
}

export const useSSEStream = (apiUrl: string) => {
  const { currentJobId, setJobStatus, addLog, addTrace, setProgress, setResult, setError } = useAnalysisStore();
  const eventSourceRef = useRef<any>(null);

  useEffect(() => {
    if (!currentJobId) return;

    const sseUrl = `${apiUrl}/jobs/${currentJobId}/stream`;
    
    // Polyfilled or native EventSource depending on environment
    const eventSource = new (window as any).EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.event) {
          case 'CONNECTED':
            addLog('Connected to analysis streaming server...');
            break;
            
          case 'STATUS_CHANGE':
            setJobStatus(data.status);
            addLog(`Job Status changed: ${data.status}`);
            break;
            
          case 'STEP_COMPLETE':
            addLog(`[${data.agent}] Completed step...`);
            addTrace({
              agent: data.agent,
              output_summary: data.output_summary,
              reasoning: data.reasoning,
              key_decisions: data.key_decisions,
              progress: data.progress
            });
            setProgress(data.progress);
            break;
            
          case 'AWAITING_APPROVAL':
            triggerHaptic.reassuringPulse();
            setJobStatus('AWAITING_APPROVAL');
            setResult(data.result);
            addLog('Pipeline analysis complete. Awaiting human execution approval.');
            eventSource.close();
            break;
            
          case 'FAILED':
            triggerHaptic.errorAlert();
            setError(data.error);
            eventSource.close();
            break;
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    const handleError = () => {
      setError('Connection interrupted. Please verify your API status.');
      eventSource.close();
    };

    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('error', handleError);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener('message', handleMessage);
        eventSourceRef.current.removeEventListener('error', handleError);
        eventSourceRef.current.close();
      }
    };
  }, [currentJobId, apiUrl]);
};
