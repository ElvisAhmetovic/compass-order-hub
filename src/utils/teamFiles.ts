import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'team-files';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Accepts either a bare storage path or a legacy public URL and returns the
 * object path inside the team-files bucket.
 */
export const toTeamFilePath = (urlOrPath: string): string => {
  if (!urlOrPath) return '';
  const marker = `/${BUCKET}/`;
  const index = urlOrPath.indexOf(marker);
  if (index === -1) return urlOrPath.replace(/^\/+/, '');
  return decodeURIComponent(urlOrPath.slice(index + marker.length).split('?')[0]);
};

/**
 * The team-files bucket is private: files must be accessed through short-lived
 * signed URLs so only signed-in staff can open them.
 */
export const getTeamFileSignedUrl = async (urlOrPath: string): Promise<string | null> => {
  const path = toTeamFilePath(urlOrPath);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error('Error creating signed URL for team file:', error);
    return null;
  }
  return data?.signedUrl ?? null;
};
