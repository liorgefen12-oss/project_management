    CREATE SCHEMA IF NOT EXISTS public;
    CREATE SCHEMA audit;

    CREATE DOMAIN public.outlook_email AS text
      CONSTRAINT outlook_email_format
      CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@outlook\.com$');

    CREATE TABLE public.users (
      user_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      first_name varchar(20) NOT NULL,
      last_name varchar(20) NOT NULL,
      password varchar(255) NOT NULL,
      email public.outlook_email NOT NULL UNIQUE
    );

    CREATE TABLE public.projects (
      project_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      budget integer NOT NULL,
      value integer NOT NULL DEFAULT 0,
      description varchar(250) NOT NULL,
      name varchar(50) NOT NULL UNIQUE
    );

    CREATE TABLE public.tasks (
      task_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      task_name varchar(50) NOT NULL,
      description varchar(250) NOT NULL,
      cost integer NOT NULL,
      value integer NOT NULL,
      steps integer NOT NULL,
      project uuid NOT NULL,
      position integer NOT NULL,
      executed boolean DEFAULT false NOT NULL,
      CONSTRAINT tasks_position_positive CHECK (position > 0),
      CONSTRAINT tasks_project_position_uq UNIQUE (project, position)
        DEFERRABLE INITIALLY DEFERRED,
      CONSTRAINT tasks_project_fkey FOREIGN KEY (project)
        REFERENCES public.projects(project_id)
    );

    CREATE TABLE public.task_predecessors (
      task_id uuid NOT NULL,
      predecessor_id uuid NOT NULL,
      CONSTRAINT task_predecessors_pkey PRIMARY KEY (task_id, predecessor_id),
      CONSTRAINT task_predecessors_check CHECK (task_id <> predecessor_id),
      CONSTRAINT task_predecessors_task_id_fkey FOREIGN KEY (task_id)
        REFERENCES public.tasks(task_id) ON DELETE CASCADE,
      CONSTRAINT task_predecessors_predecessor_id_fkey FOREIGN KEY (predecessor_id)
        REFERENCES public.tasks(task_id) ON DELETE CASCADE
    );

    CREATE TABLE audit.task_actions (
      action_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      action_name varchar(100) NOT NULL UNIQUE,
      description varchar(250)
    );

    CREATE TABLE audit.logs (
      log_id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
      project_id uuid,
      task_id uuid,
      user_id uuid NOT NULL,
      action_id integer NOT NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT logs_project_id_fkey FOREIGN KEY (project_id)
        REFERENCES public.projects(project_id),
      CONSTRAINT logs_task_id_fkey FOREIGN KEY (task_id)
        REFERENCES public.tasks(task_id),
      CONSTRAINT logs_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users(user_id),
      CONSTRAINT logs_action_id_fkey FOREIGN KEY (action_id)
        REFERENCES audit.task_actions(action_id)
    );

    CREATE FUNCTION public.get_project_total_cost_by_id(p_project_id uuid)
    RETURNS bigint LANGUAGE sql STABLE AS $$
      SELECT COALESCE(SUM(cost), 0)
      FROM public.tasks WHERE project = p_project_id;
    $$;

    CREATE FUNCTION public.get_project_total_cost_by_name(p_project_name varchar)
    RETURNS bigint LANGUAGE sql STABLE AS $$
      SELECT COALESCE(SUM(t.cost), 0)
      FROM public.tasks t JOIN public.projects p ON p.project_id = t.project
      WHERE p.name = p_project_name;
    $$;

    CREATE FUNCTION public.get_project_total_value_by_id(p_project_id uuid)
    RETURNS bigint LANGUAGE sql STABLE AS $$
      SELECT COALESCE(SUM(value), 0)
      FROM public.tasks WHERE project = p_project_id;
    $$;

    CREATE FUNCTION public.get_project_total_value_by_name(p_project_name varchar)
    RETURNS bigint LANGUAGE sql STABLE AS $$
      SELECT COALESCE(SUM(t.value), 0)
      FROM public.tasks t JOIN public.projects p ON p.project_id = t.project
      WHERE p.name = p_project_name;
    $$;

    CREATE FUNCTION public.get_tasks_by_project_id(p_project_id uuid)
    RETURNS SETOF public.tasks LANGUAGE sql STABLE AS $$
      SELECT * FROM public.tasks
      WHERE project = p_project_id ORDER BY position ASC;
    $$;

    CREATE FUNCTION public.get_tasks_by_project_id_and_status(
      p_project_id uuid, p_completed boolean
    ) RETURNS SETOF public.tasks LANGUAGE sql STABLE AS $$
      SELECT * FROM public.tasks
      WHERE project = p_project_id AND executed = p_completed
      ORDER BY position ASC;
    $$;

    CREATE FUNCTION public.get_tasks_by_project_name(p_project_name varchar)
    RETURNS SETOF public.tasks LANGUAGE sql STABLE AS $$
      SELECT t.* FROM public.tasks t
      JOIN public.projects p ON p.project_id = t.project
      WHERE p.name = p_project_name ORDER BY t.position ASC;
    $$;

    CREATE FUNCTION public.get_tasks_by_project_name_and_status(
      p_project_name varchar, p_completed boolean
    ) RETURNS SETOF public.tasks LANGUAGE sql STABLE AS $$
      SELECT t.* FROM public.tasks t
      JOIN public.projects p ON p.project_id = t.project
      WHERE p.name = p_project_name AND t.executed = p_completed
      ORDER BY t.position ASC;
    $$;

    CREATE FUNCTION public.get_task_predecessors(p_task_id uuid)
    RETURNS SETOF public.tasks LANGUAGE sql STABLE AS $$
      WITH RECURSIVE chain AS (
        SELECT predecessor_id AS task_id, 1 AS depth,
               ARRAY[p_task_id, predecessor_id] AS path
        FROM public.task_predecessors WHERE task_id = p_task_id
        UNION ALL
        SELECT p.predecessor_id, c.depth + 1, c.path || p.predecessor_id
        FROM public.task_predecessors p
        JOIN chain c ON p.task_id = c.task_id
        WHERE p.predecessor_id <> ALL (c.path)
      )
      SELECT t.* FROM public.tasks t
      JOIN (SELECT task_id, MIN(depth) AS depth FROM chain GROUP BY task_id) c
        ON t.task_id = c.task_id
      ORDER BY c.depth, t.task_id;
    $$;

    CREATE FUNCTION public.update_task_position(p_task_id uuid, p_new_position integer)
    RETURNS void LANGUAGE plpgsql AS $$
    DECLARE
      v_project uuid;
      v_old_pos integer;
      v_max_pos integer;
    BEGIN
      SELECT project, position INTO v_project, v_old_pos
      FROM public.tasks WHERE task_id = p_task_id FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Task % does not exist', p_task_id;
      END IF;

      SELECT MAX(position) INTO v_max_pos
      FROM public.tasks WHERE project = v_project;

      IF p_new_position < 1 OR p_new_position > v_max_pos THEN
        RAISE EXCEPTION 'Position % is out of range (1..%)',
          p_new_position, v_max_pos;
      END IF;

      IF p_new_position = v_old_pos THEN RETURN; END IF;

      UPDATE public.tasks
      SET position = CASE
        WHEN task_id = p_task_id THEN p_new_position
        WHEN v_old_pos < p_new_position THEN position - 1
        ELSE position + 1
      END
      WHERE project = v_project
        AND position BETWEEN LEAST(v_old_pos, p_new_position)
                         AND GREATEST(v_old_pos, p_new_position);
    END;
    $$;
