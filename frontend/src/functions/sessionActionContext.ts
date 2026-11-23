// State and setters from SignedInApp that the session actions read and update
export interface SessionActionContext {
  projectId: string | null;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  setError: (error: string | undefined) => void;
  setProjectId: (projectId: string | null) => void;
  signOutOfProject: (projectId: string) => Promise<unknown>;
}
