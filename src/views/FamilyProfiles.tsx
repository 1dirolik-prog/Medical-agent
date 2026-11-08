import React, { useState } from 'react';
import { useHealth } from '../HealthContext';
import { motion } from 'motion/react';
import { Heart, Upload, Trash2, UserPlus, Shield, Edit2, Camera } from 'lucide-react';
import { Sex, BloodGroup, FamilyMember } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

const FamilyProfiles = () => {
  const { members, activeMember, addMember, updateMember, deleteMember, setActiveMemberId, t, language } = useHealth();
  const [showAdd, setShowAdd] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    avatar: '',
    age: '',
    sex: 'Male' as Sex,
    height: '',
    weight: '',
    bloodGroup: 'O+' as BloodGroup,
    isChild: false,
    belongsToFamily: true,
    mission: '',
    chronicConditions: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingMemberId(null);
    setFormData({
      name: '',
      avatar: '',
      age: '',
      sex: 'Male',
      height: '',
      weight: '',
      bloodGroup: 'O+',
      isChild: false,
      belongsToFamily: true,
      mission: '',
      chronicConditions: ''
    });
    setShowAdd(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setEditingMemberId(member.id);
    setFormData({
      name: member.name,
      avatar: member.avatar || '',
      age: member.age.toString(),
      sex: member.sex,
      height: member.height.toString(),
      weight: member.weight.toString(),
      bloodGroup: member.bloodGroup,
      isChild: member.isChild || false,
      belongsToFamily: member.belongsToFamily !== false,
      mission: member.mission || '',
      chronicConditions: (member.chronicConditions || []).join(', ')
    });
    setShowAdd(true);
  };

  const handleSaveMember = () => {
    if (!formData.name) return;

    if (editingMemberId) {
      const existing = members.find(m => m.id === editingMemberId);
      if (existing) {
        updateMember({
          ...existing,
          name: formData.name,
          avatar: formData.avatar,
          age: parseInt(formData.age) || 0,
          sex: formData.sex,
          height: parseFloat(formData.height) || 0,
          weight: parseFloat(formData.weight) || 0,
          bloodGroup: formData.bloodGroup,
          isChild: formData.isChild,
          belongsToFamily: formData.belongsToFamily,
          mission: formData.mission,
          chronicConditions: formData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean)
        });
      }
    } else {
      const newMember: FamilyMember = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        avatar: formData.avatar,
        age: parseInt(formData.age) || 0,
        sex: formData.sex,
        height: parseFloat(formData.height) || 0,
        weight: parseFloat(formData.weight) || 0,
        bloodGroup: formData.bloodGroup,
        occupation: '',
        lifestyle: '',
        chronicConditions: formData.chronicConditions.split(',').map(s => s.trim()).filter(Boolean),
        medications: [],
        isChild: formData.isChild,
        belongsToFamily: formData.belongsToFamily,
        mission: formData.mission,
      };
      addMember(newMember);
      setActiveMemberId(newMember.id);
    }
    
    setShowAdd(false);
    setEditingMemberId(null);
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t.family_mgt}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage health profiles for your loved ones</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer"
        >
          <UserPlus size={20} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {members.map(member => (
          <motion.div 
            key={member.id}
            whileHover={{ scale: 1.01 }}
            className={`card-android border-l-4 ${activeMember?.id === member.id ? 'border-l-medical-blue' : 'border-l-transparent'}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold overflow-hidden relative select-none">
                {member.avatar ? (
                  member.avatar.startsWith("preset:") ? (
                    (() => {
                      const parts = member.avatar.split(":");
                      const gradient = parts[1] || "from-cyan-400 to-blue-500";
                      const icon = parts[2] || "🧑";
                      return (
                        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl select-none`}>
                          {icon}
                        </div>
                      );
                    })()
                  ) : (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                    {member.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{member.name}</h3>
                  {member.id === 'master-user' && <Shield size={14} className="text-medical-blue" />}
                  {member.isChild && <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-bold uppercase">{language === 'ru' ? 'Ребенок' : 'Child'}</span>}
                  {member.belongsToFamily !== false ? (
                    <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">{language === 'ru' ? 'Семья' : 'Family'}</span>
                  ) : (
                    <span className="bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">{language === 'ru' ? 'Другой' : 'Other'}</span>
                  )}
                </div>
                <div className="flex gap-4 mt-1">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{language === 'ru' ? 'Возраст:' : 'Age:'} <span className="text-slate-600 dark:text-slate-300">{member.age}</span></div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{language === 'ru' ? 'Кровь:' : 'Blood:'} <span className="text-slate-600 dark:text-slate-300">{member.bloodGroup}</span></div>
                </div>
              </div>
              <div className="flex gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberToDelete(member.id);
                    }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
                    title="Delete Profile"
                    aria-label={language === 'ru' ? 'Удалить профиль' : 'Delete Profile'}
                  >
                    <Trash2 size={16} />
                  </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(member);
                  }}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-medical-blue hover:bg-medical-blue/10 dark:hover:bg-medical-blue/20 rounded-full transition-colors cursor-pointer"
                  title="Edit Profile"
                  aria-label={language === 'ru' ? 'Редактировать профиль' : 'Edit Profile'}
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
            
            {activeMember?.id === member.id && (
               <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 flex gap-6">
                  <div className="text-center flex-1">
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{language === 'ru' ? 'Вес' : 'Weight'}</p>
                     <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{member.weight}kg</p>
                  </div>
                  <div className="text-center flex-1">
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{language === 'ru' ? 'Рост' : 'Height'}</p>
                     <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{member.height}cm</p>
                  </div>
                  <div className="text-center flex-1">
                     <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">{language === 'ru' ? 'Статус' : 'Status'}</p>
                     <div className="flex justify-center mt-1"><div className="w-4 h-4 rounded-full bg-medical-green" /></div>
                  </div>
               </div>
            )}
            {activeMember?.id === member.id && (member.chronicConditions?.length > 0) && (
               <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700 text-xs">
                  {member.chronicConditions && member.chronicConditions.length > 0 && (
                     <div className="mt-2"><span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{language === 'ru' ? 'Хронические:' : 'Chronic:'}</span> <span className="text-slate-600 dark:text-slate-300 font-medium">{member.chronicConditions.join(', ')}</span></div>
                  )}
               </div>
            )}
          </motion.div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto"
           >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingMemberId ? (language === 'ru' ? 'Ребавить профиль' : 'Edit Profile') : t.add_member || 'Add Family Member'}</h3>
                {editingMemberId && (
                  <button 
                    onClick={() => {
                      setMemberToDelete(editingMemberId);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors cursor-pointer"
                    title="Delete Profile"
                    aria-label={language === 'ru' ? 'Удалить профиль' : 'Delete Profile'}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <form onSubmit={e => { e.preventDefault(); handleSaveMember(); }} className="space-y-4">
                 
                 <div className="flex flex-col items-center justify-center space-y-2">
                   <div 
                     className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold overflow-hidden relative cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-medical-blue transition-colors group"
                     onClick={() => fileInputRef.current?.click()}
                   >
                     {formData.avatar ? (
                       <>
                         {formData.avatar.startsWith("preset:") ? (
                           (() => {
                             const parts = formData.avatar.split(":");
                             const gradient = parts[1] || "from-cyan-400 to-blue-500";
                             const icon = parts[2] || "🧑";
                             return (
                               <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-4xl select-none`}>
                                 {icon}
                               </div>
                             );
                           })()
                         ) : (
                           <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                         )}
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Camera className="text-white" />
                         </div>
                       </>
                     ) : (
                       <div className="w-full h-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center">
                         <Camera className="text-slate-400 dark:text-slate-500 group-hover:text-medical-blue transition-colors" />
                       </div>
                     )}
                   </div>
                   <p className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     {language === 'ru' ? 'Загрузить фото' : 'Upload Photo'}
                   </p>
                   <input 
                     type="file" 
                     className="hidden" 
                     ref={fileInputRef} 
                     accept="image/*" 
                     onChange={handleAvatarUpload} 
                   />
                 </div>

                 <input 
                   className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:border-medical-blue text-slate-800 dark:text-slate-100" 
                   placeholder={language === 'ru' ? 'ФИО' : 'Full Name'} 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
                 <div className="grid grid-cols-2 gap-4">
                    <input 
                      className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-100" 
                      placeholder={language === 'ru' ? 'Возраст' : 'Age'} 
                      type="number" 
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                    />
                    <select 
                      className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-100"
                      value={formData.sex}
                      onChange={e => setFormData({...formData, sex: e.target.value as Sex})}
                    >
                       <option value="Male">{language === 'ru' ? 'Мужской' : 'Male'}</option>
                       <option value="Female">{language === 'ru' ? 'Женский' : 'Female'}</option>
                    </select>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <input 
                      className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-100" 
                      placeholder={language === 'ru' ? 'Рост (см)' : 'Height (cm)'} 
                      type="number" 
                      value={formData.height}
                      onChange={e => setFormData({...formData, height: e.target.value})}
                    />
                    <input 
                      className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-100" 
                      placeholder={language === 'ru' ? 'Вес (кг)' : 'Weight (kg)'} 
                      type="number" 
                      value={formData.weight}
                      onChange={e => setFormData({...formData, weight: e.target.value})}
                    />
                 </div>
                 <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none text-slate-800 dark:text-slate-100"
                    value={formData.bloodGroup}
                    onChange={e => setFormData({...formData, bloodGroup: e.target.value as BloodGroup})}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                 </select>
                 <div className="grid grid-cols-2 gap-3">
                   <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.isChild} 
                        onChange={e => setFormData({...formData, isChild: e.target.checked})}
                        className="w-5 h-5 accent-medical-blue cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{language === 'ru' ? 'Ребенок' : 'Child profile'}</span>
                   </label>
                   <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.belongsToFamily} 
                        onChange={e => setFormData({...formData, belongsToFamily: e.target.checked})}
                        className="w-5 h-5 accent-medical-blue cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{language === 'ru' ? 'Семья' : 'Family member'}</span>
                   </label>
                 </div>
                 <textarea 
                    className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none resize-none text-slate-800 dark:text-slate-100" 
                    placeholder={language === 'ru' ? 'Хронические заболевания (через запятую)' : 'Chronic Conditions (comma separated)'} 
                    rows={2}
                    value={formData.chronicConditions}
                    onChange={e => setFormData({...formData, chronicConditions: e.target.value})}
                 />
                 <textarea 
                    className="w-full bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none resize-none text-slate-800 dark:text-slate-100" 
                    placeholder={language === 'ru' ? 'Цель (например, похудеть на 5 кг, снизить холестерин)' : 'Health Goal / Mission (e.g. Lose 5kg, Lower Cholesterol)'} 
                    rows={2}
                    value={formData.mission}
                    onChange={e => setFormData({...formData, mission: e.target.value})}
                 />
              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => {setShowAdd(false); setEditingMemberId(null);}} className="flex-1 py-3 text-slate-400 dark:text-slate-500 font-bold cursor-pointer">{t.cancel || (language === 'ru' ? 'Отмена' : 'Cancel')}</button>
                 <button type="submit" className="flex-1 py-3 bg-medical-blue text-white rounded-xl font-bold cursor-pointer">{editingMemberId ? t.save || (language === 'ru' ? 'Сохранить' : 'Save') : (language === 'ru' ? 'Создать' : 'Create')}</button>
              </div>
              </form>
           </motion.div>
        </div>
      )}

      <ConfirmDialog
        isOpen={memberToDelete !== null}
        onClose={() => setMemberToDelete(null)}
        onConfirm={() => {
          if (memberToDelete) {
            deleteMember(memberToDelete);
          }
          if (editingMemberId === memberToDelete) {
            setShowAdd(false);
            setEditingMemberId(null);
          }
        }}
        title={language === 'ru' ? 'Удалить профиль?' : 'Delete Profile?'}
        description={
          language === 'ru'
            ? 'Вы уверены, что хотите удалить этого члена семьи? Это действие нельзя отменить.'
            : 'Are you sure you want to remove this family member? This action cannot be undone.'
        }
        confirmText={language === 'ru' ? 'Удалить' : 'Delete'}
        cancelText={language === 'ru' ? 'Отмена' : 'Cancel'}
      />
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

export default FamilyProfiles;
