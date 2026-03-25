import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Plus, Copy, Trash2, Languages, Loader2, ArrowLeft, FolderOpen } from 'lucide-react';
import {
  fetchCategories, createCategory, deleteCategory,
  fetchUpsellsByCategory, createUpsell, deleteUpsell,
  translateUpsellText, fetchCachedTranslation, saveCachedTranslation
} from '@/services/upsellService';
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

const TextLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');

  // Category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catName, setCatName] = useState('');

  // Text item dialog
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Per-item translation state
  const [translations, setTranslations] = useState<Record<string, { text: string; lang: string; loading: boolean }>>({});

  // Queries
  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['upsell_categories'],
    queryFn: fetchCategories,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['upsells', selectedCategoryId],
    queryFn: () => fetchUpsellsByCategory(selectedCategoryId!),
    enabled: !!selectedCategoryId,
  });

  // Mutations
  const createCatMutation = useMutation({
    mutationFn: () => createCategory(catName, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell_categories'] });
      setCatName('');
      setCatDialogOpen(false);
      toast({ title: 'Category created' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteCatMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsell_categories'] });
      toast({ title: 'Category deleted' });
    },
  });

  const createTextMutation = useMutation({
    mutationFn: () => createUpsell(title, description, user!.id, selectedCategoryId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsells', selectedCategoryId] });
      setTitle('');
      setDescription('');
      setTextDialogOpen(false);
      toast({ title: 'Text created' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteTextMutation = useMutation({
    mutationFn: deleteUpsell,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upsells', selectedCategoryId] });
      toast({ title: 'Text deleted' });
    },
  });

  const handleTranslate = async (id: string, originalText: string, language: string) => {
    try {
      const cached = await fetchCachedTranslation(id, language);
      if (cached) {
        setTranslations(prev => ({ ...prev, [id]: { text: cached, lang: language, loading: false } }));
        return;
      }
      setTranslations(prev => ({ ...prev, [id]: { text: '', lang: language, loading: true } }));
      const translated = await translateUpsellText(originalText, language);
      setTranslations(prev => ({ ...prev, [id]: { text: translated, lang: language, loading: false } }));
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

  const handleSelectCategory = (id: string, name: string) => {
    setSelectedCategoryId(id);
    setSelectedCategoryName(name);
    setTranslations({});
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex">
        <Layout>
          <div className="p-6 max-w-4xl mx-auto">
            {!selectedCategoryId ? (
              /* ===== Category List View ===== */
              <>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-foreground">Text Library</h1>
                  <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="h-4 w-4 mr-2" /> Add Category</Button>
                    </DialogTrigger>
                    <DialogContent onFocusOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label htmlFor="cat-name">Category Title</Label>
                          <Input id="cat-name" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Sales Pitches" />
                        </div>
                        <Button onClick={() => createCatMutation.mutate()} disabled={!catName.trim() || createCatMutation.isPending} className="w-full">
                          {createCatMutation.isPending ? 'Saving...' : 'Save Category'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {catsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">No categories yet. Click "Add Category" to create one.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(cat => (
                      <Card
                        key={cat.id}
                        className="cursor-pointer hover:shadow-md transition-shadow group"
                        onClick={() => handleSelectCategory(cat.id, cat.name)}
                      >
                        <CardContent className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="h-5 w-5 text-primary" />
                            <span className="font-medium text-foreground">{cat.name}</span>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete category "{cat.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this category and all text items inside it.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCatMutation.mutate(cat.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ===== Category Detail View ===== */
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCategoryId(null)}>
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-bold text-foreground">{selectedCategoryName}</h1>
                  </div>
                  <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="h-4 w-4 mr-2" /> Add Text</Button>
                    </DialogTrigger>
                    <DialogContent onFocusOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
                      <DialogHeader>
                        <DialogTitle>Add New Text</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label htmlFor="text-title">Title</Label>
                          <Input id="text-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Premium Package Pitch" />
                        </div>
                        <div>
                          <Label htmlFor="text-desc">Description / Script</Label>
                          <Textarea id="text-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter your script here..." rows={6} />
                        </div>
                        <Button onClick={() => createTextMutation.mutate()} disabled={!title.trim() || !description.trim() || createTextMutation.isPending} className="w-full">
                          {createTextMutation.isPending ? 'Saving...' : 'Save Text'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {itemsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">No text items in this category. Click "Add Text" to create one.</p>
                ) : (
                  <Accordion type="multiple" className="space-y-3">
                    {items.map(item => {
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
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTextMutation.mutate(item.id)}>
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
              </>
            )}
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default TextLibrary;
