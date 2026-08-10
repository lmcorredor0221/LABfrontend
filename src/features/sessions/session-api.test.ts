import { createSessionsApi } from "@/features/sessions/session-api";
import { getLongRunningApiRequestTimeoutMs } from "@/core/config/runtime";

describe("sessions api canonical exports", () => {
  it("parses canonical export metadata headers from response objects", async () => {
    const response = new Response(JSON.stringify({ schema_version: "construction-pack.v1" }), {
      headers: {
        "content-type": "application/json",
        "x-canonical-checksum-sha256": "a".repeat(64),
        "x-canonical-contract-version": "construction-pack.v1",
        "x-canonical-export-preview": "true",
        "x-canonical-export-readiness": "blocked",
        "x-canonical-generated-at": "2026-07-16T00:00:00Z",
        "x-canonical-source-blueprint-version": "7",
      },
    });
    const client = {
      get: vi.fn().mockResolvedValue(response),
    };

    const api = createSessionsApi(client as never);
    const result = await api.exportConstructionPack("session-s2", true);

    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/sessions/session-s2/export/construction-pack?preview=true",
      { responseType: "response" },
    );
    expect(result.meta.contractVersion).toBe("construction-pack.v1");
    expect(result.meta.preview).toBe(true);
    expect(result.meta.readiness).toBe("blocked");
    expect(result.meta.sourceBlueprintVersion).toBe(7);
    expect(result.meta.checksumSha256).toHaveLength(64);
  });

  it("supports the dedicated test-pack export route", async () => {
    const response = new Response(JSON.stringify({ schema_version: "test-pack.v1" }), {
      headers: {
        "content-type": "application/json",
        "x-canonical-checksum-sha256": "b".repeat(64),
        "x-canonical-contract-version": "test-pack.v1",
        "x-canonical-export-preview": "true",
        "x-canonical-export-readiness": "ready",
        "x-canonical-generated-at": "2026-07-16T00:00:00Z",
      },
    });
    const client = {
      get: vi.fn().mockResolvedValue(response),
    };

    const api = createSessionsApi(client as never);
    const result = await api.exportTestPack("session-s7", true);

    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/sessions/session-s7/export/test-pack?preview=true",
      { responseType: "response" },
    );
    expect(result.meta.contractVersion).toBe("test-pack.v1");
    expect(result.meta.readiness).toBe("ready");
  });

  it("supports the portable ACP v2 export route", async () => {
    const response = new Response(JSON.stringify({ schema_version: "agent-construction-package.v2" }), {
      headers: {
        "content-type": "application/json",
        "x-canonical-checksum-sha256": "c".repeat(64),
        "x-canonical-contract-version": "agent-construction-package.v2",
        "x-canonical-export-preview": "true",
        "x-canonical-export-readiness": "ready",
        "x-canonical-generated-at": "2026-07-16T00:00:00Z",
      },
    });
    const client = {
      get: vi.fn().mockResolvedValue(response),
    };

    const api = createSessionsApi(client as never);
    const result = await api.exportAgentConstructionPackage("session-s7", true);

    expect(client.get).toHaveBeenCalledWith(
      "/api/v1/sessions/session-s7/export/agent-construction-package?preview=true",
      { responseType: "response" },
    );
    expect(result.meta.contractVersion).toBe("agent-construction-package.v2");
    expect(result.meta.readiness).toBe("ready");
  });

  it("appends the selected ACP export profile to preview and zip routes", async () => {
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ preview: true })
        .mockResolvedValueOnce(new Blob(["zip"], { type: "application/zip" })),
      post: vi.fn().mockResolvedValue({ preview: true }),
    };

    const api = createSessionsApi(client as never);

    await api.getAcpPreview("session-s2", "design-only");
    await api.generateAcp("session-s2", "design-only");
    await api.exportAcpZip("session-s2", "design-only");

    expect(client.get).toHaveBeenNthCalledWith(
      1,
      "/api/v1/sessions/session-s2/acp/preview?profile=design-only",
    );
    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-s2/acp/generate?profile=design-only", {
      timeoutMs: getLongRunningApiRequestTimeoutMs(),
    });
    expect(client.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/sessions/session-s2/acp/export.zip?profile=design-only",
      { responseType: "blob" },
    );
  });

  it("loads the governed diagram catalog and selected content format", async () => {
    const client = {
      get: vi.fn().mockResolvedValueOnce({ entries: [] }).mockResolvedValueOnce({ content: "<svg />" }),
    };

    const api = createSessionsApi(client as never);

    await api.getDiagramCatalog("session-diagrams");
    await api.getDiagramContent("session-diagrams", "memory_rag_architecture", "svg");

    expect(client.get).toHaveBeenNthCalledWith(1, "/api/v1/sessions/session-diagrams/diagrams/catalog");
    expect(client.get).toHaveBeenNthCalledWith(
      2,
      "/api/v1/sessions/session-diagrams/diagrams/memory_rag_architecture?format=svg",
    );
  });

  it("records generic commercial events for governed diagram upsell and protection", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ session: { id: "session-diagrams" } }),
    };
    const api = createSessionsApi(client as never);
    const payload = {
      event_key: "diagram_protected_action_blocked",
      metadata: {
        action: "copy",
        diagram_key: "architecture_overview",
      },
      product: "blueprint",
      source: "diagram_browser",
    };

    await api.recordCommercialEvent("session-diagrams", payload);

    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-diagrams/commercial-events", {
      body: payload,
    });
  });

  it("loads the commercial audit report with a bounded event limit", async () => {
    const client = {
      get: vi.fn().mockResolvedValue({ contract_version: "commercial-audit.v1", recent_events: [] }),
    };
    const api = createSessionsApi(client as never);

    await api.getCommercialAuditReport("session-diagrams", 12);

    expect(client.get).toHaveBeenCalledWith("/api/v1/sessions/session-diagrams/commercial-audit?limit=12");
  });

  it("supports durable export retry/cancel and launcher report routes", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ status: "recorded" }),
    };
    const api = createSessionsApi(client as never);
    const launcherReport = {
      detected_ide: "cursor",
      detected_tool: "codex-cli",
      launcher_version: "1.0.0",
      report: { mode: "dry_run" },
      status: "dry_run_completed",
      summary: "Launcher completed outside Lean.",
    };

    await api.retryExportJob("session-saas", "job-1");
    await api.cancelExportJob("session-saas", "job-2");
    await api.submitAcpLauncherReport("session-saas", launcherReport);

    expect(client.post).toHaveBeenNthCalledWith(1, "/api/v1/sessions/session-saas/exports/jobs/job-1/retry");
    expect(client.post).toHaveBeenNthCalledWith(2, "/api/v1/sessions/session-saas/exports/jobs/job-2/cancel");
    expect(client.post).toHaveBeenNthCalledWith(3, "/api/v1/sessions/session-saas/acp/launcher/report", {
      body: launcherReport,
    });
  });

  it("posts actuals to the dedicated estimation endpoint", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ id: "actuals-1" }),
    };

    const api = createSessionsApi(client as never);
    const payload = {
      actual_automation_coverage_percent: 61,
      actual_cost_total: 14500000,
      actual_duration_weeks: 4.5,
      actual_hours_total: 132,
      actual_provider: "openai",
      delivery_mode: "agentic" as const,
      estimation_run_id: "run-9",
      notes: "Cierre real del piloto controlado.",
    };

    await api.upsertEstimationActuals("session-s8", payload);

    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-s8/estimate/actuals", {
      body: payload,
    });
  });

  it("uses the long-running timeout for blueprint generation", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ status: "ready" }),
    };

    const api = createSessionsApi(client as never);
    await api.buildBlueprint("session-long");

    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-long/build-blueprint", {
      timeoutMs: getLongRunningApiRequestTimeoutMs(),
    });
  });
});
