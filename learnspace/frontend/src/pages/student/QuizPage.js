// ============================================================
// LearnSpace - Quiz Page
// ============================================================
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Loader } from '../../components/common/UI';
import { toast } from 'react-toastify';

const QuizPage = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [started, setStarted] = useState(false);
  const startTime = useRef(null);

  useEffect(() => {
    api.get(`/quizzes/${quizId}`)
      .then(res => { setQuiz(res.data.data.quiz); })
      .catch(() => { toast.error('Quiz not found.'); navigate(`/learn/${courseId}`); })
      .finally(() => setLoading(false));
  }, [quizId, courseId, navigate]);

  const startQuiz = () => {
    setStarted(true);
    startTime.current = Date.now();
    if (quiz.time_limit) {
      setTimeLeft(quiz.time_limit * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && Object.keys(answers).length < quiz.questions.length) {
      const unanswered = quiz.questions.length - Object.keys(answers).length;
      if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeTaken = startTime.current ? Math.floor((Date.now() - startTime.current) / 1000) : 0;
      const res = await api.post(`/quizzes/${quizId}/submit`, { answers, time_taken: timeTaken });
      setResult(res.data.data.result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return <Loader />;
  if (!quiz) return null;

  // Result Screen
  if (result) {
    const passed = result.passed;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className={`rounded-2xl p-8 text-center border-2 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{passed ? 'Congratulations!' : 'Better luck next time!'}</h2>
          <p className="text-gray-600 mb-6">{passed ? 'You passed the quiz!' : `You need ${quiz.passing_score}% to pass. Try again!`}</p>

          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <div className={`text-5xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-500'}`}>
              {parseFloat(result.score).toFixed(1)}%
            </div>
            <p className="text-gray-500 text-sm">Your Score</p>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div><p className="text-lg font-bold text-gray-900">{result.earned_points}</p><p className="text-xs text-gray-500">Points Earned</p></div>
              <div><p className="text-lg font-bold text-gray-900">{result.total_points}</p><p className="text-xs text-gray-500">Total Points</p></div>
              <div><p className="text-lg font-bold text-gray-900">{quiz.passing_score}%</p><p className="text-xs text-gray-500">Pass Mark</p></div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(`/learn/${courseId}`)}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Back to Course
            </button>
            {!passed && (
              <button
                onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); setStarted(false); }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>

        {/* Answer Review */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-gray-900">Answer Review</h3>
          {result.answers?.map((a, i) => {
            const q = quiz.questions[i];
            return (
              <div key={i} className={`bg-white rounded-xl border p-4 ${a.is_correct ? 'border-green-200' : 'border-red-200'}`}>
                <p className="text-sm font-medium text-gray-800 mb-2">{i + 1}. {q?.question_text}</p>
                <p className="text-xs"><span className={`font-medium ${a.is_correct ? 'text-green-600' : 'text-red-500'}`}>Your answer:</span> {a.selected_answer}</p>
                {!a.is_correct && <p className="text-xs text-green-600 font-medium mt-1">Correct: {q?.correct_answer}</p>}
                {q?.explanation && <p className="text-xs text-gray-500 mt-2 italic">{q.explanation}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz Intro
  if (!started) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-gray-500 text-sm mb-6">{quiz.description}</p>}
          <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4 mb-6">
            <div><p className="text-lg font-bold text-gray-900">{quiz.questions?.length}</p><p className="text-xs text-gray-500">Questions</p></div>
            <div><p className="text-lg font-bold text-gray-900">{quiz.time_limit ? `${quiz.time_limit}m` : '∞'}</p><p className="text-xs text-gray-500">Time Limit</p></div>
            <div><p className="text-lg font-bold text-gray-900">{quiz.passing_score}%</p><p className="text-xs text-gray-500">Pass Mark</p></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/learn/${courseId}`)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={startQuiz} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Start Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const q = questions[currentQ];
  const totalAnswered = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-sm text-gray-500">Question {currentQ + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{totalAnswered}/{questions.length} answered</span>
          {timeLeft !== null && (
            <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
              ⏱ {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {questions.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentQ(idx)}
            className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${idx === currentQ ? 'bg-blue-600 text-white' : answers[questions[idx].id] ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <p className="text-base font-semibold text-gray-900 mb-5 leading-relaxed">{currentQ + 1}. {q?.question_text}</p>

        {q?.question_type === 'true_false' ? (
          <div className="grid grid-cols-2 gap-3">
            {['True', 'False'].map(opt => (
              <button
                key={opt}
                onClick={() => handleAnswer(q.id, opt)}
                className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${answers[q.id] === opt ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300 text-gray-700'}`}
              >
                {opt === 'True' ? '✓ True' : '✗ False'}
              </button>
            ))}
          </div>
        ) : q?.question_type === 'short_answer' ? (
          <textarea
            value={answers[q.id] || ''}
            onChange={e => handleAnswer(q.id, e.target.value)}
            rows={3}
            placeholder="Type your answer here..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        ) : (
          <div className="space-y-2">
            {q?.options?.map((opt, optIdx) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              const isSelected = answers[q.id] === optText;
              return (
                <button
                  key={optIdx}
                  onClick={() => handleAnswer(q.id, optText)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{optText}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          disabled={currentQ === 0}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {currentQ < questions.length - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;
