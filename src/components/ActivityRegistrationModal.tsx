import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { countries, getCountriesSorted, findCountryByDialCode, type Country } from '@/data/countries';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  activityId?: string;
}

const ActivityRegistrationModal = ({ isOpen, onClose, activityName }: ActivityRegistrationModalProps) => {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    findCountryByDialCode('+237') || countries[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedCountries = useMemo(() => getCountriesSorted(), []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return sortedCountries;
    const query = searchQuery.toLowerCase();
    return sortedCountries.filter(
      c => c.name.toLowerCase().includes(query) || 
           c.dialCode.includes(query) ||
           c.code.toLowerCase().includes(query)
    );
  }, [sortedCountries, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Vous devez être connecté pour vous inscrire');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Veuillez entrer votre numéro de téléphone');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('activity_registrations')
        .insert({
          user_id: user.id,
          activity_name: activityName,
          phone_country_code: selectedCountry.dialCode,
          phone_number: phoneNumber.trim()
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Vous êtes déjà inscrit à cette activité');
        } else {
          throw error;
        }
      } else {
        toast.success(`Inscription réussie à "${activityName}" !`);
        onClose();
        setPhoneNumber('');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>S'inscrire à l'activité</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-muted-foreground">
            Vous vous inscrivez à : <strong className="text-primary">{activityName}</strong>
          </p>
        </div>

        {!user ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Vous devez être connecté pour vous inscrire à une activité.
            </p>
            <Button onClick={() => window.location.href = '/auth'}>
              Se connecter
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="flex gap-2 mt-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-[140px] justify-between px-2"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="text-sm">{selectedCountry.dialCode}</span>
                      </span>
                      <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Rechercher un pays..." 
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                        <CommandGroup>
                          {filteredCountries.map((country) => (
                            <CommandItem
                              key={country.code}
                              value={country.code}
                              onSelect={() => {
                                setSelectedCountry(country);
                                setOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xl">{country.flag}</span>
                              <span className="flex-1 truncate">{country.name}</span>
                              <span className="text-muted-foreground text-sm">{country.dialCode}</span>
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedCountry.code === country.code ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="6XXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nous vous contacterons sur ce numéro pour les détails de l'activité
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Inscription...' : 'Confirmer l\'inscription'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityRegistrationModal;
