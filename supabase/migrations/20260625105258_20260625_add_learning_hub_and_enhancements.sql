/*
# AI Learning Hub & Platform Enhancement Schema

## Summary
Adds comprehensive tables for an AI Learning Hub, enhanced LeetCode tracking,
AI Mentor daily tasks, and learning progress tracking. All tables are
multi-user with owner-scoped RLS policies.

## New Tables
1. `learning_topics` - Master list of tech topics with difficulty levels and metadata
2. `learning_resources` - Curated resources (articles, videos, courses) per topic
3. `user_topic_progress` - Tracks each user's completion status per topic
4. `daily_tasks` - AI-generated daily tasks for users
5. `leetcode_streaks` - Daily LeetCode streak tracking
6. `leetcode_topic_progress` - Per-topic DSA progress tracking
7. `placement_evaluations` - Detailed placement readiness history

## Modified Tables
- `profiles` - adds `current_streak`, `longest_streak`, `last_active_date` columns

## Security
- All new tables have RLS enabled with owner-scoped policies.
- `user_id` defaults to `auth.uid()` for seamless inserts.
*/

-- 1. Add streak tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE;

-- 2. Learning Topics (master catalog)
CREATE TABLE IF NOT EXISTS learning_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. 'DSA', 'Frontend', 'Backend', 'System Design', 'DevOps'
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  prerequisites TEXT[] DEFAULT '{}',
  estimated_hours INTEGER DEFAULT 5,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Learning Resources (curated per topic)
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES learning_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'article' CHECK (type IN ('article', 'video', 'course', 'book', 'documentation', 'practice')),
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_minutes INTEGER DEFAULT 30,
  is_free BOOLEAN DEFAULT true,
  provider TEXT, -- e.g. 'YouTube', 'freeCodeCamp', 'Coursera', 'MDN'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. User Topic Progress (tracks per-user learning)
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES learning_topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  progress_percent INTEGER DEFAULT 0,
  hours_spent INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- 5. Daily Tasks (AI Mentor generated)
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'dsa' CHECK (category IN ('dsa', 'project', 'learning', 'interview', 'resume', 'communication')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LeetCode Streaks
CREATE TABLE IF NOT EXISTS leetcode_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL DEFAULT CURRENT_DATE,
  problems_solved INTEGER DEFAULT 0,
  easy_solved INTEGER DEFAULT 0,
  medium_solved INTEGER DEFAULT 0,
  hard_solved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, streak_date)
);

-- 7. LeetCode Topic Progress
CREATE TABLE IF NOT EXISTS leetcode_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL, -- e.g. 'Arrays', 'Dynamic Programming', 'Graphs'
  problems_solved INTEGER DEFAULT 0,
  total_problems INTEGER DEFAULT 0,
  weak_subtopics TEXT[] DEFAULT '{}',
  last_practiced DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_name)
);

-- 8. Placement Evaluations (history)
CREATE TABLE IF NOT EXISTS placement_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  dsa_score INTEGER DEFAULT 0,
  projects_score INTEGER DEFAULT 0,
  resume_score INTEGER DEFAULT 0,
  communication_score INTEGER DEFAULT 0,
  aptitude_score INTEGER DEFAULT 0,
  linkedin_score INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Beginner',
  strong_areas TEXT[] DEFAULT '{}',
  weak_areas TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Learning Topics
