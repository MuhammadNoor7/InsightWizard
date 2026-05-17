import api from './api';

export interface AnalyzeResponse {
  job_id: string;
  status: 'PENDING' | 'RUNNING';
}

export const postAnalyze = async (content: string, domain: string): Promise<AnalyzeResponse> => {
  const response = await api.post<AnalyzeResponse>('/analyze', {
    content,
    domain,
  });
  return response.data;
};

export const postAnalyzeFile = async (
  fileUri: string,
  fileName: string,
  fileMimeType: string,
  domain: string
): Promise<AnalyzeResponse> => {
  const formData = new FormData();
  
  // React Native FormData append signature
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: fileMimeType,
  } as any);
  
  formData.append('domain', domain);

  const response = await api.post<AnalyzeResponse>('/analyze-file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};
