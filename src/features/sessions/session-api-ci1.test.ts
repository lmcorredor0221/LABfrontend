import { createSessionsApi } from "@/features/sessions/session-api";

describe("sessions api journey artifacts CI1", () => {
  it("calls the generic create, list and latest routes for journey artifacts", async () => {
    const client = {
      get: vi
        .fn()
        .mockResolvedValueOnce({ items: [], latest: null })
        .mockResolvedValueOnce(null),
      post: vi.fn().mockResolvedValue({ id: "artifact-1" }),
    };
    const api = createSessionsApi(client as never);
    const payload = {
      artifact_kind: "blueprint_design",
      proposal_payload: {
        narrative: "Propuesta inicial",
      },
    };

    await api.createJourneyArtifact("session-ci1", "design", payload);
    await api.listJourneyArtifacts("session-ci1", "design");
    await api.getLatestJourneyArtifact("session-ci1", "design");

    expect(client.post).toHaveBeenCalledWith("/api/v1/sessions/session-ci1/journey/design/artifacts", {
      body: payload,
    });
    expect(client.get).toHaveBeenNthCalledWith(1, "/api/v1/sessions/session-ci1/journey/design/artifacts");
    expect(client.get).toHaveBeenNthCalledWith(2, "/api/v1/sessions/session-ci1/journey/design/artifacts/latest");
  });

  it("encodes artifact ids on patch, approve and reject routes", async () => {
    const client = {
      patch: vi.fn().mockResolvedValue({ id: "artifact v2" }),
      post: vi.fn().mockResolvedValue({ id: "artifact v2" }),
    };
    const api = createSessionsApi(client as never);

    await api.patchJourneyArtifact("session-ci1", "tools", "artifact v2", {
      user_patch: {
        approved: true,
      },
    });
    await api.approveJourneyArtifact("session-ci1", "tools", "artifact v2", {
      note: "Aprobado por usuario",
    });
    await api.rejectJourneyArtifact("session-ci1", "tools", "artifact v2", {
      note: "Se reemplaza por una alternativa mas simple",
    });

    expect(client.patch).toHaveBeenCalledWith(
      "/api/v1/sessions/session-ci1/journey/tools/artifacts/artifact%20v2",
      {
        body: {
          user_patch: {
            approved: true,
          },
        },
      },
    );
    expect(client.post).toHaveBeenNthCalledWith(
      1,
      "/api/v1/sessions/session-ci1/journey/tools/artifacts/artifact%20v2/approve",
      {
        body: {
          note: "Aprobado por usuario",
        },
      },
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      "/api/v1/sessions/session-ci1/journey/tools/artifacts/artifact%20v2/reject",
      {
        body: {
          note: "Se reemplaza por una alternativa mas simple",
        },
      },
    );
  });
});
