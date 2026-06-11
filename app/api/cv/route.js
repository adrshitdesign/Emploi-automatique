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
Règles : mets en avant en premier ce qui matche le poste, reformule l'accroche pour parler au besoin de l'entreprise, et NE JAMAIS inventer d'expérience, de compétence, de diplôme ou de date absents du CV source.

Réponds en JSON strict avec cette structure exacte :
{
  "nom": "nom complet du candidat",
  "titre": "intitulé de poste court",
  "accroche": "2-3 phrases d'accroche adaptées à l'offre",
  "experiences": [
    { "poste": "...", "organisation": "...", "periode": "...", "details": "1-2 phrases" }
  ],
  "formations": [
    { "diplome": "...", "etablissement": "...", "periode": "..." }
  ],
  "competences": ["compétence 1", "compétence 2"],
  "contact": { "email": "...", "ville": "...", "telephone": "..." }
}

Inclus au maximum 4 expériences et 3 formations, les plus pertinentes en premier. Si une information n'existe pas dans le CV source, mets une chaîne vide. Réponds UNIQUEMENT avec le JSON, sans backticks ni texte autour.`;

    const text = await callClaude({
      prompt,
      maxTokens: 1800,
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
