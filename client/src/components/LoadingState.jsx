import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function LoadingState() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const id = setTimeout(() => setSlow(true), 10000); return () => clearTimeout(id); }, []);
  return <div className="flex min-h-64 flex-col items-center justify-center text-center"><span className="mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-[#eaf4c6] text-[#536927]"><LoaderCircle className="animate-spin" size={28}/></span><h3 className="text-lg font-bold">Reading your resume like a recruiter would…</h3><p className="mt-2 max-w-xs text-sm leading-6 text-[#737a6b]">We’re checking your skills against the role you selected.</p>{slow && <p className="mt-3 text-sm font-medium text-[#6c7b37]">Still working, the AI is thinking hard…</p>}<div className="mt-6 flex items-center gap-2 text-xs text-[#818779]"><ShieldCheck size={14}/> Your resume file is not stored</div></div>;
}
