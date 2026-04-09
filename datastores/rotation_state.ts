import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

const RotationStateDatastore = DefineDatastore({
  name: "rotation_state",
  primary_key: "group_key",
  attributes: {
    group_key: { type: Schema.types.string },
    last_index: { type: Schema.types.number },
  },
});

export default RotationStateDatastore;
