import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Clock, ArrowRight, Loader2, ChevronDown, Plus, Map, BookOpen, Calendar, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { db } from '../../firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

export default function RoadmapGenerator() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Dashboard State
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [role, setRole] = useState('Frontend Developer');
  const [experience, setExperience] = useState('Beginner');
  const [timeline, setTimeline] = useState('3 Months');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchSavedRoadmaps();
  }, [currentUser]);

  const fetchSavedRoadmaps = async () => {
    if (!currentUser) return;
    setIsLoadingRoadmaps(true);
    try {
      const roadmapsRef = collection(db, 'roadmaps');
      const q = query(roadmapsRef, where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      let roadmaps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      roadmaps.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setSavedRoadmaps(roadmaps);
      if (roadmaps.length === 0) setShowForm(true);
    } catch (error) {
      console.error("Error fetching roadmaps:", error);
      toast.error("Failed to load saved roadmaps.");
    } finally {
      setIsLoadingRoadmaps(false);
    }
  };

  const handleGenerate = async () => {
    if (!currentUser) {
      toast.error("Please log in to generate a roadmap.");
      return;
    }
    setIsGenerating(true);
    let generatedData = null;
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");
      const genAI = new GoogleGenerativeAI(apiKey);
      let totalWeeks = 4;
      if (timeline === '3 Months') totalWeeks = 12;
      if (timeline === '6 Months') totalWeeks = 24;

      const schema = {
        type: SchemaType.ARRAY,
        description: `A highly detailed, week-by-week learning roadmap containing exactly ${totalWeeks} items.`,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.NUMBER },
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            tasks: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  text: { type: SchemaType.STRING },
                  completed: { type: SchemaType.BOOLEAN }
                },
                required: ["id", "text", "completed"]
              }
            }
          },
          required: ["id", "title", "description", "tasks"]
        }
      };

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 }
      });

      const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      const prompt = `Today's date is ${currentDate}. You are an elite career coach and senior engineer. Create a highly detailed, professional, step-by-step learning roadmap for a ${experience} level ${role}. The roadmap MUST be strictly structured week-by-week for a total timeline of ${timeline} (which equals EXACTLY ${totalWeeks} weeks). Provide actionable, realistic tasks for each week. Include specific modern tools, frameworks, and best practices. Make it advanced and highly correct.`;

      const result = await model.generateContent(prompt);
      generatedData = JSON.parse(result.response.text());
    } catch (error) {
      console.error("AI Generation Error:", error);
      let errorMessage = "Failed to generate AI roadmap. Please try again later.";
      if (error.message?.includes("API_KEY") || error.message?.includes("API key")) {
         errorMessage = "Invalid Gemini API Key in .env!";
      }
      toast.error(errorMessage);
      setIsGenerating(false);
      return;
    }

    if (generatedData) {
      try {
        const roadmapsRef = collection(db, 'roadmaps');
        const docRef = await addDoc(roadmapsRef, {
          userId: currentUser.uid,
          role,
          experience,
          timeline,
          data: generatedData,
          isAiGenerated: true,
          createdAt: serverTimestamp()
        });
        
        toast.success("Roadmap saved successfully!");
        navigate(`/roadmap/view?id=${docRef.id}`);
      } catch (dbError) {
        console.error("Firestore Save Error:", dbError);
        toast.error("Failed to save roadmap to database.");
        setIsGenerating(false);
      }
    } else {
      setIsGenerating(false);
    }
  };

  const calculateProgress = (roadmapData) => {
    if (!roadmapData) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    roadmapData.forEach(phase => {
      phase.tasks.forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    });
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#3a2f25]">Learning Roadmaps</h1>
          <p className="text-[#7a6f65] mt-1">Manage and track your personalized learning paths.</p>
        </div>
        {!showForm && savedRoadmaps.length > 0 && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-[#8FAF8F] to-[#7a9a7a] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <Plus size={20} /> Create New Roadmap
          </button>
        )}
      </div>

      {isLoadingRoadmaps ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#8FAF8F]" size={40} />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* Dashboard View */}
          {!showForm && savedRoadmaps.length > 0 && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {savedRoadmaps.map((rm) => {
                const progress = calculateProgress(rm.data);
                return (
                  <div 
                    key={rm.id}
                    onClick={() => navigate(`/roadmap/view?id=${rm.id}`)}
                    className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-[6px_6px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8FAF8F]/20 to-[#A8C5DA]/20 flex items-center justify-center text-[#5a7a5a]">
                        <Map size={24} />
                      </div>
                      <ArrowUpRight size={20} className="text-[#b5a99f] group-hover:text-[#8FAF8F] transition-colors" />
                    </div>
                    <h3 className="font-bold text-xl text-[#3a2f25]">{rm.role}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#7a6f65] mt-2 mb-6 font-medium">
                      <Zap size={14} className="text-[#A8C5DA]" /> {rm.experience}
                      <span className="w-1 h-1 rounded-full bg-[#d8d0c8]" />
                      <Clock size={14} className="text-[#F0B8C8]" /> {rm.timeline}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-[#5a7a5a]">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/60 border border-white/80 overflow-hidden">
                        <div 
                          style={{ width: `${progress}%` }} 
                          className="h-full bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] transition-all duration-1000"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Configuration Form */}
          {(showForm || savedRoadmaps.length === 0) && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-[6px_6px_20px_rgba(0,0,0,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)] mt-8"
            >
              {savedRoadmaps.length > 0 && (
                <button 
                  onClick={() => setShowForm(false)}
                  className="mb-6 text-sm font-bold text-[#7a6f65] hover:text-[#5a4f45] flex items-center gap-1 transition-colors"
                >
                  ← Back to My Roadmaps
                </button>
              )}

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8FAF8F]/10 text-[#5a7a5a] mb-4">
                  <Target size={32} />
                </div>
                <h2 className="text-2xl font-bold text-[#3a2f25]">Configure Your Path</h2>
                <p className="text-[#7a6f65] mt-2">Tell us where you want to go, and we'll map out the journey.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#4a3f35] mb-2 flex items-center gap-2">
                    <Target size={16} className="text-[#8FAF8F]" /> Target Role
                  </label>
                  <div className="relative">
                    <select 
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full appearance-none bg-white/50 border border-white/80 text-[#3a2f25] font-semibold text-lg rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#8FAF8F]/50 shadow-sm cursor-pointer"
                    >
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="Data Scientist">Data Scientist</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9a8f85] pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#4a3f35] mb-2 flex items-center gap-2">
                      <Zap size={16} className="text-[#A8C5DA]" /> Experience
                    </label>
                    <div className="relative">
                      <select 
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full appearance-none bg-white/50 border border-white/80 text-[#3a2f25] font-semibold rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#A8C5DA]/50 shadow-sm cursor-pointer"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a8f85] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#4a3f35] mb-2 flex items-center gap-2">
                      <Clock size={16} className="text-[#F0B8C8]" /> Timeline
                    </label>
                    <div className="relative">
                      <select 
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full appearance-none bg-white/50 border border-white/80 text-[#3a2f25] font-semibold rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#F0B8C8]/50 shadow-sm cursor-pointer"
                      >
                        <option value="1 Month">1 Month</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a8f85] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full mt-8 bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA] hover:opacity-90 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(143,175,143,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={24} /> Generating AI Roadmap...
                    </>
                  ) : (
                    <>
                      Generate My Roadmap <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  );
}
