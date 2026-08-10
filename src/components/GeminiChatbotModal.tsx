import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Zap, 
  Mic, 
  RefreshCw, 
  User, 
  Cpu, 
  Copy, 
  Check, 
  MessageSquare, 
  HelpCircle,
  FileCode2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { sendGeminiChat, fetchLowLatencyFlashLite } from '../services/api';
import { Project } from '../types';

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenVoiceModal: () => void;
  projects: Project[];
  selectedProjectForContext?: Project | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  timestamp: string;
  latencyMs?: number;
}

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  onOpenVoiceModal,
  projects,
  selectedProjectForContext
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      content: `Hello! I am your AI Software Architecture & Portfolio Assistant powered by Gemini. I have real-time context on all **${projects.length} portfolio projects** in this enterprise workspace.\n\nHow can I assist you with project analytics, test coverage evaluation, tech stack comparisons, or deployment reviews today?`,
      modelUsed: 'gemini-3.5-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Context preset prompts
  const presetPrompts = [
    { label: '📊 Analyze Stack Gaps', prompt: 'Analyze our portfolio tech stacks and highlight any gaps or key dependencies.' },
    { label: '⚠️ Review Test Coverage', prompt: 'Identify projects with test coverage below 90% and recommend concrete improvement steps.' },
    { label: '⏳ Pending Approval Status', prompt: 'Which projects are currently pending supervisor review or changes requested?' },
    { label: '🚀 Deployment Roadmap', prompt: 'Summarize upcoming deployments for Q3 2026 and highlight high priority projects.' }
  ];

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || inputMessage.trim();
    if (!textToSend || isLoading) return;

    if (!overridePrompt) setInputMessage('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendGeminiChat(apiMessages, selectedModel);

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: res.text,
        modelUsed: res.model,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Error processing query:** ${err.message || 'Unable to reach Gemini AI services. Please verify GEMINI_API_KEY in server secrets.'}`,
        modelUsed: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        role: 'model',
        content: `Conversation history reset. Ask me anything about your software portfolio, architecture specs, or deployment timelines.`,
        modelUsed: selectedModel,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">Gemini AI Assistant</h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Context
                  </span>
                </div>
                <p className="text-xs text-slate-400">Context-aware multi-turn software intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Conversation Launch Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVoiceModal();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 hover:from-cyan-500/20 hover:to-purple-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Switch to Live Voice</span>
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                title="Clear Chat History"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium">Model Engine:</span>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.5-flash')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    selectedModel === 'gemini-3.5-flash'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gemini 3.5 Flash
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    selectedModel === 'gemini-3.1-pro-preview'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gemini 3.1 Pro (Deep)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    selectedModel === 'gemini-3.1-flash-lite'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3" /> Flash-Lite (Fast)
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 hidden sm:block">
              {projects.length} projects synced in context
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[82%] group`}>
                    <div className={`flex items-center gap-2 mb-1 text-[10px] text-slate-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span>{isUser ? 'You' : `Gemini (${msg.modelUsed || selectedModel})`}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.latencyMs && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400/90 font-mono flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> {msg.latencyMs}ms
                          </span>
                        </>
                      )}
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap relative ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-xs shadow-lg'
                      }`}
                    >
                      {msg.content}

                      {/* Copy Action for AI Responses */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Copy Message"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-purple-400 animate-spin" />
                </div>
                <div className="px-4 py-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center gap-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2 text-slate-400">Gemini is analyzing portfolio state...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Prompts */}
          <div className="px-5 py-2 bg-slate-950/40 border-t border-slate-800/80 overflow-x-auto flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
            </span>
            {presetPrompts.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(preset.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-xs whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Footer Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask Gemini about your projects, code coverage, tech stack...`}
                disabled={isLoading}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
