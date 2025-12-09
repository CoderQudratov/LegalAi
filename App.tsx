import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './constants';
import { Message, Role, Suggestion, Attachment } from './types';
import { sendMessageToGemini } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import Sidebar from './components/Sidebar';
import Disclaimer from './components/Disclaimer';

const SUGGESTIONS: Suggestion[] = [
  { 
    id: 'contract', 
    label: 'Shartnoma tahlili', 
    prompt: 'Menda bir shartnoma bor, uni tahlil qilib xavfli tomonlarini aytib bering. Matnni shu yerga tashlaymi yoki rasm yuklaymi?',
    icon: <Icons.DocumentCheck />
  },
  { 
    id: 'divorce', 
    label: 'Ajralish jarayoni', 
    prompt: 'Nikohdan ajralish jarayoni qanday bo\'ladi? Bolalar va mulk masalasi bo\'yicha maslahat bering.',
    icon: <Icons.UserGroup />
  },
  { 
    id: 'labor', 
    label: 'Mehnat nizosi', 
    prompt: 'Ish beruvchi meni noqonuniy bo\'shatmoqchi. Mening huquqlarim qanday?',
    icon: <Icons.Scale />
  },
];

const App: React.FC = () => {
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
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    setAttachment(undefined);
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

    // Create a placeholder for the AI response
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '', 
    };
    setMessages(prev => [...prev, initialAiMessage]);

    try {
      // We pass the messages history *excluding* the newly added ones for the API context 
      // (the service handles adding the new one as the current prompt)
      await sendMessageToGemini(
        userMessage.text,
        messages, // pass history before this new message
        userMessage.attachment,
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg
          ));
        }
      );
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, text: 'Uzr, texnik xatolik yuz berdi. Iltimos qayta urinib ko\'ring.', isError: true } : msg
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Disclaimer />
      
      <Sidebar 
        onClear={handleClearChat} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full transition-all">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-bold text-slate-800">LegalAI</span>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth" id="chat-container">
          <div className="max-w-3xl mx-auto min-h-full flex flex-col">
            
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-fade-in mt-10 md:mt-0">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
                   <Icons.Scale />
                   <div className="text-white absolute w-10 h-10"><Icons.Scale /></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">LegalAI ga Xush Kelibsiz</h2>
                  <p className="text-slate-500 max-w-md mx-auto">
                    O'zbekiston qonunchiligi bo'yicha sun'iy intellekt yordamchisi. 
                    Savol bering yoki hujjat yuklang.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSendMessage(s.prompt)}
                      className="flex flex-col items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                      <div className="text-blue-600 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {s.icon}
                      </div>
                      <span className="font-medium text-sm text-slate-700">{s.label}</span>
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
                     <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                     </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-10">
          <div className="max-w-3xl mx-auto">
            {/* Attachment Preview in Input */}
            {attachment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded-lg w-fit">
                 <div className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                   Tasvir yuklandi
                 </div>
                 <button onClick={removeAttachment} className="text-slate-400 hover:text-red-500">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                     <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                   </svg>
                 </button>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-slate-100 rounded-2xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-500 hover:text-blue-600 transition-colors"
                title="Rasm yuklash (Shartnoma rasmi)"
              >
                <Icons.PaperClip />
              </button>
              
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Huquqiy savolingizni yozing yoki hujjat rasmini yuklang..."
                className="w-full bg-transparent border-none focus:ring-0 py-3.5 max-h-48 resize-none text-slate-800 placeholder-slate-400 leading-relaxed"
                rows={1}
              />
              
              <button 
                onClick={() => handleSendMessage()}
                disabled={(!inputValue.trim() && !attachment) || isLoading}
                className="p-2 mb-1.5 mr-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Icons.Send />
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              LegalAI xato qilishi mumkin. Muhim ma'lumotlarni tekshiring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;