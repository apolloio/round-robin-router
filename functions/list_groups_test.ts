import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import ListGroups from "./list_groups.ts";

const { createContext } = SlackFunctionTester("list_groups");

const testInteractivity = {
  interactivity_pointer: "test-interactivity-pointer",
  interactor: {
    id: "U01234567",
    secret: "test-secret",
  },
};

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("list_groups: uses placeholder when datastore is empty", async () => {
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (_input: string | URL | Request, _init?: RequestInit) => {
      return Promise.resolve(jsonResponse({ ok: true, items: [] }));
    },
  );

  const { outputs, error } = await ListGroups(
    createContext({ inputs: { interactivity: testInteractivity } }),
  );

  assertEquals(error, undefined);
  assertEquals(outputs?.group_keys, ["NO_GROUPS_YET"]);
  assertEquals(outputs?.interactivity, testInteractivity);
});

Deno.test("list_groups: returns keys from query", async () => {
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (_input: string | URL | Request, _init?: RequestInit) => {
      return Promise.resolve(
        jsonResponse({
          ok: true,
          items: [
            { group_key: "a", group_name: "A", member_ids: ["U1"] },
            { group_key: "b", group_name: "B", member_ids: ["U2"] },
          ],
        }),
      );
    },
  );

  const { outputs, error } = await ListGroups(
    createContext({ inputs: { interactivity: testInteractivity } }),
  );

  assertEquals(error, undefined);
  assertEquals(outputs?.group_keys, ["a", "b"]);
  assertEquals(outputs?.interactivity, testInteractivity);
});
