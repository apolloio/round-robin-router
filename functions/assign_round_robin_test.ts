import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import AssignRoundRobin from "./assign_round_robin.ts";

const { createContext } = SlackFunctionTester("assign_round_robin");

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.test("assign_round_robin: advances and skips requester when possible", async () => {
  let call = 0;
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (input: string | URL | Request, _init?: RequestInit) => {
      const url = String(input instanceof Request ? input.url : input);
      call++;
      if (url.includes("apps.datastore.get")) {
        if (call === 1) {
          return Promise.resolve(
            jsonResponse({
              ok: true,
              item: {
                group_key: "team-a",
                group_name: "Team A",
                member_ids: ["U111", "U222"],
              },
            }),
          );
        }
        return Promise.resolve(
          jsonResponse({
            ok: true,
          }),
        );
      }
      if (url.includes("apps.datastore.put")) {
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      return Promise.resolve(new Response("not mocked", { status: 500 }));
    },
  );

  const { outputs, error } = await AssignRoundRobin(
    createContext({
      inputs: {
        group_key: "team-a",
        requester: "U111",
      },
    }),
  );

  assertEquals(error, undefined);
  assertEquals(outputs?.assigned_user, "U222");
});

Deno.test("assign_round_robin: returns error when group is missing", async () => {
  using _stubFetch = stub(
    globalThis,
    "fetch",
    (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes("apps.datastore.get")) {
        return Promise.resolve(jsonResponse({ ok: false, error: "not_found" }));
      }
      return Promise.resolve(new Response("not mocked", { status: 500 }));
    },
  );

  const { outputs, error } = await AssignRoundRobin(
    createContext({
      inputs: {
        group_key: "unknown",
        requester: "U111",
      },
    }),
  );

  assertEquals(outputs, undefined);
  assertEquals(error, "Group not found");
});
