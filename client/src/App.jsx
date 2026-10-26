import React, { useEffect, useState } from 'react';
import { BrainCircuit, FileText, ShieldCheck, Clock3, ArrowUpRight } from 'lucide-react';
import UploadForm from './components/UploadForm.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import ResultCard from './components/ResultCard.jsx';
import HistoryList from './components/HistoryList.jsx';
import { analyzeResume, getHistory } from './lib/api.js';
import { getUserId } from './lib/userId.js';

export default function App() {
 const [file,setFile]=useState(null),[role,setRole]=useState('Full-stack developer');
 const [status,setStatus]=useState('idle'),[result,setResult]=useState(null),[error,setError]=useState('');
 const [history,setHistory]=useState([]),[historyLoading,setHistoryLoading]=useState(true),[userId]=useState(()=>getUserId());
 async function refreshHistory(){try{const data=await getHistory(userId);setHistory(data.results||[])}catch(e){console.warn('[Client] history unavailable:',e.message)}finally{setHistoryLoading(false)}}
 useEffect(()=>{refreshHistory()},[]);
 async function submit(){if(!file)return;setStatus('loading');setError('');try{const data=await analyzeResume(file,role,userId);setResult(data);setStatus('done');await refreshHistory()}catch(e){setError(e.message||'Something went wrong.');setStatus('error')}}
 function reset(){setFile(null);setStatus('idle');setError('');setResult(null)}
 function selectHistory(item){setResult(item);setStatus('done');window.scrollTo({top:0,behavior:'smooth'})}
 return <main className="app-shell">
  <header className="topbar"><a href="#top" className="brand" aria-label="Resume Lab home"><span className="brand-mark"><BrainCircuit size={20}/></span><span className="brand-name">resume<span>lab</span></span></a><div className="topbar-right"><span className="privacy-note"><ShieldCheck size={15}/> Your resume stays private</span><span className="topbar-divider"/><span className="workspace-label">PERSONAL WORKSPACE</span></div></header>
  <div className="workspace" id="top">
   <section className="intro-block"><div className="intro-copy"><p className="eyebrow"><span className="eyebrow-rule"/> Career clarity, one page at a time</p><h1>Make your experience<br/>work <span>harder.</span></h1><p className="intro-description">Get a focused review of your resume against the role you want. Find the strengths to lead with and the changes worth making before you apply.</p><div className="trust-line"><span><i/> Role-specific feedback</span><span>Practical next steps</span><span>Private by design</span></div></div>
   <div className="intro-aside" aria-hidden="true"><div className="document-shadow"/><div className="document-art"><div className="document-top"><span className="document-symbol"><FileText size={18}/></span><span className="document-status">RESUME / REVIEW</span></div><div className="document-title-line"/><div className="document-sub-line"/><div className="document-section-label">EXPERIENCE</div><div className="document-line long"/><div className="document-line"/><div className="document-line medium"/><div className="document-section-label">CORE SKILLS</div><div className="skill-strokes"><i/><i/><i/><i/></div><div className="document-score"><span>Ready for a closer look</span><strong><ArrowUpRight size={15}/></strong></div></div><div className="floating-note"><span className="floating-note-mark">✓</span><span><b>Built around your goal</b><small>Not a one-size-fits-all score</small></span></div></div></section>
   <div className="content-grid"><section className="panel upload-panel"><div className="panel-heading"><div><p className="section-kicker">Your resume review</p><h2>{status==='done'?'Your results':'Start with your resume'}</h2><p className="panel-subtitle">{status==='done'?'A clearer view of what to improve next.':'Select a target role and add your latest PDF.'}</p></div><span className="step-count">{status==='done'?'REVIEWED':'01'}</span></div>
    {status==='idle'&&<UploadForm file={file} setFile={setFile} role={role} setRole={setRole} onSubmit={submit} busy={false}/>}
    {status==='loading'&&<LoadingState/>}{status==='error'&&<ErrorState message={error} onRetry={()=>setStatus('idle')}/>}
    {status==='done'&&result&&<ResultCard result={result} onReset={reset}/>}</section>
   <aside className="side-column"><section className="how-panel"><div className="side-panel-title"><div><p className="section-kicker">A useful review</p><h2>Know what to work on</h2></div><ArrowUpRight size={18}/></div><div className="benefit-row"><span className="benefit-number">01</span><div><h3>Role-aware feedback</h3><p>See how your experience lines up with the position you’re targeting.</p></div></div><div className="benefit-row"><span className="benefit-number">02</span><div><h3>Skills with context</h3><p>Understand which strengths stand out and which skills need attention.</p></div></div><div className="benefit-row"><span className="benefit-number">03</span><div><h3>Clear next steps</h3><p>Get three specific improvements to make your application stronger.</p></div></div><div className="privacy-callout"><ShieldCheck size={17}/><p>Your PDF is processed for analysis and is not stored. Your results appear in recent reviews.</p></div></section><HistoryList items={history} loading={historyLoading} onSelect={selectHistory}/></aside></div>
   <footer className="app-footer"><span>Resume Lab <i/> A clearer next step.</span><span><Clock3 size={13}/> Feedback supports your judgment; it doesn’t guarantee a hiring outcome.</span></footer>
  </div>
 </main>
}