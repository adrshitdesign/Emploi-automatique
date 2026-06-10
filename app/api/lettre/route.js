import { callClaude } from "../../../lib/claude";
import { DEFAULT_PROFIL, competencesToString } from "../../../lib/profil";

export async function POST(request) {
  try {
    const { offre, profil } = await request.json();
    const p = profil || DEFAULT_PROFIL;

    const prompt = `Tu es expert en lettres de motivation pour les métiers créatifs français.

PROFIL :
${p.titre}
${p.resume}
Compétences : ${competencesToString(p.competences)}

POSTE VISÉ :
${offre.intitule} chez ${offre.entreprise}
${offre.description ? `\nDescription :\n${offre.description.slice(0, 1800)}` : ""}

Rédige une lettre de motivation en français, ton professionnel mais humain, sans formules creuses. 3 paragraphes maximum. Elle doit montrer une compréhension réelle du poste, mettre en avant les compétences les plus pertinentes, et se terminer par une ouverture naturelle vers un entretien. Commence directement, sans "Madame, Monsieur" générique. Retourne uniquement la lettre.`;

    const text = await callClaude({ prompt, maxTokens: 1000 });
    return Response.json({ lettre: text });
  } catch (err) {
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
