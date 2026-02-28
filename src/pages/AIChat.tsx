import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

// PDF.js worker (Vite)
(pdfjs as any).GlobalWorkerOptions.workerSrc = pdfWorker;

interface Message { role: 'user' | 'assistant'; content: string; }
interface Conversation { id: string; title: string | null; created_at: string; }
interface UploadedFile { name: string; content: string; type: string; }

const AIChat = () => {
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
  
  // Web Speech API
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported
  } = useWebSpeech({
    onResult: (text) => {
      setInput(prev => (prev ? prev + ' ' : '') + text);
    },
    onError: (error) => {
      toast({ title: 'Erreur micro', description: error, variant: 'destructive' });
    }
  });

  useEffect(() => { 
    if (!loading) {
      if (!user) navigate('/auth');
      else loadConversations();
    }
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
    toast({ title: "Conversation supprimée" });
  };

  const streamChat = async (userMessage: Message, convId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      if (!response.ok) { toast({ title: "Erreur", variant: "destructive" }); return; }
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
    } catch { toast({ title: "Erreur", variant: "destructive" }); }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let convId = currentConversationId || await createNewConversation();
    if (!convId) return;
    setCurrentConversationId(convId);
    
    // Inclure le fichier s'il existe
    let fullContent = input;
    if (uploadedFile) {
      fullContent = `[Fichier attaché: ${uploadedFile.name}]\n${uploadedFile.content}\n\n${input}`;
    }
    
    const userMessage: Message = { role: 'user', content: fullContent };
    setMessages(prev => [...prev, userMessage]); 
    setInput(''); 
    setUploadedFile(null); // Réinitialiser après envoi
    setIsLoading(true);
    await saveMessage(convId, 'user', fullContent);
    await streamChat(userMessage, convId);
    await loadConversations(); 
    setIsLoading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Permet de re-sélectionner le même fichier
    event.target.value = '';

    // Bloquer les images (l’IA ne les analyse pas ici)
    if (file.type.startsWith('image/')) {
      toast({
        title: "Format non supporté",
        description: "Les images ne peuvent pas être analysées. Utilisez un PDF, un DOCX ou un fichier texte.",
        variant: "destructive",
      });
      return;
    }

    try {
      const ext = file.name.toLowerCase().split('.').pop();

      // PDF
      if (file.type === 'application/pdf' || ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const doc = await (pdfjs as any).getDocument({ data: arrayBuffer }).promise;

        let extracted = '';
        const maxPages = Math.min(doc.numPages ?? 1, 10);

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = (content.items || [])
            .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
            .join(' ');
          extracted += `\n\n--- Page ${pageNum} ---\n${pageText}`;
          if (extracted.length > 15000) break;
        }

        setUploadedFile({
          name: file.name,
          content: extracted.trim().slice(0, 15000),
          type: file.type,
        });

        toast({ title: '✅ PDF ajouté', description: file.name });
        return;
      }

      // DOCX
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = (result?.value || '').trim();

        setUploadedFile({
          name: file.name,
          content: text.slice(0, 15000),
          type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        toast({ title: '✅ DOCX ajouté', description: file.name });
        return;
      }

      // Texte (txt, md, etc.)
      const text = await file.text();
      setUploadedFile({
        name: file.name,
        content: text.substring(0, 15000),
        type: file.type || 'text/plain',
      });
      toast({ title: '✅ Fichier ajouté', description: file.name });
    } catch (error) {
      console.error('Erreur lecture fichier:', error);
      toast({ title: '❌ Erreur', description: "Impossible de lire le fichier", variant: 'destructive' });
    }
  };

  const newChat = useCallback(() => { setCurrentConversationId(null); setMessages([]); setShowSidebar(false); }, []);

  const LogoIcon = ({ className }: { className?: string }) => (
    <img src={logo3v} alt="Logo 3V" className={className} />
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b p-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}
            aria-label="Retour à l’accueil"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden"
            aria-label="Ouvrir la liste des conversations"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <div className="p-2 bg-primary rounded-lg">
            <LogoIcon className="w-5 h-5 object-contain" />
          </div>

          <div>
            <h1 className="font-semibold text-primary text-sm">Assistant Spirituel 3V</h1>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={newChat}>
          <Plus className="w-4 h-4 mr-1" />
          Nouveau
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`${showSidebar ? 'block' : 'hidden'} md:block w-56 border-r bg-muted/30 overflow-y-auto`}>
          <div className="p-2 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Conversations</p>
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer group ${
                  currentConversationId === c.id ? 'bg-primary/10' : 'hover:bg-muted'
                }`}
                onClick={() => loadMessages(c.id)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs truncate flex-1">{c.title || 'Sans titre'}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  aria-label="Supprimer la conversation"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="max-w-2xl mx-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <LogoIcon className="w-12 h-12 text-primary mx-auto mb-3 object-contain" />
                  <h3 className="font-semibold text-primary mb-1">Bienvenue !</h3>
                  <p className="text-muted-foreground text-sm">
                    Posez vos questions sur la Bible et la foi.
                  </p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="bg-primary rounded w-7 h-7 flex items-center justify-center p-1">
                      <LogoIcon className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div
                    className={`rounded-lg p-3 max-w-[80%] text-sm ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}

                    {/* Bouton voice pour les réponses de l'assistant */}
                    {m.role === 'assistant' && isSupported() && (
                      <Button
                        onClick={() => (isSpeaking ? stopSpeaking() : speak(m.content))}
                        variant="ghost"
                        size="sm"
                        className="mt-2 gap-1 h-6 text-xs"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            Arrêter
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            Lire
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="bg-secondary rounded w-7 h-7 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2">
                  <div className="bg-primary rounded w-7 h-7 flex items-center justify-center p-1">
                    <LogoIcon className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-3 bg-card">
            <div className="max-w-2xl mx-auto">
              {/* Affichage du fichier attaché */}
              {uploadedFile && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded text-sm">
                  <Paperclip className="w-4 h-4" />
                  <span className="flex-1 truncate">{uploadedFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              
              {/* Barre d'entrée */}
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.txt,.md,.docx"
                  onChange={handleFileSelect}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()}
                  className={uploadedFile ? 'bg-muted' : ''}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                
                {/* Boutons Voice */}
                {isSupported() && (
                  <>
                    {isListening ? (
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={stopListening}
                        title="Arrêter l'enregistrement"
                      >
                        <MicOff className="w-5 h-5" />
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={startListening}
                        title="Commencer l'enregistrement vocal"
                      >
                        <Mic className="w-5 h-5" />
                      </Button>
                    )}
                  </>
                )}
                
                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSend()} 
                  placeholder="Posez votre question... ou utilisez le microphone"
                  disabled={isLoading || isListening}
                  className="flex-1" 
                />
                <Button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                >
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
