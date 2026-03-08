import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Mic, MicOff, Paperclip, Trash2, MessageSquare, Plus, ArrowLeft, Volume2, VolumeX, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWebSpeech } from '@/hooks/useWebSpeech';
import ReactMarkdown from 'react-markdown';
import logo3v from '@/assets/logo-3v.png';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

(pdfjs as any).GlobalWorkerOptions.workerSrc = pdfWorker;

interface Message { role: 'user' | 'assistant'; content: string; }
interface Conversation { id: string; title: string | null; created_at: string; }
interface UploadedFile { name: string; content: string; type: string; }

const AIChat = () => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking, isSupported } = useWebSpeech({
    onResult: (text) => { setInput(prev => (prev ? prev + ' ' : '') + text); },
    onError: (error) => { toast({ title: t('aiChat.micError'), description: error, variant: 'destructive' }); }
  });

  useEffect(() => { 
    if (!loading) { if (!user) navigate('/auth'); else loadConversations(); }
  }, [user, loading, navigate]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase.from('ai_conversations').select('id, title, created_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(10);
    setConversations(data || []);
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase.from('ai_messages').select('role, content').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    setMessages((data || []) as Message[]);
    setCurrentConversationId(conversationId);
    setShowSidebar(false);
  };

  const createNewConversation = async () => {
    if (!user) return null;
    const { data } = await supabase.from('ai_conversations').insert({ user_id: user.id, title: 'Nouvelle conversation' }).select().single();
    if (!data) return null;
    await loadConversations();
    return data.id;
  };

  const saveMessage = async (conversationId: string, role: string, content: string) => {
    await supabase.from('ai_messages').insert({ conversation_id: conversationId, role, content });
    if (role === 'user') {
      await supabase.from('ai_conversations').update({ title: content.substring(0, 50), updated_at: new Date().toISOString() }).eq('id', conversationId);
    }
  };

  const deleteConversation = async (id: string) => {
    await supabase.from('ai_messages').delete().eq('conversation_id', id);
    await supabase.from('ai_conversations').delete().eq('id', id);
    if (currentConversationId === id) { setCurrentConversationId(null); setMessages([]); }
    await loadConversations();
  };

  const streamChat = async (userMessage: Message, convId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      if (!response.ok) { toast({ title: t('common.error'), variant: 'destructive' }); return; }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '', textBuffer = '';
      if (!reader) return;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, idx); textBuffer = textBuffer.slice(idx + 1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const content = JSON.parse(jsonStr).choices?.[0]?.delta?.content;
            if (content) { assistantMessage += content; setMessages(prev => { const last = prev[prev.length - 1]; return last?.role === 'assistant' ? prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantMessage } : m) : [...prev, { role: 'assistant', content: assistantMessage }]; }); }
          } catch { break; }
        }
      }
      if (assistantMessage) await saveMessage(convId, 'assistant', assistantMessage);
    } catch { toast({ title: t('common.error'), variant: 'destructive' }); }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let convId = currentConversationId || await createNewConversation();
    if (!convId) return;
    setCurrentConversationId(convId);
    let fullContent = input;
    if (uploadedFile) { fullContent = `[Fichier: ${uploadedFile.name}]\n${uploadedFile.content}\n\n${input}`; }
    const userMessage: Message = { role: 'user', content: fullContent };
    setMessages(prev => [...prev, userMessage]); 
    setInput(''); setUploadedFile(null); setIsLoading(true);
    await saveMessage(convId, 'user', fullContent);
    await streamChat(userMessage, convId);
    await loadConversations(); setIsLoading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    if (file.type.startsWith('image/')) { toast({ title: t('aiChat.unsupportedFormat'), variant: 'destructive' }); return; }
    try {
      const ext = file.name.toLowerCase().split('.').pop();
      if (file.type === 'application/pdf' || ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const doc = await (pdfjs as any).getDocument({ data: ab }).promise;
        let text = '';
        for (let p = 1; p <= Math.min(doc.numPages ?? 1, 10); p++) {
          const page = await doc.getPage(p);
          const c = await page.getTextContent();
          text += '\n' + (c.items || []).map((it: any) => it?.str || '').join(' ');
          if (text.length > 15000) break;
        }
        setUploadedFile({ name: file.name, content: text.trim().slice(0, 15000), type: file.type });
        toast({ title: `✅ PDF` }); return;
      }
      if (ext === 'docx') {
        const ab = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: ab });
        setUploadedFile({ name: file.name, content: (result?.value || '').slice(0, 15000), type: 'application/docx' });
        toast({ title: `✅ DOCX` }); return;
      }
      const text = await file.text();
      setUploadedFile({ name: file.name, content: text.slice(0, 15000), type: file.type || 'text/plain' });
      toast({ title: `✅ ${file.name}` });
    } catch { toast({ title: '❌', variant: 'destructive' }); }
  };

  const newChat = useCallback(() => { setCurrentConversationId(null); setMessages([]); setShowSidebar(false); }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-4 py-3 flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden text-muted-foreground"><MessageSquare className="w-5 h-5" /></button>
          <div className="w-8 h-8 rounded-lg bg-cathedral-gold/10 flex items-center justify-center p-1">
            <img src={logo3v} alt="3V" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-cinzel font-bold text-foreground">{t('aiChat.title')}</h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={newChat} className="gap-1 text-xs border-cathedral-gold/30">
          <Plus className="w-3 h-3" />{t('aiChat.new')}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-52 border-r border-border/20 bg-muted/10 overflow-y-auto`}>
          <div className="p-3 space-y-0.5">
            <p className="text-[10px] font-inter text-muted-foreground/50 uppercase tracking-wider mb-2">{t('aiChat.conversations')}</p>
            {conversations.map(c => (
              <div key={c.id} className={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer group transition-colors ${currentConversationId === c.id ? 'bg-cathedral-gold/10' : 'hover:bg-muted/50'}`} onClick={() => loadMessages(c.id)}>
                <MessageSquare className="w-3 h-3 flex-shrink-0 text-muted-foreground/40" />
                <span className="text-xs truncate flex-1 font-inter">{c.title || t('aiChat.noTitle')}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}>
                  <Trash2 className="w-3 h-3 text-muted-foreground/40 hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-14 h-14 rounded-full bg-cathedral-gold/10 flex items-center justify-center mx-auto mb-4 p-2">
                    <img src={logo3v} alt="3V" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-cinzel font-bold text-foreground mb-1">{t('aiChat.welcome')}</h3>
                  <p className="text-sm text-muted-foreground font-inter max-w-sm mx-auto">{t('aiChat.welcomeDesc')}</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-cathedral-gold/10 flex items-center justify-center flex-shrink-0 p-1">
                      <img src={logo3v} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm ${
                    m.role === 'user' 
                      ? 'bg-cathedral-gold/10 text-foreground' 
                      : 'bg-muted/50'
                  }`}>
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none font-inter"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    ) : (
                      <p className="whitespace-pre-wrap font-inter">{m.content}</p>
                    )}
                    {m.role === 'assistant' && isSupported() && (
                      <button onClick={() => isSpeaking ? stopSpeaking() : speak(m.content)}
                        className="mt-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1 font-inter">
                        {isSpeaking ? <><VolumeX className="w-3 h-3" />{t('aiChat.stop')}</> : <><Volume2 className="w-3 h-3" />{t('aiChat.read')}</>}
                      </button>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-cathedral-gold/10 flex items-center justify-center p-1">
                    <img src={logo3v} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-muted/50 rounded-xl px-4 py-3 flex gap-1">
                    <div className="w-1.5 h-1.5 bg-cathedral-gold/50 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-cathedral-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-cathedral-gold/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border/20 p-3 bg-background">
            <div className="max-w-2xl mx-auto">
              {uploadedFile && (
                <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-cathedral-gold/5 border border-cathedral-gold/20 rounded text-xs font-inter">
                  <Paperclip className="w-3 h-3 text-cathedral-gold" />
                  <span className="flex-1 truncate">{uploadedFile.name}</span>
                  <button onClick={() => setUploadedFile(null)}><X className="w-3 h-3 text-muted-foreground" /></button>
                </div>
              )}
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt,.md,.docx" onChange={handleFileSelect} />
                <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-2"><Paperclip className="w-4 h-4" /></button>
                {isSupported() && (
                  isListening ? (
                    <button onClick={stopListening} className="text-destructive p-2"><MicOff className="w-4 h-4" /></button>
                  ) : (
                    <button onClick={startListening} className="text-muted-foreground/40 hover:text-muted-foreground p-2"><Mic className="w-4 h-4" /></button>
                  )
                )}
                <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder={t('aiChat.askQuestion')} disabled={isLoading || isListening} className="flex-1 border-border/30" />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="sm" className="bg-cathedral-gold hover:bg-cathedral-gold/90 text-cathedral-navy">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
