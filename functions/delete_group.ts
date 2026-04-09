import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import GroupMembersDatastore from "../datastores/group_members.ts";
import RotationStateDatastore from "../datastores/rotation_state.ts";

export const DeleteGroupFunction = DefineFunction({
  callback_id: "delete_group",
  title: "Delete rotation group",
  description: "Remove a group from group_members and clear its rotation_state",
  source_file: "functions/delete_group.ts",
  input_parameters: {
    properties: {
      group_key: { type: Schema.types.string },
    },
    required: ["group_key"],
  },
  output_parameters: {
    properties: {
      group_key: { type: Schema.types.string },
    },
    required: ["group_key"],
  },
});

export default SlackFunction(
  DeleteGroupFunction,
  async ({ inputs, client }) => {
    const groupKey = inputs.group_key.trim();
    if (!groupKey) {
      return { error: "Group id is empty" };
    }
    if (groupKey === "NO_GROUPS_YET") {
      return {
        error:
          "No groups to delete. Add a group with **Configure rotation group** first.",
      };
    }

    const delGroup = await client.apps.datastore.delete({
      datastore: GroupMembersDatastore.name,
      id: groupKey,
    });

    if (!delGroup.ok) {
      const err = delGroup.error ?? "unknown";
      if (err === "not_found" || err === "item_not_found") {
        return { error: "Group not found" };
      }
      return { error: `Could not delete group: ${err}` };
    }

    const delRot = await client.apps.datastore.delete({
      datastore: RotationStateDatastore.name,
      id: groupKey,
    });

    if (!delRot.ok) {
      const err = delRot.error ?? "";
      if (err !== "not_found" && err !== "item_not_found") {
        return {
          error:
            `Group removed but rotation state could not be cleared: ${err}`,
        };
      }
    }

    return {
      outputs: {
        group_key: groupKey,
      },
    };
  },
);
