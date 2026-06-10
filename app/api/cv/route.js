import { callClaude } from "../../../lib/claude";
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

Réécris et réorganise le CV pour maximiser le match avec cette offre précise :
- Mets en avant en premier les compétences et expériences les plus pertinentes pour CE poste
- Reformule l'accroche/résumé pour parler directement au besoin de l'entreprise
- Garde tout factuel : n'invente jamais d'expérience ou de compétence absente du CV source
- Format clair en sections (accroche, compétences clés, expériences pertinentes)

Retourne uniquement le CV adapté, en markdown léger.`;

    const text = await callClaude({ prompt, maxTokens: 1500 });
    return Response.json({ cv: text });
  } catch (err) {
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
