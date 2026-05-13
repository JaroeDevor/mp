"use client";

import { useState } from "react";
import { DEFAULT_ZONES, type ZoneConfig } from "@/lib/zones";

interface SearchResult {
  message: string;
  created: number;
  skipped: number;
  total: number;
  results: Array<{
    name: string;
    score: number;
    hasEmail: boolean;
    hasPhone: boolean;
    hasWhatsapp: boolean;
  }>;
}

export default function SearchPage() {
  const [selectedZones, setSelectedZones] = useState<ZoneConfig[]>([]);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");

  const cabaZones = DEFAULT_ZONES.filter((z) => z.zone === "CABA");
  const norteZones = DEFAULT_ZONES.filter((z) => z.zone === "ZONA_NORTE");

  const toggleZone = (zone: ZoneConfig) => {
    setSelectedZones((prev) =>
      prev.some((z) => z.id === zone.id)
        ? prev.filter((z) => z.id !== zone.id)
        : [...prev, zone]
    );
  };

  const toggleAll = () => {
    if (selectedZones.length === DEFAULT_ZONES.length) {
      setSelectedZones([]);
    } else {
      setSelectedZones([...DEFAULT_ZONES]);
    }
  };



  const runSearch = async () => {
    if (selectedZones.length === 0) {
      setError("Seleccioná al menos una zona primero");
      return;
    }

    setError("");
    setSearching(true);
    setResult(null);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalFound = 0;
    let allResults: SearchResult["results"] = [];

    try {
      for (const zone of selectedZones) {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `negocios locales ${zone.name}`,
            latitude: zone.latitude,
            longitude: zone.longitude,
            radiusMeters: zone.radiusMeters,
            zone: zone.zone,
            subZone: zone.name,
          }),
        });

        const data = await res.json();
        
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || `Error en la búsqueda para ${zone.name}`);
        }

        totalCreated += data.created;
        totalSkipped += data.skipped;
        totalFound += data.total;
        allResults = [...allResults, ...data.results];
      }

      setResult({
        message: `Búsqueda completada: ${totalCreated} nuevos, ${totalSkipped} duplicados en ${selectedZones.length} zona(s)`,
        created: totalCreated,
        skipped: totalSkipped,
        total: totalFound,
        results: allResults,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error de conexión");
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Buscar prospectos</h2>
        <p>Elegí una o más zonas para encontrar negocios</p>
      </div>

      {/* Paso 1: Elegir zona */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="card-title">1. Elegí la(s) zona(s)</div>
          <button 
            className={`btn ${selectedZones.length === DEFAULT_ZONES.length ? "btn-primary" : "btn-ghost"} btn-sm`}
            onClick={toggleAll}
          >
            {selectedZones.length === DEFAULT_ZONES.length ? "Desmarcar Todas" : "Seleccionar Todas"}
          </button>
        </div>

        <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>CABA</h4>
        <div className="search-grid" style={{ marginBottom: "20px" }}>
          {cabaZones.map((zone) => (
            <div
              key={zone.id}
              className={`zone-card ${selectedZones.some(z => z.id === zone.id) ? "selected" : ""}`}
              onClick={() => toggleZone(zone)}
            >
              <div className="zone-name">{zone.name}</div>
              <div className="zone-area">Radio: {zone.radiusMeters / 1000} km</div>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>ZONA NORTE</h4>
        <div className="search-grid">
          {norteZones.map((zone) => (
            <div
              key={zone.id}
              className={`zone-card ${selectedZones.some(z => z.id === zone.id) ? "selected" : ""}`}
              onClick={() => toggleZone(zone)}
            >
              <div className="zone-name">{zone.name}</div>
              <div className="zone-area">Radio: {zone.radiusMeters / 1000} km</div>
            </div>
          ))}
        </div>
      </div>

      {/* Paso 2: Ejecutar */}
      {error && (
        <div className="login-error" style={{ marginBottom: "16px" }}>{error}</div>
      )}

      <button
        onClick={runSearch}
        disabled={searching}
        className="btn btn-primary"
        style={{ width: "100%", padding: "14px", fontSize: "1rem", marginBottom: "24px" }}
      >
        {searching ? (
          <>
            <div className="spinner" style={{ borderTopColor: "white" }} />
            Buscando... (esto puede tardar unos minutos)
          </>
        ) : (
          "🔍 Buscar negocios"
        )}
      </button>

      {/* Resultados */}
      {result && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Resultados</div>
            <span style={{ fontSize: "0.85rem", color: "var(--accent-success)" }}>
              {result.message}
            </span>
          </div>

          {result.results.length > 0 ? (
            <div className="prospect-list">
              {result.results.map((r, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{r.name}</div>
                    <div style={{ display: "flex", gap: "8px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {r.hasEmail && <span style={{ color: "var(--accent-success)" }}>✉ Email</span>}
                      {r.hasPhone && <span style={{ color: "var(--accent-success)" }}>📞 Tel</span>}
                      {r.hasWhatsapp && <span style={{ color: "var(--accent-success)" }}>💬 WA</span>}
                    </div>
                  </div>
                  <span className={`badge badge-score ${r.score >= 70 ? "high" : r.score >= 40 ? "medium" : "low"}`}>
                    {r.score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", padding: "16px 0" }}>
              No se encontraron negocios nuevos (todos ya estaban cargados).
            </p>
          )}
        </div>
      )}
    </>
  );
}
