"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  edited: boolean;
  generatedAt: string;
  templateUsed: string | null;
}

interface ProspectDetail {
  id: string;
  businessName: string;
  category: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  address: string | null;
  zone: string;
  subZone: string | null;
  score: number;
  status: string;
  notes: string | null;
  foundAt: string;
  lastContactedAt: string | null;
  emailDrafts: EmailDraft[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", APPROVED: "Aprobado", SENT: "Enviado",
  DISCARDED: "Descartado", REPLIED: "Respondió", CLIENT: "Cliente",
};

export default function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editing, setEditing] = useState(false);

  const fetchProspect = async () => {
    const res = await fetch(`/api/prospects/${id}`);
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setProspect(data);
    if (data.emailDrafts?.length > 0) {
      setEditSubject(data.emailDrafts[0].subject);
      setEditBody(data.emailDrafts[0].body);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    fetchProspect();
  }, [id]);

  const generateEmail = async () => {
    setGenerating(true);
    await fetch(`/api/prospects/${id}/email`, { method: "POST" });
    await fetchProspect();
    setGenerating(false);
    setEditing(false);
  };

  const saveEdit = async (draftId: string) => {
    await fetch(`/api/prospects/${id}/email`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, subject: editSubject, body: editBody }),
    });
    await fetchProspect();
    setEditing(false);
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchProspect();
  };

  const getMailtoLink = () => {
    if (!prospect?.email || !currentDraft) return "#";
    const subject = encodeURIComponent(currentDraft.subject);
    const body = encodeURIComponent(currentDraft.body);
    return `mailto:${prospect.email}?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return <div className="loading-overlay"><div className="spinner" /> Cargando...</div>;
  }

  if (!prospect) {
    return <div className="empty-state"><h3>Prospecto no encontrado</h3></div>;
  }

  const currentDraft = prospect.emailDrafts?.[0];

  return (
    <>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Link href="/prospects" style={{ color: "var(--text-muted)", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Volver a prospectos
          </Link>
          <h2 style={{ marginTop: "8px" }}>{prospect.businessName}</h2>
          <p>{prospect.category} · {prospect.subZone || prospect.zone}</p>
        </div>
        <div className="action-buttons">
          <span className={`badge badge-score ${prospect.score >= 70 ? "high" : prospect.score >= 40 ? "medium" : "low"}`}>
            Score: {prospect.score}
          </span>
          <span className={`badge badge-status ${prospect.status.toLowerCase()}`}>
            {STATUS_LABELS[prospect.status]}
          </span>
        </div>
      </div>

      <div className="detail-grid">
        {/* Columna izquierda: datos del prospecto */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Información del negocio</div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Email</div>
            <div className="detail-value">
              {prospect.email || <span style={{ color: "var(--text-muted)" }}>No encontrado</span>}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Teléfono</div>
            <div className="detail-value">
              {prospect.phone ? (
                <a href={`tel:${prospect.phone}`}>{prospect.phone}</a>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>No encontrado</span>
              )}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">WhatsApp</div>
            <div className="detail-value">
              {prospect.whatsapp ? (
                <a href={prospect.whatsapp} target="_blank" rel="noopener noreferrer">
                  Abrir chat ↗
                </a>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>No encontrado</span>
              )}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Instagram</div>
            <div className="detail-value">
              {prospect.instagram ? (
                <a href={`https://instagram.com/${prospect.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer">
                  {prospect.instagram} ↗
                </a>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>No encontrado</span>
              )}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Sitio web</div>
            <div className="detail-value">
              {prospect.website ? (
                <a href={prospect.website} target="_blank" rel="noopener noreferrer">
                  {new URL(prospect.website).hostname} ↗
                </a>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>No tiene</span>
              )}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Dirección</div>
            <div className="detail-value">{prospect.address || "—"}</div>
          </div>

          {/* Acciones de estado */}
          <div style={{ marginTop: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {prospect.status === "PENDING" && (
              <>
                <button onClick={() => updateStatus("APPROVED")} className="btn btn-primary btn-sm">Aprobar</button>
                <button onClick={() => updateStatus("DISCARDED")} className="btn btn-danger btn-sm">Descartar</button>
              </>
            )}
            {prospect.status === "APPROVED" && (
              <button onClick={() => updateStatus("SENT")} className="btn btn-success btn-sm">Marcar como enviado</button>
            )}
            {prospect.status === "SENT" && (
              <>
                <button onClick={() => updateStatus("REPLIED")} className="btn btn-success btn-sm">Respondió</button>
                <button onClick={() => updateStatus("CLIENT")} className="btn btn-primary btn-sm">¡Es cliente!</button>
              </>
            )}
            {prospect.status === "REPLIED" && (
              <button onClick={() => updateStatus("CLIENT")} className="btn btn-primary btn-sm">¡Es cliente!</button>
            )}
          </div>
        </div>

        {/* Columna derecha: preview del mail */}
        <div>
          <div className="card" style={{ marginBottom: "16px" }}>
            <div className="card-header">
              <div className="card-title">Mail de prospección</div>
              <div className="action-buttons">
                <button
                  onClick={generateEmail}
                  disabled={generating}
                  className="btn btn-ghost btn-sm"
                >
                  {generating ? "Generando..." : currentDraft ? "🔄 Regenerar" : "✨ Generar mail"}
                </button>
              </div>
            </div>

            {currentDraft ? (
              <>
                {editing ? (
                  <div>
                    <div className="form-group">
                      <label className="form-label">Asunto</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cuerpo</label>
                      <textarea
                        className="form-textarea"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={8}
                      />
                    </div>
                    <div className="action-buttons">
                      <button onClick={() => saveEdit(currentDraft.id)} className="btn btn-primary btn-sm">
                        Guardar
                      </button>
                      <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="email-preview">
                    <div className="email-preview-header">
                      <span className="email-preview-subject">{currentDraft.subject}</span>
                      <button onClick={() => setEditing(true)} className="btn btn-ghost btn-sm">
                        ✏️ Editar
                      </button>
                    </div>
                    <div className="email-preview-body">{currentDraft.body}</div>
                  </div>
                )}

                {prospect.email && !editing && (
                  <a
                    href={getMailtoLink()}
                    className="btn btn-success"
                    style={{ marginTop: "16px", width: "100%", textAlign: "center" }}
                  >
                    📧 Abrir en Gmail / Outlook
                  </a>
                )}

                {!prospect.email && !editing && (
                  <div style={{
                    marginTop: "16px",
                    padding: "12px",
                    background: "rgba(253, 203, 110, 0.1)",
                    border: "1px solid rgba(253, 203, 110, 0.2)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    color: "var(--accent-warning)",
                  }}>
                    Este prospecto no tiene email. Podés contactarlo por WhatsApp, teléfono o Instagram.
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state" style={{ padding: "30px" }}>
                <p>No hay borrador de mail. Hacé click en &quot;Generar mail&quot; para crear uno con IA.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
