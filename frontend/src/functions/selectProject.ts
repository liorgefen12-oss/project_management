import { errorMessage } from "../API/apiErrorClass";
import type { SessionActionContext } from "./sessionActionContext";

export async function selectProject(
  nextId: string,
  ctx: SessionActionContext & {
    signInToProject: (projectId: string) => Promise<unknown>;
  },
) {
  if (ctx.busy || nextId === ctx.projectId)
    // another action is in progress
    return;
  ctx.setBusy(true);
  ctx.setError(undefined);
  try {
    if (ctx.projectId) {
      //user is already signed into a project
      await ctx.signOutOfProject(ctx.projectId);
      ctx.setProjectId(null);
    }
    await ctx.signInToProject(nextId);
    ctx.setProjectId(nextId);
  } catch (err) {
    ctx.setError(errorMessage(err, "Could not open the project :("));
  } finally {
    ctx.setBusy(false); //dont keep buttons disabled after the procedure is done
  }
}
