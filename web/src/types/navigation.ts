import { MenuTreeType, EquitiesTabType, OptionsTabType, WorkflowStepType } from './options';

export type { MenuTreeType, EquitiesTabType, OptionsTabType, WorkflowStepType };

export interface RouteLocation {
  tree: MenuTreeType;
  optionsTab?: OptionsTabType;
  equitiesTab?: EquitiesTabType;
}
