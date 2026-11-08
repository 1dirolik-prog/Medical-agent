import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Baby, Camera, Check, X, Shield, Plus, HeartPulse, 
  Activity, Sparkles, User, Fingerprint, KeyRound, ArrowRight, Trash2
} from 'lucide-react';
import { FamilyMember, Sex, BloodGroup } from '../types';
import { useHealth } from '../HealthContext';
import ConfirmDialog from '../components/ConfirmDialog';

interface LoginSelectionViewProps {
  onContinue: () => void;
}

// Preset modern avatar vectors (glowing stylized gradients for default selections)
const AVATAR_PRESETS = [
  { id: 'av1', label: 'Mum', gradient: 'from-pink-400 to-rose-500', icon: '👩' },
  { id: 'av2', label: 'Dad', gradient: 'from-blue-400 to-indigo-600', icon: '👨' },
  { id: 'av3', label: 'Child', gradient: 'from-emerald-300 to-teal-500', icon: '👶' },
  { id: 'av4', label: 'Grandma', gradient: 'from-amber-300 to-orange-500', icon: '👵' },
  { id: 'av5', label: 'Grandpa', gradient: 'from-purple-400 to-indigo-500', icon: '👴' },
  { id: 'av6', label: 'AI Sync', gradient: 'from-cyan-400 to-blue-500', icon: '🧬' },
];

