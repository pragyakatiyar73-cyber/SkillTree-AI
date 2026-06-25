import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { MockInterview, QuestionEvaluation, InterviewReport } from '../../types';
import {
  Play, ChevronRight, Calendar, Award, MessageCircle, Target, Brain,
  CheckCircle, XCircle, Lightbulb, FileText, Clock, TrendingUp,
  AlertCircle, Loader2, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';

interface InterviewSession {
  category: 'Technical' | 'Behavioral' | 'System Design';
  currentQuestionIndex: number;
  answers: string[];
  started: boolean;
  completed: boolean;
  startTime: Date;
  evaluations: (QuestionEvaluation | null)[];
  scores?: { technical: number; communication: number; confidence: number; overall: number };
  report?: InterviewReport;
}

interface QuestionWithAnswer {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  ideal_answer: string;
  key_points: string[];
}

const FALLBACK_QUESTIONS: QuestionWithAnswer[] = [
  { id: '1', question: 'Explain the difference between let, const, and var in JavaScript.', category: 'Technical', difficulty: 'easy', ideal_answer: 'var is function-scoped and can be redeclared; let is block-scoped and can be reassigned; const is block-scoped and cannot be reassigned.', key_points: ['function scope', 'block scope', 'reassignment', 'redeclaration'] },
  { id: '2', question: 'What is the Event Loop in JavaScript?', category: 'Technical', difficulty: 'medium', ideal_answer: 'The Event Loop is a mechanism that allows JavaScript to perform non-blocking operations by pushing callbacks from the task queue to the call stack when empty.', key_points: ['call stack', 'task queue', 'microtasks', 'macrotasks'] },
  { id: '3', question: 'Explain REST API principles.', category: 'Technical', difficulty: 'easy', ideal_answer: 'REST is an architectural style using HTTP methods to interact with resources. It is stateless, uses standard status codes, and resources are identified by URIs.', key_points: ['stateless', 'HTTP methods', 'resource URIs', 'JSON'] },
  { id: '4', question: 'What is a closure in JavaScript?', category: 'Technical', difficulty: 'medium', ideal_answer: 'A closure is a function that has access to variables in its outer lexical scope even after the outer function has returned.', key_points: ['lexical scope', 'outer variables', 'data privacy'] },
  { id: '5', question: 'Explain database normalization.', category: 'Technical', difficulty: 'medium', ideal_answer: 'Normalization is the process of organizing data to reduce redundancy and improve integrity. Forms: 1NF, 2NF, 3NF, BCNF.', key_points: ['redundancy', '1NF', '2NF', '3NF'] },
  { id: '6', question: 'Tell me about yourself.', category: 'Behavioral', difficulty: 'easy', ideal_answer: 'Provide a concise professional summary highlighting your background, key skills, and what you are looking for.', key_points: ['professional background', 'key strengths', 'career goals'] },
  { id: '7', question: 'Why do you want to work here?', category: 'Behavioral', difficulty: 'easy', ideal_answer: 'Mention specific aspects like culture, mission, technology stack, or growth opportunities that align with your values.', key_points: ['company research', 'alignment', 'specific reasons'] },
  { id: '8', question: 'Describe a challenging project you worked on.', category: 'Behavioral', difficulty: 'medium', ideal_answer: 'Use STAR method: Situation, Task, Action, Result. Describe context, responsibilities, actions, and quantifiable outcomes.', key_points: ['STAR method', 'situation', 'action', 'result'] },
  { id: '9', question: 'How do you handle conflict in a team?', category: 'Behavioral', difficulty: 'medium', ideal_answer: 'Emphasize open communication, active listening, and finding common ground. Focus on shared goals and professionalism.', key_points: ['communication', 'active listening', 'common ground'] },
  { id: '10', question: 'Tell me about a time you failed.', category: 'Behavioral', difficulty: 'medium', ideal_answer: 'Be honest about a real failure, but focus on what you learned and how you improved. Show growth mindset.', key_points: ['honesty', 'responsibility', 'lessons learned', 'growth'] },
  { id: '11', question: 'Design a URL shortening service like Bitly.', category: 'System Design', difficulty: 'hard', ideal_answer: 'Discuss API design, database schema, hashing strategy, caching layer, and scalability.', key_points: ['API', 'database', 'hashing', 'caching', 'scalability'] },
  { id: '12', question: 'How would you design a real-time chat application?', category: 'System Design', difficulty: 'hard', ideal_answer: 'Use WebSockets, Redis pub/sub, message persistence, and presence service. Consider rate limiting and ordering.', key_points: ['WebSockets', 'Redis pub/sub', 'persistence', 'presence'] },
  { id: '13', question: 'Design a rate limiter for an API.', category: 'System Design', difficulty: 'medium', ideal_answer: 'Use token bucket or sliding window algorithm. Store counters in Redis. Return 429 when exceeded.', key_points: ['token bucket', 'sliding window', 'Redis', '429'] },
  { id: '14', question: 'How would you design a notification system?', category: 'System Design', difficulty: 'medium', ideal_answer: 'Separate notification types, use message queue, template engine, user preferences, and batching.', key_points: ['message queue', 'templates', 'preferences', 'batching'] },
  { id: '15', question: 'Design a scalable image storage and delivery system.', category: 'System Design', difficulty: 'hard', ideal_answer: 'Use object storage, CDN, image processing service, and metadata database. Implement deduplication.', key_points: ['object storage', 'CDN', 'processing', 'deduplication'] },
];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

async function evaluateAnswer(question: string, category: string, userAnswer: string, idealAnswer: string, keyPoints: string[]): Promise<QuestionEvaluation> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/evaluate-interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, category, userAnswer, idealAnswer, keyPoints }),
    });
    if (!response.ok) throw new Error('Evaluation failed');
    return response.json();
  } catch {
    return {
      score: Math.max(5, Math.min(10, Math.round(userAnswer.length / 20))),
      correctPoints: ['Answer provided', 'Attempted to address the question'],
      missingPoints: ['Could not fully evaluate without AI service'],
      improvements: ['Provide more detailed and structured responses', 'Include specific examples and technical depth'],
      feedback: 'Your answer was recorded but AI evaluation is temporarily unavailable. Please review the ideal answer below.',
      idealAnswer,
    };
  }
}

