/*
# Add Interview Answer Evaluations Support

## Summary
Enhances mock interviews with detailed AI-powered answer evaluations.

## Changes

### Modified Tables
1. `mock_interviews` — adds columns for storing answer-level evaluations:
   - `question_evaluations` (jsonb) — array of evaluation objects per answer
   - `report_summary` (text) — AI-generated final performance report
   - `duration_seconds` (int) — how long the interview took

### New Table
1. `interview_questions`
   - Stores question bank with ideal answers
   - `id` (uuid, PK)
   - `question` (text) — the question text
   - `category` (text) — Technical, Behavioral, System Design
   - `ideal_answer` (text) — the expected comprehensive answer
   - `key_points` (jsonb) — array of key points that should be covered
   - `difficulty` (text) — easy, medium, hard
   - `created_at` (timestamptz)

### Security
- RLS enabled on `interview_questions` (read-only for authenticated users)
*/

-- Add new columns to mock_interviews
ALTER TABLE mock_interviews 
  ADD COLUMN IF NOT EXISTS question_evaluations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_summary text,
  ADD COLUMN IF NOT EXISTS duration_seconds int DEFAULT 0;

-- Create interview_questions table with ideal answers
CREATE TABLE IF NOT EXISTS interview_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  category text NOT NULL CHECK (category IN ('Technical', 'Behavioral', 'System Design')),
  ideal_answer text NOT NULL,
  key_points jsonb DEFAULT '[]'::jsonb,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_interview_questions" ON interview_questions;
CREATE POLICY "read_interview_questions" ON interview_questions
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS interview_questions_category_idx ON interview_questions(category);

-- Seed initial questions with ideal answers and key points
INSERT INTO interview_questions (question, category, ideal_answer, key_points, difficulty) VALUES
-- Technical Questions
('Explain the difference between let, const, and var in JavaScript', 'Technical', 
 'var is function-scoped and can be redeclared and updated. It is hoisted to the top of its function scope with an initial value of undefined. let and const are block-scoped. let can be updated but not redeclared in the same scope. const cannot be updated or redeclared—it must be initialized at declaration. The temporal dead zone applies to let and const, meaning they cannot be accessed before their declaration.',
 '["var is function-scoped, let/const are block-scoped", "var can be redeclared, let cannot", "const cannot be reassigned", "var is hoisted with undefined, let/const are in temporal dead zone", "const must be initialized at declaration"]'::jsonb,
 'easy'),

('What is the time complexity of binary search?', 'Technical',
 'Binary search has a time complexity of O(log n) where n is the number of elements in the sorted array. This is because binary search halves the search space with each comparison—at each step, we eliminate half of the remaining elements. For an array of size n, we need at most log₂(n) comparisons. The space complexity is O(1) for iterative implementation and O(log n) for recursive implementation due to the call stack.',
 '["Time complexity is O(log n)", "Requires sorted array to work", "Each iteration halves the search space", "Space complexity: O(1) iterative, O(log n) recursive", "Compares middle element and discards half"]'::jsonb,
 'easy'),

('Explain closures in JavaScript with an example', 'Technical',
 'A closure is a function that retains access to variables from its outer (enclosing) scope even after the outer function has returned. This happens because the inner function maintains a reference to its lexical environment. Example: function outer(x) { return function inner(y) { return x + y; }; } const addFive = outer(5); addFive(3); // returns 8. Closures are useful for data privacy, function factories, and creating private state.',
 '["Closure retains access to outer scope variables", "Works even after outer function returns", "Inner function references lexical environment", "Used for data privacy and encapsulation", "Example: function factory pattern"]'::jsonb,
 'medium'),

('What is a deadlock in operating systems?', 'Technical',
 'A deadlock is a situation where two or more processes are unable to proceed because each is waiting for a resource held by another. Four necessary conditions for deadlock: mutual exclusion (resources non-shareable), hold and wait (process holds one resource while waiting for another), no preemption (resources cannot be forcibly taken), and circular wait (processes form a circular chain). Prevention methods include resource ordering, timeout-based detection, and Banker''s algorithm.',
 '["Deadlock: processes waiting indefinitely for each other", "Four Coffman conditions: mutual exclusion, hold and wait, no preemption, circular wait", "All four conditions must exist simultaneously", "Prevention: resource ordering, avoid circular wait", "Detection: timeout-based or graph-based algorithms"]'::jsonb,
 'medium'),

