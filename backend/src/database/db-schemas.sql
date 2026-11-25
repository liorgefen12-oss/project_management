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
      name varchar(50) NOT NULL UNIQUE,
      -- { "steps": number, "cost": number }
      goals jsonb,
      goals_met boolean,
      CONSTRAINT projects_goals_shape CHECK (
        goals IS NULL OR (
          jsonb_typeof(goals) = 'object'
          AND goals ?& ARRAY['steps', 'cost']
          AND jsonb_typeof(goals->'steps') = 'number'
          AND jsonb_typeof(goals->'cost') = 'number'
          AND (goals->>'steps')::numeric >= 0
          AND (goals->>'cost')::numeric >= 0
        )
      )
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