async function generateReport(category: string, evaluations: QuestionEvaluation[], scores: { overall: number; technical: number; communication: number; confidence: number }): Promise<InterviewReport> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/evaluate-interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generateReport: true, category, evaluations, ...scores }),
    });
    if (!response.ok) throw new Error('Report generation failed');
    return response.json();
  } catch {
    return {
      summary: 'Interview completed. Review your individual question feedback for improvement areas.',
      strengths: ['Completed all questions', 'Demonstrated willingness to learn'],
      areasForImprovement: ['Review evaluation feedback', 'Study ideal answers'],
      recommendations: ['Practice more mock interviews', 'Focus on weak technical areas'],
    };
  }
}

export default function MockInterviewPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>(FALLBACK_QUESTIONS);
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchQuestions();
      fetchInterviews();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase.from('interview_questions').select('*').order('category', { ascending: true });
      if (!error && data && data.length > 0) {
        setQuestions(data as QuestionWithAnswer[]);
      }
    } catch {
      // Fallback questions already set
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('mock_interviews').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (!error && data) setInterviews(data as MockInterview[]);
    } catch {
      // Continue without interview history
    } finally {
      setLoading(false);
    }
  };

  const startInterview = useCallback((category: 'Technical' | 'Behavioral' | 'System Design') => {
    setSession({ category, currentQuestionIndex: 0, answers: [], started: true, completed: false, startTime: new Date(), evaluations: [] });
  }, []);

  const handleAnswerChange = useCallback((answer: string) => {
    if (!session) return;
    const newAnswers = [...session.answers];
    newAnswers[session.currentQuestionIndex] = answer;
    setSession({ ...session, answers: newAnswers });
  }, [session]);

  const getQuestionsForCategory = useCallback((category: string) => questions.filter((q) => q.category === category), [questions]);

  const handleNextQuestion = useCallback(async () => {
    if (!session || !user) return;
    const categoryQuestions = getQuestionsForCategory(session.category);
    const currentQ = categoryQuestions[session.currentQuestionIndex];
    if (!currentQ) return;
    const currentAnswer = session.answers[session.currentQuestionIndex] || '';
    setEvaluating(true);
    try {
      const evaluation = await evaluateAnswer(currentQ.question, session.category, currentAnswer, currentQ.ideal_answer, currentQ.key_points);
      const newEvaluations = [...session.evaluations];
      newEvaluations[session.currentQuestionIndex] = evaluation;
      if (session.currentQuestionIndex < categoryQuestions.length - 1) {
        setSession({ ...session, currentQuestionIndex: session.currentQuestionIndex + 1, evaluations: newEvaluations });
      } else {
        await completeInterview(newEvaluations);
      }
    } catch (error) {
      console.error('Evaluation error:', error);
    } finally {
      setEvaluating(false);
    }
  }, [session, user, getQuestionsForCategory]);

  const completeInterview = async (evaluations: (QuestionEvaluation | null)[]) => {
    if (!session || !user) return;
    const validEvaluations = evaluations.filter((e): e is QuestionEvaluation => e !== null);
    const totalScore = validEvaluations.reduce((sum, e) => sum + e.score, 0);
    const avgScore = validEvaluations.length > 0 ? totalScore / validEvaluations.length : 0;
    const scores = {
      technical: Math.round(avgScore * 10),
      communication: Math.round(Math.max(50, avgScore * 10 - 10 + Math.random() * 20)),
      confidence: Math.round(Math.max(50, avgScore * 10 - 5 + Math.random() * 15)),
      overall: Math.round(avgScore * 10),
    };
    let report: InterviewReport | undefined;
    try {
      report = await generateReport(session.category, validEvaluations, scores);
    } catch {
      report = { summary: 'Interview completed.', strengths: ['Completed all questions'], areasForImprovement: ['Review feedback'], recommendations: ['Practice more'] };
    }
    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000);
    const categoryQuestions = getQuestionsForCategory(session.category);
    const questionsData = categoryQuestions.map((q, idx) => ({ id: q.id, question: q.question, category: q.category, difficulty: q.difficulty }));
    const interviewData = {
      user_id: user.id,
      questions: questionsData,
      answers: session.answers,
      technical_score: scores.technical,
      communication_score: scores.communication,
      confidence_score: scores.confidence,
      overall_score: scores.overall,
      question_evaluations: validEvaluations,
      report_summary: report.summary,
      duration_seconds: durationSeconds,
      date: new Date().toISOString(),
    };
    try {
      await supabase.from('mock_interviews').insert([interviewData]);
      setSession({ ...session, completed: true, scores, evaluations, report });
      await fetchInterviews();
    } catch (error) {
      console.error('Error saving interview:', error);
      setSession({ ...session, completed: true, scores, evaluations, report });
    }
  };

  const resetSession = () => { setSession(null); setShowDetailedReport(false); };
  const getScoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const getScoreBg = (score: number) => score >= 80 ? 'from-emerald-500/20 to-emerald-600/10' : score >= 60 ? 'from-amber-500/20 to-amber-600/10' : 'from-red-500/20 to-red-600/10';

  if (loading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading interview questions...</p>
        </div>
      </div>
    );
  }

  if (session && session.started && !session.completed) {
    const categoryQuestions = getQuestionsForCategory(session.category);
    if (categoryQuestions.length === 0) {
      return (
        <div className="min-h-screen bg-surface-950 p-6 flex items-center justify-center">
          <div className="stat-card text-center">
            <AlertCircle className="text-amber-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">No questions available</h2>
            <p className="text-gray-400 mb-4">No questions found for this category.</p>
            <button onClick={resetSession} className="btn-primary">Back to Interviews</button>
          </div>
        </div>
      );
    }
    const currentQuestion = categoryQuestions[session.currentQuestionIndex];
    const progress = ((session.currentQuestionIndex + 1) / categoryQuestions.length) * 100;
    const currentEvaluation = session.evaluations[session.currentQuestionIndex - 1];

    if (currentEvaluation && session.currentQuestionIndex > 0 && !evaluating) {
      return (
        <div className="min-h-screen bg-surface-950 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Answer Evaluation</h1>
              <p className="text-gray-400">Question {session.currentQuestionIndex} of {categoryQuestions.length}</p>
            </div>
            <div className={`stat-card bg-gradient-to-br ${getScoreBg(currentEvaluation.score * 10)} space-y-4`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Your Score</h2>
                <div className={`text-5xl font-bold ${getScoreColor(currentEvaluation.score * 10)}`}>{currentEvaluation.score}/10</div>
              </div>
              <p className="text-gray-300">{currentEvaluation.feedback}</p>
            </div>
            {currentEvaluation.correctPoints.length > 0 && (
              <div className="stat-card space-y-4">
                <div className="flex items-center gap-2"><CheckCircle className="text-emerald-400" size={24} /><h3 className="text-xl font-semibold text-white">What You Covered Well</h3></div>
                <ul className="space-y-2">
                  {currentEvaluation.correctPoints.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-300"><span className="text-emerald-400 font-bold">+</span><span>{point}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {currentEvaluation.missingPoints.length > 0 && (
              <div className="stat-card space-y-4">
                <div className="flex items-center gap-2"><XCircle className="text-red-400" size={24} /><h3 className="text-xl font-semibold text-white">Points You Missed</h3></div>
                <ul className="space-y-2">
                  {currentEvaluation.missingPoints.map((point, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-300"><span className="text-red-400 font-bold">-</span><span>{point}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {currentEvaluation.improvements.length > 0 && (
              <div className="stat-card space-y-4">
                <div className="flex items-center gap-2"><Lightbulb className="text-amber-400" size={24} /><h3 className="text-xl font-semibold text-white">How to Improve</h3></div>
                <ul className="space-y-2">
                  {currentEvaluation.improvements.map((improvement, idx) => (
                    <li key={idx} className="flex gap-3 text-gray-300"><span className="text-amber-400 font-bold">*</span><span>{improvement}</span></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="stat-card space-y-4">
              <div className="flex items-center gap-2"><FileText className="text-primary-400" size={24} /><h3 className="text-xl font-semibold text-white">Ideal Answer</h3></div>
              <div className="p-4 bg-white/5 rounded-lg border border-white/10"><p className="text-gray-300 whitespace-pre-wrap">{currentEvaluation.idealAnswer}</p></div>
            </div>
            <div className="flex gap-4">
              <button onClick={resetSession} className="btn-secondary flex-1">Exit Interview</button>
              <button
                onClick={() => {
                  const newEvaluations = [...session.evaluations];
                  if (session.currentQuestionIndex < categoryQuestions.length - 1) {
                    setSession({ ...session, currentQuestionIndex: session.currentQuestionIndex, evaluations: newEvaluations });
                  } else {
                    completeInterview(newEvaluations);
                  }
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {session.currentQuestionIndex === categoryQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface-950 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">{session.category} Interview</h1>
              <span className="text-gray-400">Question {session.currentQuestionIndex + 1} of {categoryQuestions.length}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="stat-card space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400' : currentQuestion.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{currentQuestion.question}</h2>
              <p className="text-gray-400 text-sm">Take your time to provide a comprehensive answer. AI will evaluate your response.</p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">Your Answer</label>
              <textarea
                value={session.answers[session.currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                placeholder="Provide your detailed answer here..."
                className="input-field resize-none"
                rows={10}
                disabled={evaluating}
              />
            </div>
            <div className="flex gap-4 justify-between">
              <button onClick={resetSession} className="btn-secondary" disabled={evaluating}>Exit Interview</button>
              <button
                onClick={handleNextQuestion}
                disabled={!session.answers[session.currentQuestionIndex]?.trim() || evaluating}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {evaluating ? (<><Loader2 className="animate-spin" size={18} />Evaluating...</>) : session.currentQuestionIndex === categoryQuestions.length - 1 ? 'Finish Interview' : 'Submit Answer'}
                {!evaluating && <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session && session.completed && session.scores) {
    const scores = session.scores;
    const validEvaluations = session.evaluations.filter((e): e is QuestionEvaluation => e !== null);
    const categoryQuestions = getQuestionsForCategory(session.category);
    return (
      <div className="min-h-screen bg-surface-950 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Interview Results</h1>
            <p className="text-gray-400">{session.category} Interview completed</p>
          </div>
          <div className={`stat-card bg-gradient-to-br ${getScoreBg(scores.overall)} space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center"><Award className="text-primary-400" size={32} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Overall Performance</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Clock size={14} />{Math.floor(session.startTime.getTime() / 1000 % 60)} min</span>
                    <span>{validEvaluations.length} questions</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-6xl font-bold ${getScoreColor(scores.overall)}`}>{scores.overall}%</div>
                <p className="text-gray-400 text-sm mt-1">{scores.overall >= 80 ? 'Excellent!' : scores.overall >= 60 ? 'Good effort!' : 'Keep practicing!'}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card space-y-3">
              <div className="flex items-center gap-2"><Brain size={20} className="text-blue-400" /><h3 className="text-white font-semibold">Technical</h3></div>
              <p className={`text-3xl font-bold ${getScoreColor(scores.technical)}`}>{scores.technical}%</p>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${scores.technical}%` }} /></div>
            </div>
            <div className="stat-card space-y-3">
              <div className="flex items-center gap-2"><MessageCircle size={20} className="text-emerald-400" /><h3 className="text-white font-semibold">Communication</h3></div>
              <p className={`text-3xl font-bold ${getScoreColor(scores.communication)}`}>{scores.communication}%</p>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${scores.communication}%` }} /></div>
            </div>
            <div className="stat-card space-y-3">
              <div className="flex items-center gap-2"><Target size={20} className="text-amber-400" /><h3 className="text-white font-semibold">Confidence</h3></div>
              <p className={`text-3xl font-bold ${getScoreColor(scores.confidence)}`}>{scores.confidence}%</p>
              <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${scores.confidence}%` }} /></div>
            </div>
          </div>
          {session.report && (
            <div className="stat-card space-y-6">
              <button onClick={() => setShowDetailedReport(!showDetailedReport)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3"><Sparkles className="text-primary-400" size={24} /><h2 className="text-2xl font-bold text-white">Performance Report</h2></div>
                {showDetailedReport ? <ChevronUp className="text-gray-400" size={24} /> : <ChevronDown className="text-gray-400" size={24} />}
              </button>
              {showDetailedReport && (
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10"><p className="text-gray-300 leading-relaxed">{session.report.summary}</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><TrendingUp className="text-emerald-400" size={20} /><h3 className="text-lg font-semibold text-white">Strengths</h3></div>
                      <ul className="space-y-2">
                        {session.report.strengths.map((strength, idx) => (
                          <li key={idx} className="flex gap-2 text-gray-300"><CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} /><span>{strength}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><AlertCircle className="text-amber-400" size={20} /><h3 className="text-lg font-semibold text-white">Areas for Improvement</h3></div>
                      <ul className="space-y-2">
                        {session.report.areasForImprovement.map((area, idx) => (
                          <li key={idx} className="flex gap-2 text-gray-300"><Lightbulb className="text-amber-400 shrink-0 mt-0.5" size={16} /><span>{area}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2"><Target className="text-primary-400" size={20} /><h3 className="text-lg font-semibold text-white">Recommendations</h3></div>
                    <ul className="space-y-2">
                      {session.report.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300"><ChevronRight className="text-primary-400 shrink-0 mt-0.5" size={16} /><span>{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="stat-card space-y-4">
            <h2 className="text-2xl font-bold text-white">Question Breakdown</h2>
            <div className="space-y-4">
              {validEvaluations.map((evaluation, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-400">Q{idx + 1}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${evaluation.score >= 7 ? 'bg-emerald-500/20 text-emerald-400' : evaluation.score >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{evaluation.score}/10</span>
                      </div>
                      <p className="text-white font-medium line-clamp-2">{categoryQuestions[idx]?.question || 'Question'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{evaluation.feedback}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={resetSession} className="btn-secondary flex-1">Back to Interviews</button>
            <button onClick={() => startInterview(session.category)} className="btn-primary flex-1 flex items-center justify-center gap-2"><Play size={18} />Retake Interview</button>
          </div>
        </div>
      </div>
    );
  }

  const categories = ['Technical', 'Behavioral', 'System Design'] as const;
  return (
    <div className="min-h-screen bg-surface-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Mock Interview</h1>
          <p className="text-gray-400">AI-powered interview practice with real-time evaluation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => {
            const categoryQuestions = getQuestionsForCategory(category);
            return (
              <button key={category} onClick={() => startInterview(category)} className="stat-card group hover:border-primary-500/50 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors">{category}</h2>
                  <Play className="text-gray-500 group-hover:text-primary-400 transition-colors" size={24} />
                </div>
                <p className="text-gray-400">{category === 'Technical' ? 'Test your technical knowledge and coding concepts' : category === 'Behavioral' ? 'Practice answering HR and behavioral questions' : 'Design large-scale systems and architecture'}</p>
                <div className="flex items-center gap-2 text-primary-400 text-sm font-medium">
                  <span>{categoryQuestions.length} Questions</span><span className="text-gray-500">with AI evaluation</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="stat-card space-y-6">
          <h2 className="text-2xl font-bold text-white">Interview History</h2>
          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-2">No interviews yet</p>
              <p className="text-sm text-gray-500">Start your first mock interview to see your progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((interview) => {
                const date = new Date(interview.date);
                const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={interview.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-primary-500/20 flex items-center justify-center"><Award className="text-primary-400" size={24} /></div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{interview.questions[0]?.category || 'Interview'} Interview</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={14} />{formattedDate}</span><span>{formattedTime}</span>
                          {interview.duration_seconds && <span className="flex items-center gap-1"><Clock size={14} />{Math.floor(interview.duration_seconds / 60)}m</span>}
                          <span>{interview.questions.length} questions</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(interview.overall_score)}`}>{interview.overall_score}%</p>
                      <p className="text-sm text-gray-400">Score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card space-y-3">
            <h3 className="text-lg font-semibold text-white">Before Interview</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Find a quiet environment</span></li>
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Review key concepts</span></li>
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Have pen and paper ready</span></li>
            </ul>
          </div>
          <div className="stat-card space-y-3">
            <h3 className="text-lg font-semibold text-white">During Interview</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Read questions carefully</span></li>
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Provide detailed answers</span></li>
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Use specific examples</span></li>
            </ul>
          </div>
          <div className="stat-card space-y-3">
            <h3 className="text-lg font-semibold text-white">After Interview</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Review your evaluations</span></li>
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Study ideal answers</span></li>
              <li className="flex gap-2"><span className="text-primary-400 font-bold">*</span><span>Practice weak areas</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
