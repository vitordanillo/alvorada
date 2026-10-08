const windowMs = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; expires: number }>();

export function recordLoginAttempt(email: string) {
  const now = Date.now();
  if (attempts.size > 5000) {
    for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
    if (attempts.size > 5000) throw new Error('Aguarde alguns minutos antes de tentar novamente.');
  }
  let entry = attempts.get(email);
  if (!entry || entry.expires <= now) entry = { count: 0, expires: now + windowMs };
  if (entry.count >= 10) throw new Error('Muitas tentativas de login. Aguarde 15 minutos.');
  entry.count++;
  attempts.set(email, entry);
}

export function clearLoginAttempts(email: string) { attempts.delete(email); }
