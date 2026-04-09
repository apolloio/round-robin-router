import type { Trigger } from "deno-slack-sdk/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import ConfigureGroupWorkflow from "../workflows/configure_group_workflow.ts";

const configureGroupTrigger: Trigger<typeof ConfigureGroupWorkflow.definition> =
  {
    type: TriggerTypes.Shortcut,
    name: "Configure rotation group",
    description: "Create or update a group and members for round robin",
    shortcut: {
      button_text: "Configure rotation group",
    },
    workflow: `#/workflows/${ConfigureGroupWorkflow.definition.callback_id}`,
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

export default configureGroupTrigger;
