const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const OFFRES_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 30000) {
    return cachedToken;
  }

  const clientId = process.env.FT_CLIENT_ID;
  const clientSecret = process.env.FT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Clés France Travail manquantes. Vérifie FT_CLIENT_ID et FT_CLIENT_SECRET."
    );
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "api_offresdemploiv2 o2dsoffre",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth France Travail échouée (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  return cachedToken;
}

export async function searchOffres({ motsCles, commune, departement, range }) {
  const token = await getToken();

  const params = new URLSearchParams();
  if (motsCles) params.set("motsCles", motsCles);
  if (commune) params.set("commune", commune);
  if (departement) params.set("departement", departement);
  params.set("typeContrat", "CDI,CDD");
  params.set("range", range || "0-49");

  const res = await fetch(`${OFFRES_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 204) {
    return [];
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Recherche offres échouée (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.resultats || [];
}
