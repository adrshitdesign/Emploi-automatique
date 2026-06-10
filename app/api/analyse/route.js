import { callClaude, parseJsonResponse } from "../../../lib/claude";
import { DEFAULT_PROFIL } from "../../../lib/profil";

export async function POST(request) {
  try {
    const { offre, profil } = await request.json();
    const p = profil || DEFAULT_PROFIL;

    const prompt = `Tu es un assistant qui évalue la pertinence d'offres d'emploi pour un candidat précis.

PROFIL DU CANDIDAT :
Titre : ${p.titre}
Résumé : ${p.resume}
Compétences : ${(p.competences || []).join(", ")}
Métiers visés : ${(p.metiersVises || []).join(", ")}

OFFRE À ÉVALUER :
Intitulé : ${offre.intitule}
Entreprise : ${offre.entreprise}
Type de contrat : ${offre.typeContrat}
Description : ${(offre.description || "").slice(0, 1800)}

Réponds en JSON strict avec :
- "score": number de 0 à 100 (pertinence pour ce profil)
- "est_alternance": boolean (true si alternance/apprentissage/stage déguisé)
- "points_forts": array de 2-3 strings (pourquoi ça matche)
- "points_attention": array de 0-2 strings (red flags ou réserves)
- "verdict": string (1 phrase de synthèse pour aider à décider)

Réponds UNIQUEMENT avec le JSON, sans backticks ni texte autour.`;

    const text = await callClaude({ prompt, maxTokens: 500 });
    const parsed = parseJsonResponse(text);

    if (!parsed) {
      return Response.json(
        { error: "Réponse non parsable" },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
