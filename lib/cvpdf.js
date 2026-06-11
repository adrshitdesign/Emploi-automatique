import { jsPDF } from "jspdf";

const BLEU = [61, 90, 254];
const NOIR = [26, 26, 26];
const GRIS = [110, 110, 120];
const BLANC = [255, 255, 255];
const BLEU_CLAIR = [200, 210, 255];

const pageW = 210;
const pageH = 297;
const colRightX = 138;
const colRightW = pageW - colRightX;

// Interligne en mm calculé depuis une taille en points (1pt = 0.3528mm).
function lh(pt, factor = 1.15) {
  return pt * 0.3528 * factor;
}

// Tout le CV tient sur UNE SEULE page A4.
export function genererCvPdf(cv) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Colonne bleue à droite.
  doc.setFillColor(BLEU[0], BLEU[1], BLEU[2]);
  doc.rect(colRightX, 0, colRightW, pageH, "F");

  // ---------- Colonne droite (bleue) ----------
  const rTextX = colRightX + 9;
  const rTextW = colRightW - 18;
  const rCenterX = colRightX + colRightW / 2;
  let ry = 24;

  function rSectionTitle(label) {
    doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(label, rCenterX, ry, { align: "center" });
    doc.setDrawColor(BLEU_CLAIR[0], BLEU_CLAIR[1], BLEU_CLAIR[2]);
    doc.setLineWidth(0.6);
    doc.line(rCenterX - 9, ry + 2.5, rCenterX + 9, ry + 2.5);
    ry += 9;
  }

  // Contact
  rSectionTitle("Contact");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
  const c = cv.contact || {};
  for (const val of [c.email, c.ville, c.telephone].filter(Boolean)) {
    const lines = doc.splitTextToSize(val, rTextW);
    doc.text(lines, rCenterX, ry, { align: "center" });
    ry += lines.length * lh(9, 1.3) + 1.5;
  }
  ry += 8;

  // Compétences
  if (cv.competences && cv.competences.length) {
    rSectionTitle("Compétences");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
    const bulletGap = 3.5;
    for (const comp of cv.competences) {
      if (ry > pageH - 40) break; // garde de la place pour le bénévolat
      const lines = doc.splitTextToSize(comp, rTextW - bulletGap);
      doc.text("•", rTextX, ry);
      doc.text(lines, rTextX + bulletGap, ry);
      ry += lines.length * lh(9, 1.25) + 2;
    }
    ry += 8;
  }

  // Bénévolat / Engagements
  if (cv.benevolat && cv.benevolat.length) {
    rSectionTitle("Bénévolat");
    for (const b of cv.benevolat) {
      if (ry > pageH - 14) break;
      doc.setTextColor(BLANC[0], BLANC[1], BLANC[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const poste = doc.splitTextToSize(b.poste || "", rTextW);
      doc.text(poste, rTextX, ry);
      ry += poste.length * lh(9.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const sousTitre = [b.organisation, b.periode].filter(Boolean).join(" · ");
      if (sousTitre) {
        const st = doc.splitTextToSize(sousTitre, rTextW);
        doc.setTextColor(BLEU_CLAIR[0], BLEU_CLAIR[1], BLEU_CLAIR[2]);
        doc.text(st, rTextX, ry + 0.5);
        ry += st.length * lh(8.5) + 0.5;
      }
      ry += 3;
    }
  }

  // ---------- Colonne gauche (contenu) ----------
  const leftX = 14;
  const leftW = colRightX - leftX - 10;
  const dateW = 24;
  const bodyX = leftX + dateW;
  const bodyW = leftW - dateW;
  let y = 22;
  const limitY = pageH - 18; // on ne dessine rien au-delà : tout tient sur 1 page

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

  // Filet sous l'en-tête
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

  // Formations
  if (cv.formations && cv.formations.length && y < limitY) {
    sectionTitle("DIPLÔMES ET FORMATIONS");
    for (const f of cv.formations) {
      if (y > limitY - 8) break;
      doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(doc.splitTextToSize(f.periode || "", dateW - 3), leftX, y);

      doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const dipl = doc.splitTextToSize(f.diplome || "", bodyW);
      doc.text(dipl, bodyX, y);
      let yy = y + dipl.length * lh(10);

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

  // Expériences professionnelles
  if (cv.experiences && cv.experiences.length && y < limitY) {
    sectionTitle("EXPÉRIENCES PROFESSIONNELLES");
    for (const e of cv.experiences) {
      if (y > limitY - 8) break;
      doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(doc.splitTextToSize(e.periode || "", dateW - 3), leftX, y);

      doc.setTextColor(BLEU[0], BLEU[1], BLEU[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const poste = doc.splitTextToSize(e.poste || "", bodyW);
      doc.text(poste, bodyX, y);
      let yy = y + poste.length * lh(10);

      if (e.organisation) {
        doc.setTextColor(NOIR[0], NOIR[1], NOIR[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(doc.splitTextToSize(e.organisation, bodyW), bodyX, yy + 1);
        yy += lh(9) + 2;
      }

      if (e.details) {
        doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const det = doc.splitTextToSize(e.details, bodyW);
        // on tronque proprement si ça dépasse la page
        let lines = det;
        const maxLines = Math.max(0, Math.floor((limitY - (yy + 1)) / lh(8.5, 1.3)));
        if (lines.length > maxLines) lines = lines.slice(0, maxLines);
        doc.text(lines, bodyX, yy + 1);
        yy += lines.length * lh(8.5, 1.3) + 1;
      }
      y = yy + 5;
    }
  }

  return doc;
}