('Explain REST API vs GraphQL', 'Technical',
 'REST (Representational State Transfer) uses multiple endpoints with fixed data structures. Each endpoint returns a predefined set of data, potentially causing over-fetching or under-fetching. GraphQL is a query language that lets clients request exactly the data they need in a single endpoint. REST relies on HTTP methods (GET, POST, PUT, DELETE), while GraphQL uses queries, mutations, and subscriptions. REST is simpler to implement; GraphQL is more flexible but adds complexity.',
 '["REST: multiple endpoints with fixed responses", "GraphQL: single endpoint with flexible queries", "REST can cause over/under-fetching", "GraphQL clients specify exact data needed", "REST uses HTTP methods; GraphQL uses queries/mutations", "REST simpler, GraphQL more flexible"]'::jsonb,
 'medium'),

-- Behavioral Questions
('Tell me about a time you faced a challenging technical problem', 'Behavioral',
 'Use the STAR method: Situation—describe the context and background. Task—explain what you needed to accomplish. Action—detail the specific steps you took to solve the problem. Result—share the outcome and what you learned. A strong answer demonstrates problem-solving ability, persistence, collaboration, and the capacity to learn from challenges. Emphasize your thought process, tools/techniques used, and how you overcame obstacles.',
 '["Uses STAR method structure", "Clearly describes the situation and problem", "Explains specific actions taken", "Demonstrates problem-solving process", "Shares measurable results and learnings", "Shows persistence and adaptability"]'::jsonb,
 'medium'),

('Why do you want to work in tech?', 'Behavioral',
 'A compelling answer connects personal interests, career goals, and the tech industry impact. Mention specific aspects: solving challenging problems, continuous learning, creating products that improve lives, working with innovative technologies, collaboration with smart people, and career growth opportunities. Connect your answer to the role—why THIS position aligns with your goals. Avoid generic responses; include specific experiences that sparked your interest.',
 '["Connects personal interests to tech career", "Mentions problem-solving and innovation", "Discusses impact and meaningful work", "Shows enthusiasm for continuous learning", "Connects goals to the specific role", "Avoids generic/vague responses"]'::jsonb,
 'easy'),

('Describe a project you are proud of and what you learned from it', 'Behavioral',
 'Select a project where you made significant contributions. Explain the project goal, your role, technologies used, challenges faced, and solutions implemented. Highlight measurable outcomes: performance improvements, user adoption, business impact. Discuss what you learned—technical skills, soft skills, or process improvements you discovered. Show growth mindset by mentioning how you applied learnings to subsequent projects.',
 '["Clearly describes project goals and scope", "Explains personal contributions", "Mentions technologies and skills used", "Discusses challenges and solutions", "Shares measurable outcomes/impact", "Reflects on learnings and growth"]'::jsonb,
 'medium'),

('How do you handle tight deadlines and pressure?', 'Behavioral',
 'Describe a systematic approach: prioritize tasks by impact and urgency, break down work into manageable chunks, communicate early with stakeholders about risks, focus on MVP delivery for critical items. Mention specific techniques: time boxing, eliminating distractions, seeking help when needed. Emphasize maintaining quality under pressure—no shortcuts that create technical debt. Share a real example demonstrating successful delivery under constraints.',
 '["Describes prioritization strategy", "Mentions breaking work into chunks", "Emphasizes communication with stakeholders", "Shows focus on MVP/critical items", "Maintains quality despite pressure", "Provides real example of success"]'::jsonb,
 'medium'),

('Where do you see yourself in five years professionally?', 'Behavioral',
 'Balance ambition with realism and alignment with the role. Show growth trajectory: deepening technical expertise, taking on more responsibility, leading projects or teams, developing in areas relevant to the position. Avoid saying you want the interviewer''s job or that you plan to leave the field. Express interest in both technical and leadership growth. Connect to the company—how this role helps you progress toward those goals.',
 '["Shows realistic ambition and growth", "Balances technical and leadership growth", "Aligns with the role and company", "Avoids red flags (leaving, unrealistic)", "Demonstrates commitment to the field", "Connects goals to current opportunity"]'::jsonb,
 'medium'),

