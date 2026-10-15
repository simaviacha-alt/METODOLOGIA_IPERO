import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, HelpCircle, BookOpen, User, RefreshCw, Check } from 'lucide-react';
import { ChatMessage } from '../types.ts';
import { SUGGESTED_BOT_QUESTIONS } from '../procedureData.ts';

export const ProceduralChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: '¡Hola! Soy tu asistente técnico para la capacitación en **IPERO SST de SOBOCE S.A.** (Procedimiento SPT-GSS.SI.011). Puedes consultarme cualquier duda sobre la jerarquía de controles, la fórmula de probabilidad (INPE, IFDE, ICO), la aplicación del formato APRI, o los criterios de evaluación antes de rendir tu examen.',
      timestamp: 'Ahora',
      sourceReference: 'SPT-GSS.SI.011 Rev. 11',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || 'No fue posible procesar la respuesta. Por favor intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sourceReference: data.source || 'SPT-GSS.SI.011 Rev. 11 (SOBOCE S.A.)',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Hubo una dificultad de red momentánea. De acuerdo al procedimiento SPT-GSS.SI.011, recuerda que los controles autónomos son aquellos que funcionan sin intervención humana (como resguardos y barandas), y la probabilidad se evalúa mediante P = INPE + IFDE + ICO.',
          timestamp: 'Ahora',
          sourceReference: 'Procedimiento SPT-GSS.SI.011',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
      {/* Bot Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-cyan-950/40 border border-cyan-400/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                DUDAS Y CONSULTAS SST
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Procedimiento SPT-GSS.SI.011
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Respuestas oficiales y fundamentadas en las 36 páginas del procedimiento de SOBOCE S.A.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Asistente Activo
          </span>
        </div>
      </div>

      {/* Suggested Question Chips */}
      <div className="py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Consultas Frecuentes del Procedimiento (Haz clic para preguntar):
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_BOT_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 hover:border-cyan-500/50 transition-all text-left cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="h-80 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 my-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Content Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Source attribution and copy button for bot */}
              {m.sender === 'bot' && (
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-cyan-400">
                    <BookOpen className="w-3 h-3" />
                    {m.sourceReference || 'SPT-GSS.SI.011'}
                  </span>
                  <button
                    onClick={() => handleCopyText(m.id, m.text)}
                    className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copiar respuesta"
                  >
                    {copiedId === m.id ? (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copiado
                      </span>
                    ) : (
                      'Copiar'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 text-slate-300 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-700/80 flex items-center gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Consultando procedimiento SPT-GSS.SI.011...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Escribe tu consulta sobre el procedimiento IPERO aquí (ej: ¿Cuándo usar APRI?)..."
          className="flex-1 bg-slate-800 text-white text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-700 focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Preguntar</span>
        </button>
      </form>
    </div>
  );
};
