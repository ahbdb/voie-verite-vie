import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';

interface Neuvaine {
  id: string;
  title: string;
  saint_name: string;
  description: string | null;
  pdf_url: string | null;
  total_days: number;
  is_published: boolean;
}

const Neuvaines = () => {
  const [neuvaines, setNeuvaines] = useState<Neuvaine[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNeuvaines = async () => {
      const { data, error } = await supabase
        .from('neuvaines')
        .select('id, title, saint_name, description, pdf_url, total_days, is_published')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!error && data) setNeuvaines(data);
      setLoading(false);
    };
    fetchNeuvaines();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-background">
      <Helmet>
        <title>Neuvaines — Voie Vérité Vie</title>
        <meta name="description" content="Parcourez nos neuvaines de prière jour par jour." />
      </Helmet>
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-amber-600" />
            <h1 className="text-3xl md:text-4xl font-bold font-['Playfair_Display'] text-foreground">
              Neuvaines
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Neuf jours de prière, de méditation et d'intercession. Choisissez une neuvaine et laissez-vous guider jour après jour.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : neuvaines.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Aucune neuvaine disponible pour le moment.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {neuvaines.map((n) => (
              <Card
                key={n.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-amber-200/50 hover:border-amber-400/70 overflow-hidden"
                onClick={() => navigate(`/neuvaines/${n.id}`)}
              >
                <div className="h-2 bg-gradient-to-r from-amber-500 to-amber-600" />
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-3 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {n.total_days} jours
                  </Badge>
                  <h2 className="text-xl font-bold font-['Playfair_Display'] text-foreground mb-2 group-hover:text-amber-700 transition-colors">
                    {n.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {n.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 p-0 gap-1">
                      Commencer <ChevronRight className="h-4 w-4" />
                    </Button>
                    {n.pdf_url && (
                      <a
                        href={n.pdf_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-amber-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Neuvaines;
