import { FileUp, Sparkles, X } from 'lucide-react';

const roles = ['Frontend developer', 'Backend developer', 'Full-stack developer', 'AI engineer'];
export default function UploadForm({ file, setFile, role, setRole, onSubmit, busy }) {
  const [invalid, setInvalid] = React.useState('');
  function choose(next) {
    setInvalid('');
    if (!next) { setFile(null); return; }
    if (next.type !== 'application/pdf' && !next.name.toLowerCase().endsWith('.pdf')) { setInvalid('Please choose a PDF file.'); setFile(null); return; }
    if (next.size > 4 * 1024 * 1024) { setInvalid('Keep the PDF under 4 MB.'); setFile(null); return; }
    setFile(next);
  }
  return <form onSubmit={e => { e.preventDefault(); if (file) onSubmit(); }} className="space-y-6">
    <div><label className="mb-2 block text-sm font-semibold text-[#343a30]" htmlFor="role">Target role</label><select id="role" value={role} onChange={e => setRole(e.target.value)} className="w-full rounded-2xl border border-[#dfe3d7] bg-white px-4 py-3.5 text-sm outline-none focus:border-[#8da62e] focus:ring-4 focus:ring-lime-100">{roles.map(item => <option key={item}>{item}</option>)}</select></div>
    <div><label className="mb-2 block text-sm font-semibold text-[#343a30]">Your resume</label><label className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition ${file ? 'border-[#a8c54c] bg-[#f8fbe9]' : 'border-[#d8ddd0] bg-[#fafbf7] hover:border-[#a8c54c] hover:bg-[#f8fbe9]'}`}><input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={e => choose(e.target.files?.[0])}/>{file ? <><span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f4ba] text-[#43551b]"><FileUp size={22}/></span><span className="max-w-full break-all text-sm font-bold">{file.name}</span><span className="mt-1 text-xs text-[#737a6b]">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF selected</span><button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); setFile(null); }} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6a743e]"><X size={13}/> Remove file</button></> : <><span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf0e6] text-[#4b5740]"><FileUp size={22}/></span><span className="text-sm font-bold">Drop your resume here or browse</span><span className="mt-1 text-xs text-[#737a6b]">PDF only · Maximum 4 MB</span></>}</label>{invalid && <p className="mt-2 text-sm text-red-600">{invalid}</p>}</div>
    <button disabled={!file || busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d8f36a] px-5 py-4 text-sm font-extrabold text-[#22291a] shadow-[0_8px_22px_rgba(180,210,74,.22)] transition hover:bg-[#c9e653] disabled:cursor-not-allowed disabled:opacity-50"><Sparkles size={17}/>{busy ? 'Analysing your resume…' : 'Analyse my resume'}</button>
    <p className="text-center text-xs leading-5 text-[#737a6b]">Your PDF is processed in memory and is never saved. Only your analysis results are stored.</p>
  </form>;
}
import React from 'react';
