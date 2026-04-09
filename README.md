# Round robin router (Slack Automation)

A Slack Automation (Deno) app that stores rotation groups in datastores and
assigns the next member in round-robin order. Built with the Slack CLI.

**Guide Outline**:

- [Setup](#setup)
  - [Install the Slack CLI](#install-the-slack-cli)
  - [Clone this repository](#clone-this-repository)
- [Running Your Project Locally](#running-your-project-locally)
- [Creating Triggers](#creating-triggers)
- [CLI quick reference (slack-cli)](#cli-quick-reference-slack-cli)
- [Reading datastores (copy-paste)](#reading-datastores-copy-paste)
- [Datastores](#datastores)
- [Testing](#testing)
- [Deploying Your App](#deploying-your-app)
- [Viewing Activity Logs](#viewing-activity-logs)
- [Project Structure](#project-structure)
- [Resources](#resources)

---

## Setup

Before getting started, first make sure you have a development workspace where
you have permission to install apps. **Please note that the features in this
project require that the workspace be part of
[a Slack paid plan](https://slack.com/pricing).**

### Install the Slack CLI

To use this template, you need to install and configure the Slack CLI.
Step-by-step instructions can be found in our
[Quickstart Guide](https://api.slack.com/automation/quickstart).

### Clone this repository

```zsh
git clone https://github.com/SabateurAssasin/round-robin-router.git
cd round-robin-router
```

Use your fork’s URL instead if you are not using this account’s copy.

## Running Your Project Locally

While building your app, you can see your changes appear in your workspace in
real-time with `slack run`. You'll know an app is the development version if the
name has the string `(local)` appended.

```zsh
# Run app locally
$ slack run

Connected, awaiting events
```

To stop running locally, press `<CTRL> + C` to end the process.

## Creating Triggers

[Triggers](https://api.slack.com/automation/triggers) are what cause workflows
to run. These triggers can be invoked by a user, or automatically as a response
to an event within Slack.

**End users do not use the Slack CLI.** Someone with access to the app project
(usually once per workspace and per local vs deployed app) runs
`slack trigger create` so shortcuts exist. After that, everyone runs workflows
from **⚡ Shortcuts**, a **bookmark**, or the shortcut **URL pasted in a
channel**—all inside Slack. The app’s **About** / listing text includes
`longDescription` from `manifest.ts` with the same idea.

When you `run` or `deploy` your project for the first time, the CLI will prompt
you to create a trigger if one is found in the `triggers/` directory. For any
subsequent triggers added to the application, each must be
[manually added using the `trigger create` command](#manual-trigger-creation).

When creating triggers, you must select the workspace and environment that you'd
like to create the trigger in. Each workspace can have a local development
version (denoted by `(local)`), as well as a deployed version. _Triggers created
in a local environment will only be available to use when running the
application locally._

### Link Triggers

A [link trigger](https://api.slack.com/automation/triggers/link) is a type of
trigger that generates a **Shortcut URL** which, when posted in a channel or
added as a bookmark, becomes a link. When clicked, the link trigger will run the
associated workflow.

Link triggers are _unique to each installed version of your app_. This means
that Shortcut URLs will be different across each workspace, as well as between
[locally run](#running-your-project-locally) and
[deployed apps](#deploying-your-app).

With link triggers, after selecting a workspace and environment, the output
provided will include a Shortcut URL. Copy and paste this URL into a channel as
a message, or add it as a bookmark in a channel of the workspace you selected.
Interacting with this link will run the associated workflow.

**Note: triggers won't run the workflow unless the app is either running locally
or deployed!**

### Manual Trigger Creation

To manually create a trigger, use `slack-cli trigger create` (or
`slack trigger
create` if that is your CLI binary) from the **project root**.

## CLI quick reference (slack-cli)

These examples use the **`slack-cli`** prefix. If your install exposes the
Automation CLI as `slack` instead, substitute that name.

Run from the **repository root** (`round-robin-router`). When prompted, choose
the correct **app** (local dev vs deployed) and **workspace**.

### Run the app locally

```zsh
slack-cli run
```

### Create all workflow shortcuts (once per app / environment)

```zsh
slack-cli trigger create --trigger-def triggers/configure_group_trigger.ts
slack-cli trigger create --trigger-def triggers/delete_group_trigger.ts
slack-cli trigger create --trigger-def triggers/round_robin_assign_trigger.ts
```

### List triggers (optional)

```zsh
slack-cli trigger list
```

### Inspect datastore rows (see [Reading datastores](#reading-datastores-copy-paste))

### Seed or update a group via CLI (optional)

Replace the `U…` user IDs with real member IDs from your workspace.

```bash
slack-cli datastore put --datastore group_members '{
  "item": {
    "group_key": "my-group",
    "group_name": "My group",
    "member_ids": ["U01234567", "U07654321"]
  }
}'
```

### Watch runtime logs while testing in Slack

In a second terminal (while `slack-cli run` is active):

```zsh
slack-cli activity --tail
```

## Reading datastores (copy-paste)

Both datastores use **`group_key`** as the primary key. Run these from the
**project root** after you have linked the app (`slack run` or `slack deploy`
at least once). When the CLI asks, pick the same **workspace** and **app**
(local `(local)` vs deployed) whose data you want to read.

If your binary is `slack` instead of `slack-cli`, use that name everywhere below.

### List every row (good default)

```zsh
slack-cli datastore query --datastore group_members '{"limit": 100}' --output json
slack-cli datastore query --datastore rotation_state '{"limit": 100}' --output json
```

Increase `limit` if you have more than 100 groups (Slack caps apply per request).

### Fetch one group by id

Replace `my-group` with a real `group_key`.

```zsh
slack-cli datastore get --datastore group_members '{"group_key": "my-group"}' --output json
slack-cli datastore get --datastore rotation_state '{"group_key": "my-group"}' --output json
```

If a row does not exist, the command reports that the item was not found.

### What each datastore holds

| Datastore        | Primary key | Contents |
|-----------------|-------------|----------|
| `group_members` | `group_key` | `group_name`, `member_ids` (Slack user IDs) |
| `rotation_state` | `group_key` | `last_index` (position used for the last assignment) |

See also [Datastores](#datastores) for how the app writes these from Slack.

## Datastores

For storing data related to your app, datastores offer secure storage on Slack
infrastructure. This app defines `group_members` (who belongs to each group) and
`rotation_state` (last assigned index per group). The use of a datastore
requires the `datastore:write`/`datastore:read` scopes to be present in your
manifest.

### Round robin: groups and usage

1. **Deploy or run** the app (`slack deploy` or `slack run` from this directory)
   using the [Slack CLI](https://api.slack.com/automation/quickstart) for
   Automations (not the legacy Ruby `slack` gem).

2. **Create or edit groups** (pick one):

   - **From Slack:** create a trigger for `triggers/configure_group_trigger.ts`
     and run **Configure rotation group**. Saving with an existing **Group id**
     **replaces** name and members (same as edit). It does not assign anyone.

     ```zsh
     slack trigger create --trigger-def triggers/configure_group_trigger.ts
     ```

   - **Delete a group:** create a trigger for `triggers/delete_group_trigger.ts`
     and run **Delete rotation group** (removes `group_members` and
     `rotation_state` for that id).

     ```zsh
     slack trigger create --trigger-def triggers/delete_group_trigger.ts
     ```

   - **From the CLI:** write rows to `group_members`. Example:

     ```bash
     slack datastore put --datastore group_members '{
       "item": {
         "group_key": "sales-escalation",
         "group_name": "Sales escalation",
         "member_ids": ["U01234567", "U07654321"]
       }
     }'
     ```

   `rotation_state` is updated only when someone runs **Round robin assign**;
   you do not seed it manually.

3. **Test assignment:** create a trigger for
   `triggers/round_robin_assign_trigger.ts`, run **Round robin assign**, choose
   a **Group** from the dropdown (saved groups), pick a channel, and submit.

   ```zsh
   slack trigger create --trigger-def triggers/round_robin_assign_trigger.ts
   ```

4. **Use your own workflow**: add a step that references
   `AssignRoundRobinFunction` from `functions/assign_round_robin.ts`, passing
   `group_key` (string) and `requester` (user id, usually the workflow input
   user who started the run).

## Testing

For an example of how to test a function, see `functions/*_test.ts`. Test
filenames should be suffixed with `_test`.

Run all tests with `deno test`:

```zsh
$ deno test
```

## Deploying Your App

Once development is complete, deploy the app to Slack infrastructure using
`slack deploy`:

```zsh
$ slack deploy
```

When deploying for the first time, you'll be prompted to
[create a new link trigger](#creating-triggers) for the deployed version of your
app. When that trigger is invoked, the workflow should run just as it did when
developing locally (but without requiring your server to be running).

## Viewing Activity Logs

Activity logs of your application can be viewed live and as they occur with the
following command:

```zsh
slack-cli activity --tail
```

See also [CLI quick reference (slack-cli)](#cli-quick-reference-slack-cli).

## Project Structure

### `.slack/`

Contains `apps.dev.json` and `apps.json`, which include installation details for
development and deployed apps.

Contains `hooks.json` used by the CLI to interact with the project's SDK
dependencies. It contains script hooks that are executed by the CLI and
implemented by the SDK.

### `datastores/`

[Datastores](https://api.slack.com/automation/datastores) securely store data
for your application on Slack infrastructure. Required scopes to use datastores
include `datastore:write` and `datastore:read`.

### `functions/`

[Functions](https://api.slack.com/automation/functions) are reusable building
blocks of automation that accept inputs, perform calculations, and provide
outputs. Functions can be used independently or as steps in workflows.

### `triggers/`

[Triggers](https://api.slack.com/automation/triggers) determine when workflows
are run. A trigger file describes the scenario in which a workflow should be
run, such as a user pressing a button or when a specific event occurs.

### `workflows/`

A [workflow](https://api.slack.com/automation/workflows) is a set of steps
(functions) that are executed in order.

Workflows can be configured to run without user input or they can collect input
by beginning with a [form](https://api.slack.com/automation/forms) before
continuing to the next step.

### `manifest.ts`

The [app manifest](https://api.slack.com/automation/manifest) contains the app's
configuration. This file defines attributes like app name and description.

## Resources

To learn more about developing automations on Slack, visit the following:

- [Automation Overview](https://api.slack.com/automation)
- [CLI Quick Reference](https://api.slack.com/automation/cli/quick-reference)
- [Samples and Templates](https://api.slack.com/automation/samples)
