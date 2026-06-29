import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Zap, Clock, CheckCircle2, Circle, Loader2, ArrowLeft, Download, Share2, Trash2 } from 'lucide-react';
import { db } from '../../firebase/config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RoadmapView() {
  const [searchParams] = useSearchParams();
  const roadmapId = searchParams.get('id');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (roadmapId && currentUser) {
      fetchRoadmap();
    }
  }, [roadmapId, currentUser]);

  const fetchRoadmap = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'roadmaps', roadmapId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRoadmap({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Roadmap not found.");
        navigate('/roadmap');
      }
    } catch (error) {
      console.error("Fetch roadmap error:", error);
      toast.error("Failed to load roadmap.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (phaseId, taskId) => {
    if (!roadmap || isUpdating) return;
    
    // Optimistic UI Update
    const updatedData = roadmap.data.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return phase;
    });

    setRoadmap({ ...roadmap, data: updatedData });
    
    // Background Firestore Sync
    setIsUpdating(true);
    try {
      const docRef = doc(db, 'roadmaps', roadmapId);
      await updateDoc(docRef, { data: updatedData });
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("Failed to save progress.");
      // Rollback on failure could be implemented here
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRoadmap = () => {
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    setIsUpdating(true);
    try {
      await deleteDoc(doc(db, 'roadmaps', roadmapId));
      toast.success("Roadmap deleted successfully.");
      navigate('/roadmap');
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete roadmap.");
      setIsUpdating(false);
      setShowDeleteModal(false);
    }
  };

  const calculateProgress = () => {
    if (!roadmap || !roadmap.data) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    roadmap.data.forEach(phase => {
      phase.tasks.forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    });
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-[#8FAF8F]" size={40} />
      </div>
    );
  }

  if (!roadmap) return null;

  const progress = calculateProgress();

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/roadmap')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 border border-white/80 text-[#7a6f65] hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#3a2f25]">Your Roadmap</h1>
          <p className="text-[#7a6f65] mt-1">{roadmap.isAiGenerated ? "AI-Powered " : "Curated "}Learning Path</p>
        </div>
      </div>

      <motion.div
        key="roadmap-view"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Main Timeline Area */}
        <div className="lg:col-span-8 space-y-6">
          {roadmap.data.map((phase, index) => {
            const phaseProgress = Math.round((phase.tasks.filter(t => t.completed).length / phase.tasks.length) * 100);
            
            return (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                key={phase.id} 
                className="relative"
              >
                {/* Connecting Vertical Line */}
                {index !== roadmap.data.length - 1 && (
                  <div className="absolute left-12 top-20 bottom-[-32px] w-1 bg-gradient-to-b from-[#8FAF8F]/50 to-[#8FAF8F]/10 z-20 -translate-x-1/2" />
                )}

                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-[6px_6px_20px_rgba(0,0,0,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)] relative z-10 flex gap-6">
                  
                  {/* Milestone Number Bubble */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm border border-white/80 transition-colors duration-500 ${phaseProgress === 100 ? 'bg-gradient-to-br from-[#8FAF8F] to-[#7a9a7a] text-white' : 'bg-white text-[#5a7a5a]'}`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Phase Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#3a2f25]">{phase.title}</h3>
                        <p className="text-[#7a6f65] mt-1">{phase.description}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${phaseProgress === 100 ? 'bg-[#8FAF8F]/10 text-[#5a7a5a] border-[#8FAF8F]/30' : 'bg-white/50 text-[#9a8f85] border-white/80'}`}>
                        {phaseProgress}% Done
                      </span>
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-3">
                      {phase.tasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => handleToggleTask(phase.id, task.id)}
                          className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${task.completed ? 'bg-white/60 border-white/80 shadow-sm' : 'bg-white/30 border-transparent hover:bg-white/50'}`}
                        >
                          <div className="mt-0.5 flex-shrink-0 transition-transform group-active:scale-90">
                            {task.completed ? (
                              <CheckCircle2 size={20} className="text-[#8FAF8F]" />
                            ) : (
                              <Circle size={20} className="text-[#b5a99f] group-hover:text-[#8FAF8F]" />
                            )}
                          </div>
                          <span className={`flex-1 transition-all ${task.completed ? 'text-[#7a6f65] line-through decoration-[#b5a99f]' : 'text-[#4a3f35] font-medium'}`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Sticky Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-[6px_6px_20px_rgba(0,0,0,0.06),-4px_-4px_16px_rgba(255,255,255,0.8)]">
            <h3 className="font-bold text-lg text-[#3a2f25] mb-4">Your Setup</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-[#5a4f45]">
                <Target size={18} className="text-[#8FAF8F]" />
                <span className="font-semibold">{roadmap.role}</span>
              </div>
              <div className="flex items-center gap-3 text-[#5a4f45]">
                <Zap size={18} className="text-[#A8C5DA]" />
                <span className="font-semibold">{roadmap.experience} Level</span>
              </div>
              <div className="flex items-center gap-3 text-[#5a4f45]">
                <Clock size={18} className="text-[#F0B8C8]" />
                <span className="font-semibold">{roadmap.timeline} Timeline</span>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-6 bg-white/50 rounded-2xl p-4 border border-white/60 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-[#5a7a5a]">Overall Progress</span>
                <span className="font-bold text-[#3a2f25]">{progress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/50 border border-white/60 overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-[#8FAF8F] to-[#A8C5DA]"
                />
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-[#e8e0d8]">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-[#5a7a5a] font-bold border border-[#d8d0c8] shadow-sm hover:bg-gray-50 transition-all">
                <Download size={18} /> Export PDF
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-[#5a7a5a] font-bold border border-[#d8d0c8] shadow-sm hover:bg-gray-50 transition-all">
                <Share2 size={18} /> Share Roadmap
              </button>
              <button 
                onClick={handleDeleteRoadmap}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#fff5f5] text-[#e53e3e] font-bold border border-[#fed7d7] shadow-sm hover:bg-[#fed7d7] transition-all disabled:opacity-50"
              >
                <Trash2 size={18} /> Delete Roadmap
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3a2f25]/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-6 text-[#e53e3e]">
                <div className="w-12 h-12 rounded-full bg-[#fff5f5] flex items-center justify-center">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#3a2f25]">Delete Roadmap</h3>
                  <p className="text-sm text-[#7a6f65] mt-1">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-[#5a4f45] mb-8">
                Are you sure you want to permanently delete this roadmap and all of its progress?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl font-bold text-[#5a4f45] bg-[#f5f0eb] hover:bg-[#e8e0d8] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete}
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-[#e53e3e] hover:bg-[#c53030] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
