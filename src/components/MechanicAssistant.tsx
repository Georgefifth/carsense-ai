import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { MechanicChatMessage } from '../types/telemetry';

interface MechanicAssistantProps {
  messages: MechanicChatMessage[];
  onSendMessage: (text: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const MechanicAssistant: React.FC<MechanicAssistantProps> = ({
  messages,
  onSendMessage,
  inputRef,
}) => {
  const [inputText, setInputText] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const quickChips = [
    'Can I drive 40 miles home with this?',
    'How much will a mechanic charge to fix this?',
    'What tools do I need for a DIY repair?',
    'Is this covered under emissions warranty?',
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="bg-carbon-800 border border-carbon-700 rounded-lg p-4 flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-carbon-700 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-white tracking-tight">
            AI Master Mechanic Copilot
          </h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
            GROUNDED TELEMETRY
          </span>
        </div>
        <span className="text-xs text-slate-400">Ask any question about your vehicle</span>
      </div>

      {/* Message History */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs sm:text-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-lg p-3 whitespace-pre-wrap leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-black font-medium'
                  : 'bg-carbon-900 border border-carbon-700 text-slate-200 shadow'
              }`}
            >
              {msg.text}
              <div
                className={`text-[10px] mt-1.5 font-mono ${
                  msg.sender === 'user' ? 'text-cyan-950' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded bg-carbon-700 border border-carbon-600 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="pt-2 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(chip)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-carbon-900 hover:bg-carbon-700 text-slate-300 hover:text-white border border-carbon-700 text-[11px] font-mono transition shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-carbon-700">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask mechanic (e.g. Can I drive home? What are symptoms?)..."
          className="flex-1 bg-carbon-900 border border-carbon-600 rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-black font-bold text-xs flex items-center gap-1 transition"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
