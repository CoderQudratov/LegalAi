import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';
import { Icons } from '../constants';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 group animate-fade-in-up`}>
      <div
        className={`relative max-w-[95%] md:max-w-[85%] rounded-2xl p-5 shadow-lg backdrop-blur-sm border ${
          isUser
            ? 'bg-blue-600/90 border-blue-500/50 text-white rounded-tr-sm'
            : 'bg-slate-800/80 border-slate-700/50 text-slate-100 rounded-tl-sm'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 opacity-60">
            {isUser ? null : <div className="p-1 bg-blue-500/20 rounded"><Icons.Scale /></div>}
            <div className={`text-xs font-bold uppercase tracking-wider ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                {isUser ? 'You' : 'LegalAI • Gemini 3.0'}
            </div>
        </div>

        {/* Attachment Preview */}
        {message.attachment && (
          <div className="mb-4 mt-2">
             <img 
               src={message.attachment.data} 
               alt="Uploaded document" 
               className="max-h-60 rounded-xl border border-white/10 object-cover shadow-md"
             />
          </div>
        )}

        {/* Message Content */}
        <div className={`prose prose-sm md:prose-base max-w-none ${isUser ? 'prose-invert' : 'prose-invert'} leading-relaxed`}>
           <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>
        
        {/* Grounding Sources (Citations) */}
        {message.groundingSources && message.groundingSources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
              <Icons.Globe />
              <span>Sources Verified</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {message.groundingSources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-900/50 hover:bg-blue-900/30 border border-slate-700 hover:border-blue