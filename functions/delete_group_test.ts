import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import DeleteGroup from "./delete_group.ts";

const { createContext } = SlackFunctionTester("delete_group");

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("delete_group: deletes group and rotation rows", async () => {
  let deleteCalls = 0;
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("apps.datastore.delete")) {
        deleteCalls++;
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      return Promise.resolve(new Response("not mocked", { status: 500 }));
    },
  );

  const { outputs, error } = await DeleteGroup(
    createContext({
      inputs: { group_key: "sales" },
    }),
  );

  assertEquals(error, undefined);
  assertEquals(outputs?.group_key, "sales");
  assertEquals(deleteCalls, 2);
});

Deno.test("delete_group: maps missing group to error", async () => {
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("apps.datastore.delete")) {
        return Promise.resolve(
          jsonResponse({ ok: false, error: "not_found" }),
        );
      }
      return Promise.resolve(new Response("not mocked", { status: 500 }));
    },
  );

  const { outputs, error } = await DeleteGroup(
    createContext({
      inputs: { group_key: "nope" },
    }),
  );

  assertEquals(outputs, undefined);
  assertEquals(error, "Group not found");
});
