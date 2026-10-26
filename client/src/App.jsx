import React, { useEffect, useState } from 'react';
import { ArrowUpRight, BrainCircuit, FileText, ShieldCheck, Clock3 } from 'lucide-react';
import UploadForm from './components/UploadForm.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import ResultCard from './components/ResultCard.jsx';
import HistoryList from './components/HistoryList.jsx';
import { analyzeResume, getHistory } from './lib/api.js';
import { getUserId } from './lib/userId.js';

export default function App() {
 const [file,setFile]=useState(null), [role,setRole]=useState('Full-stack developer');
 const [status,setStatus]=useState('idle'), [result,setResult]=useState(null), [error,setError]=useState('');
 const [history,setHistory]=useState([]), [historyLoading,setHistoryLoading]=useState(true), [userId]=useState(()=>getUserId());
 async function refreshHistory(){try{const data=await getHistory(userId);setHistory(data.results||[])}catch(e){console.warn('[Client] history unavailable:',e.message)}finally{setHistoryLoading(false)}}
 useEffect(()=>{refreshHistory()},[]);
 async function submit(){if(!file)return;setStatus('loading');setError('');try{const data=await analyzeResume(file,role,userId);setResult(data);setStatus('done');await refreshHistory()}catch(e){setError(e.message||'Something went wrong.');setStatus('error')}}
 function reset(){setFile(null);setStatus('idle');setError('');setResult(null)}
 function selectHistory(item){setResult(item);setStatus('done');window.scrollTo({top:0,behavior:'smooth'})}
 return <main className="app-shell">
  <header className="topbar"><a href="#top" className="brand"><span className="brand-mark"><BrainCircuit size={20}/></span><span className="brand-name">resume<span>lab</span></span></a><div className="topbar-right"><span className="privacy-note"><ShieldCheck size={15}/> Your resume stays private</span><span className="topbar-divider"/><span className="workspace-label">PERSONAL WORKSPACE</span></div></header>
  <div className="workspace" id="top">
   <section className="intro-block"><div className="intro-copy"><p className="eyebrow">Career tools for your next move</p><h1>Make your next<br className="desktop-break"/> application <span>count.</span></h1><p className="intro-description">A sharper resume starts with an honest review. Match your experience to the role and leave with a short list of improvements that matter.</p><div className="trust-line"><span className="trust-dot"/><span>Role-specific feedback</span><b>/</b><span>Practical next steps</span><b>/</b><span>Private by design</span></div></div>
   <div className="intro-aside" aria-hidden="true"><div className="document-art"><div className="document-top"><span className="document-symbol"><FileText size={18}/></span><span className="document-status">READY TO REVIEW</span></div><div className="document-title-line"/><div className="document-sub-line"/><div className="document-section-label">EXPERIENCE</div><div className="document-line long"/><div className="document-line"/><div className="document-line medium"/><div className="document-section-label">SKILLS</div><div className="skill-strokes"><i/><i/><i/><i/><i/></div><div className="document-score"><span>Resume review</span><strong>↗</strong></div></div></div></section>
   <div className="content-grid"><section className="panel upload-panel"><div className="panel-heading"><div><p className="section-kicker">Start here</p><h2>{status==='done'?'Your review':'Review your resume'}</h2><p className="panel-subtitle">{status==='done'?'Your results are ready to explore.':'Choose a target role and upload your latest PDF.'}</p></div><span className="step-count">{status==='done'?'COMPLETE':'01 / 01'}</span></div>
    {status==='idle'&&<UploadForm file={file} setFile={setFile} role={role} setRole={setRole} onSubmit={submit} busy={false}/>}
    {status==='loading'&&<LoadingState/>}{status==='error'&&<ErrorState message={error} onRetry={()=>setStatus('idle')}/>}
    {status==='done'&&result&&<ResultCard result={result} onReset={reset}/>}</section>
   <aside className="side-column"><section className="how-panel"><div className="side-panel-title"><h2>What you’ll get</h2><ArrowUpRight size={17}/></div><div className="benefit-row"><span className="benefit-number">A</span><div><h3>A role-aware score</h3><p>See how closely your resume fits the position you want.</p></div></div><div className="benefit-row"><span className="benefit-number">B</span><div><h3>Skills at a glance</h3><p>Separate strengths from the skills worth developing.</p></div></div><div className="benefit-row"><span className="benefit-number">C</span><div><h3>Three useful fixes</h3><p>Leave with specific changes before applying.</p></div></div><div className="privacy-callout"><ShieldCheck size={17}/><p>Your PDF is processed for analysis and is not stored. Only the result is saved in your history.</p></div></section><HistoryList items={history} loading={historyLoading} onSelect={selectHistory}/></aside></div>
   <footer className="app-footer"><span>resume lab · Built for your next step.</span><span><Clock3 size={13}/> Feedback is guidance, not a hiring guarantee.</span></footer>
  </div>
 </main>
}