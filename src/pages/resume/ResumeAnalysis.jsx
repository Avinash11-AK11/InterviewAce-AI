import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, CheckCircle2, AlertCircle, TrendingUp, Target, Loader2, Sparkles, FileText, ChevronRight, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export default function ResumeAnalysis() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const reportRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!currentUser || !id) return;
      try {
        const docRef = doc(db, 'resumes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().userId === currentUser.uid) {
          setData(docSnap.data());
        } else {
          setError('Resume analysis not found or access denied.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load analysis.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [id, currentUser]);

  const handleDownload = () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    setIsPrinting(true);
    
    // Allow React a frame to apply the print styles to the DOM
    setTimeout(() => {
      const element = reportRef.current;
      const opt = {
        margin: [15, 15, 15, 15],
        filename: `InterviewAce_Resume_Report_${id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          windowWidth: 850,
          width: 850,
          scrollX: 0, 
          scrollY: 0 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setIsPrinting(false);
        setIsDownloading(false);
      }).catch((err) => {
        setIsPrinting(false);
        setIsDownloading(false);
        console.error('PDF generation error:', err);
      });
    }, 150);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-3xl flex items-center justify-center shadow-lg"
        >
          <Loader2 size={40} className="text-white animate-spin" />
        </motion.div>
        <p className="text-lg font-semibold text-[#7a6f65] animate-pulse">Loading Your AI Analysis...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 inline-block">
          <AlertCircle size={32} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold">{error || 'Unknown Error'}</h2>
          <Link to="/resume" className="mt-4 inline-flex items-center gap-2 text-sm font-bold hover:underline">
            <ArrowLeft size={16} /> Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  const atsScore = data.atsScore || 0;
  
  // Determine color based on score
  let scoreColor = 'text-red-500';
  let scoreGradient = 'from-red-400 to-red-600';
  let scoreBg = 'bg-red-50';
  if (atsScore >= 80) {
    scoreColor = 'text-[#8FAF8F]';
    scoreGradient = 'from-[#8FAF8F] to-[#A8C5DA]';
    scoreBg = 'bg-[#8FAF8F]/10';
  } else if (atsScore >= 60) {
    scoreColor = 'text-amber-500';
    scoreGradient = 'from-amber-400 to-amber-600';
    scoreBg = 'bg-amber-50';
  }
  // Extract and normalize action required items dynamically to safeguard against AI key variations
  const rawActionItems = data.actionRequired || data.actionItems || data.criticalIssues || data.issues || [];
  const actionItems = rawActionItems.length > 0 
    ? rawActionItems.map(item => ({
        issue: item.issue || item.title || item.problem || 'Area for Improvement',
        priority: item.priority || item.importance || 'Medium',
        action: item.action || item.suggestion || item.solution || item.fix || ''
      }))
    : [
        ...(data.missingSkills || []).map(skill => ({
          issue: `Missing Skill: ${skill}`,
          priority: 'High',
          action: `Your resume is completely missing the keyword "${skill}". You need to add this to your skills section and demonstrate it in at least one project or work experience bullet point to pass the ATS filter.`
        })),
        ...(data.grammarIssues || []).map(issue => ({
          issue: 'Formatting / Phrasing',
          priority: 'Medium',
          action: issue
        }))
      ];

  return (
    <div className="min-h-screen bg-[#f8f6f3] pb-24" ref={reportRef}>
      {/* ── HERO SECTION ── */}
      <div className="bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] text-white pt-12 pb-32 px-6 relative overflow-hidden">
        {/* Abstract background graphics - Hidden during print to prevent html2canvas blur artifacts */}
        {!isPrinting && (
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-white/10 skew-x-12 blur-3xl" />
            <div className="absolute top-[80%] -left-[10%] w-[40%] h-[100%] bg-white/20 skew-x-[-20deg] blur-2xl" />
          </div>
        )}

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            
            {/* Left: Score */}
            <div className="flex-shrink-0 relative">
              <div className="relative w-64 h-64 flex items-center justify-center bg-white/20 rounded-full p-4 backdrop-blur-md border border-white/40 shadow-2xl">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="stroke-white/30 fill-none" strokeWidth="6" />
                  <motion.circle
                    initial={{ strokeDasharray: '0, 300' }}
                    animate={{ strokeDasharray: `${(atsScore / 100) * 283}, 300` }}
                    transition={{ duration: 2, ease: [0.175, 0.885, 0.32, 1.275] }}
                    cx="50" cy="50" r="45"
                    className="fill-none stroke-white"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <span className="text-7xl font-black tracking-tighter drop-shadow-lg text-white">
                    {atsScore}
                  </span>
                  <span className="text-white/90 font-bold text-sm tracking-widest uppercase mt-1">ATS Score</span>
                </motion.div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 text-center md:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full border border-white/40 backdrop-blur-md mb-2 shadow-sm">
                <Target size={16} className="text-white" />
                <span className="text-xs font-bold uppercase tracking-widest text-white">Target Role: {data.targetRole || 'Software Engineer'}</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-sm">
                Resume Analysis <br/>
                <span className="text-white/90">Complete</span>
              </h1>
              
              <p className="text-lg text-white/90 font-semibold leading-relaxed max-w-2xl drop-shadow-sm">
                {data.overallFeedback}
              </p>

              <div className="flex items-center gap-4 justify-center md:justify-start pt-4" data-html2canvas-ignore="true">
                <Link to="/resume" className="flex items-center gap-2 px-6 py-3 bg-white text-[#8FAF8F] rounded-xl font-black text-sm hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg">
                  <ArrowLeft size={18} /> Analyze Another
                </Link>
                <div className="flex items-center gap-2 px-6 py-3 bg-white/20 border border-white/40 text-white rounded-xl font-bold text-sm backdrop-blur-md shadow-sm">
                  <FileText size={18} className="text-white" />
                  {data.fileName || 'Pasted Resume'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── METRICS OVERLAP ── */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Keyword Match', value: data.keywordMatchScore, icon: Target, desc: 'Relevance to target role' },
            { label: 'Formatting', value: data.formattingScore, icon: FileText, desc: 'ATS parser compatibility' },
            { label: 'Readability', value: data.readabilityScore, icon: Sparkles, desc: 'Clarity and impact' }
          ].map((metric, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              key={metric.label} 
              className="bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] flex items-center gap-6 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default break-inside-avoid"
            >
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="stroke-[#e5ded6] fill-none" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" className={`fill-none ${metric.value >= 80 ? 'stroke-[#8FAF8F]' : 'stroke-[#A8C5DA]'}`} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(metric.value / 100) * 283}, 300`} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-black text-[#3a2f25]">{metric.value}%</span>
                </div>
              </div>
              <div>
                <h4 className="font-black text-[#3a2f25] text-lg">{metric.label}</h4>
                <p className="text-xs font-semibold text-[#8a7f75]">{metric.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className={`max-w-7xl mx-auto px-6 mt-12 ${isPrinting ? 'flex flex-col gap-10' : 'grid grid-cols-1 lg:grid-cols-12 gap-10'}`}>
        
        {/* LEFT COLUMN: Detailed Analysis (8 columns) */}
        <div className={isPrinting ? 'w-full space-y-10' : 'lg:col-span-8 space-y-10'}>
          
          {/* Critical Issues */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#e8e0d8] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F0B8C8]/25 flex items-center justify-center text-[#a85f75] shadow-sm">
                <AlertCircle size={22} />
              </div>
              <h2 className="text-2xl font-black text-[#3a2f25]">Action Required</h2>
              <span className="ml-auto px-4 py-1.5 bg-[#F0B8C8]/20 text-[#a85f75] text-xs font-black rounded-full uppercase tracking-widest shadow-sm">
                {actionItems.length} Issues
              </span>
            </div>

            <div className="space-y-4">
              {actionItems.map((item, i) => (
                <div key={i} className={`bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] shadow-sm border border-white/60 flex gap-4 items-start hover:shadow-md transition-all break-inside-avoid ${item.priority === 'High' ? 'border-l-4 border-l-[#F0B8C8]' : 'border-l-4 border-l-[#A8C5DA]'}`}>
                  <div className={`mt-1 p-2 rounded-xl shrink-0 ${item.priority === 'High' ? 'bg-[#F0B8C8]/25 text-[#a85f75]' : 'bg-[#A8C5DA]/25 text-[#5a7a9a]'}`}>
                    <AlertCircle size={20} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[#3a2f25] text-lg leading-tight">{item.issue}</h4>
                      <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-md ${item.priority === 'High' ? 'bg-[#F0B8C8]/20 text-[#a85f75]' : 'bg-[#A8C5DA]/20 text-[#5a7a9a]'}`}>
                        {item.priority} Priority
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/60 border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
                      <h5 className="text-[10px] font-black text-[#9a8f85] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Sparkles size={12} className="text-[#8FAF8F]" /> AI Suggestion
                      </h5>
                      <p className="text-sm font-semibold text-[#5a4f45] leading-relaxed">{item.action}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {actionItems.length === 0 && (
                <div className="bg-[#8FAF8F]/10 p-6 rounded-3xl border border-[#8FAF8F]/30 text-center shadow-inner">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-[#8FAF8F]" />
                  <h4 className="font-black text-[#3a2f25]">Flawless Execution!</h4>
                  <p className="text-sm text-[#7a6f65] font-semibold">No critical issues or missing skills detected.</p>
                </div>
              )}
            </div>
          </div>

          {/* Keyword Pill Cloud */}
          {data.keywordSuggestions?.length > 0 && (
            <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.04)] break-inside-avoid">
              <h3 className="text-lg font-black text-[#3a2f25] mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-[#F0B8C8]" />
                Recommended Keywords
              </h3>
              <p className="text-sm font-semibold text-[#8a7f75] mb-6">Sprinkle these exactly as written into your experience bullets to pass the ATS filter.</p>
              <div className="flex flex-wrap gap-2.5">
                {data.keywordSuggestions.map((kw, i) => (
                  <span key={i} className="px-4 py-2 bg-[#F0B8C8]/10 border border-[#F0B8C8]/25 text-[#a85f75] hover:bg-[#F0B8C8]/20 transition-all rounded-xl font-bold text-sm cursor-default shadow-[2px_2px_6px_rgba(0,0,0,0.01)]">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: What You Did Well (4 columns) */}
        <div className={isPrinting ? 'w-full space-y-8' : 'lg:col-span-4 space-y-8'}>
          <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/60 shadow-[8px_8px_24px_rgba(0,0,0,0.04)] space-y-6 break-inside-avoid">
            <div className="flex items-center gap-3 border-b border-[#e8e0d8] pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8FAF8F]/20 flex items-center justify-center text-[#8FAF8F] shadow-sm">
                <CheckCircle2 size={22} />
              </div>
              <h2 className="text-xl font-black text-[#3a2f25]">What You Did Well</h2>
            </div>
            
            <div className="space-y-4">
              {data.strengths?.map((str, i) => (
                <div key={i} className="bg-white/40 p-4 rounded-2xl border border-white/50 flex gap-3 items-start hover:border-[#8FAF8F]/40 hover:bg-white/60 transition-all shadow-sm">
                  <div className="mt-1 p-1 bg-[#8FAF8F]/20 rounded-full text-[#8FAF8F] shrink-0"><CheckCircle2 size={12} /></div>
                  <p className="text-sm font-semibold text-[#5a4f45] leading-relaxed">{str}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── FULL-WIDTH ROADMAP SECTION ── */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 shadow-[12px_12px_32px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative">
          {!isPrinting && <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#8FAF8F]/10 to-transparent rounded-full blur-3xl pointer-events-none" />}
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#e8e0d8] relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-xl text-white shadow-lg shadow-[#8FAF8F]/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-[#3a2f25]">Your Custom Roadmap</h3>
                <p className="text-xs font-black text-[#9a8f85] uppercase tracking-wider mt-1">To get the interview</p>
              </div>
            </div>
          </div>

          {/* Horizontal Timeline Grid */}
          <div className={`grid grid-cols-1 ${isPrinting ? 'gap-6' : 'md:grid-cols-3 gap-8'} relative z-10`}>
            {data.improvementPlan?.map((plan, i) => (
              <div key={i} className="relative flex flex-col group break-inside-avoid">
                {/* Visual Connector Line for Desktop */}
                {i < 2 && !isPrinting && (
                  <div className="hidden md:block absolute top-5 left-[50%] right-[-50%] h-0.5 bg-gradient-to-r from-[#8FAF8F] to-[#e8e0d8] -z-10" />
                )}
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white border-4 border-[#e8e0d8] flex items-center justify-center text-[#3a2f25] font-black text-sm shadow-sm group-hover:border-[#8FAF8F] group-hover:text-[#8FAF8F] transition-colors shrink-0">
                    {i + 1}
                  </div>
                  <span className="px-3 py-1 bg-[#8FAF8F]/10 text-[#8FAF8F] rounded-lg text-[9px] font-black uppercase tracking-wider border border-[#8FAF8F]/20">
                    {plan.month}
                  </span>
                </div>
                
                <div className="bg-white/40 border border-white/50 p-6 rounded-3xl group-hover:shadow-lg hover:bg-white/70 hover:scale-[1.01] transition-all duration-300 flex-1 flex flex-col shadow-sm">
                  <h4 className="font-bold text-[#3a2f25] text-lg leading-tight mb-4">{plan.title}</h4>
                  <ul className="space-y-3 flex-1">
                    {plan.steps?.map((step, si) => (
                      <li key={si} className="flex gap-2 text-sm text-[#5a4f45] font-semibold leading-relaxed">
                        <ChevronRight size={16} className="text-[#A8C5DA] shrink-0 mt-0.5" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── DOWNLOAD BUTTON AT BOTTOM CENTER ── */}
      <div className="max-w-md mx-auto px-6 mt-8 flex justify-center">
        <button 
          onClick={handleDownload}
          disabled={isDownloading}
          data-html2canvas-ignore="true"
          className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-xl bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] text-white font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-[#8FAF8F]/25 hover:from-[#7ab07a] hover:to-[#98bad0] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Download size={18} />
              Download Full Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
