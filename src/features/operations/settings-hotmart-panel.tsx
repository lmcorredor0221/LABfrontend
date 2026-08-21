"use client";

import type { ComponentProps } from "react";
import { HotmartAdminView } from "@/features/hotmart/hotmart-admin-page";

type SettingsHotmartPanelProps = Omit<ComponentProps<typeof HotmartAdminView>, "embedded">;

export function SettingsHotmartPanel(props: SettingsHotmartPanelProps) {
  return <HotmartAdminView {...props} embedded />;
}
