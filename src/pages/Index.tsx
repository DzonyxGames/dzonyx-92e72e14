import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2, Newspaper, Heart, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { data: featuredGames } = useQuery({
    queryKey: ['featured-games'],
    queryFn: async () => {
      const { data } = await supabase.from('games').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(3);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.15)_0%,_transparent_70%)]" />
        <div className="relative z-10 text-center animate-fade-in">
          <h1
            className="text-7xl sm:text-9xl font-bold tracking-widest horror-glow glitch-text animate-flicker mb-6"
            data-text="DZONYX"
            style={{ fontFamily: 'Creepster, cursive' }}
          >
            DZONYX
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto mb-8">
            We create horror experiences.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/games"><Button size="lg" className="horror-border hover-horror">Explore Games</Button></Link>
            <Link to="/donations"><Button size="lg" variant="outline" className="horror-border hover-horror">Support Us</Button></Link>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      {featuredGames && featuredGames.length > 0 && (
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>
            <Gamepad2 className="inline w-8 h-8 mr-2" /> Featured Games
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredGames.map((game, i) => (
              <div key={game.id} className="bg-card rounded-lg overflow-hidden horror-border hover-horror transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
                {game.image_url ? (
                  <img src={game.image_url} alt={game.title} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <Gamepad2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground">{game.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{game.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {game.is_free ? (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">FREE</span>
                    ) : (
                      <span className="text-xs bg-accent/20 text-accent-foreground px-2 py-1 rounded">€{game.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/games"><Button variant="outline" className="horror-border hover-horror">View All Games</Button></Link>
          </div>
        </section>
      )}

      {/* About */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <h2 className="text-3xl font-bold mb-6 horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>About Us</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Dzonyx is a horror game studio focused on immersive and disturbing experiences.
            We push the boundaries of fear, creating worlds that stay with you long after the screen goes dark.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: Newspaper, title: 'Latest News', desc: 'Stay updated with our releases', to: '/news' },
            { icon: Heart, title: 'Support Us', desc: 'Help us create more horror', to: '/donations' },
            { icon: MessageSquare, title: 'Socials', desc: 'Follow us on social media', to: '/socials' },
          ].map((item, i) => (
            <Link key={i} to={item.to} className="bg-card p-6 rounded-lg horror-border hover-horror transition-all duration-300 text-center group">
              <item.icon className="w-10 h-10 mx-auto mb-3 text-primary group-hover:animate-glitch" />
              <h3 className="font-bold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground space-y-2">
        <p>© {new Date().getFullYear()} DZONYX. All rights reserved.</p>
        <p>Contact: <a href="mailto:support@dzonyx.com" className="text-primary hover:underline">support@dzonyx.com</a></p>
      </footer>
    </div>
  );
};

export default Index;
