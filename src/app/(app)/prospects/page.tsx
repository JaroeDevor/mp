"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Prospect {
  id: string;
  businessName: string;
  category: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  zone: string;
  subZone: string | null;
  score: number;
  status: string;
  foundAt: string;
  emailDrafts: Array<{ id: string; subject: string }>;
}

interface ProspectsResponse {
  prospects: Prospect[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobado" },
  { value: "SENT", label: "Enviado" },
  { value: "DISCARDED", label: "Descartado" },
  { value: "REPLIED", label: "Respondió" },
  { value: "CLIENT", label: "Cliente" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  SENT: "Enviado",
  DISCARDED: "Descartado",
  REPLIED: "Respondió",
  CLIENT: "Cliente",
};

function getScoreClass(score: number): string {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export default function ProspectsPage() {
  const [data, setData] = useState<ProspectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchProspects = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (zoneFilter) params.set("zone", zoneFilter);
    params.set("page", page.toString());
    params.set("sortBy", "score");
    params.set("order", "desc");

    try {
      const res = await fetch(`/api/prospects?${params}`);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("Error fetching prospects");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, zoneFilter, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProspects();
  }, [fetchProspects]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchProspects();
  };

  return (
    <>
      <div className="page-header">
        <h2>Prospectos</h2>
        <p>Revisá, aprobá o descartá los negocios encontrados</p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={zoneFilter}
          onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todas las zonas</option>
          <option value="CABA">CABA</option>
          <option value="ZONA_NORTE">Zona Norte</option>
        </select>

        {data && (
          <span style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {data.pagination.total} prospectos
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading-overlay">
          <div className="spinner" />
          Cargando prospectos...
        </div>
      ) : !data || data.prospects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No hay prospectos</h3>
          <p>Andá a &quot;Buscar&quot; para encontrar nuevos negocios.</p>
        </div>
      ) : (
        <>
          <div className="prospect-list">
            {data.prospects.map((p) => (
              <div key={p.id} className="prospect-row">
                <div>
                  <div className="prospect-name">{p.businessName}</div>
                  <div className="prospect-meta">
                    <span>{p.category}</span>
                    <span>·</span>
                    <span>{p.subZone || p.zone}</span>
                  </div>
                </div>

                <div className="prospect-contact-icons">
                  <span className={`contact-icon ${p.email ? "has" : "missing"}`} title={p.email || "Sin email"}>✉</span>
                  <span className={`contact-icon ${p.phone ? "has" : "missing"}`} title={p.phone || "Sin teléfono"}>📞</span>
                  <span className={`contact-icon ${p.whatsapp ? "has" : "missing"}`} title={p.whatsapp ? "WhatsApp" : "Sin WA"}>💬</span>
                  <span className={`contact-icon ${p.instagram ? "has" : "missing"}`} title={p.instagram || "Sin IG"}>📷</span>
                </div>

                <span className={`badge badge-score ${getScoreClass(p.score)}`}>{p.score}</span>

                <span className={`badge badge-status ${p.status.toLowerCase()}`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>

                <div className="action-buttons">
                  <Link href={`/prospects/${p.id}`} className="btn btn-ghost btn-sm">
                    Ver
                  </Link>
                  {p.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(p.id, "APPROVED")}
                        className="btn btn-primary btn-sm"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => updateStatus(p.id, "DISCARDED")}
                        className="btn btn-danger btn-sm"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Anterior
              </button>
              <span style={{ padding: "6px 12px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {page} / {data.pagination.totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
