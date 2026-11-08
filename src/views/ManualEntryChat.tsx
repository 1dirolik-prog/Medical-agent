import React, { useState, useEffect, useRef } from 'react';
import { useHealth } from '../HealthContext';
import { X, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { getGeminiContent } from '../services/gemini';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

const SYSTEM_PROMPT = `
Вы — высококвалифицированный, чуткий и профессиональный медицинский ассистент для интерактивного опроса пациента и структурированного ввода диагнозов в электронную медицинскую карту.

Твоя задача — провести полноценный, бережный опрос пациента ("опрос пациента"), помочь ему корректно структурировать его жалобы, диагноз и связанные медицинские данные без самостоятельного придумывания новых диагнозов.

## Алгоритм работы (Опрос пациента):
1. **Шаг 1: Приветствие и начало опроса**: Поприветствуйте пользователя тепло, поднимите его боевой дух и сообщите, что вы поможете ему составить структурированную запись для истории болезни с помощью небольшого приятного опроса. Спросите, какой у него диагноз, заключение врача или основные жалобы/симптомы, которые его сейчас беспокоят или были установлены.
2. **Шаг 2: Уточнение сопутствующих деталей**: На основе ответа пользователя вежливо задайте по одному (не все сразу!) уточняющие вопросы:
   - Есть ли у него сопутствующие заболевания или фоновые патологии?
   - Известны ли какие-либо осложнения основного заболевания?
   - Указаны ли в его медицинских документах стадия, степень тяжести (например, легкая, средняя, тяжелая) или конкретная локализация процесса (например, левая почка, поясничный отдел и т.д.)?
   - Какая дата постановки диагноза или когда примерно начались симптомы?
3. **Шаг 3: Исправление ошибок и расшифровка**:
   - Исправьте явные орфографические ошибки в медицинских терминах.
   - Распознавайте и расшифровывайте распространенные врачебные сокращения (например, ГБ -> Гипертоническая болезнь, ИБС -> Ишемическая болезнь сердца, ХБП -> Хроническая болезнь почек и т.д.).
4. **Шаг 4: Красивая сводка**: Преобразуйте собранные данные в структурированную, красивую и понятную пользователю сводку на русском языке, укажите предложенный код МКБ-10 с уровнем уверенности (например: "I10 (Уверенность: высокая)") и предупредите, если формулировка неоднозначна. Спросите подтверждения: "Все ли верно? Напишите 'Да' или 'Сохранить', чтобы внести запись в вашу медицинскую карту."
5. **Шаг 5: Вывод JSON**: Как только пользователь отвечает согласием (пишет "Да", "Сохранить", "Верно" или аналогично), выдайте ИСКЛЮЧИТЕЛЬНО блок JSON, обернутый в \`\`\`json ... \`\`\`. Не пишите никаких приветствий, рассуждений или слов до или после блока JSON при окончательном подтверждении.

## Формат результата (JSON):
\`\`\`json
{
  "основной_диагноз": "строка с названием основного заболевания без ошибок и сокращений",
  "код_МКБ10": "код МКБ-10 с уровнем уверенности, например: I10 (Уверенность: высокая)",
  "сопутствующие_заболевания": ["заболевание 1", "заболевание 2"],
  "осложнения": ["осложнение 1", "осложнение 2"],
  "стадия": "стадия (если указана)",
  "степень_тяжести": "степень тяжести (если указана)",
  "локализация": "локализация (если указана)",
  "дата_диагноза": "YYYY-MM-DD",
  "исходный_текст": "исходный текст пользователя или описание жалоб"
}
\`\`\`

Важно: Ведите живую, эмпатичную беседу на русском языке. Поддерживайте пациента, избегайте сухого анкетирования, задавайте вопросы мягко и последовательно.
`;

export const ManualEntryChat: React.FC<{ onClose: () => void, onSave: (data: any) => void }> = ({ onClose, onSave }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    sendMessage("Привет");
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (overrideText?: string) => {
    const text = overrideText || inputText;
    if (!text.trim() && !overrideText) return;
    
    if (!overrideText) {
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setInputText('');
    }
    
    setIsLoading(true);
    
    try {
      const historyText = messages.map(m => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`).join('\n\n');
      const fullPrompt = `${SYSTEM_PROMPT}\n\nИстория общения:\n${historyText}\n\nПользователь: ${text}\nАссистент:`;
      
      const response = await getGeminiContent(fullPrompt);
      
      if (response.includes('\`\`\`json')) {
        const jsonMatch = response.match(/\`\`\`json([\s\S]*?)\`\`\`/);
        if (jsonMatch && jsonMatch[1]) {
           try {
             // Clean linebreaks or unexpected chars inside JSON block
             let rawJson = jsonMatch[1].trim();
             const data = JSON.parse(rawJson);
             onSave(data);
             setMessages(prev => [...prev, { role: 'assistant', content: 'Запись успешно сохранена и добавлена в карточку!' }]);
             setTimeout(() => {
               onClose();
             }, 2000);
             return;
           } catch(e) {
             console.error("Failed to parse JSON result from assistant", e, jsonMatch[1]);
           }
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, { role: 'assistant', content: 'Произшла ошибка, попробуйте еще раз.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="w-full max-w-lg h-[80vh] flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-medical-blue/10 flex items-center justify-center text-medical-blue">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Медицинский ассистент</h3>
              <p className="text-xs text-slate-500">Ручной ввод данных</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-medical-blue text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-medical-blue text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="self-start flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center">
                 <Bot size={16} />
              </div>
              <div className="rounded-2xl px-4 py-4 bg-slate-100 dark:bg-slate-700 rounded-tl-sm flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Введите сообщение..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-4 pr-12 outline-none focus:border-medical-blue transition-colors text-slate-800 dark:text-white"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-xl bg-medical-blue text-white disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              <Send size={18} className="translate-x-[2px]" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
