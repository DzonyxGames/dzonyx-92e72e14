import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = ['YouTube', 'Twitter', 'Instagram', 'TikTok', 'Discord', 'Facebook', 'Twitch', 'Reddit', 'Other'];

const AdminSocials = () => {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');

  const { data: links } = useQuery({
    queryKey: ['admin-social-links'],
    queryFn: async () => {
      const { data } = await supabase.from('social_links').select('*').order('display_order', { ascending: true });
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const order = (links?.length || 0);
      const { error } = await supabase.from('social_links').insert({ platform, url, display_order: order });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      setPlatform('');
      setUrl('');
      toast.success('Social link added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('social_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-links'] });
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Social link deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !url) { toast.error('Platform and URL required'); return; }
    addMutation.mutate();
  };

  return (
    <div className="mt-4 space-y-6">
      <h2 className="text-xl font-bold text-foreground">Social Media Links</h2>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-full sm:w-[180px] bg-muted border-border">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="https://..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="bg-muted border-border flex-1"
          required
        />
        <Button type="submit" disabled={addMutation.isPending}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </form>

      <div className="space-y-3">
        {links?.map((link: any) => (
          <div key={link.id} className="bg-card p-4 rounded-lg horror-border flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-sm font-medium text-foreground capitalize">{link.platform}</span>
              <p className="text-xs text-muted-foreground truncate">{link.url}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(link.id)} className="text-destructive flex-shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {(!links || links.length === 0) && <p className="text-muted-foreground text-center py-8">No social links added yet</p>}
      </div>
    </div>
  );
};

export default AdminSocials;
