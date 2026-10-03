import { ManualProjectInput, Project, ProjectDetail, Yarn } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!response.ok) {
    const body = await response.text();
    let message = `${response.status} ${response.statusText}`;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.error === 'string') message = parsed.error;
    } catch {
      // fall through to default message
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getProjects(): Promise<Project[]> {
  return request<Project[]>('/projects');
}

export function getProject(id: number): Promise<ProjectDetail> {
  return request<ProjectDetail>(`/projects/${id}`);
}

export function addProjectFromRavelry(ravelryUrl: string): Promise<Project> {
  return request<Project>('/projects', { method: 'POST', body: JSON.stringify({ ravelryUrl }) });
}

export function addManualProject(input: ManualProjectInput): Promise<Project> {
  return request<Project>('/projects', { method: 'POST', body: JSON.stringify(input) });
}

export function updateProject(id: number, input: ManualProjectInput): Promise<Project> {
  return request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function refreshProjectFromRavelry(id: number): Promise<Project> {
  return request<Project>(`/projects/${id}/refresh`, { method: 'POST' });
}

export function deleteProject(id: number): Promise<void> {
  return request<void>(`/projects/${id}`, { method: 'DELETE' });
}

export function getYarns(): Promise<Yarn[]> {
  return request<Yarn[]>('/yarns');
}

export function syncYarns(): Promise<{ imported: number }> {
  return request<{ imported: number }>('/yarns/sync', { method: 'POST' });
}

export function getYarnSheetUrl(): Promise<{ url: string | null }> {
  return request<{ url: string | null }>('/yarns/sheet-url');
}
