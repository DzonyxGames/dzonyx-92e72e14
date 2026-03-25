import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const News = () => {
  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen pt-24 px-4 max-w-4xl mx-auto pb-20">
      <h1 className="text-4xl font-bold text-center mb-12 horror-glow" style={{ fontFamily: 'Creepster, cursive' }}>
        <Newspaper className="inline w-10 h-10 mr-2" /> News
      </h1>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading...</div>
      ) : news && news.length > 0 ? (
        <div className="space-y-8">
          {news.map((item, i) => (
            <article key={item.id} className="bg-card rounded-lg overflow-hidden horror-border hover-horror transition-all animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              {item.media_type === 'image' && item.media_url && (
                <img src={item.media_url} alt={item.title} className="w-full h-64 object-cover" />
              )}
              {item.media_type === 'video' && item.media_url && (
                <div className="aspect-video">
                  <iframe src={item.media_url} className="w-full h-full" allowFullScreen />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <time>{format(new Date(item.created_at), 'MMM dd, yyyy')}</time>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">{item.title}</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                {(item as any).download_url && (
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm" className="horror-border">
                      <a href={(item as any).download_url} target="_blank" rel="noopener noreferrer" download>
                        Download file
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-20">
          <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No news yet. Check back later!</p>
        </div>
      )}
    </div>
  );
};

export default News;
