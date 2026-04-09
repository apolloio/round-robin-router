import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import SaveGroup from "./save_group.ts";

const { createContext } = SlackFunctionTester("save_group");

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("save_group: writes group_members row", async () => {
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("apps.datastore.put")) {
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      return Promise.resolve(new Response("not mocked", { status: 500 }));
    },
  );

  const { outputs, error } = await SaveGroup(
    createContext({
      inputs: {
        group_key: "sales",
        group_name: "Sales rotation",
        member_ids: ["U111", "U222"],
      },
    }),
  );

  assertEquals(error, undefined);
  assertEquals(outputs?.group_key, "sales");
  assertEquals(outputs?.member_count, 2);
});

Deno.test("save_group: rejects empty members", async () => {
  const { outputs, error } = await SaveGroup(
    createContext({
      inputs: {
        group_key: "x",
        member_ids: [],
      },
    }),
  );

  assertEquals(outputs, undefined);
  assertEquals(error, "Add at least one member");
});
