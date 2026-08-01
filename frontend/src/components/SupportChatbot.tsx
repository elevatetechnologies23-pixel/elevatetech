import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  ExternalLink,
  Sparkles,
  ChevronRight,
  Package
} from 'lucide-react';
import { useSettings } from '../utils/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actions?: { label: string; action: () => void; icon?: React.ReactNode }[];
}

export const SupportChatbot: React.FC = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If admin disabled chatbot in settings, return null
  if (settings.chatbotEnabled === 'false') {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize welcome message
      const welcomeMsg: ChatMessage = {
        id: 'welcome-1',
        sender: 'bot',
        text: settings.chatbotWelcomeMessage || 'Hello! Welcome to Elevate Technology Customer Support. How can we assist you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          {
            label: '🛒 Track Order Status',
            action: () => handleSelectOption('order_status'),
            icon: <Package size={14} />
          },
          {
            label: '💻 POS & Billing Software',
            action: () => handleSelectOption('billing_software'),
            icon: <FileText size={14} />
          },
          {
            label: '🎫 Submit Support Ticket',
            action: () => handleSelectOption('support_ticket'),
            icon: <HelpCircle size={14} />
          },
          {
            label: '💬 Chat on WhatsApp',
            action: () => handleSelectOption('whatsapp_support'),
            icon: <MessageSquare size={14} />
          }
        ]
      };
      setMessages([welcomeMsg]);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSelectOption = (key: string) => {
    if (key === 'order_status') {
      addMessage('user', 'I want to track my order status.');
      simulateBotReply(
        'You can view all active and past orders, shipping tracking numbers, and GST invoices directly from your Customer Dashboard.',
        [
          {
            label: 'Go to Orders Dashboard',
            action: () => { setIsOpen(false); navigate('/dashboard'); },
            icon: <ExternalLink size={12} />
          }
        ]
      );
    } else if (key === 'billing_software') {
      addMessage('user', 'Tell me about your Billing Software plans.');
      simulateBotReply(
        'We offer POS & GST Billing Software solutions: Standard POS (Single counter), Advanced GST Billing (Multi-counter & inventory sync), and Enterprise ERP Suite.',
        [
          {
            label: 'Explore Billing Plans',
            action: () => { setIsOpen(false); navigate('/billing-software'); },
            icon: <ChevronRight size={12} />
          }
        ]
      );
    } else if (key === 'support_ticket') {
      addMessage('user', 'I need technical help with my products.');
      simulateBotReply(
        'Our technical support queue handles license activations, warranty claims, and hardware repairs.',
        [
          {
            label: 'Submit Ticket Now',
            action: () => { setIsOpen(false); navigate('/support-tickets'); },
            icon: <HelpCircle size={12} />
          }
        ]
      );
    } else if (key === 'whatsapp_support') {
      const phoneNum = (settings.whatsappNumber || '919673391008').replace(/\D/g, '');
      const waUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent('Hello Elevate Support team, I need assistance.')}`;
      window.open(waUrl, '_blank');
      addMessage('user', 'Connect via WhatsApp Direct Support');
      addMessage('bot', 'Opening direct WhatsApp support channel...');
    }
  };

  const addMessage = (sender: 'bot' | 'user', text: string, actions?: any[]) => {
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now() + Math.random(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const simulateBotReply = (replyText: string, actions?: any[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage('bot', replyText, actions);
    }, 800);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userQuery = inputText.trim();
    setInputText('');
    addMessage('user', userQuery);

    // Smart AI Auto-Responder logic
    const lower = userQuery.toLowerCase();
    if (lower.includes('order') || lower.includes('status') || lower.includes('track')) {
      simulateBotReply('You can view live order dispatch status and courier tracking numbers under Customer Dashboard > Orders.', [
        { label: 'View My Orders', action: () => { setIsOpen(false); navigate('/dashboard'); } }
      ]);
    } else if (lower.includes('billing') || lower.includes('software') || lower.includes('pos') || lower.includes('gst')) {
      simulateBotReply('Elevate POS & Billing software includes single-counter, multi-store sync, and GST return ledger exports.', [
        { label: 'View Software Plans', action: () => { setIsOpen(false); navigate('/billing-software'); } }
      ]);
    } else if (lower.includes('contact') || lower.includes('whatsapp') || lower.includes('call') || lower.includes('phone')) {
      const phoneNum = (settings.whatsappNumber || '919673391008').replace(/\D/g, '');
      simulateBotReply(`You can reach our sales desk at ${settings.companyPhone || '+91 9673391008'} or directly chat via WhatsApp.`, [
        { label: 'Open WhatsApp Chat', action: () => window.open(`https://wa.me/${phoneNum}`, '_blank') }
      ]);
    } else {
      simulateBotReply('Thank you for reaching out! A technical support executive is reviewing your message. You can also open an official support ticket or contact us via WhatsApp.', [
        { label: 'Submit Ticket', action: () => { setIsOpen(false); navigate('/support-tickets'); } }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group p-4 rounded-full bg-gradient-to-r from-accent-blue via-indigo-600 to-accent-blue text-white shadow-[0_10px_25px_rgba(37,99,235,0.45)] hover:shadow-[0_15px_35px_rgba(37,99,235,0.6)] hover:scale-110 transition-all duration-300 flex items-center justify-center border border-white/30"
          aria-label="Open Customer Support Chatbot"
        >
          {/* Animated Pulsing Ring */}
          <span className="absolute inset-0 rounded-full bg-accent-blue opacity-40 animate-ping" />
          
          <Bot size={28} className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] group-hover:rotate-12 transition-transform duration-300" />
          
          {/* Online Status Badge */}
          <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 border-2 border-slate-900 rounded-full z-20" />
        </button>
      )}

      {/* Floating Support Chat Window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-96 h-[520px] max-h-[85vh] bg-white dark:bg-primary-800 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-primary-500/30 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-primary-600 to-indigo-950 p-4 text-white flex items-center justify-between shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="relative w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-accent-blue shadow-inner">
                <Bot size={22} className="text-cyan-400" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border border-slate-900" />
              </div>

              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-white">
                  Elevate Support AI <Sparkles size={14} className="text-accent-gold" />
                </h3>
                <span className="text-[10px] text-slate-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> 24/7 Active • Instant Assist
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors relative z-10"
              aria-label="Close Chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-primary-850/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[85%]">
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0 mb-1">
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl shadow-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-accent-blue text-white rounded-br-none'
                        : 'bg-white dark:bg-primary-700 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-primary-500/20 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>

                {/* Quick Action Buttons */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2.5 flex flex-col gap-1.5 w-full pl-8">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={act.action}
                        className="btn-secondary text-[11px] font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-primary-500/30 bg-white dark:bg-primary-700 hover:border-accent-blue hover:text-accent-blue flex items-center justify-between text-left shadow-sm group transition-all"
                      >
                        <span className="flex items-center gap-2">
                          {act.icon} {act.label}
                        </span>
                        <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-white dark:bg-primary-700 rounded-2xl border border-slate-200/50 dark:border-primary-500/20 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-primary-800 border-t border-slate-200/60 dark:border-primary-500/20 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-slate-100 dark:bg-primary-700 rounded-xl outline-none border border-transparent focus:border-accent-blue text-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-accent-blue text-white hover:bg-accent-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
              aria-label="Send Message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportChatbot;
