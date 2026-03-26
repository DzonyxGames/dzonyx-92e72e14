import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Share2, ExternalLink } from 'lucide-react';

const platformIcons: Record<string, string> = {
  youtube: '🎬',
  twitter: '𝕏',
  x: '𝕏',
  instagram: '📸',
  tiktok: '🎵',
  discord: '💬',
  facebook: '📘',
  twitch: '🟣',
  reddit: '🔴',
};

const Socials = () => {
  const { data: links } = useQuery({
    queryKey: ['social-links'],
    queryFn: async () => {
      const { data } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen pt-24 px-4 max-w-2xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-center mb-4 horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>
        <Share2 className="inline w-10 h-10 mr-2" /> Follow Us
      </h1>
      <p className="text-center text-muted-foreground mb-12">Stay connected through our social media</p>

      <div className="space-y-4">
        {links?.map((link: any) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-card p-5 rounded-lg horror-border hover-horror transition-all duration-300 group"
          >
            <span className="text-3xl">{platformIcons[link.platform.toLowerCase()] || '🌐'}</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground capitalize">{link.platform}</h3>
              <p className="text-sm text-muted-foreground truncate">{link.url}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        ))}
        {(!links || links.length === 0) && (
          <p className="text-muted-foreground text-center py-12">No social links yet. Check back soon!</p>
        )}
      </div>

      <div className="mt-16 text-center border-t border-border pt-8">
        <p className="text-muted-foreground text-sm">Contact us</p>
        <a href="mailto:support@dzonyx.com" className="text-primary hover:underline text-lg font-medium">
          support@dzonyx.com
        </a>
      </div>
    </div>
  );
};

export default Socials;
