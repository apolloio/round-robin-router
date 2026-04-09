import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ListGroupsFunction } from "../functions/list_groups.ts";
import { SaveGroupFunction } from "../functions/save_group.ts";

/**
 * Creates or updates group_members (same Group id = edit / replace).
 * Use "Round robin assign" afterward to test rotation.
 */
const ConfigureGroupWorkflow = DefineWorkflow({
  callback_id: "configure_group_workflow",
  title: "Configure rotation group",
  description: "Create, update, or replace a group and its members",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "channel", "user"],
  },
});

const listStep = ConfigureGroupWorkflow.addStep(ListGroupsFunction, {
  interactivity: ConfigureGroupWorkflow.inputs.interactivity,
});

const form = ConfigureGroupWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Configure rotation group",
    interactivity: listStep.outputs.interactivity,
    submit_label: "Save group",
    fields: {
      elements: [{
        name: "group_key",
        title: "Group id",
        description:
          "Type a new id to create a group, or an existing id to edit/replace members and name.",
        type: Schema.types.string,
      }, {
        name: "group_name",
        title: "Display name (optional)",
        type: Schema.types.string,
      }, {
        name: "member_ids",
        title: "Members in rotation order",
        type: Schema.types.array,
        items: { type: Schema.slack.types.user_id },
      }, {
        name: "channel",
        title: "Channel for confirmation",
        description: "Where to post the save confirmation.",
        type: Schema.slack.types.channel_id,
        default: ConfigureGroupWorkflow.inputs.channel,
      }],
      required: ["group_key", "member_ids", "channel"],
    },
  },
);

const save = ConfigureGroupWorkflow.addStep(SaveGroupFunction, {
  group_key: form.outputs.fields.group_key,
  group_name: form.outputs.fields.group_name,
  member_ids: form.outputs.fields.member_ids,
});

ConfigureGroupWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: form.outputs.fields.channel,
  message:
    `Saved group \`${save.outputs.group_key}\` with ${save.outputs.member_count} member(s) (created or updated). Run **Round robin assign** with the same Group id to test.`,
});

export default ConfigureGroupWorkflow;
