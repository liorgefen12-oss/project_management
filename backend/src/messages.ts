export const messages = {
  200: {
    taskUpdatedSuccessfully: "Task updated successfully",
    taskMovedSuccessfully: "Task moved successfully",
    projectUpdatedSuccessfully: "Project updated successfully",
  },
  400: {
    malformedJson: "Request body contains invalid JSON, please check for typos",
    requestFailed: "Invalid request",
    sameProjectPredecessors: "Predecessors must belong to the same project",
    selfPredecessor: "A task cannot be its own predecessor",
    cyclicPredecessors: "Task dependencies cannot contain cycles",
    taskPositionOutOfRange: "Task position is out of range",
    predecessorOrderViolation: "A task must appear after its predecessors",
    passwordRequired: "Password is required",
    outlookEmailRequired: "Must be an @outlook.com email",
    duplicatePredecessors: "Duplicate predecessor IDs",
    nothingToUpdate: "Nothing to update",
    validationErrors(issues: readonly { message: string }[]) {
      return issues.map((issue) => issue.message);
    },
  },
  401: {
    invalidCredentials: "Invalid email or password",
    notAuthenticated: "Not authenticated",
    noLoggedInUser: "Not authenticated (no logged-in user)",
  },
  404: {
    taskNotFound: "Task not found",
    projectNotFound: "Project not found",
    predecessorNotFound: "Predecessor task not found",
  },
  409: {
    projectAlreadyExists: "A project with this name already exists",
    taskPositionTaken: "A task already exists in this position",
    taskReferenceMissing: "Project or predecessor no longer exists",
    taskAlreadyExecuted: "Task was already executed",
    executedTaskReadOnly: "Executed tasks cannot be edited",
    insufficientBudget: "Not enough budget",
    invalidPredecessors: "Task predecessors must exist and be executed without cycles",
    completePredecessorFirst(taskName: string) {
      return `Complete "${taskName}" first`;
    },
  },
  500: {
    internalServerError: "Internal server error",
  },
} as const;
