import { callClaude, parseJsonResponse } from "../../../lib/claude";
import { DEFAULT_PROFIL, competencesToString } from "../../../lib/profil";

export async function POST(request) {
  try {
    const { offre, profil, cvBrut } = await request.json();
    const p = profil || DEFAULT_PROFIL;

    const cvSource =
      cvBrut && cvBrut.trim().length > 0
        ? cvBrut
        : `${p.titre}\n${p.resume}\nCompétences : ${competencesToString(p.competences)}`;

    const prompt = `Tu es expert en optimisation de CV pour les métiers créatifs français.

CV ACTUEL DU CANDIDAT :
${cvSource}

OFFRE VISÉE :
${offre.intitule} chez ${offre.entreprise}
${offre.description ? `\nDescription du poste :\n${offre.description.slice(0, 1800)}` : ""}

Réécris et réorganise le CV pour maximiser le match avec cette offre précise.
Le CV final doit tenir sur UNE SEULE PAGE A4 : sois sélectif et dense.

Structure de la page : colonne gauche = expériences PROFESSIONNELLES et formations ; colonne droite = contact, compétences et BÉNÉVOLAT/ENGAGEMENTS associatifs.

Règles importantes :
- Mets en avant en premier ce qui matche le poste, et reformule l'accroche (2-3 phrases) pour parler au besoin de l'entreprise.
- NE JAMAIS inventer d'expérience, de compétence, de diplôme ou de date absents du CV source. Tu peux reformuler et détailler ce qui existe.
- "experiences" = uniquement les expériences PROFESSIONNELLES (emplois, freelance, missions rémunérées), les plus pertinentes en premier. Maximum 4, pour tenir sur une page. Chaque "details" : 1 à 2 phrases concrètes (missions, outils, résultats).
- "benevolat" = les expériences ASSOCIATIVES, bénévoles ou d'engagement qui valorisent le profil. Garde-les COURTES (poste + structure + période, pas de details longs). Ne mets jamais une expérience pro ici, et ne mets jamais du bénévolat dans "experiences".
- "competences" : 8 à 12 compétences pertinentes.

Réponds en JSON strict avec cette structure exacte :
{
  "nom": "nom complet du candidat",
  "titre": "intitulé de poste court",
  "accroche": "2-3 phrases d'accroche adaptées à l'offre",
  "experiences": [
    { "poste": "...", "organisation": "...", "periode": "...", "details": "1-2 phrases concrètes" }
  ],
  "benevolat": [
    { "poste": "...", "organisation": "...", "periode": "..." }
  ],
  "formations": [
    { "diplome": "...", "etablissement": "...", "periode": "..." }
  ],
  "competences": ["compétence 1", "compétence 2"],
  "contact": { "email": "...", "ville": "...", "telephone": "..." }
}

Maximum 4 expériences pro, 5 bénévolats, 3 formations. Si une information n'existe pas dans le CV source, mets une chaîne vide ou un tableau vide. Réponds UNIQUEMENT avec le JSON, sans backticks ni texte autour.`;

    const text = await callClaude({
      prompt,
      maxTokens: 2600,
      model: "claude-sonnet-4-6",
    });
    const data = parseJsonResponse(text);

    if (!data) {
      return Response.json(
        { error: "Réponse CV non parsable" },
        { status: 502 }
      );
    }

    return Response.json({ cv: data });
  } catch (err) {
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
