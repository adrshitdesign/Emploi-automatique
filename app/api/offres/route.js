import { searchOffres } from "../../../lib/francetravail";
import { filterOffres, looksLikeAlternance } from "../../../lib/filtre";

export async function POST(request) {
  try {
    const { motsCles, commune, departement, typeContrat, publieeDepuis } =
      await request.json();

    const offresBrutes = await searchOffres({
      motsCles,
      commune,
      departement,
      typeContrat,
      publieeDepuis,
    });

    const offres = filterOffres(offresBrutes).map((o) => ({
      id: o.id,
      intitule: o.intitule,
      entreprise: o.entreprise?.nom || "Entreprise non précisée",
      lieu: o.lieuTravail?.libelle || "",
      typeContrat: o.typeContratLibelle || o.typeContrat || "",
      description: (o.description || "").slice(0, 2000),
      url:
        o.origineOffre?.urlOrigine ||
        `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
      dateCreation: o.dateCreation || "",
    }));

    return Response.json({
      offres,
      total: offres.length,
      filtrees: offresBrutes.length - offres.length,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
