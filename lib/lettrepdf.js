import { jsPDF } from "jspdf";

const NOIR = [26, 26, 26];
const BLEU = [61, 90, 254];
const GRIS = [110, 110, 120];

// Interligne en mm depuis une taille en points (1pt = 0.3528mm).
function lh(pt, factor = 1.4) {
  return pt * 0.3528 * factor;
}

// Génère un PDF propre pour une lettre de motivation.
// lettre : texte brut (paragraphes séparés par des sauts de ligne).
// opts : { nom, titre, ville, poste, entreprise }
export function genererLettrePdf(lettre, opts = {}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const marginX = 25;
  const marginTop = 25;
  const marginBottom = 25;
  const textW = pageW - marginX * 2;
  let y = marginTop;

  function ensureSpace(needed) {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  }

  // En-tête expéditeur (gauche)
  doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
  if (opts.nom) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(opts.nom, marginX, y);
    y += 6;
  }
  if (opts.titre) {
    doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(opts.titre, textW), marginX, y);
    y += 6;
  }

  // Date (droite, sur la première ligne)
  const dateStr = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const villePrefix = opts.ville ? `${opts.ville}, le ` : "Le ";
  doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(villePrefix + dateStr, pageW - marginX, marginTop, {
    align: "right",
  });

  y += 8;

  // Objet
  if (opts.poste || opts.entreprise) {
    doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const objet =
      "Objet : Candidature" +
      (opts.poste ? ` au poste de ${opts.poste}` : "") +
      (opts.entreprise ? ` — ${opts.entreprise}` : "");
    const objetLines = doc.splitTextToSize(objet, textW);
    ensureSpace(objetLines.length * lh(11));
    doc.text(objetLines, marginX, y);
    y += objetLines.length * lh(11) + 6;
  }

  // Filet de séparation
  doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, marginX + textW, y);
  y += 8;

  // Corps de la lettre
  doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const paragraphes = (lettre || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphes) {
    const lines = doc.splitTextToSize(para, textW);
    for (const line of lines) {
      ensureSpace(lh(11));
      doc.text(line, marginX, y);
      y += lh(11);
    }
    y += 4; // espace entre paragraphes
  }

  return doc;
}
