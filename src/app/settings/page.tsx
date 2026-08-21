import {
  SettingsWorkspacePage,
} from "@/features/operations/settings-page";
import {
  buildSettingsHref,
  parseSettingsRouteState,
  type SettingsSearchParams,
} from "@/features/operations/settings-admin-routing";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SettingsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const routeState = parseSettingsRouteState(params);
  const routeKey = buildSettingsHref(routeState);

  return (
    <SettingsWorkspacePage
      key={routeKey}
      initialConfigSubTab={routeState.configSubTab}
      initialConfigTab={routeState.configTab}
      initialProductGovernanceTab={routeState.productGovernanceTab}
      initialSection={routeState.section}
    />
  );
}
