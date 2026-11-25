import { errorMessage } from "../API/apiErrorClass";
import type { SessionActionContext } from "./sessionActionContext";

// Sign out of the current project and go back to the project selection page
export async function leaveProject(ctx: SessionActionContext) {
  if (ctx.busy || !ctx.projectId) return;
  ctx.setBusy(true);
  ctx.setError(undefined);
  try {
    await ctx.signOutOfProject(ctx.projectId);
    ctx.setProjectId(null);
  } catch (err) {
    ctx.setError(errorMessage(err, "Could not leave the project."));
  } finally {
    ctx.setBusy(false);
  }
}
