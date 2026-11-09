/** Returns query rows, or throws when the query failed — never turns an error into an empty list. */
export function must<T>(res: { data: T[] | T | null; error: { message: string } | null }): T[] {
  if (res.error) throw new Error(res.error.message);
  if (res.data == null) return [];
  return (Array.isArray(res.data) ? res.data : [res.data]) as T[];
}