export const LoginSelectionView: React.FC<LoginSelectionViewProps> = ({ onContinue }) => {
  const { 
    members, 
    activeMemberId, 
    setActiveMemberId, 
    addMember, 
    deleteMember,
    language,
    t
  } = useHealth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLocalId, setSelectedLocalId] = useState<string>(activeMemberId || '');
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('30');
  const [newSex, setNewSex] = useState<Sex>('Male');
  const [newHeight, setNewHeight] = useState('175');
  const [newWeight, setNewWeight] = useState('72');
  const [newBloodGroup, setNewBloodGroup] = useState<BloodGroup>('O+');
  const [newRole, setNewRole] = useState('Mother'); 
  const [belongsToFamily, setBelongsToFamily] = useState(true);
  const [selectedPresetAvatar, setSelectedPresetAvatar] = useState('av1');
  const [customAvatarBase64, setCustomAvatarBase64] = useState<string | null>(null);

  // Fallback to first member if none is active
  useEffect(() => {
    if (!selectedLocalId && members.length > 0) {
      setSelectedLocalId(members[0].id);
    }
  }, [members, selectedLocalId]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatarBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Pick avatar representation
    let avatarValue = '';
    if (customAvatarBase64) {
      avatarValue = customAvatarBase64;
    } else {
      // Create a colored SVG or data URL representing the chosen preset
      const preset = AVATAR_PRESETS.find(p => p.id === selectedPresetAvatar) || AVATAR_PRESETS[0];
      avatarValue = `preset:${preset.gradient}:${preset.icon}`;
    }

    const newMember: FamilyMember = {
      id: `m-${Math.random().toString(36).substring(2, 9)}`,
      name: newName,
      avatar: avatarValue,
      age: parseInt(newAge) || 30,
      sex: newSex,
      height: parseFloat(newHeight) || 175,
      weight: parseFloat(newWeight) || 72,
      bloodGroup: newBloodGroup,
      occupation: belongsToFamily ? 'Family Member' : 'Individual',
      lifestyle: 'Active',
      chronicConditions: [],
      medications: [],
      isChild: parseInt(newAge) < 18,
      belongsToFamily: belongsToFamily,
      role: newRole,
    };

    addMember(newMember);
    setSelectedLocalId(newMember.id);
    setActiveMemberId(newMember.id);
    onContinue();
    
    // Reset fields
    setNewName('');
    setNewAge('30');
    setNewSex('Male');
    setCustomAvatarBase64(null);
    setShowAddForm(false);
  };

  const handleSelectUser = (id: string) => {
    setSelectedLocalId(id);
    setActiveMemberId(id);
    onContinue();
  };

  const handleDeleteUser = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMemberToDelete(id);
  };

  // Groups
  const familyMembers = members.filter(m => m.belongsToFamily !== false);
  const otherMembers = members.filter(m => m.belongsToFamily === false);

  const renderAvatar = (member: FamilyMember, sizeClass = 'w-20 h-20') => {
    const isPreset = member.avatar?.startsWith('preset:');
    if (isPreset) {
      const parts = member.avatar?.split(':') || [];
      const gradient = parts[1] || 'from-cyan-400 to-blue-500';
      const icon = parts[2] || '🧑';
      return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl shadow-lg border border-white/20 select-none`}>
          {icon}
        </div>
      );
    }

    if (member.avatar) {
      return (
        <img 
          src={member.avatar} 
          alt={member.name} 
          className={`${sizeClass} rounded-full object-cover border border-slate-200/50 dark:border-slate-700/50 shadow-md`}
        />
      );
    }

    // Dynamic clean initials
    const letters = member.name ? member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'AI';
    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-tr from-slate-200 to-slate-250 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-xl font-extrabold text-slate-700 dark:text-slate-200 shadow-inner`}>
        {letters}
      </div>
    );
  };

  const truncateName = (name: string) => {
    if (name.length > 12 && name.includes(' ')) {
      const parts = name.split(' ');
      return `${parts[0]} ${parts[1][0]}.`;
    }
    return name;
  };

  const translateRole = (role: string) => {
    if (!role) return '';
    if (role === 'Mother') return t.role_mom;
    if (role === 'Father') return t.role_dad;
    if (role === 'Child') return t.role_child;
    if (role === 'Grandmother') return t.role_grandma;
    if (role === 'Grandfather') return t.role_grandpa;
    return role;
  };

  return (
    <div className="absolute inset-0 z-[80] h-screen max-h-screen overflow-hidden bg-[#EBF5FB] dark:bg-slate-950 transition-colors duration-500 flex flex-col font-sans select-none">
      
      {/* Bio-medical dynamic background lines and floating neon orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-60">
        {/* Glowing floating biology nodes */}
        <motion.div 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-cyan-400/15 dark:bg-cyan-500/10 blur-[60px]"
        />
        <motion.div 
          animate={{
            x: [0, -30, 50, 0],
            y: [0, 40, -50, 0],
            scale: [1, 0.85, 1.1, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-teal-400/10 dark:bg-emerald-500/5 blur-[80px]"
        />
        <motion.div 
          animate={{
            x: [0, 20, -30, 0],
            y: [0, 50, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-[50px]"
        />

        {/* Technical cross network lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-25" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
          </defs>
          <line x1="10%" y1="0" x2="10%" y2="100%" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-800" />
          <line x1="90%" y1="0" x2="90%" y2="100%" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-800" strokeDasharray="5,5" />
          <line x1="0" y1="20%" x2="100%" y2="20%" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-800" />
          <line x1="0" y1="80%" x2="100%" y2="80%" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-800" strokeDasharray="10,5" />
        </svg>
      </div>

      <div className="w-full max-w-md mx-auto px-6 relative z-10 flex-1 flex flex-col pt-5 pb-5 overflow-hidden h-full">
        
        {/* TOP: Branding with Futuristic Bio Cross */}
        <div className="text-center mt-2 mb-1">
          {/* Pulsing Neural Medical Cross Icon */}
          <div className="inline-flex relative items-center justify-center mb-2">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute inset-0 bg-cyan-400/20 dark:bg-cyan-500/25 rounded-2xl blur-lg"
            />
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-400 via-teal-400 to-blue-500 p-[1.5px] shadow-md shadow-cyan-400/10">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-cyan-400/5 to-teal-400/5 pointer-events-none" />
                <div className="flex items-center justify-center relative">
                  <HeartPulse className="w-6 h-6 text-cyan-500 dark:text-cyan-400 animate-pulse relative z-10" />
                  <Sparkles className="w-3 h-3 text-teal-400 absolute -top-0.5 -right-0.5 animate-bounce" />
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white bg-clip-text">
            Family Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-blue to-teal-400">AI Agent</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed mt-1 px-2">
            {t.login_subtitle}
          </p>
        </div>

        {/* MIDDLE: User Selection List / Sections */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-none">

          {/* FAMILY SECTION */}
          {familyMembers.length > 0 && (
            <div className="card-android !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="text-medical-blue">
                    <Users size={18} />
                  </span>
                  {t.family_members}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {familyMembers.length} {t.participants}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      isEditMode
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isEditMode ? (language === 'ru' ? 'Готово' : 'Done') : (language === 'ru' ? 'Изменить' : 'Edit')}
                  </button>
                </div>
              </div>

              {/* Grid of study group or family group members */}
              <div className="relative">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-3.5 gap-x-1 relative z-10 justify-items-center">
                  {familyMembers.map(member => {
                    const isSelected = selectedLocalId === member.id;
                    return (
                      <motion.div
                        key={member.id}
                        onClick={() => handleSelectUser(member.id)}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center select-none outline-none focus:outline-none shrink-0 snap-center w-20 group relative py-1 cursor-pointer"
                      >
                        {/* Circle container */}
                        <div className="relative">
                          {/* Outer Border ring */}
                          <div className={`p-1 rounded-full transition-all duration-300 relative ${
                            isSelected 
                              ? 'border-[3px] border-medical-blue bg-transparent transform scale-[1.02]' 
                              : 'bg-transparent border-[3px] border-transparent group-hover:border-medical-blue/30'
                          }`}>
                            <div className="bg-white dark:bg-slate-900 rounded-full">
                              {renderAvatar(member, 'w-12 h-12')}
                            </div>

                            {/* Delete Profile button - only in Edit Mode */}
                            {isEditMode && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteUser(e, member.id)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center border border-white dark:border-slate-950 shadow-sm hover:scale-110 transition-transform z-30 cursor-pointer"
                                title={t.delete}
                                aria-label={t.delete}
                              >
                                <X size={10} className="stroke-[3]" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center w-full px-1">
                          <span className={`text-xs mt-1.5 font-bold leading-tight text-center w-full truncate transition-colors duration-300 ${
                            isSelected 
                              ? 'text-medical-blue' 
                              : 'text-slate-700 dark:text-slate-200 group-hover:text-medical-blue'
                          }`}>
                            {truncateName(member.name)}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center w-full truncate h-4 mt-0.5">
                            {member.role ? translateRole(member.role) : ''}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Circle plus button to add family member inside the grid */}
                  <motion.div
                    onClick={() => setShowAddForm(true)}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center select-none outline-none focus:outline-none shrink-0 w-20 group relative py-1 cursor-pointer"
                  >
                    <div className="relative">
                      <div className="p-1 rounded-full transition-all duration-300 relative border-[3px] border-transparent">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#F0F9FB] border-2 border-dashed border-medical-blue text-medical-blue group-hover:scale-105 transition-transform">
                          <Plus size={20} className="stroke-[2.5]" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center w-full px-1">
                      <span className="text-xs mt-1.5 font-semibold text-medical-blue text-center w-full leading-tight">
                        {t.add}
                      </span>
                      <span className="h-4 mt-0.5" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER PROFILES SECTION */}
          {otherMembers.length > 0 && (
            <div className="card-android !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <span className="text-teal-500">
                    <User size={18} />
                  </span>
                  {t.other_profiles}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {otherMembers.length} {t.participants}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-y-4 gap-x-2 justify-items-center">
                {otherMembers.map(member => {
                  const isSelected = selectedLocalId === member.id;
                  return (
                    <motion.div
                      key={member.id}
                      onClick={() => handleSelectUser(member.id)}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center select-none outline-none focus:outline-none shrink-0 snap-center w-20 group relative py-1 cursor-pointer"
                    >
                      <div className="relative">
                        <div className={`p-1 rounded-full transition-all duration-300 relative ${
                          isSelected 
                            ? 'border-[3px] border-medical-blue bg-transparent transform scale-[1.02]' 
                            : 'bg-transparent border-[3px] border-transparent group-hover:border-medical-blue/30'
                        }`}>
                          <div className="bg-white dark:bg-slate-900 rounded-full">
                            {renderAvatar(member, 'w-14 h-14')}
                          </div>

                          {/* Delete profile button (other members) - only in Edit Mode */}
                          {isEditMode && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteUser(e, member.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center border border-white dark:border-slate-950 shadow-sm hover:scale-110 transition-transform z-30 cursor-pointer"
                              title={t.delete}
                              aria-label={t.delete}
                            >
                              <X size={10} className="stroke-[3]" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center w-full px-1">
                        <span className={`text-xs mt-1.5 font-bold leading-tight text-center w-full truncate transition-colors duration-300 ${
                          isSelected 
                            ? 'text-medical-blue' 
                            : 'text-slate-700 dark:text-slate-200 group-hover:text-medical-blue'
                        }`}>
                          {truncateName(member.name)}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center w-full truncate h-4 mt-0.5">
                          {member.role ? translateRole(member.role) : ''}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM: Selected member card and disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 space-y-3">
          {(() => {
            const currentSelected = members.find(m => m.id === selectedLocalId) || members[0];
            if (!currentSelected) return null;
            return (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0">
                    {renderAvatar(currentSelected, 'w-10 h-10')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                      {language === 'ru' ? 'Выбранный профиль' : 'Selected Profile'}
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {currentSelected.name}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectUser(currentSelected.id)}
                  className="bg-medical-blue hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span>{language === 'ru' ? 'Войти' : 'Continue'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })()}

          {/* Medical Privacy & Biometric Disclaimer */}
          <div className="flex items-center justify-center gap-1.5 px-6 pb-2">
            <Shield size={13} className="text-slate-400 shrink-0" />
            <p className="text-[11px] text-slate-400 text-center leading-normal font-medium">
              {t.encrypted_disclaimer}
            </p>
          </div>
        </div>

      </div>

      {/* CREATE USER SLIDEOVER FORM MODAL */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-100 flex items-end justify-center p-0 md:p-4 backdrop-blur-md bg-slate-900/40">
            {/* Closes popup */}
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setShowAddForm(false)} />

            <motion.div
              initial={{ y: "100%", opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl relative border border-slate-100 dark:border-slate-800 z-10 max-h-[85vh] overflow-y-auto"
            >
              {/* Top Handle bar for draggable cosmetic swipe-down effect */}
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-705 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <UserPlus className="text-medical-blue w-5 h-5" />
                  {t.new_profile}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  aria-label={t.cancel || "Close"}
                  className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                
                {/* PHOTO UPLOAD & PRESET AVATARS SELECTOR */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    {t.profile_image}
                  </span>
                  
                  <div className="flex items-center gap-4 justify-between">
                    {/* Custom Image Upload Dropzone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-full border-2 border-dashed border-slate-350 dark:border-slate-700 hover:border-medical-blue overflow-hidden cursor-pointer relative bg-white dark:bg-slate-950 flex items-center justify-center shrink-0 group transition-all"
                    >
                      {customAvatarBase64 ? (
                        <>
                          <img src={customAvatarBase64} alt="Custom upload" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera size={14} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Camera size={16} className="text-slate-400 group-hover:text-medical-blue transition-colors" />
                          <span className="text-[10px] text-slate-400 mt-0.5 font-bold">Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Presets Horizontal selector */}
                    <div className="flex-1 flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {AVATAR_PRESETS.map(preset => {
                        const isPresetSelected = selectedPresetAvatar === preset.id && !customAvatarBase64;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              setSelectedPresetAvatar(preset.id);
                              setCustomAvatarBase64(null); // Deselect custom upload
                            }}
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${preset.gradient} flex items-center justify-center text-xl shrink-0 transition-all ${
                              isPresetSelected 
                                ? 'scale-110 ring-2 ring-medical-blue ring-offset-2 dark:ring-offset-slate-950 shadow-md' 
                                : 'opacity-70 scale-90 hover:opacity-100'
                            }`}
                          >
                            {preset.icon}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                {/* FIELDS */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                      {t.name_alias}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.name_placeholder_eg}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue focus:ring-1 focus:ring-medical-blue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                        {t.age}
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="125"
                        placeholder="30"
                        value={newAge}
                        onChange={e => setNewAge(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue focus:ring-1 focus:ring-medical-blue"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                        {t.biological_sex}
                      </label>
                      <select
                        value={newSex}
                        onChange={e => setNewSex(e.target.value as Sex)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue focus:ring-1 focus:ring-medical-blue appearance-none cursor-pointer"
                      >
                        <option value="Male">{t.sex_male}</option>
                        <option value="Female">{t.sex_female}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                        {t.family_role}
                      </label>
                      <select
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue focus:ring-1 focus:ring-medical-blue appearance-none cursor-pointer"
                      >
                        <option value="Mother">{t.role_mom}</option>
                        <option value="Father">{t.role_dad}</option>
                        <option value="Child">{t.role_child}</option>
                        <option value="Grandmother">{t.role_grandma}</option>
                        <option value="Grandfather">{t.role_grandpa}</option>
                        <option value="Other">{t.role_other}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                        {t.blood_group_label}
                      </label>
                      <select
                        value={newBloodGroup}
                        onChange={e => setNewBloodGroup(e.target.value as BloodGroup)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue focus:ring-1 focus:ring-medical-blue appearance-none cursor-pointer"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                        {t.height_cm}
                      </label>
                      <input
                        type="number"
                        placeholder="175"
                        value={newHeight}
                        onChange={e => setNewHeight(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1 block">
                        {t.weight_kg}
                      </label>
                      <input
                        type="number"
                        placeholder="72"
                        value={newWeight}
                        onChange={e => setNewWeight(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-medical-blue"
                      />
                    </div>
                  </div>

                  {/* TOGGLES */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={belongsToFamily}
                        onChange={e => setBelongsToFamily(e.target.checked)}
                        className="w-4 h-4 accent-medical-blue rounded cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {t.add_to_family}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {t.add_to_family_desc}
                        </span>
                      </div>
                    </label>
                  </div>

                </div>

                {/* FORM ACTIONS */}
                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-50 shadow-inner transition-colors rounded-xl font-sans"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-medical-blue text-white rounded-xl text-sm font-bold shadow-md shadow-medical-blue/15 hover:opacity-95 transition-all font-sans"
                  >
                    {t.register_profile}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={memberToDelete !== null}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) {
            deleteMember(memberToDelete);
          }
          if (selectedLocalId === memberToDelete) {
            setSelectedLocalId('');
          }
        }}
        title={t.delete_profile_title}
        description={t.delete_profile_desc}
        confirmText={t.delete}
        cancelText={t.cancel}
      />

    </div>
  );
};

export default LoginSelectionView;
