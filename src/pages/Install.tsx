import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const installSteps = [
    {
      icon: Smartphone,
      title: 'Sur votre téléphone',
      description: 'Ouvrez ce site dans Safari (iPhone) ou Chrome (Android)',
      platforms: ['iOS', 'Android']
    },
    {
      icon: Download,
      title: 'Ajouter à l\'écran d\'accueil',
      description: 'iPhone : Appuyez sur le bouton Partager puis "Sur l\'écran d\'accueil". Android : Menu → "Installer l\'application"',
      platforms: ['iOS', 'Android']
    },
    {
      icon: CheckCircle,
      title: 'Profitez de l\'application',
      description: 'Lancez l\'app depuis votre écran d\'accueil comme une application native',
      platforms: ['iOS', 'Android']
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <Download className="w-16 h-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl md:text-6xl font-playfair font-bold text-primary mb-6">
                Installez l'application
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Accédez à Voie, Vérité, Vie depuis votre écran d'accueil
              </p>
            </div>
          </div>
        </section>

        {/* Installation Status */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {isInstalled ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-4">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                      <div>
                        <h3 className="text-xl font-semibold text-green-900">
                          Application installée !
                        </h3>
                        <p className="text-green-700">
                          Vous pouvez maintenant accéder à l'app depuis votre écran d'accueil
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isInstallable ? (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-primary mb-4">
                        Installation disponible
                      </h3>
                      <Button 
                        onClick={handleInstallClick}
                        size="lg"
                        className="divine-glow"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Installer maintenant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Suivez les instructions ci-dessous pour installer l'application sur votre appareil
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Installation Steps */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-playfair font-bold text-primary text-center mb-12">
                Comment installer l'application
              </h2>
              
              <div className="space-y-6">
                {installSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
                      <CardHeader>
                        <div className="flex items-start space-x-4">
                          <div className="bg-gradient-peace rounded-full w-12 h-12 flex items-center justify-center shadow-glow flex-shrink-0">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                Étape {index + 1}
                              </span>
                            </div>
                            <CardTitle className="text-xl font-playfair text-primary">
                              {step.title}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground pl-16">
                          {step.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-playfair font-bold text-primary text-center mb-12">
                Pourquoi installer l'application ?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Accès rapide',
                    description: 'Lancez l\'app directement depuis votre écran d\'accueil'
                  },
                  {
                    title: 'Fonctionnement hors-ligne',
                    description: 'Consultez le contenu même sans connexion internet'
                  },
                  {
                    title: 'Notifications',
                    description: 'Recevez des rappels pour vos lectures quotidiennes'
                  }
                ].map((benefit, index) => (
                  <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 text-center">
                    <CardContent className="pt-6">
                      <CheckCircle className="w-10 h-10 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-primary mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-gradient-subtle">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-playfair font-bold text-primary mb-6">
                Prêt à commencer ?
              </h2>
              <p className="text-muted-foreground mb-8">
                Installez l'application et rejoignez notre communauté spirituelle
              </p>
              <Button asChild size="lg" className="divine-glow">
                <Link to="/">
                  Retour à l'accueil
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Install;
