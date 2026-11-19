import { describe, expect, it } from "vitest";
import {
  getLogs,
  getLogsByProjectId,
  getLogsByProjectName,
} from "../../database/queries/audit_logs.js";
import { useQueryDatabase, projectId, otherProjectId, otherId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: filterAuditLogs", () => {
  const getDatabase = useQueryDatabase();
  it("filters audit logs by project id, project name, and action", async () => {
    const database = getDatabase();
    const user = await database
      .insertInto("public.users")
      .values({
        first_name: "Test",
        last_name: "User",
        password: "test-only",
        email: "audit-test@outlook.com",
      })
      .returning("user_id")
      .executeTakeFirstOrThrow();
    const actionNames = [
      "user log in",
      "project sign in",
      "project sign out",
      "task completed",
    ];
    const actions = await database
      .insertInto("audit.task_actions")
      .values(actionNames.map((action_name) => ({ action_name })))
      .returning(["action_id", "action_name"])
      .execute();
    const actionIds = new Map(
      actions.map((action) => [action.action_name, action.action_id]),
    );
  
    await database
      .insertInto("audit.logs")
      .values([
        {
          user_id: user.user_id,
          action_id: actionIds.get("user log in")!,
        },
        {
          user_id: user.user_id,
          action_id: actionIds.get("project sign in")!,
          project_id: projectId,
        },
        {
          user_id: user.user_id,
          action_id: actionIds.get("project sign out")!,
          project_id: projectId,
        },
        {
          user_id: user.user_id,
          action_id: actionIds.get("task completed")!,
          project_id: otherProjectId,
          task_id: otherId,
        },
      ])
      .execute();
  
    const allLogs = await getLogs(database);
    const projectIdLogs = await getLogsByProjectId(database, projectId);
    const projectNameLogs = await getLogsByProjectName(
      database,
      "Main project",
    );
    const loginLogs = await getLogs(database, "user-logins");
    const projectSignLogs = await getLogs(
      database,
      "project-sign-ins-and-outs",
    );
  
    expect(allLogs).toHaveLength(4);
    expect(projectIdLogs.map((log) => log.action_id).sort()).toEqual(
      [
        actionIds.get("project sign in"),
        actionIds.get("project sign out"),
      ].sort(),
    );
    expect(projectNameLogs.map((log) => log.action_id).sort()).toEqual(
      projectIdLogs.map((log) => log.action_id).sort(),
    );
    expect(loginLogs.map((log) => log.action_id)).toEqual([
      actionIds.get("user log in"),
    ]);
    expect(projectSignLogs.map((log) => log.action_id).sort()).toEqual(
      [
        actionIds.get("project sign in"),
        actionIds.get("project sign out"),
      ].sort(),
    );
  });
});