INSERT INTO learning_topics (name, category, difficulty, description, prerequisites, estimated_hours, order_index) VALUES
('Arrays & Strings', 'DSA', 'beginner', 'Foundation of all problem solving. Learn array manipulation, two pointers, sliding window, and string processing.', '{}', 10, 1),
('Hash Maps & Sets', 'DSA', 'beginner', 'Master hash-based data structures for O(1) lookups and frequency counting problems.', '{}', 8, 2),
('Two Pointers', 'DSA', 'beginner', 'Efficient technique for searching pairs in sorted arrays and palindrome problems.', ARRAY['Arrays & Strings'], 6, 3),
('Stacks & Queues', 'DSA', 'beginner', 'LIFO and FIFO data structures for parsing, scheduling, and backtracking problems.', ARRAY['Arrays & Strings'], 8, 4),
('Linked Lists', 'DSA', 'beginner', 'Singly and doubly linked lists with operations, cycle detection, and merging.', ARRAY['Arrays & Strings'], 8, 5),
('Binary Trees', 'DSA', 'intermediate', 'Tree traversals, DFS, BFS, and common tree operations.', ARRAY['Stacks & Queues', 'Linked Lists'], 12, 6),
('Binary Search', 'DSA', 'intermediate', 'Divide and conquer searching on sorted data and rotated arrays.', ARRAY['Arrays & Strings'], 10, 7),
('Recursion & Backtracking', 'DSA', 'intermediate', 'Solve complex problems by exploring all possibilities systematically.', ARRAY['Binary Trees'], 12, 8),
('Dynamic Programming', 'DSA', 'advanced', 'Memoization and tabulation for optimization problems.', ARRAY['Recursion & Backtracking'], 20, 9),
('Graphs', 'DSA', 'advanced', 'BFS, DFS, Dijkstra, topological sort, and graph representations.', ARRAY['Binary Trees', 'Recursion & Backtracking'], 15, 10),
('HTML & CSS', 'Frontend', 'beginner', 'Build structured web pages with semantic HTML and modern CSS including Flexbox and Grid.', '{}', 10, 1),
('JavaScript Fundamentals', 'Frontend', 'beginner', 'Variables, functions, loops, DOM manipulation, and event handling.', '{}', 12, 2),
('React Basics', 'Frontend', 'intermediate', 'Components, props, state, hooks, and JSX syntax.', ARRAY['JavaScript Fundamentals'], 15, 3),
('React Advanced', 'Frontend', 'advanced', 'Context API, Redux, performance optimization, custom hooks, and testing.', ARRAY['React Basics'], 15, 4),
('TypeScript', 'Frontend', 'intermediate', 'Static typing, interfaces, generics, and type-safe React development.', ARRAY['JavaScript Fundamentals'], 12, 5),
('Tailwind CSS', 'Frontend', 'beginner', 'Utility-first CSS framework for rapid responsive UI development.', ARRAY['HTML & CSS'], 8, 6),
('Node.js & Express', 'Backend', 'beginner', 'Server-side JavaScript, REST APIs, middleware, and routing.', ARRAY['JavaScript Fundamentals'], 12, 2),
('Databases (SQL)', 'Backend', 'intermediate', 'Relational database design, normalization, complex queries, and indexing.', '{}', 15, 3),
('NoSQL Databases', 'Backend', 'intermediate', 'MongoDB, document modeling, and when to use NoSQL over SQL.', ARRAY['Databases (SQL)'], 10, 4),
('Authentication & Security', 'Backend', 'advanced', 'JWT, OAuth, bcrypt, session management, and OWASP top 10.', ARRAY['Node.js & Express'], 12, 5),
('REST API Design', 'Backend', 'intermediate', 'API design principles, versioning, rate limiting, and documentation.', ARRAY['Node.js & Express'], 10, 6),
('Microservices', 'Backend', 'advanced', 'Service decomposition, inter-service communication, and deployment strategies.', ARRAY['REST API Design', 'Authentication & Security'], 15, 7),
('System Design Basics', 'System Design', 'intermediate', 'Scalability principles, load balancing, caching, and CDNs.', ARRAY['REST API Design', 'Databases (SQL)'], 15, 1),
('Database Design at Scale', 'System Design', 'advanced', 'Sharding, replication, CAP theorem, and read/write splitting.', ARRAY['System Design Basics', 'Databases (SQL)'], 15, 2),
('Message Queues', 'System Design', 'advanced', 'Kafka, RabbitMQ, event-driven architecture, and async processing.', ARRAY['System Design Basics'], 12, 3),
('Git & GitHub', 'DevOps', 'beginner', 'Version control, branching strategies, pull requests, and collaboration workflows.', '{}', 8, 1),
('Docker & Containers', 'DevOps', 'intermediate', 'Containerization, Dockerfiles, multi-stage builds, and Docker Compose.', ARRAY['Git & GitHub'], 10, 2),
('CI/CD Pipelines', 'DevOps', 'intermediate', 'GitHub Actions, automated testing, deployment, and monitoring.', ARRAY['Docker & Containers'], 10, 3),
('AWS Basics', 'DevOps', 'beginner', 'EC2, S3, RDS, Lambda, and cloud fundamentals.', '{}', 12, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed Learning Resources
INSERT INTO learning_resources (topic_id, title, url, type, difficulty, estimated_minutes, is_free, provider) VALUES
-- Arrays & Strings
((SELECT id FROM learning_topics WHERE name = 'Arrays & Strings'), 'NeetCode Arrays Playlist', 'https://www.youtube.com/playlist?list=PLot-Xpom53lfxQ4g3P8pLCY6_u6w6_fY1', 'video', 'beginner', 120, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Arrays & Strings'), 'LeetCode Two Sum Patterns', 'https://leetcode.com/problem-list/two-sum/', 'practice', 'beginner', 30, true, 'LeetCode'),
((SELECT id FROM learning_topics WHERE name = 'Arrays & Strings'), 'MDN Array Methods', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array', 'documentation', 'beginner', 20, true, 'MDN'),
-- Hash Maps
((SELECT id FROM learning_topics WHERE name = 'Hash Maps & Sets'), 'Hash Tables Explained', 'https://www.youtube.com/watch?v=shs0KM3wKv8', 'video', 'beginner', 15, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Hash Maps & Sets'), 'LeetCode Top Interview Hash Table', 'https://leetcode.com/studyplan/top-interview-150/', 'practice', 'beginner', 60, true, 'LeetCode'),
-- Two Pointers
((SELECT id FROM learning_topics WHERE name = 'Two Pointers'), 'Two Pointers Technique', 'https://www.youtube.com/watch?v=On03HWe2tZM', 'video', 'beginner', 20, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Two Pointers'), 'LeetCode Two Pointers Problems', 'https://leetcode.com/tag/two-pointers/', 'practice', 'beginner', 45, true, 'LeetCode'),
-- Stacks & Queues
((SELECT id FROM learning_topics WHERE name = 'Stacks & Queues'), 'Stack and Queue Data Structures', 'https://www.youtube.com/watch?v=wjI1WNcIntg', 'video', 'beginner', 25, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Stacks & Queues'), 'Valid Parentheses Practice', 'https://leetcode.com/problems/valid-parentheses/', 'practice', 'beginner', 15, true, 'LeetCode'),
-- Linked Lists
((SELECT id FROM learning_topics WHERE name = 'Linked Lists'), 'Linked List in 10 Minutes', 'https://www.youtube.com/watch?v=G0_I-ZF0S38', 'video', 'beginner', 15, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Linked Lists'), 'Reverse Linked List', 'https://leetcode.com/problems/reverse-linked-list/', 'practice', 'beginner', 20, true, 'LeetCode'),
-- Binary Trees
((SELECT id FROM learning_topics WHERE name = 'Binary Trees'), 'Binary Tree Algorithms', 'https://www.youtube.com/watch?v=fAAZixBzIAI', 'video', 'intermediate', 30, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Binary Trees'), 'LeetCode Tree Problems', 'https://leetcode.com/tag/tree/', 'practice', 'intermediate', 60, true, 'LeetCode'),
-- Binary Search
((SELECT id FROM learning_topics WHERE name = 'Binary Search'), 'Binary Search Made Easy', 'https://www.youtube.com/watch?v=MFhxShGxHWc', 'video', 'intermediate', 20, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Binary Search'), 'LeetCode Binary Search Tag', 'https://leetcode.com/tag/binary-search/', 'practice', 'intermediate', 45, true, 'LeetCode'),
-- Recursion
((SELECT id FROM learning_topics WHERE name = 'Recursion & Backtracking'), 'Backtracking Explained', 'https://www.youtube.com/watch?v=Zq4upLUaFoM', 'video', 'intermediate', 30, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Recursion & Backtracking'), 'N-Queens Problem', 'https://leetcode.com/problems/n-queens/', 'practice', 'advanced', 30, true, 'LeetCode'),
-- DP
((SELECT id FROM learning_topics WHERE name = 'Dynamic Programming'), 'DP Patterns by NeetCode', 'https://www.youtube.com/watch?v=aPQY__2H3tE', 'video', 'advanced', 45, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Dynamic Programming'), 'LeetCode DP Study Plan', 'https://leetcode.com/studyplan/dynamic-programming/', 'practice', 'advanced', 120, true, 'LeetCode'),
-- Graphs
((SELECT id FROM learning_topics WHERE name = 'Graphs'), 'Graph Algorithms for Beginners', 'https://www.youtube.com/watch?v=tWVWeAqZ0WU', 'video', 'advanced', 35, true, 'YouTube'),
((SELECT id FROM learning_topics WHERE name = 'Graphs'), 'LeetCode Graph Tag', 'https://leetcode.com/tag/graph/', 'practice', 'advanced', 60, true, 'LeetCode'),
-- HTML/CSS
((SELECT id FROM learning_topics WHERE name = 'HTML & CSS'), 'freeCodeCamp HTML/CSS Course', 'https://www.freecodecamp.org/learn/responsive-web-design/', 'course', 'beginner', 300, true, 'freeCodeCamp'),
((SELECT id FROM learning_topics WHERE name = 'HTML & CSS'), 'CSS Flexbox Guide', 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', 'article', 'beginner', 20, true, 'CSS-Tricks'),
-- JS Fundamentals
((SELECT id FROM learning_topics WHERE name = 'JavaScript Fundamentals'), 'JavaScript.info', 'https://javascript.info/', 'course', 'beginner', 180, true, 'JavaScript.info'),
((SELECT id FROM learning_topics WHERE name = 'JavaScript Fundamentals'), 'MDN JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'documentation', 'beginner', 60, true, 'MDN'),
-- React
((SELECT id FROM learning_topics WHERE name = 'React Basics'), 'React Official Tutorial', 'https://react.dev/learn', 'course', 'intermediate', 120, true, 'React.dev'),
((SELECT id FROM learning_topics WHERE name = 'React Basics'), 'React Hooks Deep Dive', 'https://www.youtube.com/watch?v=TNhaISOUy6Q', 'video', 'intermediate', 40, true, 'YouTube'),
-- TypeScript
((SELECT id FROM learning_topics WHERE name = 'TypeScript'), 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/', 'documentation', 'intermediate', 60, true, 'TypeScript'),
((SELECT id FROM learning_topics WHERE name = 'TypeScript'), 'Total TypeScript Course', 'https://www.totaltypescript.com/', 'course', 'intermediate', 180, false, 'Total TypeScript'),
-- Node.js
((SELECT id FROM learning_topics WHERE name = 'Node.js & Express'), 'Node.js Official Docs', 'https://nodejs.org/en/docs/', 'documentation', 'beginner', 40, true, 'Node.js'),
((SELECT id FROM learning_topics WHERE name = 'Node.js & Express'), 'Express.js Guide', 'https://expressjs.com/en/guide/routing.html', 'documentation', 'beginner', 30, true, 'Express.js'),
-- Databases
((SELECT id FROM learning_topics WHERE name = 'Databases (SQL)'), 'SQL Bolt Interactive', 'https://sqlbolt.com/', 'course', 'beginner', 60, true, 'SQLBolt'),
((SELECT id FROM learning_topics WHERE name = 'Databases (SQL)'), 'PostgreSQL Tutorial', 'https://www.postgresqltutorial.com/', 'course', 'intermediate', 90, true, 'PostgreSQL Tutorial'),
-- System Design
((SELECT id FROM learning_topics WHERE name = 'System Design Basics'), 'System Design Primer', 'https://github.com/donnemartin/system-design-primer', 'book', 'intermediate', 120, true, 'GitHub'),
((SELECT id FROM learning_topics WHERE name = 'System Design Basics'), 'Designing Data-Intensive Applications (Book)', 'https://dataintensive.net/', 'book', 'advanced', 300, false, 'OReilly'),
-- Git
((SELECT id FROM learning_topics WHERE name = 'Git & GitHub'), 'Git Branching Visualizer', 'https://learngitbranching.js.org/', 'course', 'beginner', 45, true, 'LearnGitBranching'),
((SELECT id FROM learning_topics WHERE name = 'Git & GitHub'), 'GitHub Skills', 'https://skills.github.com/', 'course', 'beginner', 30, true, 'GitHub'),
-- Docker
((SELECT id FROM learning_topics WHERE name = 'Docker & Containers'), 'Docker Getting Started', 'https://docs.docker.com/get-started/', 'documentation', 'intermediate', 60, true, 'Docker'),
((SELECT id FROM learning_topics WHERE name = 'Docker & Containers'), 'Docker Mastery Course', 'https://www.udemy.com/course/docker-mastery/', 'course', 'intermediate', 720, false, 'Udemy')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies

-- learning_topics: public read for all authenticated
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_topics" ON learning_topics;
CREATE POLICY "select_topics" ON learning_topics FOR SELECT TO authenticated USING (true);

-- learning_resources: public read for all authenticated
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_resources" ON learning_resources;
CREATE POLICY "select_resources" ON learning_resources FOR SELECT TO authenticated USING (true);

-- user_topic_progress: owner-scoped
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_progress" ON user_topic_progress;
CREATE POLICY "select_own_progress" ON user_topic_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_progress" ON user_topic_progress;
CREATE POLICY "insert_own_progress" ON user_topic_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_progress" ON user_topic_progress;
CREATE POLICY "update_own_progress" ON user_topic_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_progress" ON user_topic_progress;
CREATE POLICY "delete_own_progress" ON user_topic_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- daily_tasks: owner-scoped
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tasks" ON daily_tasks;
CREATE POLICY "select_own_tasks" ON daily_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tasks" ON daily_tasks;
CREATE POLICY "insert_own_tasks" ON daily_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tasks" ON daily_tasks;
CREATE POLICY "update_own_tasks" ON daily_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tasks" ON daily_tasks;
CREATE POLICY "delete_own_tasks" ON daily_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- leetcode_streaks: owner-scoped
ALTER TABLE leetcode_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_streaks" ON leetcode_streaks;
CREATE POLICY "select_own_streaks" ON leetcode_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_streaks" ON leetcode_streaks;
CREATE POLICY "insert_own_streaks" ON leetcode_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_streaks" ON leetcode_streaks;
CREATE POLICY "update_own_streaks" ON leetcode_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_streaks" ON leetcode_streaks;
CREATE POLICY "delete_own_streaks" ON leetcode_streaks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- leetcode_topic_progress: owner-scoped
ALTER TABLE leetcode_topic_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_topic_progress" ON leetcode_topic_progress;
CREATE POLICY "select_own_topic_progress" ON leetcode_topic_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_topic_progress" ON leetcode_topic_progress;
CREATE POLICY "insert_own_topic_progress" ON leetcode_topic_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_topic_progress" ON leetcode_topic_progress;
CREATE POLICY "update_own_topic_progress" ON leetcode_topic_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_topic_progress" ON leetcode_topic_progress;
CREATE POLICY "delete_own_topic_progress" ON leetcode_topic_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- placement_evaluations: owner-scoped
ALTER TABLE placement_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_evaluations" ON placement_evaluations;
CREATE POLICY "select_own_evaluations" ON placement_evaluations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_evaluations" ON placement_evaluations;
CREATE POLICY "insert_own_evaluations" ON placement_evaluations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_evaluations" ON placement_evaluations;
CREATE POLICY "update_own_evaluations" ON placement_evaluations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_evaluations" ON placement_evaluations;
CREATE POLICY "delete_own_evaluations" ON placement_evaluations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_topic_progress_user ON user_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_leetcode_streaks_user_date ON leetcode_streaks(user_id, streak_date);
CREATE INDEX IF NOT EXISTS idx_leetcode_topic_user ON leetcode_topic_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_topic ON learning_resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_placement_eval_user ON placement_evaluations(user_id);
