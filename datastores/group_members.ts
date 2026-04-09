import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

const GroupMembersDatastore = DefineDatastore({
  name: "group_members",
  primary_key: "group_key",
  attributes: {
    group_key: { type: Schema.types.string },
    group_name: { type: Schema.types.string },
    member_ids: {
      type: Schema.types.array,
      items: { type: Schema.slack.types.user_id },
    },
  },
});

export default GroupMembersDatastore;
