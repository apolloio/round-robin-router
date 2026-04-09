import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import DeleteGroupWorkflow from "../workflows/delete_group_workflow.ts";

const deleteGroupTrigger: Trigger<typeof DeleteGroupWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Delete rotation group",
  description: "Remove a saved group and rotation state",
  shortcut: {
    button_text: "Delete rotation group",
  },
  workflow: `#/workflows/${DeleteGroupWorkflow.definition.callback_id}`,
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

export default deleteGroupTrigger;
