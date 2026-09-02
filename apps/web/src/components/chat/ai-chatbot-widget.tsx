'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, X, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/lib/i18n/language-provider';
import { useSendAiChatMessage } from '@/features/ai-chat/hooks/use-ai-chat';
import { MarkdownText } from './markdown-text';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export function AiChatbotWidget() {
  const { locale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessageMutation = useSendAiChatMessage();

  const isAmharic = locale === 'am';

  // Initialize welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: isAmharic
            ? 'ሰላም! እኔ የጆኤል አካዳሚ AI ረዳት ነኝ። በኮርሶች፣ በክህሎት ስልጠናዎች ወይም በፕላትፎርሙ አጠቃቀም ላይ ማንኛውንም ጥያቄ ይጠይቁኝ!'
            : 'Hello! I am Joel Academy AI Assistant. Ask me anything about our courses, certifications, learning roadmaps, or platform navigation!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, messages.length, isAmharic]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sendMessageMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMessage('');

    try {
      const res = await sendMessageMutation.mutateAsync({
        message: text,
        locale,
      });

      const replyText =
        res.reply ||
        (isAmharic
          ? 'ይቅርታ፣ ለጥያቄዎ ምላሽ ማመንጨት አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።'
          : 'Sorry, I could not generate a response. Please try again.');

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; response?: { status?: number } };
      const isRateLimited = errorObj?.status === 429 || errorObj?.response?.status === 429;

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: isRateLimited
          ? isAmharic
            ? '⚠️ የ10 ጥያቄዎች ገደብ ደርሰዋል። እባክዎ ጥቂት ደቂቃዎች ይጠብቁ እና ድጋሚ ይሞክሩ።'
            : '⚠️ Rate limit reached (maximum 10 requests). Please wait a few minutes before asking again.'
          : isAmharic
            ? 'ይቅርታ፣ ጥያቄዎን ማስተናገድ አልተቻለም። እባክዎ ድጋሚ ይሞክሩ።'
            : 'Sorry, unable to process your question right now. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: isAmharic
          ? 'የውይይት ታሪክ ጸድቷል። ማንኛውንም አዲስ ጥያቄ መጠየቅ ይችላሉ!'
          : 'Chat history cleared. Feel free to ask a new question!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const suggestedQuestions = isAmharic
    ? ['በጆኤል አካዳሚ ምን አይነት ኮርሶች አሉ?', 'ሰርተፊኬት እንዴት ማግኘት ይቻላል?', 'በነጻ መጀመር ይቻላል?']
    : ['What courses are available?', 'How do I earn a certificate?', 'Can I start for free?'];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="group relative flex size-14 items-center justify-center rounded-full bg-brand shadow-xl transition-all duration-300 hover:scale-105 hover:bg-brand/95"
          aria-label="Open AI Assistant"
        >
          <Bot className="size-7 text-brand-foreground transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500">
            <Sparkles className="size-2.5 text-white" />
          </span>
        </Button>
      )}

      {/* Expanded Chat Drawer / Panel */}
      {isOpen && (
        <Card className="flex h-[520px] w-[360px] flex-col overflow-hidden border border-border shadow-2xl sm:w-[400px]">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between border-b border-border bg-brand px-4 py-3 text-brand-foreground">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-xs">
                <Bot className="size-5 text-brand-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold leading-none text-brand-foreground">
                  {isAmharic ? 'የጆኤል አካዳሚ AI ረዳት' : 'Joel Academy AI Assistant'}
                </CardTitle>
                <p className="mt-1 text-[11px] text-brand-foreground/80">
                  {isAmharic ? 'በፈጣን AI የተደገፈ' : 'Powered by Gemini AI'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="size-8 text-brand-foreground/80 hover:bg-white/10 hover:text-brand-foreground"
                title={isAmharic ? 'ታሪክ አጽዳ' : 'Clear history'}
              >
                <Trash2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="size-8 text-brand-foreground/80 hover:bg-white/10 hover:text-brand-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages Feed */}
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-3.5">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-brand text-brand-foreground rounded-br-none font-medium'
                          : msg.isError
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 rounded-bl-none'
                            : 'bg-muted text-foreground rounded-bl-none'
                      }`}
                    >
                      {msg.isError && (
                        <AlertCircle className="mr-1 inline size-3.5 text-amber-500" />
                      )}
                      {msg.sender === 'user' ? msg.text : <MarkdownText content={msg.text} />}
                    </div>
                    <span className="mt-1 text-[10px] text-muted-foreground/70 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {/* Loading Spinner */}
                {sendMessageMutation.isPending && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                      <Bot className="size-4 text-brand animate-pulse" />
                    </div>
                    <span className="flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      {isAmharic ? 'በማሰብ ላይ...' : 'Thinking...'}
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Suggested Quick Prompts */}
            {messages.length <= 2 && !sendMessageMutation.isPending && (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border bg-muted/20">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors truncate max-w-full"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isAmharic ? 'ጥያቄዎን እዚህ ይጻፉ...' : 'Ask a question...'}
                disabled={sendMessageMutation.isPending}
                className="flex-1 text-xs"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                className="size-9 shrink-0 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Send className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
