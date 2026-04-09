import { Manifest } from "deno-slack-sdk/mod.ts";
import { AssignRoundRobinFunction } from "./functions/assign_round_robin.ts";
import { DeleteGroupFunction } from "./functions/delete_group.ts";
import { ListGroupsFunction } from "./functions/list_groups.ts";
import { SaveGroupFunction } from "./functions/save_group.ts";
import GroupMembersDatastore from "./datastores/group_members.ts";
import RotationStateDatastore from "./datastores/rotation_state.ts";
import ConfigureGroupWorkflow from "./workflows/configure_group_workflow.ts";
import DeleteGroupWorkflow from "./workflows/delete_group_workflow.ts";
import RoundRobinAssignWorkflow from "./workflows/round_robin_assign_workflow.ts";

export default Manifest({
  name: "round-robin-router",
  description: "Round robin assignment app",
  longDescription:
    "After your workspace installs this app, an admin runs `slack trigger create` once per environment (local vs deployed) to register shortcuts—end users never use the CLI. Use **Configure rotation group** to create or update a team, **Delete rotation group** to remove one, and **Round robin assign** to pick the next person. Shortcuts appear under ⚡ or via bookmarked links.",
  icon: "assets/default_new_app_icon.png",

  functions: [
    AssignRoundRobinFunction,
    ListGroupsFunction,
    SaveGroupFunction,
    DeleteGroupFunction,
  ],

  workflows: [
    ConfigureGroupWorkflow,
    DeleteGroupWorkflow,
    RoundRobinAssignWorkflow,
  ],

  datastores: [
    GroupMembersDatastore,
    RotationStateDatastore,
  ],

  botScopes: [
    "datastore:read",
    "datastore:write",
    "chat:write",
    "chat:write.public",
    "im:write",
  ],
});
