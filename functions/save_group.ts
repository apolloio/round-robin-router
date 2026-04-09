import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import GroupMembersDatastore from "../datastores/group_members.ts";

export const SaveGroupFunction = DefineFunction({
  callback_id: "save_group",
  title: "Save rotation group",
  description:
    "Create or replace a group (same group_key overwrites name and members)",
  source_file: "functions/save_group.ts",
  input_parameters: {
    properties: {
      group_key: { type: Schema.types.string },
      group_name: { type: Schema.types.string },
      member_ids: {
        type: Schema.types.array,
        items: { type: Schema.slack.types.user_id },
      },
    },
    required: ["group_key", "member_ids"],
  },
  output_parameters: {
    properties: {
      group_key: { type: Schema.types.string },
      member_count: { type: Schema.types.number },
    },
    required: ["group_key", "member_count"],
  },
});

export default SlackFunction(
  SaveGroupFunction,
  async ({ inputs, client }) => {
    const groupKey = inputs.group_key.trim();
    if (!groupKey) {
      return { error: "Group id is empty" };
    }
    if (groupKey === "NO_GROUPS_YET") {
      return { error: "Pick a real Group id (not the empty placeholder)." };
    }

    const memberIds = Array.isArray(inputs.member_ids)
      ? inputs.member_ids.filter((id): id is string => Boolean(id?.trim()))
      : [];

    if (memberIds.length === 0) {
      return { error: "Add at least one member" };
    }

    const displayName = inputs.group_name?.trim() || groupKey;

    const put = await client.apps.datastore.put({
      datastore: GroupMembersDatastore.name,
      item: {
        group_key: groupKey,
        group_name: displayName,
        member_ids: memberIds,
      },
    });

    if (!put.ok) {
      return {
        error: `Could not save group: ${put.error ?? "unknown"}`,
      };
    }

    return {
      outputs: {
        group_key: groupKey,
        member_count: memberIds.length,
      },
    };
  },
);
