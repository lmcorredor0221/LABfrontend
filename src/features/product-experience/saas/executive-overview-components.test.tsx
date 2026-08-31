import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DeliverableGenerationLiveTracker,
  DeliverableProgressSummary,
  ExecutiveOverviewDemo,
  ExecutiveProductKeyDeliverables,
  ExecutiveStorySection,
  ProductBuildProgress,
  ProductMilestoneTimeline,
  buildExecutiveOverviewModel,
} from "@/features/product-experience/saas/executive-overview-components";
import type {
  ProductBuildDeliverableStatus,
  ProductBuildLifecycle,
  ProductBuildProductKey,
  ProductBuildStatus,
} from "@/features/product-experience/saas/product-build-status";

function deliverable(
  key: string,
  type: ProductBuildDeliverableStatus["deliverable_type"],
  state: ProductBuildDeliverableStatus["state"] = "available",
): ProductBuildDeliverableStatus {
  return {
    deliverable_key: key,
    deliverable_type: type,
    href: `/deliverables/${key}`,
    job_id: `job-${key}`,
    product_surface: "blueprint_basic",
    required: true,
    stage_key: "estimate",
    state,
    title: key,
    updated_at: "2026-08-15T10:00:00Z",
  };
}

function createStatus(
  lifecycle: ProductBuildLifecycle,
  productKey: ProductBuildProductKey = "blueprint_basic",
): ProductBuildStatus {
  return {
    actions: [],
    attention: {
      blocking_count: 1,
      items: [
        {
          blocking: true,
          deliverable_key: "",
          href: "/projects/session-1/attention",
          key: "attention-1",
          product_key: productKey,
          reason: "Falta resolver una decision antes de completar el producto.",
          run_id: "run-1",
          severity: "blocking",
          source: "product_build_step",
          stage_key: "define",
          step_id: "step-1",
          title: "Decision pendiente de definicion",
        },
      ],
      technical_error_count: 0,
      total: 1,
      warning_count: 0,
    },
    contract_version: "product-build-status.v1",
    current_activity: lifecycle === "running"
      ? {
          activity_key: "build",
          detail: "Generando documentos y diagramas.",
          label: "Construyendo entregables",
          started_at: "2026-08-15T10:00:00Z",
          status: "running",
          step_key: "deliverables",
          updated_at: "2026-08-15T10:01:00Z",
        }
      : null,
    deliverables: [
      deliverable("architecture", "diagram"),
      deliverable("executive-summary", "document"),
      deliverable("tool-contracts", "contract", "queued"),
    ],
    entitlement: {
      access_state: "allowed",
      checkout_href: "",
      is_purchased: true,
      purchase_required: false,
      tier: productKey === "acp" ? "acp" : productKey === "blueprint_pro" ? "blueprint_pro" : "blueprint",
      upgrade_label: "",
    },
    generated_at: "2026-08-15T10:01:00Z",
    last_error: null,
    lifecycle,
    product_key: productKey,
    product_label: productKey === "acp" ? "ACP" : productKey === "blueprint_pro" ? "Blueprint Pro" : "Blueprint",
    product_mode: productKey === "acp" ? "acp_implementation" : productKey === "blueprint_pro" ? "premium_enrichment" : "basic_free",
    progress: {
      blocked_units: 1,
      calculation: "weighted_units",
      completed_units: lifecycle === "completed" ? 3 : 1,
      label: lifecycle === "completed" ? "3 de 3 entregables listos" : "1 de 3 entregables listo",
      percent: lifecycle === "completed" ? 100 : 33,
      total_units: 3,
    },
    session_id: "session-1",
    source_contracts: ["product-build-status.v1"],
    stages: [
      {
        blocker_count: 0,
        deliverable_count: 2,
        label: "Descubrir",
        lifecycle: "completed",
        progress: {
          blocked_units: 0,
          calculation: "weighted_units",
          completed_units: 2,
          label: "Completa",
          percent: 100,
          total_units: 2,
        },
        stage_key: "discover",
      },
      {
        blocker_count: 1,
        deliverable_count: 1,
        label: "Definir",
        lifecycle: "requires_attention",
        progress: {
          blocked_units: 1,
          calculation: "weighted_units",
          completed_units: 1,
          label: "Requiere atencion",
          percent: 60,
          total_units: 2,
        },
        stage_key: "define",
      },
    ],
    workspace_id: "workspace-1",
  };
}

