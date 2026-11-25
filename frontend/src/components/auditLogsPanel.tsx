import { errorMessage } from "../API/apiErrorClass";
import { useProjectAuditLogs } from "../API/audit_logs/useProjectAuditLogs";
import type { BoardTask } from "../API/types";

type AuditLogsPanelProps = {
  projectId: string;
  tasksById: Map<string, BoardTask>;
};

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
});

export default function AuditLogsPanel({
  projectId,
  tasksById,
}: AuditLogsPanelProps) {
  const logs = useProjectAuditLogs(projectId);

  let content;
  if (logs.error) {
    content = (
      <p role="alert" className="alert">
        Could not load the audit logs: {errorMessage(logs.error)}
      </p>
    );
  } else if (!logs.data) {
    content = <p className="muted">Loading…</p>;
  } else if (logs.data.length === 0) {
    content = <p className="muted">No activity yet.</p>;
  } else {
    content = (
      <ol className="audit-logs__list">
        {logs.data.map((log) => {
          const task = log.task_id ? tasksById.get(log.task_id) : undefined;
          return (
            <li key={log.log_id} className="audit-logs__item">
              <div className="audit-logs__action">{log.action_name}</div>
              {task && <div className="audit-logs__task">{task.task_name}</div>}
              <div className="audit-logs__meta">
                {log.first_name} {log.last_name} ·{" "}
                <time dateTime={log.created_at}>
                  {dateFormat.format(new Date(log.created_at))}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <aside className="panel audit-logs" aria-label="Project audit logs">
      <h2 className="audit-logs__title">Activity log</h2>
      {content}
    </aside>
  );
}
