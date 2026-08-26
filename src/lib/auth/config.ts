/** Confronto a tempo costante per evitare timing attack sulla password. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bytesA = enc.encode(a);
  const bytesB = enc.encode(b);

  // Lunghezze diverse: confrontiamo comunque contro un buffer della stessa
  // lunghezza di bytesA per non far trapelare la lunghezza in modo grossolano,
  // e il risultato e' comunque sempre "non valido".
  const length = Math.max(bytesA.length, bytesB.length);
  let diff = bytesA.length === bytesB.length ? 0 : 1;

  for (let i = 0; i < length; i++) {
    const byteA = i < bytesA.length ? bytesA[i] : 0;
    const byteB = i < bytesB.length ? bytesB[i] : 0;
    diff |= byteA ^ byteB;
  }

  return diff === 0;
}

export function isPasswordCorrect(candidate: string): boolean {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    throw new Error("APP_PASSWORD deve essere definita nelle variabili d'ambiente");
  }
  return timingSafeEqual(candidate, appPassword);
}
