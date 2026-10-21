import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Database,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';

const SUGGESTIONS = [
  'Which machines need attention?',
  'Why is Machine 3 flagged?',
  'Explain latest critical alert',
  'What is the RUL of Conveyor CV-12?',
  'Status of Hydraulic Press MCH-002',
];

export default function ChatWidget({ activeMachineId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I'm PredictaMaint AI. I have live access to your machine fleet telemetry and anomaly database. Ask me any diagnostic question about machine health, RUL, or alerts.",
      sources: 'Live MongoDB telemetry & anomaly streams',
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (questionText = null) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(q, activeMachineId);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.answer,
        sources: res.sources,
        modelUsed: res.modelUsed,
        machineId: res.machineId,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Apologies, I encountered an error connecting to the diagnostic server. Please verify the Express backend is running.',
        sources: 'Error',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="chat-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Open AI Fleet Diagnostics"
        >
          <Bot size={28} />
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          className="chat-panel"
          style={{
            width: isExpanded ? '640px' : '440px',
            height: isExpanded ? '740px' : '580px',
          }}
        >
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#ffffff" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  PredictaMaint Diagnostic AI
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#38bdf8' }}>
                  <Database size={11} />
                  <span>Grounding: Live MongoDB Telemetry</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                {/* Grounding Source Attribution Tag */}
                {m.sender === 'ai' && m.sources && (
                  <div className="chat-context-tag">
                    <Database size={11} />
                    <span>based on: {m.sources}</span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="chat-bubble chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={14} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Extracting machine context & querying diagnostic model...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="suggestion-chips">
            {SUGGESTIONS.map((s, idx) => (
              <button key={idx} className="suggestion-chip" onClick={() => handleSend(s)} disabled={loading}>
                {s}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.86rem', padding: '9px 12px' }}
              placeholder={
                activeMachineId
                  ? `Ask about ${activeMachineId} or fleet...`
                  : 'Ask about machine health, RUL, or alerts...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{ padding: '0 16px' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
