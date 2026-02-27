import { supabase } from '@/integrations/supabase/client';

export interface Upsell {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const fetchUpsells = async (): Promise<Upsell[]> => {
  const { data, error } = await supabase
    .from('upsells')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as Upsell[]) || [];
};

export const createUpsell = async (title: string, description: string, userId: string): Promise<Upsell> => {
  const { data, error } = await supabase
    .from('upsells')
    .insert({ title, description, created_by: userId } as any)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as Upsell;
};

export const deleteUpsell = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('upsells')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const fetchCachedTranslation = async (upsellId: string, language: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('upsell_translations')
    .select('translated_text')
    .eq('upsell_id', upsellId)
    .eq('language', language)
    .maybeSingle();

  if (error) throw error;
  return (data as any)?.translated_text || null;
};

export const saveCachedTranslation = async (upsellId: string, language: string, translatedText: string): Promise<void> => {
  const { error } = await supabase
    .from('upsell_translations')
    .upsert({ upsell_id: upsellId, language, translated_text: translatedText } as any, { onConflict: 'upsell_id,language' });

  if (error) throw error;
};

export const translateUpsellText = async (text: string, targetLanguage: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('translate-upsell', {
    body: { text, targetLanguage },
  });

  if (error) throw error;
  return data.translatedText;
};
