import api from './api';

export interface ApproveResponse {
  status: 'COMPLETED';
}

export const approveJob = async (jobId: string): Promise<ApproveResponse> => {
  const response = await api.post<ApproveResponse>(`/jobs/${jobId}/approve`);
  return response.data;
};
