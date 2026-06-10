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
  const [commune, setCommune] = useState("75056");
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
        body: JSON.stringify({ motsCles, commune }),
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
        }
      } catch (e) {}
      setScoring((s) => ({ ...s, [offre.id]: false }));
    }
  }

  const sorted = [...offres].sort((a, b) => {
    const sa = scores[a.id]?.score ?? -1;
    const sb = scores[b.id]?.score ?? -1;
    return sb - sa;
  });

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
          <label>Code commune (Paris = 75056)</label>
          <input value={commune} onChange={(e) => setCommune(e.target.value)} />
        </div>
        <button className="btn" onClick={chercher} disabled={loading}>
          {loading ? <span className="spinner" /> : "Chercher"}
        </button>
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
        </p>
      )}

      {sorted.map((offre) => {
        const sc = scores[offre.id];
        const isScoring = scoring[offre.id];
        let scoreClass = "score-low";
        if (sc) {
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
              ) : sc ? (
                <div className={"score-badge " + scoreClass}>{sc.score}</div>
              ) : null}
            </div>

            {sc && (
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
    </div>
  );
}

function DocButton({ type, offre, profil }) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");

  async function generate() {
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/" + type, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offre, profil, cvBrut: profil.cvBrut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setOutput(type === "lettre" ? data.lettre : data.cv);
    } catch (e) {
      setOutput("Erreur : " + e.message);
    }
    setLoading(false);
  }

  const label = type === "lettre" ? "Lettre" : "CV adapté";

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={generate} disabled={loading}>
        {loading ? <span className="spinner" style={{ borderTopColor: "var(--accent)" }} /> : label}
      </button>
      {output && (
        <div style={{ width: "100%" }}>
          <div className="output-box">{output}</div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 8 }}
            onClick={() => navigator.clipboard.writeText(output)}
          >
            Copier
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
