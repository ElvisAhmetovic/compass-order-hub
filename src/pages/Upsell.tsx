import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Plus, Copy, Trash2, Languages, Loader2 } from 'lucide-react';
import { fetchUpsells, createUpsell, deleteUpsell, translateUpsellText, fetchCachedTranslation, saveCachedTranslation } from '@/services/upsellService';
import Sidebar from '@/components/dashboard/Sidebar';

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Czech', label: 'Czech' },
  { value: 'Swedish', label: 'Swedish' },
  { value: 'Norwegian', label: 'Norwegian' },
  { value: 'Danish', label: 'Danish' },
  { value: 'Bosnian', label: 'Bosnian' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Arabic', label: 'Arabic' },
];

const Upsell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Per-item translation state
  const [translations, setTranslations] = useState<Record<string, { text: string; lang: string; loading: boolean }>>({});

  const { data: upsells = [], isLoading } = useQuery({
    queryKey: ['upsells'],
    queryFn: fetchUpsells,
  });

  const createMutation = useMutation({
    mutationFn: () => createUpsell(title, description, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsells'] });
      setTitle('');
      setDescription('');
      setDialogOpen(false);
      toast({ title: 'Upsell created successfully' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUpsell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsells'] });
      toast({ title: 'Upsell deleted' });
    },
  });

  const handleTranslate = async (id: string, originalText: string, language: string) => {
    try {
      // Check cache first
      const cached = await fetchCachedTranslation(id, language);
      if (cached) {
        setTranslations(prev => ({ ...prev, [id]: { text: cached, lang: language, loading: false } }));
        return;
      }
      // Not cached — call AI
      setTranslations(prev => ({ ...prev, [id]: { text: '', lang: language, loading: true } }));
      const translated = await translateUpsellText(originalText, language);
      setTranslations(prev => ({ ...prev, [id]: { text: translated, lang: language, loading: false } }));
      // Save to cache
      await saveCachedTranslation(id, language, translated);
    } catch (err: any) {
      toast({ title: 'Translation failed', description: err.message, variant: 'destructive' });
      setTranslations(prev => ({ ...prev, [id]: { text: '', lang: language, loading: false } }));
    }
  };

  const handleCopy = async (id: string, originalText: string) => {
    const textToCopy = translations[id]?.text || originalText;
    await navigator.clipboard.writeText(textToCopy);
    toast({ title: 'Copied to clipboard!' });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Upsell Scripts</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Upsell</Button>
            </DialogTrigger>
            <DialogContent onFocusOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Add New Upsell</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="upsell-title">Title</Label>
                  <Input id="upsell-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Premium Package Pitch" />
                </div>
                <div>
                  <Label htmlFor="upsell-desc">Description / Script</Label>
                  <Textarea id="upsell-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter your upsell script here..." rows={6} />
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !description.trim() || createMutation.isPending} className="w-full">
                  {createMutation.isPending ? 'Saving...' : 'Save Upsell'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : upsells.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No upsell scripts yet. Click "Add Upsell" to create one.</p>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {upsells.map(item => {
              const t = translations[item.id];
              const displayText = t?.text || item.description;
              return (
                <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium">{item.title}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap text-sm text-foreground/90">{displayText}</p>
                      {t?.loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Translating...</div>}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select onValueChange={lang => handleTranslate(item.id, item.description, lang)} value={t?.lang || ''}>
                          <SelectTrigger className="w-44">
                            <Languages className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Translate to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map(l => (
                              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => handleCopy(item.id, item.description)}>
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </Layout>
      </div>
    </div>
  );
};

export default Upsell;
