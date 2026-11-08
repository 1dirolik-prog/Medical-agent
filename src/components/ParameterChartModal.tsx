import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { X, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { translateParameter } from '../services/paramTranslator';
import { getStandardReferenceRange } from '../services/referenceRanges';

const ParameterChartModal = ({ parameter, data, onClose, t, language, activeMember }: any) => {
  if (!parameter || !data) return null;

  const sortedData = [...data]
    .filter(d => d.parameter === parameter && d.value !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => ({
       ...d,
       formattedDate: new Date(d.date).toLocaleDateString(language, { month: 'short', day: 'numeric' })
    }));

  const standardRange = activeMember ? getStandardReferenceRange(parameter, activeMember.age, activeMember.sex) : null;
  const standardMin = standardRange?.min !== undefined ? standardRange.min : (data[0]?.referenceRange?.min || undefined);
  const standardMax = standardRange?.max !== undefined ? standardRange.max : (data[0]?.referenceRange?.max || undefined);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
         onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-5"
           onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
             <h3 className="font-bold text-lg text-slate-800 dark:text-white">
               {translateParameter(parameter, language)}
             </h3>
             <p className="text-xs text-slate-500">
               {sortedData.length} {language === 'ru' ? 'записей' : 'entries'}
             </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 h-72 w-full">
           {sortedData.length < 1 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                 {language === 'ru' ? 'Недостаточно данных для графика' : 'Not enough data for chart'}
              </div>
           ) : (
              <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={sortedData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                   <YAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                     labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                   />
                   {standardMin !== undefined && standardMax !== undefined && (
                      <ReferenceArea 
                         y1={standardMin} 
                         y2={standardMax} 
                         fill="#22c55e" 
                         fillOpacity={0.1} 
                         ifOverflow="extendDomain"
                      />
                   )}
                   <Line 
                     type="monotone" 
                     dataKey="value" 
                     stroke="#3b82f6" 
                     strokeWidth={3}
                     dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                     activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                   />
                 </LineChart>
              </ResponsiveContainer>
           )}
        </div>
        
        {standardMin !== undefined && standardMax !== undefined && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
            <span className="inline-block w-3 h-3 bg-green-500/20 border border-green-500/50 rounded mr-2 align-middle"></span>
            {language === 'ru' ? `Норма: ${standardMin} - ${standardMax}` : `Norm: ${standardMin} - ${standardMax}`}
            {sortedData.length > 0 && sortedData[0].unit && ` ${sortedData[0].unit}`}
          </div>
        )}
      </div>
    </div>
  );
};
export default ParameterChartModal;
