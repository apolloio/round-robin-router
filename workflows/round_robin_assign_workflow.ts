import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { AssignRoundRobinFunction } from "../functions/assign_round_robin.ts";
import { ListGroupsFunction } from "../functions/list_groups.ts";

/**
 * Lists saved groups, then assigns the next member for the chosen group.
 */
const RoundRobinAssignWorkflow = DefineWorkflow({
  callback_id: "round_robin_assign_workflow",
  title: "Round robin assign",
  description: "Pick the next assignee from a saved group",
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

const listStep = RoundRobinAssignWorkflow.addStep(ListGroupsFunction, {
  interactivity: RoundRobinAssignWorkflow.inputs.interactivity,
});

const inputForm = RoundRobinAssignWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Round robin assign",
    interactivity: listStep.outputs.interactivity,
    submit_label: "Assign",
    fields: {
      elements: [{
        name: "group_key",
        title: "Group",
        description:
          "Saved groups in this workspace (from Configure rotation group).",
        type: Schema.types.string,
        enum: listStep.outputs.group_keys,
      }, {
        name: "channel",
        title: "Channel to post the result",
        type: Schema.slack.types.channel_id,
        default: RoundRobinAssignWorkflow.inputs.channel,
      }],
      required: ["group_key", "channel"],
    },
  },
);

const assignStep = RoundRobinAssignWorkflow.addStep(AssignRoundRobinFunction, {
  group_key: inputForm.outputs.fields.group_key,
  requester: RoundRobinAssignWorkflow.inputs.user,
});

RoundRobinAssignWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: inputForm.outputs.fields.channel,
  message: `Round-robin assignee: <@${assignStep.outputs.assigned_user}>`,
});

export default RoundRobinAssignWorkflow;
