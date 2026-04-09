import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import GroupMembersDatastore from "../datastores/group_members.ts";

export const ListGroupsFunction = DefineFunction({
  callback_id: "list_groups",
  title: "List saved groups",
  description: "Query group_members and return existing group_key values",
  source_file: "functions/list_groups.ts",
  input_parameters: {
    properties: {
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["interactivity"],
  },
  output_parameters: {
    properties: {
      group_keys: {
        type: Schema.types.array,
        items: { type: Schema.types.string },
      },
      interactivity: { type: Schema.slack.types.interactivity },
    },
    required: ["group_keys", "interactivity"],
  },
});

export default SlackFunction(
  ListGroupsFunction,
  async ({ inputs, client }) => {
    const query = await client.apps.datastore.query({
      datastore: GroupMembersDatastore.name,
      limit: 100,
    });

    if (!query.ok) {
      return {
        error: `Could not list groups: ${query.error ?? "unknown"}`,
      };
    }

    const items = query.items ?? [];
    let groupKeys = items
      .map((item: { group_key?: string }) => item.group_key)
      .filter((k: string | undefined): k is string => Boolean(k?.trim()));

    if (groupKeys.length === 0) {
      groupKeys = ["NO_GROUPS_YET"];
    }

    return {
      outputs: {
        group_keys: groupKeys,
        interactivity: inputs.interactivity,
      },
    };
  },
);
