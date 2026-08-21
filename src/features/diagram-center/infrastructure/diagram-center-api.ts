import { apiClient } from "@/core/api/client";
import type {
  DiagramCatalog,
  DiagramDetail,
  DiagramGenerationJob,
  DiagramGenerationReason,
  DiagramVersionComparison,
} from "@/features/diagram-center/domain/types";

const projectPath = (projectId: string) => `/v3/projects/${encodeURIComponent(projectId)}`;

export const diagramCenterApi = {
  catalog(projectId: string) {
    return apiClient.get<DiagramCatalog>(`${projectPath(projectId)}/diagrams`);
  },
  detail(projectId: string, diagramKey: string, versionId?: string) {
    const query = versionId ? `?version_id=${encodeURIComponent(versionId)}` : "";
    return apiClient.get<DiagramDetail>(
      `${projectPath(projectId)}/diagrams/${encodeURIComponent(diagramKey)}${query}`,
    );
  },
  generate(projectId: string, diagramKey: string, reason: DiagramGenerationReason) {
    return apiClient.post<DiagramGenerationJob>(
      `${projectPath(projectId)}/diagrams/${encodeURIComponent(diagramKey)}/generate`,
      {
        body: {
          detail_level: "standard",
          idempotency_key: crypto.randomUUID(),
          reason,
        },
      },
    );
  },
  job(projectId: string, jobId: string) {
    return apiClient.get<DiagramGenerationJob>(`${projectPath(projectId)}/diagram-jobs/${encodeURIComponent(jobId)}`);
  },
  compare(projectId: string, diagramKey: string, baseVersionId: string, targetVersionId: string) {
    const query = new URLSearchParams({
      base_version_id: baseVersionId,
      target_version_id: targetVersionId,
    });
    return apiClient.get<DiagramVersionComparison>(
      `${projectPath(projectId)}/diagrams/${encodeURIComponent(diagramKey)}/compare?${query.toString()}`,
    );
  },
  download(projectId: string, diagramKey: string, format: "svg" | "mermaid" | "json") {
    return apiClient.get<Blob>(
      `${projectPath(projectId)}/diagrams/${encodeURIComponent(diagramKey)}/download?format=${format}`,
      { responseType: "blob" },
    );
  },
};
