import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateUserProfile } from '../../firebase/authService';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, X, Save, Search, Shield, User, Zap, Star } from 'lucide-react';
import { calculateLevel } from '../../utils/helpers';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  
  const [editForm, setEditForm] = useState({ xp: 0, level: 1, role: 'candidate' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      xp: user.xp || 0,
      level: user.level || 1,
      role: user.role || 'candidate'
    });
  };

  const handleXpChange = (e) => {
    const newXp = parseInt(e.target.value) || 0;
    const newLevel = calculateLevel(newXp);
    setEditForm({ ...editForm, xp: newXp, level: newLevel });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const finalLevel = parseInt(editForm.level) || 1;
      
      const getRankFromLevel = (lvl) => {
        if (lvl <= 20) return 'Bronze';
        if (lvl <= 40) return 'Silver';
        if (lvl <= 60) return 'Gold';
        if (lvl <= 80) return 'Platinum';
        return 'Diamond';
      };

      await updateUserProfile(editingUser.id, {
        xp: parseInt(editForm.xp) || 0,
        level: finalLevel,
        role: editForm.role,
        rank: getRankFromLevel(finalLevel),
      });
      setEditingUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#4a3f35]">User Management</h2>
          <p className="text-sm text-[#7a6f65]">Manage all registered users, update roles and stats.</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white focus:border-amber-300 focus:ring-2 focus:ring-amber-200 outline-none rounded-xl text-sm transition-all shadow-sm text-[#4a3f35]"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8f85]" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e8d8c8] bg-[#fdfbf9]">
                <th className="px-6 py-4 text-xs font-bold text-[#7a6f65] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a6f65] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a6f65] uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a6f65] uppercase tracking-wider">XP</th>
                <th className="px-6 py-4 text-xs font-bold text-[#7a6f65] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8d8c8]">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-white/40 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Avatar" className="w-8 h-8 rounded-full border border-white shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-[#4a3f35]">{user.name || 'No Name'}</p>
                        <p className="text-xs text-[#9a8f85]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role === 'admin' 
                        ? 'bg-amber-100/50 text-amber-700 border-amber-200'
                        : 'bg-blue-100/50 text-blue-700 border-blue-200'
                    }`}>
                      {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                      {user.role === 'admin' ? 'Admin' : 'Candidate'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5a7a5a]">
                      <Star size={14} className="text-[#8FAF8F]" fill="currentColor" />
                      Lv. {user.level || 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                      <Zap size={14} className="text-amber-500" fill="currentColor" />
                      {(user.xp || 0).toLocaleString()} XP
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="p-2 bg-white border border-[#e8d8c8] text-[#7a6f65] hover:text-amber-600 hover:border-amber-300 rounded-lg transition-all shadow-sm inline-flex items-center gap-2"
                    >
                      <Edit2 size={14} />
                      <span className="text-xs font-semibold">Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-[#9a8f85] text-sm">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FAF6F1] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-white/50"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#e8d8c8]/30 to-[#fdfbf9]/50 px-6 py-4 border-b border-[#e8d8c8] flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#4a3f35]">Edit User Details</h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 text-[#9a8f85] hover:text-[#4a3f35] hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* User Info (Readonly view) */}
                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl border border-white/80">
                  {editingUser.profilePicture ? (
                    <img src={editingUser.profilePicture} alt="Avatar" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8FAF8F] to-[#A8C5DA] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {(editingUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#4a3f35]">{editingUser.name}</p>
                    <p className="text-xs text-[#7a6f65]">{editingUser.email}</p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#7a6f65] mb-1.5 uppercase tracking-wider">
                      Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-[#e8d8c8] focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none rounded-xl text-sm font-medium text-[#4a3f35] transition-all"
                    >
                      <option value="candidate">Candidate</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#7a6f65] mb-1.5 uppercase tracking-wider">
                      Experience Points (XP)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={editForm.xp}
                        onChange={handleXpChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#e8d8c8] focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none rounded-xl text-sm font-bold text-amber-600 transition-all"
                      />
                      <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#7a6f65] mb-1.5 uppercase tracking-wider">
                      Level (Auto-calculated)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={editForm.level}
                        onChange={(e) => setEditForm({ ...editForm, level: parseInt(e.target.value) || 1 })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-[#e8d8c8] focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none rounded-xl text-sm font-bold text-[#5a7a5a] transition-all"
                      />
                      <Star size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8FAF8F]" />
                    </div>
                    <p className="text-[10px] text-[#9a8f85] mt-1.5 px-1">
                      Level is automatically calculated based on XP, but you can manually override it if needed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gradient-to-r from-[#e8d8c8]/30 to-[#fdfbf9]/50 px-6 py-4 border-t border-[#e8d8c8] flex justify-end gap-3">
                <button
                  onClick={() => setEditingUser(null)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold text-[#7a6f65] hover:text-[#4a3f35] hover:bg-white/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-bold rounded-xl shadow-[0_4px_10px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
