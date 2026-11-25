import { errorMessage } from "../API/apiErrorClass";
import type { SessionActionContext } from "./sessionActionContext";

export async function handleLogout(
  ctx: SessionActionContext & { logout: () => Promise<unknown> },
) {
  if (ctx.busy) return;
  ctx.setBusy(true); //dont let other functions run simultanously
  ctx.setError(undefined); //no current error
  try {
    if (ctx.projectId) {
      //sign out of project before logging out; best effort, so a failure here never blocks logging out
      await ctx.signOutOfProject(ctx.projectId).catch(() => undefined);
      ctx.setProjectId(null);
    }
    await ctx.logout();
  } catch (err) {
    ctx.setError(errorMessage(err, "Could not log out."));
  } finally {
    ctx.setBusy(false);
  }
}
