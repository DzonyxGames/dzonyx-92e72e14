import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, AlertTriangle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const BANK_ACCOUNT = 'RS35170001089853000194';

const Donations = () => {
  const [copied, setCopied] = useState(false);

  const copyAccount = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT);
    setCopied(true);
    toast.success('Bank account copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 px-4 max-w-2xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-center mb-4 horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>
        <Heart className="inline w-10 h-10 mr-2" /> Support Dzonyx
      </h1>
      <p className="text-center text-muted-foreground mb-12">Help us create more horror experiences</p>

      <div className="bg-card rounded-lg p-8 horror-border space-y-8">
        <div className="bg-muted rounded-lg p-6 space-y-3">
          <h3 className="font-medium text-foreground">Bank Transfer</h3>
          <div className="flex items-center gap-2">
            <code className="bg-background px-3 py-2 rounded text-sm text-foreground flex-1 font-mono">
              {BANK_ACCOUNT}
            </code>
            <Button variant="outline" size="icon" onClick={copyAccount} className="horror-border">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">All donations are final. No refunds.</p>
            <p className="text-xs text-muted-foreground mt-1">
              By donating, you agree that the contribution is voluntary and non-refundable.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground text-sm">Questions? Contact us at</p>
        <a href="mailto:support@dzonyx.com" className="text-primary hover:underline font-medium">
          support@dzonyx.com
        </a>
      </div>
    </div>
  );
};

export default Donations;
