import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BrainCircuit, ShieldCheck, Sparkles } from 'lucide-react';
import UploadForm from './components/UploadForm.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import ResultCard from './components/ResultCard.jsx';
import HistoryList from './components/HistoryList.jsx';
import { analyzeResume, getHistory } from './lib/api.js';
import { getUserId } from './lib/userId.js';

export default function App() {
 const [file, setFile] = useState(null); const [role, setRole] = useState('Full-stack developer');
 const [status, setStatus] = useState('idle'); const [result, setResult] = useState(null); const [error, setError] = useState('');
 const [history, setHistory] = useState([]); const [historyLoading, setHistoryLoading] = useState(true); const [userId] = useState(() => getUserId());
 async function refreshHistory() { try { const data = await getHistory(userId); setHistory(data.results || []); } catch (e) { console.warn('[Client] history unavailable:', e.message); } finally { setHistoryLoading(false); } }
 useEffect(() => { refreshHistory(); }, []);
 async function submit() { if (!file) return; setStatus('loading'); setError(''); try { const data = await analyzeResume(file, role, userId); setResult(data); setStatus('done'); await refreshHistory(); } catch (e) { setError(e.message || 'Something went wrong.'); setStatus('error'); } }
 function reset() { setFile(null); setStatus('idle'); setError(''); setResult(null); }
 function selectHistory(item) { setResult(item); setStatus('done'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
 return <main className="min-h-screen px-4 py-7 sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl"><header className="mb-8 flex items-center justify-between"><a href="#top" className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#20251b] text-[#d8f36a]"><BrainCircuit size={21}/></span><span><span className="block text-sm font-black tracking-tight">resume<span className="text-[#7e9631]">lab</span></span><span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-[#858b7c]">Career toolkit</span></span></a><span className="hidden items-center gap-1.5 rounded-full border border-[#e1e5d9] bg-white px-3 py-2 text-xs font-semibold text-[#66704f] sm:inline-flex"><ShieldCheck size={14}/> Privacy-first by design</span></header>
 <section id="top" className="mb-6 grid gap-5 rounded-[2rem] bg-[#20251b] p-6 text-white sm:grid-cols-[1fr_auto] sm:items-end sm:p-9"><div><span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] text-[#d8f36a]"><Sparkles size={13}/> Your next opportunity starts here</span><h1 className="max-w-xl text-3xl font-black leading-[1.1] tracking-tight sm:text-5xl">Make your resume <span className="text-[#d8f36a]">work harder.</span></h1><p className="mt-4 max-w-lg text-sm leading-6 text-white/65 sm:text-base">Get clear, role-specific feedback and practical next steps before you apply.</p></div><div className="hidden h-24 w-24 items-center justify-center rounded-[1.7rem] border border-white/10 bg-white/5 text-[#d8f36a] sm:flex"><ArrowUpRight size={43} strokeWidth={1.3}/></div></section>
 <section className="rounded-[2rem] border border-[#e5e8df] bg-white p-5 shadow-[0_18px_55px_rgba(47,57,34,.045)] sm:p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#7b836d]">Resume review</p><h2 className="mt-1 text-xl font-black tracking-tight">Let’s see where you stand.</h2><p className="mt-1 text-sm text-[#737a6b]">A few seconds now can make your next application stronger.</p></div><span className="rounded-xl bg-[#f1f5e7] px-3 py-2 text-xs font-extrabold text-[#65783b]">01 / 01</span></div>
 {status === 'idle' && <UploadForm file={file} setFile={setFile} role={role} setRole={setRole} onSubmit={submit} busy={false}/>}
 {status === 'loading' && <LoadingState/>}{status === 'error' && <ErrorState message={error} onRetry={() => setStatus('idle')}/ >}{status === 'done' && result && <ResultCard result={result} onReset={reset}/>}
 </section><HistoryList items={history} loading={historyLoading} onSelect={selectHistory}/><footer className="flex flex-col items-center justify-between gap-2 px-2 py-7 text-center text-xs text-[#818779] sm:flex-row"><span>Built for developers taking their next step.</span><span>Results are guidance, not a hiring guarantee.</span></footer></div></main>;
}
