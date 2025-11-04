-- =====================================================
-- TASKS & MAINTENANCE MANAGEMENT
-- =====================================================
-- Created: 2025-10-31
-- Purpose: Task management system for maintenance and operations

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'MAINTENANCE',
    'CLEANING',
    'INSPECTION',
    'REPAIR',
    'DELIVERY',
    'OTHER'
  )),
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
  )),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  )),
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Comments (for collaboration and updates)
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task Attachments (photos of issues, etc.)
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_hotel_id ON tasks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_room_id ON tasks(room_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);

-- Row Level Security Policies

-- tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of their hotel"
  ON tasks FOR SELECT
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their hotel tasks"
  ON tasks FOR UPDATE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete tasks"
  ON tasks FOR DELETE
  USING (
    hotel_id IN (
      SELECT hotel_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('HOTEL_OWNER', 'MANAGER')
    )
  );

-- task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their hotel tasks"
  ON task_comments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add comments to their hotel tasks"
  ON task_comments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- task_attachments
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments on their hotel tasks"
  ON task_attachments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add attachments to their hotel tasks"
  ON task_attachments FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks
      WHERE hotel_id IN (
        SELECT hotel_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE tasks IS 'Work orders and tasks for maintenance, cleaning, and operations';
COMMENT ON TABLE task_comments IS 'Comments and updates on tasks for collaboration';
COMMENT ON TABLE task_attachments IS 'File attachments (photos, documents) for tasks';
