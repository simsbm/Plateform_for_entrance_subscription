import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Copy, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getToken } from '../../lib/api';

const API_BASE = 'http://localhost:3000/api';
const STORAGE_KEY = 'supptic_chat_messages';
const HISTORY_KEY = 'supptic_chat_history';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface HistoryEntry {
  role: 'user' | 'model';
  text: string;
}

const INITIAL_MESSAGE: Message = {
  id: 1,
  text: "Bonjour ! Je suis votre assistante SUPPTIC. Comment puis-je vous aider aujourd'hui ?",
  sender: 'bot',
  timestamp: new Date(),
};

const QUICK_QUESTIONS = [
  "Comment puis-je m'inscrire ?",
  'Documents requis ?',
  'Dates des examens ?',
  'Informations sur le programme',
];

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_MESSAGE];
    const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [INITIAL_MESSAGE];
  }
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function MarkdownMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0 text-sm">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5 text-sm">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5 text-sm">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ children }) => (
          <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
        ),
        h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="font-bold text-sm mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-foreground"
      title="Copier"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function ChatbotAssistant() {
  const [isOpen, setIsOpen]       = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [messages, setMessages]   = useState<Message[]>(loadMessages);
  const [conversationHistory, setConversationHistory] = useState<HistoryEntry[]>(loadHistory);

  const scrollAreaRef  = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  function clearConversation() {
    setMessages([INITIAL_MESSAGE]);
    setConversationHistory([]);
  }

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: Date.now(),
      text: trimmed,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Crée un message bot vide qu'on va remplir en streaming
    const botId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botId, text: '', sender: 'bot', timestamp: new Date() }]);

    let fullReply = '';

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, history: conversationHistory }),
      });

      if (!response.ok || !response.body) throw new Error('Réponse invalide');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload) as { chunk?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.chunk) {
              fullReply += parsed.chunk;
              // Met à jour le message en temps réel
              setMessages(prev =>
                prev.map(m => m.id === botId ? { ...m, text: fullReply } : m)
              );
            }
          } catch {
            // chunk malformé, on ignore
          }
        }
      }

      // Met à jour l'historique pour les prochains tours
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', text: trimmed },
        { role: 'model', text: fullReply },
      ]);
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === botId
            ? { ...m, text: 'Désolé, une erreur est survenue. Veuillez réessayer ou contacter info@supptic.cm.' }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, conversationHistory]);

  return (
    <>
      {/* Bouton flottant */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r from-primary to-secondary hover:shadow-xl transition-all"
            >
              <MessageCircle className="w-8 h-8" />
            </Button>
            {messages.length === 1 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                1
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fenêtre de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2">
              {/* En-tête */}
              <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Assistant SUPPTIC</CardTitle>
                      <p className="text-xs text-blue-100">
                        {isTyping ? 'En train d\'écrire...' : 'En ligne · Prêt à vous aider'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearConversation}
                      className="text-white hover:bg-white/20"
                      title="Effacer la conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Zone des messages */}
                <ScrollArea ref={scrollAreaRef} className="h-[420px] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.sender === 'bot' && (
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <Bot className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div
                          className={`group max-w-[78%] rounded-lg p-3 ${
                            message.sender === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.sender === 'bot' ? (
                            <>
                              <MarkdownMessage text={message.text || '…'} />
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {message.text && <CopyButton text={message.text} />}
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm">{message.text}</p>
                              <p className="text-xs mt-1 text-blue-100">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </>
                          )}
                        </div>
                        {message.sender === 'user' && (
                          <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <User className="w-5 h-5 text-accent" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Indicateur de frappe (trois points) */}
                    {isTyping && messages[messages.length - 1]?.text === '' && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Questions rapides */}
                {messages.length === 1 && !isTyping && (
                  <div className="px-4 pb-2 pt-3 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Questions rapides :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_QUESTIONS.map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => sendMessage(question)}
                          className="text-xs h-auto py-2 px-3 text-left whitespace-normal"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Zone de saisie */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Saisissez votre message..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(inputMessage);
                        }
                      }}
                      disabled={isTyping}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => sendMessage(inputMessage)}
                      size="icon"
                      disabled={isTyping || !inputMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
