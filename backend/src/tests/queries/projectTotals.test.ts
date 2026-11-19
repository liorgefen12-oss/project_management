import { describe, expect, it } from "vitest";
import {
  getProjectTotalCostById,
  getProjectTotalCostByName,
  getProjectTotalValueById,
  getProjectTotalValueByName,
} from "../../database/queries/tasks.js";
import { useQueryDatabase, projectId, emptyProjectId, missingId } from "./databaseFixture.js";

describe.skipIf(!process.env.TEST_DATABASE_URL)("PostgreSQL queries: projectTotals", () => {
  const getDatabase = useQueryDatabase();
  it("returns exact bigint totals as strings and zero for empty or missing projects", async () => {
    const database = getDatabase();
    expect(await getProjectTotalCostById(database, projectId)).toBe(
      "4294967304",
    );
    expect(await getProjectTotalCostByName(database, "Main project")).toBe(
      "4294967304",
    );
    expect(await getProjectTotalValueById(database, projectId)).toBe("9");
    expect(await getProjectTotalValueByName(database, "Main project")).toBe(
      "9",
    );
    for (const id of [emptyProjectId, missingId]) {
      expect(await getProjectTotalCostById(database, id)).toBe("0");
      expect(await getProjectTotalValueById(database, id)).toBe("0");
    }
    for (const name of ["Empty project", "' OR true --"]) {
      expect(await getProjectTotalCostByName(database, name)).toBe("0");
      expect(await getProjectTotalValueByName(database, name)).toBe("0");
    }
  });
});
