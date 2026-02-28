import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Send, MessageCircle, Heart, HelpCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import DonationModal from '@/components/DonationModal';

const WHATSAPP_NUMBER = '+393513430349';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\+/g, '')}`;

const contactFormSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: 'Le nom doit contenir au moins 2 caractères' })
    .max(100, { message: 'Le nom ne peut pas dépasser 100 caractères' }),
  email: z.string()
    .trim()
    .email({ message: 'Adresse email invalide' })
    .max(255, { message: "L'email ne peut pas dépasser 255 caractères" }),
  type: z.enum(['question', 'adhesion', 'activite', 'don', 'temoignage', 'autre'], {
    required_error: 'Veuillez sélectionner un type de demande'
  }),
  subject: z.string()
    .trim()
    .max(200, { message: 'Le sujet ne peut pas dépasser 200 caractères' })
    .optional(),
  message: z.string()
    .trim()
    .min(10, { message: 'Le message doit contenir au moins 10 caractères' })
    .max(2000, { message: 'Le message ne peut pas dépasser 2000 caractères' })
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const Contact = () => {
  const { toast } = useToast();
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      type: undefined,
      message: ''
    }
  });

  const contactTypes = [
    { value: 'question', label: 'Question générale', icon: HelpCircle },
    { value: 'adhesion', label: "Adhésion à l'association", icon: Heart },
    { value: 'activite', label: 'Information sur les activités', icon: MessageCircle },
    { value: 'don', label: 'Don ou soutien financier', icon: Heart },
    { value: 'temoignage', label: 'Partage de témoignage', icon: MessageCircle },
    { value: 'autre', label: 'Autre', icon: Mail }
  ];

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('submit-contact', {
        body: data
      });

      if (error) throw error;

      toast({
        title: "Message envoyé avec succès !",
        description: result.message || "Nous vous répondrons dans les plus brefs délais.",
      });

      form.reset();
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Erreur lors de l'envoi",
        description: "Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    }
  };

  const openWhatsApp = () => {
    window.open(WHATSAPP_URL, '_blank');
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-8 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-primary mb-4">
                Contactez-nous
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Nous sommes là pour vous accompagner dans votre cheminement spirituel
              </p>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Contact Form */}
                <div>
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-elegant">
                    <CardHeader>
                      <CardTitle className="text-2xl font-playfair text-primary">
                        Envoyez-nous un message
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nom complet *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="bg-background/50"
                                      placeholder="Votre nom"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email *</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="email"
                                      className="bg-background/50"
                                      placeholder="votre@email.com"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type de demande *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-background/50">
                                      <SelectValue placeholder="Sélectionnez le type de votre demande" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {contactTypes.map((type) => {
                                      const Icon = type.icon;
                                      return (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center space-x-2">
                                            <Icon className="w-4 h-4" />
                                            <span>{type.label}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sujet</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-background/50"
                                    placeholder="Résumé de votre message"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={5}
                                    className="bg-background/50 resize-none"
                                    placeholder="Décrivez votre demande, vos questions ou partagez votre témoignage..."
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                            className="w-full"
                          >
                            {form.formState.isSubmitting ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Envoi en cours...</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Send className="w-4 h-4" />
                                <span>Envoyer le message</span>
                              </div>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-xl font-playfair text-primary">
                        Informations de contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary mb-1">Email</h3>
                          <a href="mailto:voieveritevie3v@gmail.com" className="text-muted-foreground hover:text-primary">
                            voieveritevie3v@gmail.com
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary mb-1">WhatsApp</h3>
                          <button 
                            onClick={openWhatsApp}
                            className="text-muted-foreground hover:text-primary"
                          >
                            +39 351 343 0349
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary mb-1">Adresse</h3>
                          <p className="text-muted-foreground">
                            Douala, Cameroun
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-primary mb-1">Horaires</h3>
                          <p className="text-muted-foreground">
                            Tous les jours : 7h00 - 22h00
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-xl font-playfair text-primary">
                        Contactez-nous sur WhatsApp
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Pour une réponse plus rapide, contactez-nous directement sur WhatsApp.
                      </p>
                      <Button onClick={openWhatsApp} variant="outline" className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Ouvrir WhatsApp
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-xl font-playfair text-primary">
                        Faire un don
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        Soutenez notre mission spirituelle et nos actions communautaires.
                      </p>
                      <Button className="w-full" onClick={() => setDonationModalOpen(true)}>
                        <Heart className="w-4 h-4 mr-2" />
                        Faire un don
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <DonationModal open={donationModalOpen} onOpenChange={setDonationModalOpen} />
    </div>
  );
};

export default Contact;
