import { type ReactNode } from "react";
import { UxaBadge, type UxaTone } from "./components";

export type UxaActionDockScope = {
  helper: string;
  label: string;
  tone?: UxaTone;
};

export function UxaContextualActionDock({
  actions,
  children,
  label,
  scope,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  label: string;
  scope: UxaActionDockScope;
}) {
  return (
    <div aria-label={label} className="uxa-contextual-action-dock" role="region">
      <div className="uxa-contextual-action-dock__inner">
        <div className="uxa-contextual-action-dock__scope">
          <UxaBadge tone={scope.tone ?? "info"}>{scope.label}</UxaBadge>
          <span>{scope.helper}</span>
        </div>
        <div className="uxa-contextual-action-dock__actions">
          {actions ?? children}
        </div>
      </div>
    </div>
  );
}
