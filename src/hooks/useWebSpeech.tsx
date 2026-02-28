import { useState, useCallback, useRef, useEffect } from 'react';

interface UseWebSpeechOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  timeout?: number; // ms avant arrêt auto du micro
  language?: string;
}

export const useWebSpeech = (options: UseWebSpeechOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const optionsRef = useRef(options);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mettre à jour les options sans recréer le hook
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Cleanup sur unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Déjà arrêté
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    try {
      // @ts-ignore - Web Speech API n'est pas dans les types par défaut
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        optionsRef.current.onError?.('Web Speech API non supportée sur ce navigateur');
        return;
      }

      // Arrêter la reconnaissance précédente si elle est active
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorer
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = optionsRef.current.language || 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';
      let hasStarted = false;

      recognition.onstart = () => {
        hasStarted = true;
        setIsListening(true);
        finalTranscript = '';
        
        // Configurer un timeout pour arrêter automatiquement
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const timeoutMs = optionsRef.current.timeout || 10000; // 10s par défaut
        
        timeoutRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch (e) {
            // Déjà arrêté
          }
        }, timeoutMs);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Envoyer le résultat final même s'il est partiel
        if (finalTranscript.trim()) {
          optionsRef.current.onResult?.(finalTranscript.trim());
        } else if (hasStarted) {
          optionsRef.current.onError?.('Aucun son détecté. Veuillez réessayer.');
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        const errorMessages: { [key: string]: string } = {
          'no-speech': 'Pas de son détecté. Veuillez parler plus fort.',
          'audio-capture': 'Erreur du microphone. Vérifiez les permissions.',
          'network': 'Erreur réseau. Vérifiez votre connexion.',
          'aborted': 'Reconnaissance vocale interrompue.',
          'service-not-allowed': 'Service non autorisé par le navigateur.',
          'bad-grammar': 'Erreur de grammaire vocale.',
          'unknown': 'Erreur inconnue.'
        };
        
        const errorMsg = errorMessages[event.error] || `Erreur: ${event.error}`;
        optionsRef.current.onError?.(errorMsg);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      optionsRef.current.onError?.(`Erreur d'initialisation: ${String(error)}`);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Déjà arrêté
      }
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    try {
      // Vérifier si le navigateur supporte l'API
      if (!('speechSynthesis' in window)) {
        optionsRef.current.onError?.('Text-to-Speech non supportée');
        return;
      }

      // Arrêter la parole précédente si elle est en cours
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = optionsRef.current.language || 'fr-FR';
      utterance.rate = 0.95; // Légèrement plus lent pour clarté
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event: any) => {
        console.error('Speech synthesis error:', event.error);
        optionsRef.current.onError?.(`Erreur synthèse vocale: ${event.error}`);
        setIsSpeaking(false);
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      optionsRef.current.onError?.(`Erreur synthèse: ${String(error)}`);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    try {
      speechSynthesis.cancel();
    } catch (e) {
      // Déjà arrêté
    }
    setIsSpeaking(false);
  }, []);

  const isSupported = useCallback(() => {
    return (
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
      'speechSynthesis' in window
    );
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSupported
  };
};
