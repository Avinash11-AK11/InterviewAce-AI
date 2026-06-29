import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Save, User, GraduationCap, Calendar, FileText,
  Tag, Plus, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, getAvatarBg } from '../../utils/helpers';

// ─── Tag Input ────────────────────────────────────────────────────────────────
const TagInput = ({ tags, onChange }) => {
  const [inputVal, setInputVal] = useState('');

  const addTag = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      onChange([...tags, trimmed]);
      setInputVal('');
    }
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="rounded-xl border border-gray-200 bg-white/60 p-3 focus-within:border-[#8FAF8F] transition-colors">
      <div className="flex flex-wrap gap-2 mb-2">
        <AnimatePresence>
          {tags.map((tag) => (
            <motion.span
              key={tag}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#A8C5DA]/20 text-[#5a8fa0] text-xs font-medium border border-[#A8C5DA]/40"
            >
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors ml-0.5">
                <X size={10} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder="Add a skill and press Enter..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-300"
        />
        <button onClick={addTag} disabled={!inputVal.trim()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8FAF8F] text-white text-xs font-semibold
            disabled:opacity-40 hover:bg-[#7a9f7a] transition-colors">
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
};

// ─── Form Field ───────────────────────────────────────────────────────────────
const FormField = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-1.5">
      {Icon && <Icon size={14} className="text-[#8FAF8F]" />}
      {label}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <AlertCircle size={10} /> {error}
      </p>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditProfile({ onClose, onSaved }) {
  const { userProfile, currentUser, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    displayName: userProfile?.displayName || userProfile?.name || '',
    college:     userProfile?.college || '',
    gradYear:    userProfile?.gradYear || '',
    bio:         userProfile?.bio || '',
    skills:      userProfile?.skills || [],
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Avatar selection ──────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: 'Image must be under 5MB' }));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, avatar: null }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.displayName.trim()) errs.displayName = 'Name is required';
    if (form.gradYear && (isNaN(form.gradYear) || form.gradYear < 2000 || form.gradYear > 2035))
      errs.gradYear = 'Enter a valid graduation year (2000-2035)';
    return errs;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      let photoURL = userProfile?.photoURL || null;

      // Upload new avatar if selected
      if (avatarFile && currentUser) {
        const storageRef = ref(storage, `avatars/${currentUser.uid}`);
        const task = uploadBytesResumable(storageRef, avatarFile);
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            (snap) => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject,
            async () => {
              photoURL = await getDownloadURL(task.snapshot.ref);
              resolve();
            },
          );
        });
      }

      await updateProfile({
        displayName: form.displayName.trim(),
        college:     form.college.trim(),
        gradYear:    form.gradYear ? Number(form.gradYear) : null,
        bio:         form.bio.trim(),
        skills:      form.skills,
        photoURL,
        profileComplete: !!(form.displayName && form.college && form.gradYear && form.bio && form.skills.length),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved?.();
        onClose?.();
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrors({ save: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const GRAD_YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          className="w-full max-w-lg bg-[#FAF6F1] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Edit Profile</h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors">
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

            {/* ── Avatar Upload ── */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#8FAF8F]/40" />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-[#8FAF8F]/40"
                    style={{ backgroundColor: getAvatarBg(form.displayName) }}>
                    {getInitials(form.displayName || 'U')}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <button onClick={() => fileInputRef.current?.click()}
                className="text-xs text-[#8FAF8F] font-semibold hover:underline">
                Change Photo
              </button>
              {errors.avatar && <p className="text-xs text-red-500">{errors.avatar}</p>}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#8FAF8F]" animate={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>

            {/* ── Name ── */}
            <FormField label="Full Name" icon={User} error={errors.displayName}>
              <input
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm text-gray-800
                  focus:outline-none focus:border-[#8FAF8F] transition-colors placeholder-gray-300"
              />
            </FormField>

            {/* ── College ── */}
            <FormField label="College / University" icon={GraduationCap} error={errors.college}>
              <input
                value={form.college}
                onChange={(e) => setForm((p) => ({ ...p, college: e.target.value }))}
                placeholder="e.g. IIT Bombay"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm text-gray-800
                  focus:outline-none focus:border-[#8FAF8F] transition-colors placeholder-gray-300"
              />
            </FormField>

            {/* ── Graduation Year ── */}
            <FormField label="Graduation Year" icon={Calendar} error={errors.gradYear}>
              <select
                value={form.gradYear}
                onChange={(e) => setForm((p) => ({ ...p, gradYear: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm text-gray-800
                  focus:outline-none focus:border-[#8FAF8F] transition-colors"
              >
                <option value="">Select year</option>
                {GRAD_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </FormField>

            {/* ── Bio ── */}
            <FormField label="Bio" icon={FileText} error={errors.bio}>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell us a bit about yourself..."
                rows={3}
                maxLength={300}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm text-gray-800
                  focus:outline-none focus:border-[#8FAF8F] transition-colors placeholder-gray-300 resize-none"
              />
              <p className="text-xs text-right text-gray-300 mt-1">{form.bio.length}/300</p>
            </FormField>

            {/* ── Skills ── */}
            <FormField label="Skills" icon={Tag}>
              <TagInput tags={form.skills} onChange={(s) => setForm((p) => ({ ...p, skills: s }))} />
              <p className="text-xs text-gray-400 mt-1">Press Enter or click Add to add a skill</p>
            </FormField>

            {/* Save error */}
            {errors.save && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <AlertCircle size={14} /> {errors.save}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold
                  hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#8FAF8F] text-white text-sm font-semibold
                  hover:bg-[#7a9f7a] transition-colors shadow-lg shadow-[#8FAF8F]/30
                  disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : success ? (
                  <><CheckCircle size={16} /> Saved!</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
