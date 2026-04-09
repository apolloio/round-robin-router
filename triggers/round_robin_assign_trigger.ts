import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import RoundRobinAssignWorkflow from "../workflows/round_robin_assign_workflow.ts";

const roundRobinAssignTrigger: Trigger<
  typeof RoundRobinAssignWorkflow.definition
> = {
  type: TriggerTypes.Shortcut,
  name: "Round robin assign",
  description: "Pick the next assignee from a saved group",
  shortcut: {
    button_text: "Run round robin",
  },
  workflow: `#/workflows/${RoundRobinAssignWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel: {
      value: TriggerContextData.Shortcut.channel_id,
    },
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
};

export default roundRobinAssignTrigger;