describe("executive overview shared components", () => {
  it("builds a product model from live product build status", () => {
    const status = createStatus("completed");
    const model = buildExecutiveOverviewModel({
      productKey: "blueprint_basic",
      projectTitle: "Agente de soporte",
      sessionId: "session-1",
      status,
    });

    expect(model.productLabel).toBe("Blueprint");
    expect(model.milestones).toHaveLength(5);
    expect(model.milestones[0]?.progress).toBe(100);
    expect(model.deliverableGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "diagram", total: 1 }),
        expect.objectContaining({ key: "document", total: 1 }),
      ]),
    );
  });

  it("renders a reusable executive overview with processing feedback", () => {
    const status = createStatus("running");
    const model = buildExecutiveOverviewModel({
      productKey: "blueprint_basic",
      projectTitle: "Agente de soporte",
      sessionId: "session-1",
      status,
    });

    render(<ExecutiveOverviewDemo model={model} status={status} />);

    expect(screen.getByRole("heading", { name: /De una necesidad ambigua/ })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Progreso global del producto" })).toHaveAttribute("aria-valuenow", "33");
    expect(screen.getByRole("status")).toHaveTextContent("Generando Blueprint");
    expect(screen.getByRole("link", { name: /Abrir Atencion/ })).toHaveAttribute("href", "/projects/session-1/attention");
  });

  it("keeps milestone navigation accessible and controlled", () => {
    const status = createStatus("completed");
    const model = buildExecutiveOverviewModel({
      productKey: "blueprint_pro",
      projectTitle: "Agente de soporte",
      sessionId: "session-1",
      status,
    });
    const onSelect = vi.fn();

    render(<ProductMilestoneTimeline activeKey="discover" milestones={model.milestones} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Definir/ }));

    expect(onSelect).toHaveBeenCalledWith("define");
    expect(screen.getByRole("button", { name: /Descubrir/ })).toHaveAttribute("aria-current", "step");
  });

  it("renders story, deliverables and progress without product-specific duplication", () => {
    const status = createStatus("completed", "acp");
    const model = buildExecutiveOverviewModel({
      productKey: "acp",
      projectTitle: "Agente de soporte",
      sessionId: "session-1",
      status,
    });

    render(
      <>
        <ProductBuildProgress status={status} />
        <ExecutiveStorySection milestone={model.milestones[0]} />
        <DeliverableProgressSummary groups={model.deliverableGroups} />
      </>,
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Entender antes de construir" })).toBeInTheDocument();
    expect(screen.getByText("2/3 disponibles")).toBeInTheDocument();
  });

  it("renders the 5 differentiating key deliverables for Blueprint Básico, Blueprint Pro and ACP", () => {
    const { rerender } = render(<ExecutiveProductKeyDeliverables productKey="blueprint_basic" sessionId="session-1" />);
    expect(screen.getByText("5 Artefactos Clave del Blueprint Básico")).toBeInTheDocument();
    expect(screen.getByText("Diagnóstico del Problema y Contexto Operativo")).toBeInTheDocument();
    expect(screen.getByText("Definición de Alcance y Requisitos MVP")).toBeInTheDocument();
    expect(screen.getByText("Arquitectura Propuesta y Patrones Agénticos")).toBeInTheDocument();
    expect(screen.getByText("Orquestación Agéntica y Seguridad Guardrails")).toBeInTheDocument();
    expect(screen.getByText("Propuesta Técnico-Comercial y Retorno de Inversión")).toBeInTheDocument();

    // Check target menu badges & routing
    expect(screen.getAllByText("Menú: Artefactos Gobernados")).toHaveLength(2);
    expect(screen.getAllByText("Menú: Diagramas de Blueprint")).toHaveLength(2);
    expect(screen.getAllByText("Menú: Artefactos Comerciales")).toHaveLength(1);

    rerender(<ExecutiveProductKeyDeliverables productKey="blueprint_pro" sessionId="session-1" />);
    expect(screen.getByText("5 Artefactos Clave de Blueprint Pro")).toBeInTheDocument();
    expect(screen.getByText("Master Specification Document (Markdown & PDF)")).toBeInTheDocument();
    expect(screen.getByText("Estimation Pack y Modelado de 5 Escenarios")).toBeInTheDocument();
    expect(screen.getByText("Contratos de Herramientas y Schemas de Integración")).toBeInTheDocument();
    expect(screen.getByText("Estrategia de Memoria Dual y Contratos de Conocimiento")).toBeInTheDocument();
    expect(screen.getByText("Catálogo Completo de Diagramas de Arquitectura (C4, UML, BPMN)")).toBeInTheDocument();

    rerender(<ExecutiveProductKeyDeliverables productKey="acp" sessionId="session-1" />);
    expect(screen.getByText("5 Artefactos Clave del Agent Construction Package (ACP)")).toBeInTheDocument();
    expect(screen.getByText("Paquete Portable ZIP Listo para IDEs Agénticos")).toBeInTheDocument();
    expect(screen.getByText("Prompt Pack Ejecutable (System, Planner, Evaluator)")).toBeInTheDocument();
    expect(screen.getByText("Construction Pack y Workflows Durables")).toBeInTheDocument();
    expect(screen.getByText("Test Suite Automatizada y Dataset de Evaluación")).toBeInTheDocument();
    expect(screen.getByText("Diagramas de Implementación, Despliegue y Telemetría B2B")).toBeInTheDocument();
  });

  it("shows 'En proceso' badge and animated indicators on deliverable cards when build is running", () => {
    const runningStatus = createStatus("running", "blueprint_basic");
    render(
      <ExecutiveProductKeyDeliverables
        productKey="blueprint_basic"
        sessionId="session-1"
        status={runningStatus}
      />,
    );

    expect(screen.getByText("5 en proceso")).toBeInTheDocument();
    expect(screen.getAllByText("En proceso").length).toBeGreaterThanOrEqual(5);
  });

  it("renders DeliverableGenerationLiveTracker with multi-phase loading status across service levels", () => {
    const status = createStatus("running", "blueprint_pro");
    render(
      <DeliverableGenerationLiveTracker
        productKey="blueprint_pro"
        productLabel="Blueprint Pro"
        status={status}
      />,
    );

    expect(screen.getByText(/Generando entregables de Blueprint Pro/i)).toBeInTheDocument();
    expect(screen.getByText("En Ejecución")).toBeInTheDocument();
  });

  it("renders persistent queue counters and retry action only for retryable failures", () => {
    const onProcessPending = vi.fn();
    const onRetryFailed = vi.fn();
    const status: ProductBuildStatus = {
      ...createStatus("requires_attention", "blueprint_pro"),
      processing_queue: {
        active: false,
        completed_at: "2026-08-15T10:06:00Z",
        completed_count: 2,
        completed_items: [
          {
            attempt_count: 1,
            deliverable_key: "master-spec",
            deliverable_type: "document",
            error_message: "",
            href: "/deliverables/master-spec",
            job_id: "job-master-spec",
            retried: false,
            stage_key: "package",
            status: "completed",
            title: "Master Specification",
            updated_at: "2026-08-15T10:05:00Z",
          },
        ],
        current_deliverable_key: "",
        failed_count: 1,
        failed_items: [
          {
            attempt_count: 1,
            deliverable_key: "diagram.c4_container",
            deliverable_type: "diagram",
            error_message: "Fallo de render en el proveedor.",
            href: "/deliverables/diagram.c4_container",
            job_id: "job-diagram",
            retried: false,
            stage_key: "package",
            status: "failed",
            title: "C4 Container",
            updated_at: "2026-08-15T10:06:00Z",
          },
        ],
        mode: "process_pending",
        pending_count: 0,
        processing_count: 0,
        queue_id: "queue-1",
        retried_count: 1,
        started_at: "2026-08-15T10:00:00Z",
        status: "completed_with_errors",
        summary: "Se completaron 2 de 3 entregables; 1 sigue fallando.",
        total_count: 3,
        updated_at: "2026-08-15T10:06:00Z",
      },
    };

    render(
      <DeliverableGenerationLiveTracker
        productKey="blueprint_pro"
        productLabel="Blueprint Pro"
        status={status}
        onProcessPending={onProcessPending}
        onRetryFailed={onRetryFailed}
      />,
    );

    expect(screen.getByText("Completado con errores")).toBeInTheDocument();
    expect(screen.getByText("Reintentar fallidos")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Reintentados")).toBeInTheDocument();
    expect(screen.getByText("Master Specification")).toBeInTheDocument();
    expect(screen.getByText("Fallo de render en el proveedor.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar fallidos" }));
    expect(onRetryFailed).toHaveBeenCalledTimes(1);
  });

  it("hides failed-item retry action when the queue already exhausted the retry budget", () => {
    const status: ProductBuildStatus = {
      ...createStatus("requires_attention", "blueprint_pro"),
      processing_queue: {
        active: false,
        completed_at: "2026-08-15T10:06:00Z",
        completed_count: 2,
        completed_items: [],
        current_deliverable_key: "",
        failed_count: 1,
        failed_items: [
          {
            attempt_count: 2,
            deliverable_key: "diagram.c4_container",
            deliverable_type: "diagram",
            error_message: "Fallo de render en el proveedor.",
            href: "/deliverables/diagram.c4_container",
            job_id: "job-diagram",
            retried: true,
            stage_key: "package",
            status: "failed",
            title: "C4 Container",
            updated_at: "2026-08-15T10:06:00Z",
          },
        ],
        mode: "process_pending",
        pending_count: 0,
        processing_count: 0,
        queue_id: "queue-2",
        retried_count: 1,
        started_at: "2026-08-15T10:00:00Z",
        status: "completed_with_errors",
        summary: "Se completaron 2 de 3 entregables; 1 sigue fallando.",
        total_count: 3,
        updated_at: "2026-08-15T10:06:00Z",
      },
    };

    render(
      <DeliverableGenerationLiveTracker
        productKey="blueprint_pro"
        productLabel="Blueprint Pro"
        status={status}
        onProcessPending={vi.fn()}
        onRetryFailed={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Reintentar fallidos" })).not.toBeInTheDocument();
    expect(screen.getByText("Completado con errores")).toBeInTheDocument();
    expect(screen.getByText("Fallo de render en el proveedor.")).toBeInTheDocument();
  });
});
