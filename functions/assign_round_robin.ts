import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import GroupMembersDatastore from "../datastores/group_members.ts";
import RotationStateDatastore from "../datastores/rotation_state.ts";

export const AssignRoundRobinFunction = DefineFunction({
  callback_id: "assign_round_robin",
  title: "Assign Round Robin",
  description: "Assign next user from group",
  source_file: "functions/assign_round_robin.ts",
  input_parameters: {
    properties: {
      group_key: { type: Schema.types.string },
      requester: { type: Schema.slack.types.user_id },
    },
    required: ["group_key", "requester"],
  },
  output_parameters: {
    properties: {
      assigned_user: { type: Schema.slack.types.user_id },
    },
    required: ["assigned_user"],
  },
});

export default SlackFunction(
  AssignRoundRobinFunction,
  async ({ inputs, client }) => {
    const groupKey = inputs.group_key.trim();
    if (!groupKey) {
      return { error: "Group id is empty" };
    }
    if (groupKey === "NO_GROUPS_YET") {
      return {
        error: "No groups saved yet. Run **Configure rotation group** first.",
      };
    }

    const group = await client.apps.datastore.get({
      datastore: GroupMembersDatastore.name,
      id: groupKey,
    });

    if (!group.ok || !group.item) {
      return { error: "Group not found" };
    }

    const members = group.item.member_ids;
    if (!Array.isArray(members) || members.length === 0) {
      return { error: "Group has no members" };
    }

    const state = await client.apps.datastore.get({
      datastore: RotationStateDatastore.name,
      id: groupKey,
    });

    const lastIndex = state.item?.last_index ?? -1;
    let nextIndex = (lastIndex + 1) % members.length;

    let assigned = members[nextIndex];

    // skip requester
    if (assigned === inputs.requester && members.length > 1) {
      nextIndex = (nextIndex + 1) % members.length;
      assigned = members[nextIndex];
    }

    const put = await client.apps.datastore.put({
      datastore: RotationStateDatastore.name,
      item: {
        group_key: groupKey,
        last_index: nextIndex,
      },
    });

    if (!put.ok) {
      return {
        error: `Could not save rotation state: ${put.error ?? "unknown"}`,
      };
    }

    return {
      outputs: {
        assigned_user: assigned,
      },
    };
  },
);
