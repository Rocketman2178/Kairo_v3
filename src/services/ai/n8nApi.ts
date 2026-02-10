const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface N8NApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  status?: number;
  error?: string;
}

interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: N8NNode[];
  connections?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  tags?: Array<{ id: string; name: string }>;
}

interface N8NNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  typeVersion?: number;
}

interface N8NExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt: string;
  workflowId: string;
  status: string;
  data?: Record<string, unknown>;
}

interface WorkflowListResponse {
  data: N8NWorkflow[];
  nextCursor?: string;
}

interface ExecutionListResponse {
  data: N8NExecution[];
  nextCursor?: string;
}

async function callN8NProxy<T>(
  endpoint: string,
  method: string = "GET",
  body?: unknown
): Promise<N8NApiResponse<T>> {
  const url = `${SUPABASE_URL}/functions/v1/n8n-api-proxy`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ endpoint, method, body }),
  });

  return response.json();
}

export async function listWorkflows(): Promise<N8NApiResponse<WorkflowListResponse>> {
  return callN8NProxy<WorkflowListResponse>("/api/v1/workflows");
}

export async function getWorkflow(id: string): Promise<N8NApiResponse<N8NWorkflow>> {
  return callN8NProxy<N8NWorkflow>(`/api/v1/workflows/${id}`);
}

export async function getWorkflowNodes(id: string): Promise<N8NNode[] | null> {
  const result = await getWorkflow(id);
  if (result.success && result.data?.nodes) {
    return result.data.nodes;
  }
  return null;
}

export async function listExecutions(
  workflowId?: string,
  status?: string,
  limit: number = 20
): Promise<N8NApiResponse<ExecutionListResponse>> {
  let endpoint = `/api/v1/executions?limit=${limit}`;
  if (workflowId) endpoint += `&workflowId=${workflowId}`;
  if (status) endpoint += `&status=${status}`;
  return callN8NProxy<ExecutionListResponse>(endpoint);
}

export async function getExecution(id: string): Promise<N8NApiResponse<N8NExecution>> {
  return callN8NProxy<N8NExecution>(`/api/v1/executions/${id}`);
}

export async function activateWorkflow(id: string): Promise<N8NApiResponse<N8NWorkflow>> {
  return callN8NProxy<N8NWorkflow>(`/api/v1/workflows/${id}/activate`, "POST");
}

export async function deactivateWorkflow(id: string): Promise<N8NApiResponse<N8NWorkflow>> {
  return callN8NProxy<N8NWorkflow>(`/api/v1/workflows/${id}/deactivate`, "POST");
}

export type {
  N8NApiResponse,
  N8NWorkflow,
  N8NNode,
  N8NExecution,
  WorkflowListResponse,
  ExecutionListResponse,
};
