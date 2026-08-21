import { ArtifactCenterMockup } from "@/features/mockups/artifact-center-mockup";

export default function Page() {
  return (
    <div className="uxa-foundation-root min-h-screen w-full bg-[var(--surface-canvas)]">
      <div className="mx-auto w-full max-w-[var(--uxa-layout-content-max)] px-4 pb-8 pt-4 lg:px-5">
        <main className="min-w-0 space-y-4" id="main-content">
          <ArtifactCenterMockup />
        </main>
      </div>
    </div>
  );
}
