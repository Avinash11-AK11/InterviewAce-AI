import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { FileText, UploadCloud, File, AlertCircle, Loader2, Target, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeResume } from '../../services/geminiService';
import { toast } from 'react-hot-toast';
import { syncUserStats } from '../../utils/syncStats';

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'text'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleAnalyze = async () => {
    if (!targetRole.trim()) {
      toast.error('Please specify a target role');
      return;
    }

    if (uploadMode === 'file' && !file) {
      toast.error('Please upload a resume file');
      return;
    }

    if (uploadMode === 'text' && resumeText.trim().length < 50) {
      toast.error('Please paste a valid resume text (at least 50 characters)');
      return;
    }

    setIsAnalyzing(true);
    let analysisData = null;

    try {
      if (uploadMode === 'file') {
        const fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = error => reject(error);
        });
        
        analysisData = await analyzeResume({
          targetRole,
          fileData: { base64: fileBase64, mimeType: file.type }
        });
      } else {
        analysisData = await analyzeResume({
          resumeText,
          targetRole
        });
      }

      // Save to Firebase
      if (currentUser) {
        const docRef = await addDoc(collection(db, 'resumes'), {
          userId: currentUser.uid,
          targetRole,
          atsScore: analysisData.atsScore,
          keywordMatchScore: analysisData.keywordMatchScore,
          formattingScore: analysisData.formattingScore,
          readabilityScore: analysisData.readabilityScore,
          missingSkills: analysisData.missingSkills || [],
          grammarIssues: analysisData.grammarIssues || [],
          actionRequired: analysisData.actionRequired || [],
          keywordSuggestions: analysisData.keywordSuggestions || [],
          strengths: analysisData.strengths || [],
          improvementPlan: analysisData.improvementPlan || [],
          overallFeedback: analysisData.overallFeedback || '',
          fileName: file ? file.name : 'Pasted Text',
          createdAt: serverTimestamp()
        });

        // Trigger XP sync for "Resume Ready" badge and XP update
        await syncUserStats(currentUser.uid);

        toast.success('Resume analyzed successfully!');
        navigate(`/resume/analysis/${docRef.id}`);
      } else {
        toast.error("You must be logged in to analyze resumes");
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-[#3a2f25] mb-3 tracking-tight">AI Resume Analyzer</h1>
        <p className="text-[#7a6f65] max-w-2xl mx-auto text-sm font-semibold leading-relaxed">
          Upload your resume and get a real-time ATS score, pinpointed weaknesses, and a step-by-step improvement roadmap tailored for your dream role.
        </p>
      </div>

      <div className="bg-white/50 backdrop-blur-md rounded-[2.5rem] shadow-[8px_8px_32px_rgba(0,0,0,0.05),-4px_-4px_16px_rgba(255,255,255,0.9)] border border-white/60 p-6 md:p-10 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#8FAF8F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-[#F0B8C8]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          
          {/* Target Role */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-[#7a6f65] uppercase tracking-wider">
              1. Target Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Target size={20} className="text-[#8FAF8F]" />
              </div>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full pl-12 pr-4 py-4 bg-white/60 border border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-2xl focus:ring-4 focus:ring-[#8FAF8F]/15 focus:border-[#8FAF8F] outline-none transition-all text-[#3a2f25] font-semibold text-lg placeholder:font-semibold placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-[#7a6f65] uppercase tracking-wider">
              2. Your Resume
            </label>
            <div className="flex bg-[#e5ded6]/60 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.03)] p-1.5 rounded-2xl w-full max-w-sm border border-white/35">
              <button
                onClick={() => setUploadMode('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                  uploadMode === 'file' 
                    ? 'bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.04)] text-[#8FAF8F]' 
                    : 'text-[#7a6f65] hover:bg-white/40 hover:text-[#5a4f45]'
                }`}
              >
                <UploadCloud size={18} />
                Upload PDF
              </button>
              <button
                onClick={() => setUploadMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                  uploadMode === 'text' 
                    ? 'bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.04)] text-[#8FAF8F]' 
                    : 'text-[#7a6f65] hover:bg-white/40 hover:text-[#5a4f45]'
                }`}
              >
                <FileText size={18} />
                Paste Text
              </button>
            </div>
          </div>

          {/* Input Area */}
          <AnimatePresence mode="wait">
            {uploadMode === 'file' ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-[2rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[280px] bg-white/30
                    ${isDragActive ? 'border-[#8FAF8F] bg-[#8FAF8F]/5 scale-[1.01] shadow-[0_4px_12px_rgba(143,175,143,0.1)]' : 'border-[#d0c8bf] hover:border-[#8FAF8F] hover:bg-[#8FAF8F]/5'}
                    ${isDragReject ? 'border-red-400 bg-red-50/50' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {file ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] rounded-2xl flex items-center justify-center shadow-md text-white">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-[#3a2f25]">{file.name}</p>
                        <p className="text-xs text-[#7a6f65] font-semibold mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <p className="text-xs text-[#8FAF8F] font-bold mt-2">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 bg-white/50 border border-white/60 shadow-[4px_4px_8px_#E3DCD5,_-4px_-4px_8px_#FFFFFF] rounded-2xl flex items-center justify-center text-[#8a7f75] group-hover:scale-105 transition-transform duration-300">
                        <UploadCloud size={30} />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-[#3a2f25]">Drag & Drop your resume here</p>
                        <p className="text-xs text-[#7a6f65] font-semibold mt-1">or click to browse from your device</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-[#f0edea]/70 rounded-full text-[10px] font-black uppercase tracking-wider text-[#9a8f85] border border-white/40 shadow-sm">
                        <File size={12} className="text-[#8FAF8F]" />
                        ONLY PDF FILES SUPPORTED (MAX 5MB)
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste the raw text of your resume here..."
                  className="w-full h-[280px] p-6 bg-white/60 border border-white/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-[2rem] focus:ring-4 focus:ring-[#8FAF8F]/15 focus:border-[#8FAF8F] outline-none transition-all resize-none text-[#3a2f25] font-semibold text-sm leading-relaxed"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <div className="pt-6 border-t border-[#e8e0d8] mt-6">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`w-full py-5 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3
                ${isAnalyzing 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] hover:shadow-xl hover:shadow-[#8FAF8F]/25 hover:from-[#7ab07a] hover:to-[#98bad0] transform hover:-translate-y-1'
                }
              `}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  <SparklesIcon />
                  Analyze My Resume
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
