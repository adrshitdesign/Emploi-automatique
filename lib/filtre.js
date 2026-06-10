const ALT_KEYWORDS = [
  "alternance",
  "alternant",
  "apprentissage",
  "apprenti",
  "contrat pro",
  "contrat de professionnalisation",
  "bachelor",
  "en formation",
  "rythme alterné",
  "rythme scolaire",
  "cfa",
  "opco",
  "stage",
  "stagiaire",
];

const ALT_CONTRACT_CODES = ["E2", "FS", "FT"];

export function looksLikeAlternance(offre) {
  const haystack = [
    offre.intitule || "",
    offre.description || "",
    offre.typeContratLibelle || "",
    offre.natureContrat || "",
  ]
    .join(" ")
    .toLowerCase();

  const foundKeywords = ALT_KEYWORDS.filter((k) => haystack.includes(k));

  const codeMatch =
    offre.typeContrat && ALT_CONTRACT_CODES.includes(offre.typeContrat);

  return {
    isAlternance: foundKeywords.length > 0 || codeMatch,
    reasons: foundKeywords,
  };
}

export function filterOffres(offres) {
  return offres.filter((o) => !looksLikeAlternance(o).isAlternance);
}
