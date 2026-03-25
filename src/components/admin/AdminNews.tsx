import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface NewsForm {
  title: string;
  content: string;
  media_type: 'video' | 'image' | 'text';
  media_url: string;
  download_url: string;
  is_public: boolean;
}

const emptyForm: NewsForm = { title: '', content: '', media_type: 'text', media_url: '', download_url: '', is_public: true };

const AdminNews = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsForm>(emptyForm);
  const [newsFile, setNewsFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { data: news } = useQuery({
    queryKey: ['admin-news'],
    queryFn: async () => {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let downloadUrl: string | null = form.download_url || null;

      if (newsFile) {
        setUploadingFile(true);
        try {
          const extension = newsFile.name.split('.').pop() || 'bin';
          const filePath = `news/${crypto.randomUUID()}.${extension}`;
          const { error: uploadError } = await supabase.storage.from('downloads').upload(filePath, newsFile);
          if (uploadError) throw uploadError;
          const { data: fileData } = supabase.storage.from('downloads').getPublicUrl(filePath);
          downloadUrl = fileData.publicUrl;
        } finally {
          setUploadingFile(false);
        }
      }

      const payload = {
        title: form.title,
        content: form.content || null,
        media_type: form.media_type,
        media_url: form.media_type !== 'text' ? (form.media_url || null) : null,
        download_url: downloadUrl,
        is_public: form.is_public,
      };
      if (editId) {
        const { error } = await supabase.from('news').update(payload as any).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news').insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      setDialogOpen(false);
      setEditId(null);
      setForm(emptyForm);
      setNewsFile(null);
      toast.success(editId ? 'News updated!' : 'News posted!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-news'] });
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast.success('News deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      title: item.title,
      content: item.content || '',
      media_type: item.media_type || 'text',
      media_url: item.media_url || '',
      download_url: (item as any).download_url || '',
      is_public: item.is_public,
    });
    setDialogOpen(true);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setNewsFile(null); setDialogOpen(true); };
  const updateField = (field: keyof NewsForm, value: any) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Manage News</h2>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add News</Button>
      </div>

      <div className="space-y-3">
        {news?.map(item => (
          <div key={item.id} className="bg-card p-4 rounded-lg horror-border flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground truncate block">{item.title}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(item.created_at), 'MMM dd, yyyy')} · {item.media_type}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
        {(!news || news.length === 0) && <p className="text-muted-foreground text-center py-8">No news yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit News' : 'Add News'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Title" value={form.title} onChange={e => updateField('title', e.target.value)} className="bg-muted" />
            <Textarea placeholder="Content / Message" value={form.content} onChange={e => updateField('content', e.target.value)} className="bg-muted min-h-[120px]" />
            
            <div>
              <label className="text-sm text-foreground mb-1 block">Media Type</label>
              <Select value={form.media_type} onValueChange={v => updateField('media_type', v)}>
                <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Only</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.media_type !== 'text' && (
              <Input
                placeholder={form.media_type === 'video' ? 'Video URL (YouTube embed link)' : 'Image URL'}
                value={form.media_url}
                onChange={e => updateField('media_url', e.target.value)}
                className="bg-muted"
              />
            )}

            <Input
              type="file"
              onChange={(e) => setNewsFile(e.target.files?.[0] || null)}
              className="bg-muted"
            />
            <Input
              placeholder="Or paste download URL (optional)"
              value={form.download_url}
              onChange={e => updateField('download_url', e.target.value)}
              className="bg-muted"
            />
            {form.download_url && (
              <a href={form.download_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                Current download file
              </a>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={form.is_public} onCheckedChange={v => updateField('is_public', v)} />
              <span className="text-sm text-foreground">{form.is_public ? 'Public' : 'Private'}</span>
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || saveMutation.isPending || uploadingFile} className="w-full">
              {saveMutation.isPending || uploadingFile ? 'Saving...' : editId ? 'Update News' : 'Post News'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNews;
