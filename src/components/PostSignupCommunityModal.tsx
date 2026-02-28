import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbB0GplLY6d6hkP5930J";
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/FfvCe9nHwpj5OYoDZBfGER";
const YOUTUBE_CHANNEL_URL = "https://youtube.com/@voie-verite-vie?si=qD8LmbyREJdQm1Db";
const WHATSAPP_CONTACT_URL = "https://wa.me/393513430349";

export default function PostSignupCommunityModal({
  open,
  onOpenChange,
  fullName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fullName?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bienvenue{fullName ? ` ${fullName}` : ""} !</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pour des raisons de sécurité, on ne peut pas vous ajouter "automatiquement" à WhatsApp/YouTube.
            Par contre, voici les accès officiels en un clic.
          </p>

          <div className="grid gap-2">
            <Button asChild className="w-full">
              <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noreferrer">
                Rejoindre la chaîne WhatsApp
              </a>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">
                Rejoindre le groupe WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noreferrer">
                Aller sur la chaîne YouTube
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <a href={WHATSAPP_CONTACT_URL} target="_blank" rel="noreferrer">
                Contacter le fondateur sur WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
