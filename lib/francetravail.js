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

export async function searchOffres({
  motsCles,
  commune,
  departement,
  range,
  typeContrat,
  publieeDepuis,
}) {
  const token = await getToken();

  const params = new URLSearchParams();
  if (motsCles) params.set("motsCles", motsCles);

  // L'API France Travail accepte soit un departement (2 chiffres, ex "75"),
  // soit une commune (code INSEE complet). Si la valeur fournie dans "commune"
  // fait 2 ou 3 chiffres, on la traite comme un departement, ce qui est
  // beaucoup plus robuste pour les grandes villes comme Paris.
  const loc = (commune || departement || "").trim();
  if (loc) {
    if (/^\d{2,3}$/.test(loc)) {
      params.set("departement", loc.slice(0, 2));
    } else {
      params.set("commune", loc);
    }
  }

  // typeContrat : "CDI", "CDD" ou "CDI,CDD". Par défaut les deux.
  const contrat = (typeContrat || "CDI,CDD").trim();
  params.set("typeContrat", contrat || "CDI,CDD");

  // publieeDepuis : nombre de jours accepté par l'API (1, 3, 7, 14, 31).
  const depuis = parseInt(publieeDepuis, 10);
  if ([1, 3, 7, 14, 31].includes(depuis)) {
    params.set("publieeDepuis", String(depuis));
  }

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
