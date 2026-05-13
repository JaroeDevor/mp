"use client";

import { useState, useEffect } from "react";
import { DEFAULT_ZONES } from "@/lib/zones";

interface SearchConfig {
  id: string;
  query: string;
  zone: string;
  subZone: string | null;
  active: boolean;
  lastRunAt: string | null;
  prospectsFound: number;
}

export default function SearchesConfigPage() {
  const [configs, setConfigs] = useState<SearchConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState("");

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/searches");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfigs();
  }, []);

  const handleAdd = async () => {
    if (!selectedZoneId) return;
    
    const zone = DEFAULT_ZONES.find(z => z.id === selectedZoneId);
    if (!zone) return;

    setAdding(true);
    try {
      await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `negocios locales ${zone.name}`,
          zone: zone.zone,
          subZone: zone.name,
          latitude: zone.latitude,
          longitude: zone.longitude,
          radiusMeters: zone.radiusMeters
        })
      });
      setSelectedZoneId("");
      await fetchConfigs();
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/searches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive })
      });
      await fetchConfigs();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteConfig = async (id: string) => {
    if (!confirm("¿Eliminar esta configuración?")) return;
    try {
      await fetch(`/api/searches/${id}`, { method: "DELETE" });
      await fetchConfigs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>Búsquedas Automáticas</h2>
          <p>Configurá las zonas que la app debe buscar todos los días (Cron Job).</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div className="card-title">Agregar nueva zona al escaneo diario</div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select 
            className="filter-select" 
            style={{ flex: 1 }}
            value={selectedZoneId}
            onChange={e => setSelectedZoneId(e.target.value)}
          >
            <option value="">Seleccioná una zona...</option>
            {DEFAULT_ZONES.map(z => (
              <option key={z.id} value={z.id}>{z.zone} - {z.name}</option>
            ))}
          </select>
          <button 
            className="btn btn-primary"
            disabled={!selectedZoneId || adding}
            onClick={handleAdd}
          >
            {adding ? "Agregando..." : "+ Agregar zona"}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Zonas configuradas ({configs.length})</div>
        </div>

        {loading ? (
          <div className="loading-overlay">
            <div className="spinner" />
            Cargando configuraciones...
          </div>
        ) : configs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <h3>No hay búsquedas automáticas</h3>
            <p>Agregá una zona para que la app trabaje por vos todos los días.</p>
          </div>
        ) : (
          <div className="prospect-list">
            {configs.map(config => (
              <div key={config.id} className="prospect-row" style={{ alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div className="prospect-name">{config.subZone || config.zone}</div>
                  <div className="prospect-meta" style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                    <span>{config.query}</span>
                    <span style={{ color: "var(--accent-success)" }}>
                      {config.prospectsFound} encontrados en total
                    </span>
                    <span>
                      Última vez: {config.lastRunAt ? new Date(config.lastRunAt).toLocaleDateString() : "Nunca"}
                    </span>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className={`btn ${config.active ? "btn-success" : "btn-ghost"} btn-sm`}
                    onClick={() => toggleActive(config.id, config.active)}
                  >
                    {config.active ? "ON" : "OFF"}
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteConfig(config.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
