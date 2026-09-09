/**
 * Normalize design strings by trimming, lowercasing, and stripping whitespace/hyphens
 * so 'ZF 1089', 'zf-1089', 'zf1089', and '1089' match flexibly.
 */
export function normalizeDesignCode(code?: string): string {
  if (!code) return '';
  return code.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if target design number(s) match search query
 */
export function matchesDesignSearch(
  target: string | string[] | undefined | null,
  query: string
): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const rawQuery = query.trim().toLowerCase();
  const normQuery = normalizeDesignCode(query);

  const targets = Array.isArray(target) ? target : [target];

  return targets.some((t) => {
    if (!t) return false;
    const rawTarget = t.trim().toLowerCase();
    const normTarget = normalizeDesignCode(t);

    return (
      rawTarget.includes(rawQuery) ||
      (normQuery.length > 0 && normTarget.includes(normQuery)) ||
      (normTarget.length > 0 && normQuery.includes(normTarget))
    );
  });
}
