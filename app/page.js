"use client";

import { useState, useEffect } from "react";
import "./globals.css";

const STORAGE_TRACKER = "jobflow_tracker";
const STORAGE_PROFIL = "jobflow_profil";

const DEFAULT_PROFIL = {
  titre: "Graphiste · Motion designer · Monteur vidéo · Directeur artistique",
  ville: "Paris",
  resume:
    "Designer et monteur freelance basé à Paris (adrshitdesign). Polyvalent : direction artistique, identité visuelle, montage vidéo multi-caméra, motion design, communication digitale.",
  competences:
    "Direction artistique, Identité visuelle, Motion design, Montage multi-caméra, Premiere Pro, After Effects, Photoshop, Illustrator, Communication digitale",
  cvBrut: "",
};

export default function Home() {
  const [tab, setTab] = useState("offres");
  const [profil, setProfil] = useState(DEFAULT_PROFIL);
  const [tracker, setTracker] = useState([]);

  useEffect(() => {
    try {
      const p = localStorage.getItem(STORAGE_PROFIL);
      if (p) setProfil(JSON.parse(p));
      const t = localStorage.getItem(STORAGE_TRACKER);
      if (t) setTracker(JSON.parse(t));
    } catch (e) {}
  }, []);

  function saveProfil(next) {
    setProfil(next);
    try {
      localStorage.setItem(STORAGE_PROFIL, JSON.stringify(next));
    } catch (e) {}
  }

  function saveTracker(next) {
    setTracker(next);
    try {
      localStorage.setItem(STORAGE_TRACKER, JSON.stringify(next));
    } catch (e) {}
  }

  function addToTracker(offre) {
    const entry = {
      id: Date.now().toString(),
      boite: offre.entreprise || "",
      poste: offre.intitule || "",
      statut: "Envoyée",
      date: new Date().toISOString().slice(0, 10),
      lien: offre.url || "",
      notes: "",
    };
    saveTracker([entry, ...tracker]);
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1>JobFlow</h1>
          <div className="sub">
            Recherche d'emploi automatisée — offres filtrées, scorées, CV et lettres adaptés
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={"tab" + (tab === "offres" ? " active" : "")}
          onClick={() => setTab("offres")}
        >
          Flux d'offres
        </button>
        <button
          className={"tab" + (tab === "tracker" ? " active" : "")}
          onClick={() => setTab("tracker")}
        >
          Mes candidatures
        </button>
        <button
          className={"tab" + (tab === "profil" ? " active" : "")}
          onClick={() => setTab("profil")}
        >
          Mon profil
        </button>
      </div>

      {tab === "offres" && (
        <OffresTab profil={profil} onAdd={addToTracker} />
      )}
      {tab === "tracker" && (
        <TrackerTab tracker={tracker} saveTracker={saveTracker} />
      )}
      {tab === "profil" && (
        <ProfilTab profil={profil} saveProfil={saveProfil} />
      )}
    </div>
  );
}

