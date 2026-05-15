export type EasyFirebaseSession = {
  mode: "easy";
  uid: string;
  email: string;
  idToken: string;
};

export function encodeEasyFirebaseSession(input: { uid: string; email?: string; idToken: string }) {
  const payload: EasyFirebaseSession = {
    mode: "easy",
    uid: input.uid,
    email: input.email ?? "",
    idToken: input.idToken,
  };

  return `easy:${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}

export function decodeEasyFirebaseSession(value: string | undefined | null): EasyFirebaseSession | null {
  if (!value?.startsWith("easy:")) return null;

  try {
    const decoded = JSON.parse(Buffer.from(value.slice("easy:".length), "base64url").toString("utf8")) as Partial<EasyFirebaseSession>;
    if (decoded.mode !== "easy" || !decoded.uid || !decoded.idToken) return null;
    return {
      mode: "easy",
      uid: decoded.uid,
      email: decoded.email ?? "",
      idToken: decoded.idToken,
    };
  } catch {
    return null;
  }
}

export function getIdTokenFromCookieValue(value: string | undefined | null) {
  if (!value) return null;
  const easy = decodeEasyFirebaseSession(value);
  if (easy) return easy.idToken;
  if (value.startsWith("idtoken:")) return value.slice("idtoken:".length);
  return value;
}
