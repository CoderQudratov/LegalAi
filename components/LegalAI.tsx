import React, { useState, useRef, useEffect } from 'react';
import { Icons, DEMO_PROMPT, APP_NAME } from '../constants';
import { Message, Role, Suggestion, Attachment } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import Sidebar from './Sidebar';
import Disclaimer from './Disclaimer';

const SUGGESTIONS: Suggestion[] = [
  { 
    id: 'contract', 
    label: 'Shartnoma Tahlili', 
    prompt: 'Menda shartnoma (rasmi) bor, uni O\'zbekiston Fuqarolik kodeksiga muvofiq xavfli bandlar va yetishmayotgan himoya choralarini tekshirib bering.',
    icon: <Icons.DocumentCheck />
  },
  { 
    id: 'divorce', 
    label: 'Oila Huquqi', 
    prompt: 'O\'zbekistonda agar umumiy farzandlar bo\'lsa, ajrashish tartibi qanday? Mulk qanday taqsimlanadi?',
    icon: <Icons.UserGroup />
  },
  { 
    id: 'labor', 
    label: 'Mehnat Nizosi', 
    prompt: 'Ish beruvchim meni ogohlantirishsiz ishdan bo\'shatdi. Mehnat kodeksi bo\'yicha qanday kompensatsiya olishga haqliman?',
    icon: <Icons.Scale />
  },
];

const LegalAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleClearChat = () => {
    setMessages([]);
    setAttachment(undefined);
    setInputValue('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          mimeType: file.type,
          data: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    setAttachment(undefined);
  };

  const handleMagicDemo = () => {
    if (isLoading) return;
    setInputValue('');
    let i = 0;
    const txt = DEMO_PROMPT;
    const speed = 15; 

    const typeWriter = () => {
      if (i < txt.length) {
        setInputValue(prev => prev + txt.charAt(i));
        i++;
        setTimeout(typeWriter, speed);
      }
    };
    typeWriter();
  };

  const handleSendMessage = async (text: string = inputValue) => {
    if ((!text.trim() && !attachment) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      attachment: attachment
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setAttachment(undefined);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '', 
    };
    setMessages(prev => [...prev, initialAiMessage]);

    try {
      await sendMessageToGemini(
        userMessage.text,
        messages, 
        userMessage.attachment,
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
          ));
        }
      );
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Uzr, texnik xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.', isError: true } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden relative font-inter">
      <Disclaimer />
      
      <Sidebar 
        onClear={handleClearChat} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col h-full relative w-full transition-all">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-bold text-white tracking-tight">{APP_NAME}</span>
          <div className="w-8"></div> 
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth scrollbar-hide" id="chat-container">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in mt-10 md:mt-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 relative">
                   <div className="text-white transform scale-150"><Icons.Scale /></div>
                   <div className="absolute inset-0 border border-white/10 rounded-3xl"></div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{APP_NAME}</h2>
                  <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                    Gemini 3.0 Pro asosidagi virtual huquqshunos.<br/>
                    <span className="text-blue-400 text-sm mt-2 block">O'zbekiston Qonunchiligi bo'yicha Ekspert</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSendMessage(s.prompt)}
                      className="flex flex-col items-center gap-3 p-5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all group backdrop-blur-sm"
                    >
                      <div className="text-blue-500 p-2 bg-blue-500/10 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        {s.icon}
                      </div>
                      <span className="font-medium text-sm text-slate-300 group-hover:text-white">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pb-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                   <div className="flex justify-start mb-6 animate-pulse">
                     <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                     </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-slate-950/80 backdrop-blur-md border-t border-slate-800 p-4 sticky bottom-0 z-20">
          <div className="max-w-3xl mx-auto">
            {attachment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-slate-800 rounded-lg w-fit border border-slate-700">
                 <div className="text-xs font-medium text-slate-300 truncate max-w-[200px]">
                   Rasm yuklandi
                 </div>
                 <button onClick={removeAttachment} className="text-slate-400 hover:text-red-400 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                     <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                   </svg>
                 </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-slate-900 rounded-2xl border border-slate-700 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-lg">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex items-center pb-2 pl-2 gap-1">
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-slate-800"
                  title="Hujjat yuklash"
                >
                  <Icons.PaperClip />
                </button>
                <button 
                  onClick={handleMagicDemo}
                  disabled={isLoading}
                  className="p-2 text-amber-500 hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-500/10"
                  title="Demo (Video uchun)"
                >
                  <Icons.Sparkles />
                </button>
              </div>
              
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Huquqiy savolingizni yozing..."
                className="w-full bg-transparent border-none focus:ring-0 py-3.5 max-h-48 resize-none text-slate-200 placeholder-slate-500 leading-relaxed font-normal"
                rows={1}
              />
              
              <button 
                onClick={() => handleSendMessage()}
                disabled={(!inputValue.trim() && !attachment) || isLoading}
                className="p-2 mb-1.5 mr-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
              >
                <Icons.Send />
              </button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-3 font-medium">
              AIAdvokat xato qilishi mumkin. Muhim ma'lumotlarni tekshiring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalAI;