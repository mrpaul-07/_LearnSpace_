// ============================================================
// LearnSpace - LearnPage (Fixed - _id throughout)
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import LiveClassesSection from '../../components/common/LiveClassesSection';
import { toast } from 'react-toastify';

// Helper: MongoDB _id ba regular id
const getId = (obj) => obj?._id || obj?.id || '';

const fmtDuration = (seconds) => {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Video Player ───────────────────────────────────────────
const VideoPlayer = ({ src, lessonId, onComplete, savedPosition = 0 }) => {
  const videoRef   = useRef(null);
  const [ready, setReady]   = useState(false);
  const [error, setError]   = useState(false);
  const markedRef  = useRef(false);
  const saveTimer  = useRef(null);

  useEffect(() => {
    setReady(false);
    setError(false);
    markedRef.current = false;
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [src, lessonId]);

  const handleCanPlay = () => {
    setReady(true);
    if (savedPosition > 5 && videoRef.current) {
      videoRef.current.currentTime = savedPosition;
    }
  };

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;

    if (!markedRef.current && duration > 0 && currentTime / duration >= 0.9) {
      markedRef.current = true;
      onCompleteRef.current?.({
        watch_time:    Math.floor(currentTime),
        last_position: Math.floor(currentTime),
      });
    }

    if (saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (!lessonId) return;
      api.patch(`/progress/lesson/${lessonId}/position`, {
        last_position: Math.floor(videoRef.current?.currentTime || 0),
        watch_time:    Math.floor(videoRef.current?.currentTime || 0),
      }).catch(() => {});
    }, 10000);
  }, [lessonId]);

  const handleEnded = useCallback(() => {
    if (!markedRef.current) {
      markedRef.current = true;
      onCompleteRef.current?.({
        watch_time:    Math.floor(videoRef.current?.duration || 0),
        last_position: 0,
      });
    }
  }, []);

  if (!src) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-2">📹</div>
          <p className="text-sm">No video uploaded for this lesson</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-gray-300 px-4">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-sm font-medium mb-2">Video failed to load</p>
          <a href={src} target="_blank" rel="noreferrer"
            className="text-blue-400 text-xs underline break-all">
            Open video directly ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        key={src}
        className="w-full h-full"
        controls
        controlsList="nodownload"
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => setError(true)}
        playsInline
      >
        <source src={src} type="video/mp4" />
        <source src={src} type="video/webm" />
        <source src={src} type="video/ogg" />
      </video>
    </div>
  );
};

