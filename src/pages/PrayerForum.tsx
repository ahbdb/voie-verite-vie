import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Send, User, Calendar, MessageCircle, HandHeart, Plus, Clock, TrendingUp, Flame } from 'lucide-react';

interface PrayerRequest {
  id: string;
  title: string;
  content: string;
  is_anonymous: boolean;
  prayer_count: number;
  created_at: string;
  user_id: string | null;
  profiles?: { full_name: string | null } | null;
  user_role?: string | null;
}

interface PrayerResponse {
  id: string;
  content: string;
  created_at: string;
  user_id: string | null;
  profiles?: { full_name: string | null } | null;
  user_role?: string | null;
}

const PrayerForum = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [responses, setResponses] = useState<PrayerResponse[]>([]);
  const [responseContent, setResponseContent] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPrayerRequests();
  }, []);

  const fetchPrayerRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          let profiles = null;
          let user_role = null;
          
          if (!request.is_anonymous && request.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', request.user_id)
              .maybeSingle();
            profiles = profile;
            
            // Fetch user role
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', request.user_id)
              .maybeSingle();
            user_role = roleData?.role || null;
          }
          
          return { ...request, profiles, user_role };
        })
      );
      
      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error fetching prayer requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('prayer_responses')
        .select('*')
        .eq('prayer_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const responsesWithProfiles = await Promise.all(
        (data || []).map(async (response) => {
          let profile = null;
          let user_role = null;
          
          if (response.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', response.user_id)
              .maybeSingle();
            profile = profileData;
            
            // Fetch user role
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', response.user_id)
              .maybeSingle();
            user_role = roleData?.role || null;
          }
          
          return { ...response, profiles: profile, user_role };
        })
      );

      setResponses(responsesWithProfiles);
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour soumettre une demande de prière.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('prayer_requests')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          is_anonymous: isAnonymous
        });

      if (error) throw error;

      toast({
        title: "Demande soumise",
        description: "Votre intention de prière a été partagée avec la communauté.",
      });

      setTitle('');
      setContent('');
      setIsAnonymous(false);
      fetchPrayerRequests();
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      toast({
        title: "Erreur",
        description: "Impossible de soumettre votre demande.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (requestId: string, currentCount: number) => {
    if (prayedFor.has(requestId)) {
      toast({
        title: "Déjà prié",
        description: "Vous avez déjà prié pour cette intention.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('prayer_requests')
        .update({ prayer_count: currentCount + 1 })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => 
        prev.map(r => 
          r.id === requestId 
            ? { ...r, prayer_count: r.prayer_count + 1 }
            : r
        )
      );

      setPrayedFor(prev => new Set([...prev, requestId]));

      toast({
        title: "🙏 Merci pour votre prière",
        description: "Que Dieu bénisse cette intention.",
      });
    } catch (error) {
      console.error('Error updating prayer count:', error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour répondre.",
        variant: "destructive",
      });
      return;
    }

    if (!responseContent.trim() || !selectedRequest) return;

    setSubmittingResponse(true);
    try {
      const { error } = await supabase
        .from('prayer_responses')
        .insert({
          prayer_request_id: selectedRequest.id,
          user_id: user.id,
          content: responseContent.trim()
        });

      if (error) throw error;

      toast({
        title: "Réponse envoyée",
        description: "Votre message d'encouragement a été partagé.",
      });

      setResponseContent('');
      fetchResponses(selectedRequest.id);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const openRequestDetail = (request: PrayerRequest) => {
    setSelectedRequest(request);
    fetchResponses(request.id);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getAuthorDisplay = (request: PrayerRequest) => {
    if (request.is_anonymous) return 'Anonyme';
    if (request.user_role === 'admin_principal') return '👑 Admin Principal';
    return request.profiles?.full_name || 'Membre';
  };

  const getResponseAuthorDisplay = (response: PrayerResponse) => {
    if (response.user_role === 'admin_principal') return '👑 Admin Principal';
    return response.profiles?.full_name || 'Membre Anonyme';
  };

  // Sort requests
  const recentRequests = [...requests].slice(0, 10);
  const mostPrayed = [...requests].sort((a, b) => b.prayer_count - a.prayer_count).slice(0, 10);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        <section className="py-8 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-primary mb-4">
                Forum de Prière
              </h1>
              <p className="text-lg text-muted-foreground">
                Partagez vos intentions et priez ensemble en communauté. « Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux. » (Matthieu 18:20)
              </p>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Form & Stats */}
              <div className="lg:col-span-1 space-y-6">
                {/* Submit Prayer Request */}
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-playfair text-primary flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Nouvelle intention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        placeholder="Titre de votre intention"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={100}
                      />
                      <Textarea
                        placeholder="Décrivez votre intention de prière..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        maxLength={1000}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="anonymous"
                          checked={isAnonymous}
                          onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                        />
                        <label htmlFor="anonymous" className="text-sm text-muted-foreground">
                          Anonyme
                        </label>
                      </div>
                      <Button type="submit" disabled={submitting} className="w-full" size="sm">
                        {submitting ? 'Envoi...' : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Partager
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Stats */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{requests.length}</div>
                        <div className="text-xs text-muted-foreground">Intentions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {requests.reduce((sum, r) => sum + r.prayer_count, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Prières</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Prayer Requests */}
              <div className="lg:col-span-2">
                <Tabs defaultValue="recent" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="recent" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Récentes
                    </TabsTrigger>
                    <TabsTrigger value="popular" className="flex items-center gap-2">
                      <Flame className="w-4 h-4" />
                      Les plus priées
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="recent">
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                      ) : recentRequests.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <HandHeart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune intention de prière pour le moment.</p>
                            <p className="text-sm">Soyez le premier à partager une intention.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        recentRequests.map((request) => (
                          <PrayerRequestCard 
                            key={request.id}
                            request={request}
                            onPray={handlePray}
                            onViewDetails={() => openRequestDetail(request)}
                            isPrayed={prayedFor.has(request.id)}
                            getTimeAgo={getTimeAgo}
                            getAuthorDisplay={getAuthorDisplay}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="popular">
                    <div className="space-y-4">
                      {mostPrayed.length === 0 ? (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune intention populaire.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        mostPrayed.map((request) => (
                          <PrayerRequestCard 
                            key={request.id}
                            request={request}
                            onPray={handlePray}
                            onViewDetails={() => openRequestDetail(request)}
                            isPrayed={prayedFor.has(request.id)}
                            getTimeAgo={getTimeAgo}
                            getAuthorDisplay={getAuthorDisplay}
                          />
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </section>

        {/* Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
            <div className="max-w-2xl w-full max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-xl text-primary">{selectedRequest.title}</h3>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {selectedRequest.prayer_count}
                  </Badge>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequest.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {getAuthorDisplay(selectedRequest)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="p-6 max-h-[40vh] overflow-y-auto space-y-4">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Messages d'encouragement ({responses.length})
                </h4>
                
                {responses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Soyez le premier à laisser un message d'encouragement.
                  </p>
                ) : (
                  responses.map((response) => (
                    <div key={response.id} className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">{response.content}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <User className="w-3 h-3" />
                        {getResponseAuthorDisplay(response)}
                        <span>•</span>
                        {new Date(response.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Laissez un message d'encouragement..."
                    value={responseContent}
                    onChange={(e) => setResponseContent(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSubmitResponse} 
                    disabled={submittingResponse || !responseContent.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Prayer Request Card Component
const PrayerRequestCard = ({ 
  request, 
  onPray, 
  onViewDetails,
  isPrayed,
  getTimeAgo,
  getAuthorDisplay
}: { 
  request: PrayerRequest; 
  onPray: (id: string, count: number) => void;
  onViewDetails: () => void;
  isPrayed: boolean;
  getTimeAgo: (date: string) => string;
  getAuthorDisplay: (request: PrayerRequest) => string;
}) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewDetails}>
    <CardContent className="pt-6">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg text-primary line-clamp-1">{request.title}</h3>
        <Badge variant="secondary" className="flex items-center gap-1 ml-2 flex-shrink-0">
          <Heart className={`w-3 h-3 ${request.prayer_count > 10 ? 'text-red-500' : ''}`} />
          {request.prayer_count}
        </Badge>
      </div>
      <p className="text-muted-foreground mb-4 line-clamp-2">
        {request.content}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {getAuthorDisplay(request)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {getTimeAgo(request.created_at)}
          </span>
        </div>
        <Button
          variant={isPrayed ? "secondary" : "outline"}
          size="sm"
          onClick={(e) => { e.stopPropagation(); onPray(request.id, request.prayer_count); }}
          disabled={isPrayed}
        >
          <Heart className={`w-4 h-4 mr-1 ${isPrayed ? 'fill-current' : ''}`} />
          {isPrayed ? 'Prié' : 'Je prie'}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default PrayerForum;
