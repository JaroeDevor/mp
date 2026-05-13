"use client";

import { useEffect, useState } from "react";

interface Stats {
  totalProspects: number;
  pending: number;
  approved: number;
  sent: number;
  replied: number;
  clients: number;
  discarded: number;
  newThisWeek: number;
  sentThisWeek: number;
  avgScore: number;
  responseRate: number;
  funnel: {
    found: number;
    approved: number;
    sent: number;
    replied: number;
    clients: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => {
        if (res.status === 401) window.location.href = "/login";
        if (!res.ok) throw new Error("Error fetching stats");
        return res.json();
      })
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        Cargando métricas...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>Sin datos todavía</h3>
        <p>Hacé tu primera búsqueda para empezar a ver métricas.</p>
      </div>
    );
  }

  const maxFunnel = stats.funnel.found || 1;

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Resumen general de tu prospección</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total prospectos</div>
          <div className="stat-value accent">{stats.totalProspects}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pendientes de revisión</div>
          <div className="stat-value warning">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mails enviados</div>
          <div className="stat-value info">{stats.sent}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tasa de respuesta</div>
          <div className="stat-value success">{stats.responseRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Clientes ganados</div>
          <div className="stat-value success">{stats.clients}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Score promedio</div>
          <div className="stat-value accent">{stats.avgScore}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Embudo de conversión</div>
        </div>
        <div className="funnel">
          {[
            { label: "Encontrados", value: stats.funnel.found, color: "var(--accent-primary)" },
            { label: "Aprobados", value: stats.funnel.approved, color: "var(--accent-secondary)" },
            { label: "Enviados", value: stats.funnel.sent, color: "var(--accent-warning)" },
            { label: "Respondieron", value: stats.funnel.replied, color: "var(--accent-success)" },
            { label: "Clientes", value: stats.funnel.clients, color: "#00b894" },
          ].map((step) => (
            <div className="funnel-step" key={step.label}>
              <div
                className="funnel-bar"
                style={{
                  width: `${Math.max((step.value / maxFunnel) * 100, 8)}%`,
                  background: step.color,
                }}
              >
                {step.value}
              </div>
              <span className="funnel-label">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Esta semana</div>
          </div>
          <div style={{ display: "flex", gap: "32px", paddingTop: "8px" }}>
            <div>
              <div className="stat-label">Nuevos prospectos</div>
              <div className="stat-value accent" style={{ fontSize: "1.5rem" }}>{stats.newThisWeek}</div>
            </div>
            <div>
              <div className="stat-label">Mails enviados</div>
              <div className="stat-value info" style={{ fontSize: "1.5rem" }}>{stats.sentThisWeek}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Por estado</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px" }}>
            {[
              { label: "Aprobados", value: stats.approved, cls: "approved" },
              { label: "Respondieron", value: stats.replied, cls: "replied" },
              { label: "Descartados", value: stats.discarded, cls: "discarded" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={`badge badge-status ${item.cls}`}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