// ── PDF / Document Viewer ──────────────────────────────────
const DocViewer = ({ src, lessonId, onComplete }) => {
  const [error, setError] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    setError(false);
    const t = setTimeout(() => {
      onCompleteRef.current?.({ watch_time: 0, last_position: 0 });
    }, 5000);
    return () => clearTimeout(t);
  }, [lessonId]);

  if (!src) {
    return (
      <div className="w-full rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="text-center text-gray-400">
          <div className="text-5xl mb-2">📄</div>
          <p className="text-sm">No document uploaded for this lesson</p>
        </div>
      </div>
    );
  }

  const isPDF = src.toLowerCase().includes('.pdf');

  if (error) {
    return (
      <div className="w-full rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="text-center text-gray-300 px-4">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm font-medium mb-3">Document preview failed</p>
          <a href={src} target="_blank" rel="noreferrer"
            className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
            Open Document ↗
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-700" style={{ height: '75vh' }}>
      {isPDF ? (
        <object
          data={src}
          type="application/pdf"
          className="w-full h-full"
          onError={() => setError(true)}
        >
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center text-gray-300 px-4">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm font-medium mb-3">PDF preview not supported in this browser</p>
              <a href={src} target="_blank" rel="noreferrer"
                className="inline-block bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
                Open PDF ↗
              </a>
            </div>
          </div>
        </object>
      ) : (
        <iframe
          src={src}
          title="Lesson document"
          className="w-full h-full border-0"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

// ── Main LearnPage ─────────────────────────────────────────
const LearnPage = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();

  const [course,      setCourse]      = useState(null);
  const [lessons,     setLessons]     = useState([]);
  const [progress,    setProgress]    = useState({});
  const [current,     setCurrent]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  const currentRef  = useRef(null);
  const progressRef = useRef({});
  useEffect(() => { currentRef.current  = current;  }, [current]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  useEffect(() => {
    const load = async () => {
      try {
        const courseRes   = await api.get(`/courses/${courseId}`);
        const courseData  = courseRes.data?.data?.course || {};
        setCourse(courseData);

        const lessonsRes  = await api.get(`/lessons/course/${courseId}`);
        const lessonsData = lessonsRes.data?.data?.lessons || [];
        console.log('📚 Lessons loaded:', lessonsData);
        setLessons(lessonsData);

        try {
          const progRes  = await api.get(`/progress/course/${courseId}`);
          const progData = progRes.data?.data || {};
          setOverallProgress(parseFloat(progData.overall_progress || 0));

          const map = {};
          (progData.lessons || []).forEach(l => {
            const lid = getId(l);
            map[lid] = {
              is_completed:  l.is_completed  || false,
              last_position: l.last_position || 0,
              watch_time:    l.watch_time    || 0,
            };
          });
          setProgress(map);
          progressRef.current = map;

          const firstIncomplete = lessonsData.find(l => !map[getId(l)]?.is_completed);
          setCurrent(firstIncomplete || lessonsData[0] || null);
        } catch {
          setCurrent(lessonsData[0] || null);
        }
      } catch (err) {
        console.error('❌ Load course error:', err.response?.status, err.response?.data);
        toast.error('Failed to load course. Redirecting…');
        navigate('/my-courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, navigate]);

  // ── handleComplete ─────────────────────────────────────────
  const handleComplete = useCallback(async ({ watch_time, last_position }) => {
    const lesson = currentRef.current;
    if (!lesson) return;

    const lessonId = getId(lesson);
    if (!lessonId) {
      console.error('❌ Lesson has no id:', lesson);
      return;
    }

    // Don't double-mark
    if (progressRef.current[lessonId]?.is_completed) return;

    try {
      const res = await api.post(`/progress/lesson/${lessonId}`, { watch_time, last_position });
      const newPercent = res.data?.data?.progress_percent;

      setProgress(prev => {
        const next = {
          ...prev,
          [lessonId]: { ...prev[lessonId], is_completed: true, last_position: last_position || 0 }
        };
        progressRef.current = next;
        return next;
      });

      if (newPercent !== undefined) {
        setOverallProgress(parseFloat(newPercent));
      }

      toast.success('✅ Lesson complete!');
      if (parseFloat(newPercent) >= 100) {
        toast.success('🎉 Course complete! Your certificate is ready.');
      }
    } catch (err) {
      console.error('❌ Mark complete error:', err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to mark lesson complete.');
    }
  }, []);

  const handleManualComplete = useCallback(() => {
    handleComplete({ watch_time: 0, last_position: 0 });
  }, [handleComplete]);

  const currentId = getId(current);

  const goNext = () => {
    const idx = lessons.findIndex(l => getId(l) === currentId);
    if (idx >= 0 && idx < lessons.length - 1) setCurrent(lessons[idx + 1]);
  };
  const goPrev = () => {
    const idx = lessons.findIndex(l => getId(l) === currentId);
    if (idx > 0) setCurrent(lessons[idx - 1]);
  };

  const currentIndex   = lessons.findIndex(l => getId(l) === currentId);
  const completedCount = Object.values(progress).filter(p => p.is_completed).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const typeIcon = (type) => type === 'video' ? '▶' : type === 'quiz' ? '📝' : '📄';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="text-gray-400 hover:text-white p-1 rounded text-xl leading-none">☰</button>
          <div className="min-w-0">
            <Link to="/my-courses" className="text-xs text-gray-500 hover:text-gray-300 block">← My Courses</Link>
            <p className="text-white text-sm font-semibold truncate">{course.title}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400">
            {completedCount}/{lessons.length} · {Math.round(overallProgress)}%
          </span>
          <div className="w-28 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">

            {!current ? (
              <div className="w-full aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
                <p className="text-gray-400">Select a lesson from the sidebar</p>
              </div>
            ) : current.type === 'video' ? (
              <VideoPlayer
                key={currentId}
                src={current.content_url}
                lessonId={currentId}
                savedPosition={progress[currentId]?.is_completed ? 0 : (progress[currentId]?.last_position || 0)}
                onComplete={handleComplete}
              />
            ) : current.type === 'quiz' ? (
              <div className="w-full aspect-video bg-gray-800 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-white font-semibold text-lg mb-4">{current.title}</p>
                  <Link to={`/learn/${courseId}/quiz/${currentId}`}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700">
                    Start Quiz →
                  </Link>
                </div>
              </div>
            ) : (
              <DocViewer
                key={currentId}
                src={current.content_url}
                lessonId={currentId}
                onComplete={handleComplete}
              />
            )}

            {/* Lesson info + controls */}
            {current && (
              <div className="mt-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-white text-xl font-bold">{current.title}</h2>
                    {current.title_bn && (
                      <p className="text-gray-400 text-sm mt-0.5">{current.title_bn}</p>
                    )}
                    {current.description && (
                      <p className="text-gray-400 text-sm mt-2 max-w-2xl">{current.description}</p>
                    )}
                  </div>
                  {!progress[currentId]?.is_completed ? (
                    <button
                      onClick={handleManualComplete}
                      className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700"
                    >
                      ✓ Mark as Complete
                    </button>
                  ) : (
                    <span className="shrink-0 px-4 py-2 bg-green-900/40 text-green-400 text-sm rounded-lg border border-green-800">
                      ✓ Completed
                    </span>
                  )}
                </div>

                {/* Prev / Next */}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={goPrev}
                    disabled={currentIndex <= 0}
                    className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={goNext}
                    disabled={currentIndex < 0 || currentIndex >= lessons.length - 1}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Live Classes */}
            <div className="mt-6">
              <LiveClassesSection courseId={courseId} isInstructor={false} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-72 shrink-0 bg-gray-900 border-l border-gray-800 overflow-y-auto hidden md:block">
            <div className="p-4 border-b border-gray-800">
              <p className="text-white text-sm font-semibold">Course Content</p>
              <p className="text-gray-500 text-xs mt-0.5">{completedCount}/{lessons.length} completed</p>
            </div>
            {lessons.length === 0 ? (
              <p className="p-6 text-center text-gray-500 text-sm">No lessons yet.</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {lessons.map((lesson, idx) => {
                  const lid    = getId(lesson);
                  const done   = progress[lid]?.is_completed || false;
                  const active = currentId === lid;
                  return (
                    <button
                      key={lid || idx}
                      onClick={() => setCurrent(lesson)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                        active
                          ? 'bg-blue-900/40 border-l-2 border-blue-500'
                          : 'hover:bg-gray-800 border-l-2 border-transparent'
                      }`}
                    >
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs mt-0.5 ${
                        done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {done ? '✓' : typeIcon(lesson.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-medium leading-snug line-clamp-2 ${
                          active ? 'text-blue-300' : done ? 'text-gray-500' : 'text-gray-200'
                        }`}>
                          {idx + 1}. {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-600 capitalize">{lesson.type}</span>
                          {lesson.duration > 0 && (
                            <span className="text-xs text-gray-600">{fmtDuration(lesson.duration)}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnPage;