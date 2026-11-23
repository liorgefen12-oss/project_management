// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../API/types";
import { useGlobalStore } from "./useGlobalStore";

const alice: User = { user_id: "a", first_name: "Alice", last_name: "A", email: "alice@outlook.com" };
const bob: User = { user_id: "b", first_name: "Bob", last_name: "B", email: "bob@outlook.com" };

describe("useGlobalStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useGlobalStore.getState().clearUser();
  });

  it("persists only the open project, and keeps it for the same user", () => {
    const store = useGlobalStore.getState();
    store.setUser(alice);
    store.setProjectId("p1");

    const saved = JSON.parse(sessionStorage.getItem("project-board")!);
    expect(saved.state).toEqual({ projectId: "p1", projectUserId: "a" });

    // Simulates the user being reloaded from /users/me after a refresh
    useGlobalStore.getState().setUser(alice);
    expect(useGlobalStore.getState().projectId).toBe("p1");
  });

  it("does not hand a remembered project to a different user", () => {
    useGlobalStore.getState().setUser(alice);
    useGlobalStore.getState().setProjectId("p1");

    useGlobalStore.getState().setUser(bob);
    expect(useGlobalStore.getState().projectId).toBeNull();
  });
});
