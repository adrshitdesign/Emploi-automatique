import { jsPDF } from "jspdf";

const BLEU = [61, 90, 254];
const NOIR = [26, 26, 26];
const GRIS = [110, 110, 120];
const BLANC = [255, 255, 255];
const BLEU_CLAIR = [200, 210, 255];

// Interligne en mm calculé depuis une taille en points (1pt = 0.3528mm).
function lh(pt, factor = 1.15) {
  return pt * 0.3528 * factor;
}

export function genererCvPdf(cv) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const colRightX = 138;
  const colRightW = pageW - colRightX;

  // Colonne bleue à droite.
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(colRightX, 0, colRightW, pageH, "F");

  // --- Colonne gauche (contenu) ---
  const leftX = 14;
  const leftW = colRightX - leftX - 10; // largeur utile gauche
  const dateW = 24; // gouttière des dates
  const bodyX = leftX + dateW; // colonne du texte principal
  const bodyW = leftW - dateW;
  let y = 22;

  // Nom
  doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text((cv.nom || "").toUpperCase(), leftX, y);
  y += 8;

  // Titre
  doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(13);
  const titreLines = doc.splitTextToSize(cv.titre || "", leftW);
  doc.text(titreLines, leftX, y);
  y += titreLines.length * lh(13) + 3;

  // Filet de séparation sous l'en-tête
  doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.setLineWidth(0.4);
  doc.line(leftX, y, leftX + leftW, y);
  y += 7;

  // Accroche
  if (cv.accroche) {
    doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const accroche = doc.splitTextToSize(cv.accroche, leftW);
    doc.text(accroche, leftX, y);
    y += accroche.length * lh(9.5, 1.3) + 8;
  }

  // Helper : titre de section avec petit filet d'accent
  function sectionTitle(label) {
    doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, leftX, y);
    doc.setDrawColor(BLEU[0], BLEU[1], BLEU[2]);
    doc.setLineWidth(0.8);
    doc.line(leftX, y + 2, leftX + 16, y + 2);
    y += 8;
  }

  // --- Formations ---
  if (cv.formations && cv.formations.length) {
    sectionTitle("DIPLÔMES ET FORMATIONS");

    for (const f of cv.formations) {
      if (y > pageH - 22) break;
      // Période (gouttière grise)
      doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(doc.splitTextToSize(f.periode || "", dateW - 3), leftX, y);

      // Diplôme
      doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const dipl = doc.splitTextToSize(f.diplome || "", bodyW);
      doc.text(dipl, bodyX, y);
      let yy = y + dipl.length * lh(10);

      // Établissement
      if (f.etablissement) {
        doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        const etab = doc.splitTextToSize(f.etablissement, bodyW);
        doc.text(etab, bodyX, yy + 1);
        yy += etab.length * lh(9) + 1;
      }
      y = yy + 5;
    }
    y += 3;
  }

  // --- Expériences ---
  if (cv.experiences && cv.experiences.length) {
    if (y > pageH - 30) y = pageH - 30;
    sectionTitle("EXPÉRIENCES PROFESSIONNELLES");

    for (const e of cv.experiences) {
      if (y > pageH - 22) break;
      // Période
      doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(doc.splitTextToSize(e.periode || "", dateW - 3), leftX, y);

      // Poste
      doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const poste = doc.splitTextToSize(e.poste || "", bodyW);
      doc.text(poste, bodyX, y);
      let yy = y + poste.length * lh(10);

      // Organisation
      if (e.organisation) {
        doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(doc.splitTextToSize(e.organisation, bodyW), bodyX, yy + 1);
        yy += lh(9) + 2;
      }

      // Détails
      if (e.details) {
        doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const det = doc.splitTextToSize(e.details, bodyW);
        doc.text(det, bodyX, yy + 1);
        yy += det.length * lh(8.5, 1.3) + 1;
      }
      y = yy + 5;
    }
  }

  // --- Colonne droite (bleue) ---
  const rTextX = colRightX + 9;
  const rTextW = colRightW - 18;
  const rCenterX = colRightX + colRightW / 2;
  let ry = 24;

  function rSectionTitle(label) {
    doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(label, rCenterX, ry, { align: "center" });
    // petit filet clair centré
    doc.setDrawColor(BLEU_CLAIR[0], BLEU_CLAIR[1], BLEU_CLAIR[2]);
    doc.setLineWidth(0.6);
    doc.line(rCenterX - 9, ry + 2.5, rCenterX + 9, ry + 2.5);
    ry += 9;
  }

  // Contact
  rSectionTitle("Contact");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const c = cv.contact || {};
  doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
  for (const val of [c.email, c.ville, c.telephone].filter(Boolean)) {
    const lines = doc.splitTextToSize(val, rTextW);
    doc.text(lines, rCenterX, ry, { align: "center" });
    ry += lines.length * lh(9, 1.3) + 1.5;
  }
  ry += 9;

  // Compétences
  if (cv.competences && cv.competences.length) {
    rSectionTitle("Compétences");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
    const bulletGap = 3.5;
    for (const comp of cv.competences) {
      if (ry > pageH - 14) break;
      const lines = doc.splitTextToSize(comp, rTextW - bulletGap);
      // Puce + retrait pendant (les lignes suivantes restent alignées)
      doc.text("•", rTextX, ry);
      doc.text(lines, rTextX + bulletGap, ry);
      ry += lines.length * lh(9, 1.25) + 2;
    }
  }

  return doc;
}