-- System Design Questions
('Design a URL shortener (like bit.ly)', 'System Design',
 'Requirements: short URLs, redirect service, analytics. Core components: API layer (REST endpoints for create/redirect), URL encoding service (base62 encoding), database (mapping short code to long URL, can use NoSQL for scale), cache (Redis for hot URLs), analytics (async event processing). Estimate: 100M URLs/month, 10:1 read-to-write ratio. Database: store short_code, long_url, created_at, expiry. Use 7-character base62 for 62^7 = 3.5 trillion combinations. Consider: rate limiting, custom aliases, expiration, CDN for global redirect.',
 '["Clarifies requirements and constraints", "Estimates scale and read/write ratio", "Designs API endpoints", "URL encoding strategy (base62)", "Database schema for URL mapping", "Cache layer for hot URLs", "Analytics and tracking", "Handles scalability and rate limiting"]'::jsonb,
 'hard'),

('Design a real-time chat application', 'System Design',
 'Requirements: one-on-one and group chats, real-time delivery, online status, message history. Architecture: WebSocket connections for real-time, message queue (Kafka/RabbitMQ) for async processing, database (NoSQL for messages, SQL for user data), presence service for online status. Consider: message ordering, delivery confirmation, handling offline users, end-to-end encryption, horizontal scaling of WebSocket servers, message pagination for history, media attachments to object storage.',
 '["WebSocket for real-time connections", "Message queue for async processing", "Database: NoSQL for messages, SQL for users", "Presence service for online status", "Message ordering and delivery confirmation", "Handles offline users with push notifications", "Media attachments to object storage", "Horizontal scaling considerations"]'::jsonb,
 'hard'),

('Design a file upload service with cloud storage', 'System Design',
 'Requirements: upload/download files, user storage quotas, file sharing, versioning. Architecture: API gateway, upload service (chunked uploads for large files, resumable uploads), metadata database (file info, permissions, versions), object storage (S3/GCS), CDN for downloads, virus scanning service. Flow: client requests upload URL, uploads directly to storage, service validates and updates metadata. Consider: concurrent uploads, deduplication, rate limiting, encryption at rest, access logging.',
 '["Chunked/resumable uploads for large files", "Direct upload to object storage (S3)", "Metadata database for file info", "User quotas and access control", "Virus scanning for security", "CDN for fast downloads", "Versioning and deduplication", "Encryption and access logging"]'::jsonb,
 'hard'),

('Design a notification delivery system', 'System Design',
 'Requirements: multi-channel (push, email, SMS), user preferences, delivery tracking, scalability. Architecture: notification service (template engine, channel router), message queue per channel, channel workers (email SMTP, push APNs/FCM, SMS Twilio), preference store, delivery tracker. Flow: event triggers notification, service generates from template, routes to queue, worker delivers and updates status. Consider: retry logic, rate limiting to user, batching, deduplication, priority levels.',
 '["Multi-channel support (push, email, SMS)", "Template engine for message generation", "Message queues per channel", "Channel-specific workers", "User preferences and quiet hours", "Delivery tracking and status", "Retry logic and rate limiting", "Priority levels and batching"]'::jsonb,
 'hard'),

('Design an e-commerce product page with high traffic', 'System Design',
 'Requirements: product details, reviews, recommendations, inventory check. Architecture: CDN for static assets, API gateway, product service (product info, cache in Redis), review service (pagination, sorting, moderation), recommendation service (ML-based, pre-computed), inventory service (real-time availability). Scale: 100K requests/sec during sale. Use read replicas, aggressive caching, eventual consistency for reviews, pre-compute hot product data. Consider: flash sale handling, personalization, A/B testing.',
 '["CDN for static assets delivery", "Product service with Redis caching", "Review service with pagination", "Recommendation service (ML/pre-computed)", "Inventory service for availability", "Read replicas and caching layers", "Handles flash sale traffic spikes", "A/B testing and personalization"]'::jsonb,
 'hard');
