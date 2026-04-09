import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { DeleteGroupFunction } from "../functions/delete_group.ts";
import { ListGroupsFunction } from "../functions/list_groups.ts";

/**
 * Removes a group and its saved rotation cursor. To change members instead,
 * use **Configure rotation group** with the same Group id (that replaces the row).
 */
const DeleteGroupWorkflow = DefineWorkflow({
  callback_id: "delete_group_workflow",
  title: "Delete rotation group",
  description: "Remove a saved group and its rotation state",
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

const listStep = DeleteGroupWorkflow.addStep(ListGroupsFunction, {
  interactivity: DeleteGroupWorkflow.inputs.interactivity,
});

const form = DeleteGroupWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Delete rotation group",
    interactivity: listStep.outputs.interactivity,
    submit_label: "Delete",
    fields: {
      elements: [{
        name: "group_key",
        title: "Group to delete",
        description:
          "Permanently removes this group and its rotation progress. To edit members, use **Configure rotation group** instead.",
        type: Schema.types.string,
        enum: listStep.outputs.group_keys,
      }, {
        name: "channel",
        title: "Channel for confirmation",
        description: "Where to post the delete confirmation.",
        type: Schema.slack.types.channel_id,
        default: DeleteGroupWorkflow.inputs.channel,
      }],
      required: ["group_key", "channel"],
    },
  },
);

const del = DeleteGroupWorkflow.addStep(DeleteGroupFunction, {
  group_key: form.outputs.fields.group_key,
});

DeleteGroupWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: form.outputs.fields.channel,
  message:
    `Deleted group \`${del.outputs.group_key}\` and cleared its rotation state.`,
});

export default DeleteGroupWorkflow;
