import type { MenuTreeType, EquitiesTabType, OptionsTabType, WorkflowStepType } from './options.ts';
export type { MenuTreeType, EquitiesTabType, OptionsTabType, WorkflowStepType };

export interface RouteLocation {
  tree: MenuTreeType;
  optionsTab?: OptionsTabType;
  equitiesTab?: EquitiesTabType;
  canonicalPath?: string;
  isNotFound?: boolean;
}
