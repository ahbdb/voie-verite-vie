import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Search, Book, Heart, Users, Calendar, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  const faqCategories = [
    { id: 'general', name: 'Général', icon: HelpCircle, color: 'bg-blue-500/10 text-blue-700' },
    { id: 'spiritualite', name: 'Spiritualité', icon: Heart, color: 'bg-red-500/10 text-red-700' },
    { id: 'activites', name: 'Activités', icon: Calendar, color: 'bg-green-500/10 text-green-700' },
    { id: 'lecture', name: 'Lecture biblique', icon: Book, color: 'bg-purple-500/10 text-purple-700' },
    { id: 'communaute', name: 'Communauté', icon: Users, color: 'bg-orange-500/10 text-orange-700' },
    { id: 'contact', name: 'Contact', icon: HelpCircle, color: 'bg-cyan-500/10 text-cyan-700' }
  ];

  useEffect(() => {
    loadFAQ();
  }, []);

  const loadFAQ = async () => {
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    
    if (data) setFaqData(data);
    setLoading(false);
  };

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFAQ = faqCategories.reduce((acc, category) => {
    acc[category.id] = filteredFAQ.filter(item => item.category === category.id);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-8 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-playfair font-bold text-primary mb-4">
                Questions Fréquentes
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                Trouvez des réponses à vos questions spirituelles et pratiques
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher une question..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-border/50"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {faqCategories.map((category) => {
                const categoryFAQs = groupedFAQ[category.id] || [];
                const Icon = category.icon;
                
                if (categoryFAQs.length === 0) return null;

                return (
                  <div key={category.id} className="mb-12">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-peace rounded-full w-12 h-12 flex items-center justify-center mr-4 shadow-glow">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary">
                        {category.name}
                      </h2>
                      <Badge className={`ml-3 ${category.color}`}>
                        {categoryFAQs.length} questions
                      </Badge>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                      {categoryFAQs.map((faq) => (
                        <AccordionItem 
                          key={faq.id} 
                          value={`item-${faq.id}`}
                          className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 px-6 shadow-subtle hover:shadow-elegant transition-all duration-300"
                        >
                          <AccordionTrigger className="text-left hover:no-underline py-6">
                            <span className="font-playfair font-semibold text-primary pr-4">
                              {faq.question}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-6">
                            <div className="text-muted-foreground leading-relaxed">
                              <p className="whitespace-pre-wrap">{faq.answer}</p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}

              {filteredFAQ.length === 0 && (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-playfair font-semibold text-primary mb-2">
                    Aucune question trouvée
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Essayez avec d'autres mots-clés ou consultez toutes nos questions
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-primary hover:underline"
                  >
                    Voir toutes les questions
                  </button>
                </div>
              )}

              {/* Contact for more questions */}
              <div className="mt-16 text-center">
                <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 shadow-elegant border border-border/50">
                  <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-playfair font-semibold text-primary mb-3">
                    Vous ne trouvez pas votre réponse ?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Notre équipe est là pour vous accompagner dans votre cheminement spirituel
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center px-6 py-3 bg-gradient-peace text-white rounded-lg hover:shadow-glow transition-all duration-300 divine-glow"
                  >
                    Nous contacter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default FAQ;