function OffresTab({ profil, onAdd }) {
  const [motsCles, setMotsCles] = useState(
    "motion designer monteur vidéo graphiste"
  );
  const [commune, setCommune] = useState("75");
  const [typeContrat, setTypeContrat] = useState("CDI,CDD");
  const [publieeDepuis, setPublieeDepuis] = useState("");
  const [scoreMin, setScoreMin] = useState(0);
  const [motsExclus, setMotsExclus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [offres, setOffres] = useState([]);
  const [meta, setMeta] = useState(null);
  const [scores, setScores] = useState({});
  const [scoring, setScoring] = useState({});

  async function chercher() {
    setLoading(true);
    setError("");
    setOffres([]);
    setScores({});
    try {
      const res = await fetch("/api/offres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motsCles, commune, typeContrat, publieeDepuis }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOffres(data.offres);
      setMeta({ total: data.total, filtrees: data.filtrees });
      scoreAll(data.offres);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function scoreAll(list) {
    for (const offre of list.slice(0, 15)) {
      setScoring((s) => ({ ...s, [offre.id]: true }));
      try {
        const res = await fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offre, profil }),
        });
        const data = await res.json();
        if (res.ok) {
          setScores((sc) => ({ ...sc, [offre.id]: data }));
        } else {
          setScores((sc) => ({
            ...sc,
            [offre.id]: { erreur: data.error || "Scoring indisponible" },
          }));
        }
      } catch (e) {
        setScores((sc) => ({
          ...sc,
          [offre.id]: { erreur: "Scoring indisponible (réseau)" },
        }));
      }
      setScoring((s) => ({ ...s, [offre.id]: false }));
    }
  }

  const sorted = [...offres].sort((a, b) => {
    const sa = typeof scores[a.id]?.score === "number" ? scores[a.id].score : -1;
    const sb = typeof scores[b.id]?.score === "number" ? scores[b.id].score : -1;
    return sb - sa;
  });

  const exclusions = motsExclus
    .split(",")
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);

  const visibles = sorted.filter((offre) => {
    // Filtre score minimum : on garde les offres encore en cours de scoring,
    // sinon on exige un score >= seuil.
    if (scoreMin > 0) {
      const sc = scores[offre.id];
      const enCours = scoring[offre.id];
      const hasScore = sc && typeof sc.score === "number";
      if (!enCours && hasScore && sc.score < scoreMin) return false;
      if (!enCours && !hasScore) return false;
    }
    // Exclusion de mots-clés sur intitulé + entreprise + description.
    if (exclusions.length) {
      const hay = [offre.intitule, offre.entreprise, offre.description]
        .join(" ")
        .toLowerCase();
      if (exclusions.some((m) => hay.includes(m))) return false;
    }
    return true;
  });

  const masquees = sorted.length - visibles.length;

  return (
    <div>
      <div className="banner">
        Les offres remontent depuis l'API France Travail, déjà filtrées des
        alternances et stages, puis classées par pertinence pour ton profil.
      </div>

      <div className="search-bar">
        <div className="field">
          <label>Mots-clés</label>
          <input
            value={motsCles}
            onChange={(e) => setMotsCles(e.target.value)}
          />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label>Département (Paris = 75)</label>
          <input value={commune} onChange={(e) => setCommune(e.target.value)} />
        </div>
        <button className="btn" onClick={chercher} disabled={loading}>
          {loading ? <span className="spinner" /> : "Chercher"}
        </button>
      </div>

      <div className="search-bar" style={{ marginTop: -4 }}>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Contrat</label>
          <select
            value={typeContrat}
            onChange={(e) => setTypeContrat(e.target.value)}
          >
            <option value="CDI,CDD">CDI + CDD</option>
            <option value="CDI">CDI seulement</option>
            <option value="CDD">CDD seulement</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Publiée depuis</label>
          <select
            value={publieeDepuis}
            onChange={(e) => setPublieeDepuis(e.target.value)}
          >
            <option value="">Peu importe</option>
            <option value="1">24 h</option>
            <option value="3">3 jours</option>
            <option value="7">7 jours</option>
            <option value="14">14 jours</option>
            <option value="31">31 jours</option>
          </select>
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label>Score minimum : {scoreMin}</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={scoreMin}
            onChange={(e) => setScoreMin(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>Exclure des mots-clés (séparés par des virgules)</label>
          <input
            value={motsExclus}
            onChange={(e) => setMotsExclus(e.target.value)}
            placeholder="ex : commercial, régie, télévente"
          />
        </div>
      </div>

      {error && (
        <div className="card" style={{ color: "var(--red-text)" }}>
          {error}
        </div>
      )}

      {meta && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          {meta.total} offres pertinentes · {meta.filtrees} alternances/stages
          écartés
          {masquees > 0 && ` · ${masquees} masquée${masquees > 1 ? "s" : ""} par tes filtres`}
        </p>
      )}

      {visibles.map((offre) => {
        const sc = scores[offre.id];
        const isScoring = scoring[offre.id];
        const hasScore = sc && typeof sc.score === "number";
        let scoreClass = "score-low";
        if (hasScore) {
          if (sc.score >= 70) scoreClass = "score-high";
          else if (sc.score >= 45) scoreClass = "score-mid";
        }
        return (
          <div className="offre-card" key={offre.id}>
            <div className="offre-head">
              <div>
                <div className="offre-title">{offre.intitule}</div>
                <div className="offre-meta">
                  {offre.entreprise} · {offre.lieu} · {offre.typeContrat}
                </div>
              </div>
              {isScoring ? (
                <div
                  className="score-badge score-mid"
                  style={{ fontSize: 11 }}
                >
                  ...
                </div>
              ) : hasScore ? (
                <div className={"score-badge " + scoreClass}>{sc.score}</div>
              ) : null}
            </div>

            {hasScore && (
              <div className="offre-body">
                <strong>{sc.verdict}</strong>
                {sc.points_forts?.length > 0 && (
                  <ul className="pf-list">
                    {sc.points_forts.map((pf, i) => (
                      <li key={i}>{pf}</li>
                    ))}
                  </ul>
                )}
                {sc.points_attention?.length > 0 && (
                  <ul className="pf-list" style={{ color: "var(--amber-text)" }}>
                    {sc.points_attention.map((pa, i) => (
                      <li key={i}>{pa}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {sc && sc.erreur && (
              <div
                className="offre-body"
                style={{ color: "var(--amber-text)" }}
              >
                Score non calculé : {sc.erreur}
              </div>
            )}

            <div className="offre-actions">
              <a
                className="btn btn-ghost btn-sm"
                href={offre.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir l'offre
              </a>
              <DocButton type="lettre" offre={offre} profil={profil} />
              <DocButton type="cv" offre={offre} profil={profil} />
              <button
                className="btn btn-sm"
                onClick={() => onAdd(offre)}
              >
                + Tracker
              </button>
            </div>
          </div>
        );
      })}

      {!loading && offres.length === 0 && !error && (
        <div className="empty">
          Lance une recherche pour voir les offres remonter.
        </div>
      )}

      {!loading && offres.length > 0 && visibles.length === 0 && (
        <div className="empty">
          Toutes les offres sont masquées par tes filtres (score minimum ou
          mots-clés exclus). Assouplis-les pour en voir.
        </div>
      )}
    </div>
  );
}

function DocButton({ type, offre, profil }) {
  const [loading, setLoading] = useState(false);
  const [lettre, setLettre] = useState("");
  const [cv, setCv] = useState(null);
  const [erreur, setErreur] = useState("");

  async function generate() {
    setLoading(true);
    setLettre("");
    setCv(null);
    setErreur("");
    try {
      const res = await fetch("/api/" + type, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offre, profil, cvBrut: profil.cvBrut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (type === "lettre") {
        setLettre(data.lettre);
      } else {
        setCv(data.cv);
      }
    } catch (e) {
      setErreur("Erreur : " + e.message);
    }
    setLoading(false);
  }

  async function downloadPdf() {
    if (!cv) return;
    const { genererCvPdf } = await import("../lib/cvpdf");
    const doc = genererCvPdf(cv);
    const nom = (cv.nom || "CV").replace(/\s+/g, "_");
    const poste = (offre.entreprise || "offre").replace(/\s+/g, "_").slice(0, 20);
    doc.save(`CV_${nom}_${poste}.pdf`);
  }

  const label = type === "lettre" ? "Lettre" : "CV adapté";

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
        {loading ? <span className="spinner" style={{ borderTopColor: "var(--accent)" }} /> : label}
      </button>

      {erreur && (
        <div style={{ width: "100%" }}>
          <div className="output-box" style={{ color: "var(--red-text)" }}>{erreur}</div>
        </div>
      )}

      {lettre && (
        <div style={{ width: "100%" }}>
          <div className="output-box">{lettre}</div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => navigator.clipboard.writeText(lettre)}
          >
            Copier
          </button>
        </div>
      )}

      {cv && (
        <div style={{ width: "100%" }}>
          <div className="output-box">
            <strong>{cv.titre}</strong>
            {cv.accroche && <p style={{ marginTop: 6 }}>{cv.accroche}</p>}
            {cv.experiences?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong style={{ fontSize: 13 }}>Expériences mises en avant :</strong>
                <ul className="pf-list">
                  {cv.experiences.map((e, i) => (
                    <li key={i}>
                      {e.poste} — {e.organisation} {e.periode ? `(${e.periode})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cv.competences?.length > 0 && (
              <p style={{ marginTop: 8, fontSize: 13 }}>
                <strong>Compétences :</strong> {cv.competences.join(", ")}
              </p>
            )}
          </div>
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={downloadPdf}>
            Télécharger le PDF
          </button>
        </div>
      )}
    </>
  );
}

function TrackerTab({ tracker, saveTracker }) {
  function updateStatut(id, statut) {
    saveTracker(
      tracker.map((e) => (e.id === id ? { ...e, statut } : e))
    );
  }
  function remove(id) {
    if (!confirm("Supprimer ?")) return;
    saveTracker(tracker.filter((e) => e.id !== id));
  }

  function daysSince(date) {
    if (!date) return 0;
    return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  }

  if (tracker.length === 0) {
    return (
      <div className="empty">
        Aucune candidature suivie. Ajoute des offres depuis le flux.
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Boîte</th>
          <th>Poste</th>
          <th>Statut</th>
          <th>Depuis</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {tracker.map((e) => {
          const days = daysSince(e.date);
          const relance =
            ["Envoyée", "Relance"].includes(e.statut) && days >= 10;
          return (
            <tr key={e.id}>
              <td>{e.boite}</td>
              <td>
                {e.poste}
                {e.lien && (
                  <>
                    {" "}
                    <a href={e.lien} target="_blank" rel="noopener noreferrer">
                      ↗
                    </a>
                  </>
                )}
              </td>
              <td>
                <select
                  value={e.statut}
                  onChange={(ev) => updateStatut(e.id, ev.target.value)}
                  style={{
                    border: "1px solid var(--border-strong)",
                    borderRadius: 6,
                    padding: "3px 6px",
                    fontSize: 13,
                  }}
                >
                  <option>Envoyée</option>
                  <option>En attente</option>
                  <option>Relance</option>
                  <option>Entretien</option>
                  <option>Refus</option>
                  <option>Acceptée</option>
                </select>
              </td>
              <td>
                {days}j
                {relance && (
                  <div className="relance-flag">À relancer</div>
                )}
              </td>
              <td>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => remove(e.id)}
                >
                  Suppr
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ProfilTab({ profil, saveProfil }) {
  const [local, setLocal] = useState(profil);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocal(profil);
  }, [profil]);

  function save() {
    saveProfil(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="banner">
        Ton profil est utilisé partout : scoring des offres, génération de CV et
        de lettres. Remplis-le une fois.
      </div>
      <div className="card">
        <div className="field">
          <label>Titre / accroche</label>
          <input
            value={local.titre}
            onChange={(e) => setLocal({ ...local, titre: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Résumé pro</label>
          <textarea
            value={local.resume}
            onChange={(e) => setLocal({ ...local, resume: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Compétences (séparées par des virgules)</label>
          <textarea
            value={local.competences}
            onChange={(e) =>
              setLocal({ ...local, competences: e.target.value })
            }
          />
        </div>
        <div className="field">
          <label>
            CV complet (optionnel — colle ton CV ici pour des adaptations plus
            précises)
          </label>
          <textarea
            value={local.cvBrut}
            onChange={(e) => setLocal({ ...local, cvBrut: e.target.value })}
            style={{ minHeight: 140 }}
          />
        </div>
        <button className="btn" onClick={save}>
          {saved ? "Enregistré ✓" : "Enregistrer le profil"}
        </button>
      </div>
    </div>
  );
}
