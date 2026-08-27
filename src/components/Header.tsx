import type { ReactNode } from "react";

import type { ViewerAction, ViewerContext, ViewerLabels } from "../types.js";
import { IconClose } from "./Icons.js";

interface Props {
  groups: string[];
  counts: Record<string, number>;
  activeGroup: string | undefined;
  showGroups: boolean;
  allGroupsTab: boolean;
  onGroupSelect: (group: string | undefined) => void;
  actions: ViewerAction[];
  context: ViewerContext | null;
  showClose: boolean;
  onClose: () => void;
  labels: ViewerLabels;
  extra?: ReactNode;
}

export function Header({
  groups,
  counts,
  activeGroup,
  showGroups,
  allGroupsTab,
  onGroupSelect,
  actions,
  context,
  showClose,
  onClose,
  labels,
  extra,
}: Props) {
  const hasChrome = showGroups || actions.length > 0 || showClose || extra;
  if (!hasChrome) return null;

  return (
    <div className="riv-header">
      {showGroups ? (
        <div className="riv-groups" role="tablist" aria-label="Image groups">
          {allGroupsTab ? (
            <button
              type="button"
              role="tab"
              className="riv-group"
              aria-selected={activeGroup === undefined}
              onClick={() => onGroupSelect(undefined)}
            >
              {labels.allGroups}
              <span className="riv-group-count">({Object.values(counts).reduce((a, b) => a + b, 0)})</span>
            </button>
          ) : null}

          {groups.map((group) => (
            <button
              key={group}
              type="button"
              role="tab"
              className="riv-group"
              aria-selected={activeGroup === group}
              onClick={() => onGroupSelect(group)}
            >
              {group}
              <span className="riv-group-count">({counts[group] ?? 0})</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="riv-groups" />
      )}

      <div className="riv-actions">
        {extra}

        {actions.map((action) => {
          const content = (
            <>
              {action.icon}
              <span>{action.label}</span>
            </>
          );
          const shared = {
            className: "riv-action",
            "data-primary": action.primary ? "true" : undefined,
            // Compact collapses the label on narrow screens, which only works
            // if an icon is left behind — otherwise the button renders empty
            // and the action silently disappears on mobile.
            "data-compact": action.compact && action.icon ? "true" : undefined,
            title: action.label,
          } as const;

          if (action.href) {
            return (
              <a
                key={action.id}
                {...shared}
                href={action.href}
                target={action.target}
                rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
                download={action.download === true ? "" : action.download || undefined}
                onClick={() => context && action.onClick?.(context)}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              {...shared}
              disabled={action.disabled}
              onClick={() => context && action.onClick?.(context)}
            >
              {content}
            </button>
          );
        })}

        {showClose ? (
          <button type="button" className="riv-action riv-close" onClick={onClose} title={labels.close} aria-label={labels.close}>
            <IconClose />
          </button>
        ) : null}
      </div>
    </div>
  );
}
