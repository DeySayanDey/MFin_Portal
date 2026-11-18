/** Format an ISO calendar date for display without changing its calendar day. */
export function formatDateDMY(value: string | null | undefined): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}
