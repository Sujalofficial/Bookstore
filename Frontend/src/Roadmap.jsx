import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Roadmap.css';
import API_URL from './config';

// ─── Goal suggestion chips ───
const GOAL_CHIPS = [
  "🚀 Become a Full Stack Developer",
  "📈 Learn Stock Market Investing",
  "🧠 Master Machine Learning",
  "✍️ Become a Professional Writer",
  "📊 Learn Data Science",
  "💡 Start My Own Business",
  "🎨 Learn UI/UX Design",
  "🔐 Get into Cybersecurity",
];

// ─── Multi-step loading messages ───
const LOADING_STEPS = [
  { icon: "🎯", text: "Reading your goal…",         pct: 15 },
  { icon: "📚", text: "Scanning our book inventory…", pct: 35 },
  { icon: "🤖", text: "Consulting Gemini AI…",       pct: 60 },
  { icon: "🗺️", text: "Building your roadmap…",      pct: 80 },
  { icon: "✨", text: "Adding final touches…",       pct: 95 },
];

const MAX_CHARS = 150;

// ─── Parse Gemini roadmap text into structured stages ───
const parseRoadmap = (text) => {
  // Match numbered stages: "1.", "Stage 1:", "**1.**", etc.
  const regex = /(?:^|\n)(?:#{1,3}\s*)?(?:\*\*)?(?:Stage\s+)?(\d+)[.:)]\s*\*{0,2}([^\n*\[]+)\*{0,2}/gm;
  const matches = [...text.matchAll(regex)];
  if (matches.length < 2) return null; // fallback to raw rendering

  return matches.map((match, i) => {
    const start = match.index;
    const end   = matches[i + 1]?.index ?? text.length;
    const block = text.slice(start, end).trim();

    const lines = block.split('\n').map(l => l.trim()).filter(Boolean).slice(1);
    const books = [];
    const descParts = [];

    for (const line of lines) {
      const clean = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
      if (!clean || /^[#\-_=]{2,}$/.test(clean)) continue;
      if (/recommended books?:/i.test(clean)) continue;

      if (line.includes('[AVAILABLE IN OUR STORE]')) {
        books.push({ text: clean.replace('[AVAILABLE IN OUR STORE]', '').trim(), available: true });
      } else if (line.includes('[EXTERNAL RECOMMENDATION]')) {
        books.push({ text: clean.replace('[EXTERNAL RECOMMENDATION]', '').trim(), available: false });
      } else {
        descParts.push(clean);
      }
    }

    return {
      num:   parseInt(match[1]),
      title: match[2].replace(/\*\*/g, '').trim(),
      desc:  descParts.join(' ').slice(0, 350),
      books,
    };
  }).filter(s => s.title);
};

// ─── localStorage helpers ───
const loadHistory    = ()  => JSON.parse(localStorage.getItem('rm_history')  || '[]');
const loadProgress   = ()  => JSON.parse(localStorage.getItem('rm_progress') || '{}');
const saveHistory    = (h) => localStorage.setItem('rm_history',  JSON.stringify(h));
const saveProgress   = (p) => localStorage.setItem('rm_progress', JSON.stringify(p));

export default function Roadmap() {
  const [goal,        setGoal]        = useState('');
  const [rawRoadmap,  setRawRoadmap]  = useState('');
  const [stages,      setStages]      = useState(null);   // parsed | null = use raw
  const [loading,     setLoading]     = useState(false);
  const [loadStep,    setLoadStep]    = useState(0);
  const [error,       setError]       = useState('');
  const [history,     setHistory]     = useState(loadHistory);
  const [progress,    setProgress]    = useState(loadProgress);
  const [expanded,    setExpanded]    = useState({});     // stage expand state
  const [copiedBtn,   setCopiedBtn]   = useState('');
  const [toast,       setToast]       = useState(null);
  const [currentGoal, setCurrentGoal] = useState('');

  const navigate   = useNavigate();
  const inputRef   = useRef(null);
  const resultsRef = useRef(null);
  const stepTimer  = useRef(null);

  // Animate loading steps
  useEffect(() => {
    if (!loading) { clearInterval(stepTimer.current); return; }
    setLoadStep(0);
    let i = 0;
    stepTimer.current = setInterval(() => {
      i = Math.min(i + 1, LOADING_STEPS.length - 1);
      setLoadStep(i);
    }, 1400);
    return () => clearInterval(stepTimer.current);
  }, [loading]);

  const handleGenerate = async (e, chipGoal) => {
    if (e) e.preventDefault();
    const activeGoal = chipGoal || goal;
    if (!activeGoal.trim()) return;
    if (!chipGoal) setGoal(activeGoal);

    setLoading(true);
    setRawRoadmap('');
    setStages(null);
    setError('');
    setExpanded({});

    try {
      const res  = await fetch(`${API_URL}/api/ai-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: activeGoal }),
      });
      const data = await res.json();

      if (res.ok) {
        setRawRoadmap(data.roadmap);
        const parsed = parseRoadmap(data.roadmap);
        setStages(parsed);
        setCurrentGoal(activeGoal);

        // Auto-expand first 2 stages
        if (parsed) {
          const init = {};
          parsed.slice(0, 2).forEach(s => { init[s.num] = true; });
          setExpanded(init);
        }

        // Save to history
        const entry  = { id: Date.now(), goal: activeGoal, roadmap: data.roadmap, date: new Date().toLocaleDateString('en-IN') };
        const newHist = [entry, ...loadHistory().filter(h => h.goal !== activeGoal)].slice(0, 3);
        setHistory(newHist);
        saveHistory(newHist);

        // Scroll to results
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        setError(data.error || 'AI could not generate a roadmap. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = (stageNum) => {
    setExpanded(prev => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  const toggleComplete = (stageNum) => {
    const key     = `${currentGoal}__${stageNum}`;
    const updated = { ...progress, [key]: !progress[key] };
    setProgress(updated);
    saveProgress(updated);
  };

  const isCompleted = (stageNum) => progress[`${currentGoal}__${stageNum}`];

  const completedCount = stages ? stages.filter(s => isCompleted(s.num)).length : 0;

  const storeBookCount = stages
    ? stages.flatMap(s => s.books).filter(b => b.available).length
    : (rawRoadmap.match(/\[AVAILABLE IN OUR STORE\]/g) || []).length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const copyRoadmap = async () => {
    await navigator.clipboard.writeText(rawRoadmap);
    setCopiedBtn('copy');
    showToast('📋 Roadmap copied to clipboard!');
    setTimeout(() => setCopiedBtn(''), 2000);
  };

  const downloadRoadmap = () => {
    const blob  = new Blob([`🗺️ AI Reading Roadmap\nGoal: ${currentGoal}\n\n${rawRoadmap}`], { type: 'text/plain' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `${currentGoal.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}-roadmap.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('⬇️ Roadmap downloaded!');
  };

  const shareRoadmap = async () => {
    const text = `🗺️ My AI Learning Roadmap\n\nGoal: "${currentGoal}"\n\n${rawRoadmap}\n\n— Generated by BOOKSHELF AI`;
    await navigator.clipboard.writeText(text);
    setCopiedBtn('share');
    showToast('🔗 Roadmap copied — ready to share!');
    setTimeout(() => setCopiedBtn(''), 2000);
  };

  const loadFromHistory = (entry) => {
    setGoal(entry.goal);
    setRawRoadmap(entry.roadmap);
    setCurrentGoal(entry.goal);
    const parsed = parseRoadmap(entry.roadmap);
    setStages(parsed);
    setError('');
    if (parsed) {
      const init = {};
      parsed.slice(0, 2).forEach(s => { init[s.num] = true; });
      setExpanded(init);
    }
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const resetRoadmap = () => {
    setRawRoadmap('');
    setStages(null);
    setCurrentGoal('');
    setError('');
    setTimeout(() => inputRef.current?.focus(), 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const charCount   = goal.length;
  const isOverLimit = charCount > MAX_CHARS;
  const hasResult   = rawRoadmap.length > 0;

  return (
    <div className="rm-wrapper">

      {/* ═══ NAVBAR ═══ */}
      <nav className="rm-nav">
        <div className="rm-logo" onClick={() => navigate('/userhome')}>BOOK<span>SHELF</span>.</div>
        <div className="rm-nav-links">
          <button className="rm-nav-btn" onClick={() => navigate('/userhome')}>🏠 Home</button>
          <button className="rm-nav-btn" onClick={() => navigate('/cart')}>🛒 Cart</button>
          <button className="rm-nav-btn" onClick={() => navigate('/profile')}>👤 Profile</button>
          <button className="rm-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>Logout</button>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <div className="rm-hero">
        <h1>🗺️ AI Learning Roadmap</h1>
        <p>Tell us your goal — Gemini builds a step-by-step book-based path to mastery.</p>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="rm-main">

        {/* Input Card */}
        <div className="rm-input-card">
          <label className="rm-input-label">What do you want to master?</label>
          <form onSubmit={handleGenerate}>
            <div className="rm-input-row">
              <div className="rm-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="e.g., I want to learn Machine Learning from scratch…"
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  maxLength={MAX_CHARS + 10}
                  required
                />
                {charCount > 80 && (
                  <span className={`rm-char-count ${isOverLimit ? 'over' : ''}`}>
                    {charCount}/{MAX_CHARS}
                  </span>
                )}
              </div>
              <button type="submit" className="rm-generate-btn" disabled={loading || isOverLimit || !goal.trim()}>
                {loading ? '🧠 Generating…' : '✨ Generate'}
              </button>
            </div>
          </form>

          {error && <div className="rm-error">⚠️ {error}</div>}

          {/* Goal chips */}
          <p className="rm-chips-label">Try a goal →</p>
          <div className="rm-chips">
            {GOAL_CHIPS.map(chip => (
              <button
                key={chip}
                className="rm-chip"
                onClick={() => handleGenerate(null, chip.replace(/^[\S]+\s/, ''))}
                disabled={loading}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Recent History */}
        {history.length > 0 && !hasResult && !loading && (
          <div className="rm-history">
            <h3 className="rm-history-title">🕘 Recent Roadmaps</h3>
            <div className="rm-history-items">
              {history.map(entry => (
                <div key={entry.id} className="rm-history-item" onClick={() => loadFromHistory(entry)}>
                  <span className="rm-history-goal">{entry.goal}</span>
                  <span className="rm-history-date">{entry.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading animation */}
        {loading && (
          <div className="rm-loading-card">
            <div className="rm-loading-icon">{LOADING_STEPS[loadStep].icon}</div>
            <p className="rm-loading-step">{LOADING_STEPS[loadStep].text}</p>
            <div className="rm-progress-bar-track">
              <div className="rm-progress-bar-fill" style={{ width: `${LOADING_STEPS[loadStep].pct}%` }} />
            </div>
            <p className="rm-loading-sub">Scanning inventory for matching books…</p>
          </div>
        )}

        {/* ═══ RESULTS ═══ */}
        {hasResult && !loading && (
          <div className="rm-results" ref={resultsRef}>

            {/* Header + actions */}
            <div className="rm-results-header">
              <h2 className="rm-results-title">Your Personalized Path 🚀</h2>
              <div className="rm-results-actions">
                <button className={`rm-action-btn ${copiedBtn === 'copy' ? 'copied' : ''}`} onClick={copyRoadmap}>
                  {copiedBtn === 'copy' ? '✅ Copied' : '📋 Copy'}
                </button>
                <button className="rm-action-btn" onClick={downloadRoadmap}>⬇️ Save</button>
                <button className={`rm-action-btn ${copiedBtn === 'share' ? 'copied' : ''}`} onClick={shareRoadmap}>
                  {copiedBtn === 'share' ? '✅ Copied' : '🔗 Share'}
                </button>
              </div>
            </div>

            {/* Store book count badge */}
            {storeBookCount > 0 && (
              <div className="rm-store-badge">
                ✅ {storeBookCount} book{storeBookCount > 1 ? 's' : ''} from this roadmap {storeBookCount > 1 ? 'are' : 'is'} available in our store!
              </div>
            )}

            {/* Progress tracker */}
            {stages && stages.length > 0 && (
              <div className="rm-progress-tracker">
                <span className="rm-tracker-text">
                  {completedCount}/{stages.length} stages done
                </span>
                <div className="rm-tracker-bar">
                  <div className="rm-tracker-fill" style={{ width: `${(completedCount / stages.length) * 100}%` }} />
                </div>
                <span className="rm-tracker-pct">{Math.round((completedCount / stages.length) * 100)}%</span>
              </div>
            )}

            {/* ── Parsed stage cards ── */}
            {stages ? stages.map(stage => (
              <div
                key={stage.num}
                className={`rm-stage-card ${isCompleted(stage.num) ? 'completed' : ''} ${expanded[stage.num] ? 'expanded' : ''}`}
              >
                {/* Stage Header */}
                <div className="rm-stage-header" onClick={() => toggleStage(stage.num)}>
                  {/* Checkbox */}
                  <div
                    className="rm-stage-checkbox"
                    onClick={e => { e.stopPropagation(); toggleComplete(stage.num); }}
                    title={isCompleted(stage.num) ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isCompleted(stage.num) ? '✓' : ''}
                  </div>

                  <div className="rm-stage-num">{stage.num}</div>
                  <span className="rm-stage-title">{stage.title}</span>
                  <span className="rm-stage-chevron">▼</span>
                </div>

                {/* Stage Body */}
                {expanded[stage.num] && (
                  <div className="rm-stage-body">
                    {stage.desc && <p className="rm-stage-desc">{stage.desc}</p>}

                    {stage.books.length > 0 && (
                      <>
                        <p className="rm-books-label">📖 Recommended Books</p>
                        {stage.books.map((book, i) => (
                          <div key={i} className={`rm-book-item ${book.available ? 'in-store' : 'external'}`}>
                            <span className="rm-book-icon">{book.available ? '📗' : '📘'}</span>
                            <span className="rm-book-text">{book.text}</span>
                            <span className="rm-book-tag">{book.available ? '✅ In Store' : '🔗 External'}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

            )) : (
              /* ── Raw text fallback if parsing failed ── */
              <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', border: '1px solid #eef0f6' }}>
                {rawRoadmap.split('\n').map((line, i) => {
                  let cls = '';
                  if (line.includes('[AVAILABLE IN OUR STORE]')) cls = 'in-stock-tag';
                  if (line.includes('[EXTERNAL RECOMMENDATION]'))  cls = 'external-tag';
                  return <p key={i} className={`rm-raw-line ${cls}`}>{line || '\u00A0'}</p>;
                })}
              </div>
            )}

            {/* Bottom actions */}
            <div className="rm-bottom-actions">
              <button className="rm-shop-btn" onClick={() => navigate('/userhome')}>
                🛒 Shop Recommended Books
              </button>
              <button className="rm-new-goal-btn" onClick={resetRoadmap}>
                🔄 Try a Different Goal
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Toast */}
      {toast && <div className="rm-toast">{toast}</div>}

    </div>
  );
}