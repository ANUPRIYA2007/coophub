import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import {
    Globe, ChevronRight, ChevronDown, Search, X, RefreshCw,
    Building2, MapPin, Layers, AlertCircle, Loader2, Filter,
    Home, ArrowLeft, CheckCircle2, Hash, Landmark
} from "lucide-react";
import {
    getGeographySummary, getZones, getZoneStates,
    getStateDetail, getStateDistricts, searchGeography
} from "../../../services/admin/geographyService";

// ─── Zone color palette (using COOP HUB brand tokens) ────────────────────────
const ZONE_PALETTE = {
    SZ: { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", label: "South" },
    NZ: { color: "#3B82F6", bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", label: "North" },
    WZ: { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", label: "West" },
    EZ: { color: "#FF7900", bg: "rgba(255, 121, 0, 0.12)", border: "rgba(255, 121, 0, 0.3)", label: "East" },
};

// ─── Reusable styled card ─────────────────────────────────────────────────────
function GeoCard({ children, style = {}, onClick }) {
    const { isDark } = useTheme();
    return (
        <div
            onClick={onClick}
            style={{
                background: isDark ? "#0A1220" : "#FFFFFF",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "18px",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.18s ease",
                ...style
            }}
            onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = "#FF7900"; }}
            onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"; }}
        >
            {children}
        </div>
    );
}

// ─── Summary metric pill ──────────────────────────────────────────────────────
function MetricPill({ label, value, color = "#FF7900" }) {
    const { isDark } = useTheme();
    return (
        <div style={{ textAlign: "center", padding: "14px 10px" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: "800", color, lineHeight: 1 }}>
                {value ?? "—"}
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: "600", color: isDark ? "#94A3B8" : "#64748B", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}
            </div>
        </div>
    );
}

// ─── Breadcrumb component ─────────────────────────────────────────────────────
function Breadcrumb({ crumbs, onNavigate }) {
    const { isDark } = useTheme();
    return (
        <nav style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", marginBottom: "20px" }}>
            {crumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.key}>
                    {idx > 0 && <ChevronRight size={14} color={isDark ? "#94A3B8" : "#64748B"} />}
                    <button
                        onClick={() => onNavigate(crumb)}
                        style={{
                            background: "none", border: "none", cursor: idx === crumbs.length - 1 ? "default" : "pointer",
                            color: idx === crumbs.length - 1 ? (isDark ? "#FFFFFF" : "#0F172A") : "#FF7900",
                            fontWeight: idx === crumbs.length - 1 ? "800" : "600",
                            fontSize: "13px", padding: "2px 4px", borderRadius: "4px",
                            textDecoration: "none"
                        }}
                    >
                        {crumb.label}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
    const isUT = type === "UNION_TERRITORY";
    return (
        <span style={{
            fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "9999px",
            background: isUT ? "rgba(59,130,246,0.12)" : "rgba(16,185,129,0.12)",
            color: isUT ? "#3B82F6" : "#10B981",
            border: isUT ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(16,185,129,0.3)",
            textTransform: "uppercase", letterSpacing: "0.5px"
        }}>
            {isUT ? "UT" : "State"}
        </span>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon = MapPin, title, description }) {
    const { isDark } = useTheme();
    return (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 14px", color: isDark ? "#94A3B8" : "#94A3B8"
            }}>
                <Icon size={24} />
            </div>
            <div style={{ fontWeight: "700", fontSize: "14px", color: isDark ? "#CBD5E1" : "#334155", marginBottom: "6px" }}>
                {title}
            </div>
            <div style={{ fontSize: "12.5px", color: isDark ? "#94A3B8" : "#64748B" }}>{description}</div>
        </div>
    );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
function LoadingState({ message = "Loading..." }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "48px" }}>
            <Loader2 size={20} color="#FF7900" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ color: "#94A3B8", fontSize: "13px" }}>{message}</span>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
    return (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <AlertCircle size={28} color="#EF4444" style={{ marginBottom: "10px" }} />
            <div style={{ fontWeight: "700", color: "#EF4444", marginBottom: "6px", fontSize: "14px" }}>Failed to load data</div>
            <div style={{ color: "#94A3B8", fontSize: "12.5px", marginBottom: "14px" }}>{message}</div>
            {onRetry && (
                <button onClick={onRetry} style={{
                    background: "#FF7900", color: "#050A12", border: "none", borderRadius: "8px",
                    padding: "8px 16px", fontWeight: "700", fontSize: "12.5px", cursor: "pointer"
                }}>
                    Retry
                </button>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function SuperAdminGeography() {
    const { t } = useTranslation();
    const { isDark } = useTheme();

    // ── Navigation state (drill-down levels) ──────────────────────────────────
    // level: 'india' | 'zone' | 'state' | 'district'
    const [level, setLevel] = useState("india");
    const [selectedZone, setSelectedZone] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    // ── Data state ────────────────────────────────────────────────────────────
    const [summary, setSummary] = useState(null);
    const [zones, setZones] = useState([]);
    const [zoneDetail, setZoneDetail] = useState(null);   // { zone, states, union_territories }
    const [stateDetail, setStateDetail] = useState(null);
    const [districts, setDistricts] = useState([]);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [filterType, setFilterType] = useState("ALL");
    const [filterZone, setFilterZone] = useState("ALL");

    const searchDebounceRef = useRef(null);

    // ── Breadcrumbs ───────────────────────────────────────────────────────────
    const buildCrumbs = () => {
        const crumbs = [{ key: "india", label: "🇮🇳 India" }];
        if (selectedZone) crumbs.push({ key: "zone", label: selectedZone.name });
        if (selectedState) crumbs.push({ key: "state", label: selectedState.name || selectedState });
        if (selectedDistrict) crumbs.push({ key: "district", label: selectedDistrict.name });
        return crumbs;
    };

    const handleCrumbNav = (crumb) => {
        if (crumb.key === "india") { resetToIndia(); }
        else if (crumb.key === "zone") { goToZone(selectedZone); }
        else if (crumb.key === "state") { goToState(selectedState); }
    };

    // ── Load national summary + zones on mount ────────────────────────────────
    const loadIndia = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [summaryData, zonesData] = await Promise.all([getGeographySummary(), getZones()]);
            setSummary(summaryData);
            setZones(zonesData.zones || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadIndia(); }, [loadIndia]);

    const resetToIndia = () => {
        setLevel("india");
        setSelectedZone(null);
        setSelectedState(null);
        setSelectedDistrict(null);
        setZoneDetail(null);
        setStateDetail(null);
        setDistricts([]);
        setSearchQuery("");
        setSearchResults(null);
    };

    // ── Zone drill-down ───────────────────────────────────────────────────────
    const goToZone = async (zone) => {
        setSelectedZone(zone);
        setSelectedState(null);
        setSelectedDistrict(null);
        setLevel("zone");
        setLoading(true);
        setError(null);
        try {
            const data = await getZoneStates(zone.code);
            setZoneDetail(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── State drill-down ──────────────────────────────────────────────────────
    const goToState = async (state) => {
        setSelectedState(state);
        setSelectedDistrict(null);
        setLevel("state");
        setLoading(true);
        setError(null);
        try {
            const [detail, distData] = await Promise.all([
                getStateDetail(state.code),
                getStateDistricts(state.code, 1, 50)
            ]);
            setStateDetail(detail);
            setDistricts(distData.districts || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Search (debounced, 350ms) ─────────────────────────────────────────────
    const handleSearch = (q) => {
        setSearchQuery(q);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!q.trim()) { setSearchResults(null); return; }
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await searchGeography({
                    q,
                    zone: filterZone !== "ALL" ? filterZone : "",
                    type: filterType !== "ALL" ? filterType : "",
                    limit: 30
                });
                setSearchResults(res.results || []);
            } catch {}
            setSearchLoading(false);
        }, 350);
    };

    const handleSearchResultClick = async (result) => {
        setSearchQuery("");
        setSearchResults(null);
        if (result.level === "ZONE") {
            const zone = zones.find(z => z.code === result.code);
            if (zone) goToZone(zone);
        } else if (result.level === "STATE" || result.level === "UNION_TERRITORY") {
            // Navigate to zone first, then state
            const matchZone = zones.find(z => z.code === result.zone_code);
            if (matchZone) {
                await goToZone(matchZone);
                await goToState(result);
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    const renderSummaryBar = () => (
        <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "1px", background: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
            borderRadius: "14px", overflow: "hidden", marginBottom: "24px"
        }}>
            {[
                { label: t("Zones"), value: summary?.total_zones, color: "#FF7900" },
                { label: t("States"), value: summary?.total_states, color: "#10B981" },
                { label: t("Union Territories"), value: summary?.total_union_territories, color: "#3B82F6" },
                { label: t("State/UT Units"), value: summary?.total_units, color: "#F59E0B" },
                { label: t("Districts"), value: summary?.total_districts === 0 ? "0" : (summary?.total_districts || "—"), color: "#94A3B8" },
                { label: t("Cooperatives"), value: summary?.total_cooperatives === 0 ? "0" : (summary?.total_cooperatives || "—"), color: "#94A3B8" },
            ].map(m => (
                <div key={m.label} style={{ background: isDark ? "#0A1220" : "#FFFFFF" }}>
                    <MetricPill label={m.label} value={m.value} color={m.color} />
                </div>
            ))}
        </div>
    );

    const renderZoneCards = () => {
        // Apply filter
        const filtered = zones.filter(z => filterZone === "ALL" || z.code === filterZone);
        return (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {filtered.map(zone => {
                    const palette = ZONE_PALETTE[zone.code] || { color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)", label: zone.code };
                    return (
                        <GeoCard key={zone.code} onClick={() => goToZone(zone)} style={{ borderLeft: `4px solid ${palette.color}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                <div>
                                    <div style={{ fontSize: "10px", fontWeight: "800", color: palette.color, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                                        {zone.code}
                                    </div>
                                    <h3 style={{ margin: 0, fontWeight: "800", fontSize: "1.05rem", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                                        {zone.name}
                                    </h3>
                                    {zone.description && (
                                        <p style={{ margin: "4px 0 0", fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                                            {zone.description}
                                        </p>
                                    )}
                                </div>
                                <span style={{
                                    background: palette.bg, color: palette.color, border: `1px solid ${palette.border}`,
                                    fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", flexShrink: 0
                                }}>
                                    {palette.label}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "12px" }}>
                                {[
                                    { label: "States", value: zone.state_count ?? 0 },
                                    { label: "UTs", value: zone.ut_count ?? 0 },
                                    { label: "Total", value: zone.total_units ?? 0 },
                                    { label: "Districts", value: zone.district_count ?? 0 },
                                    { label: "Coops", value: zone.cooperative_count ?? 0 },
                                ].map(stat => (
                                    <div key={stat.label} style={{
                                        background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                        borderRadius: "8px", padding: "8px", textAlign: "center"
                                    }}>
                                        <div style={{ fontWeight: "800", fontSize: "15px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{stat.value}</div>
                                        <div style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{stat.label}</div>
                                    </div>
                                ))}
                                <div style={{
                                    background: palette.bg, border: `1px solid ${palette.border}`,
                                    borderRadius: "8px", padding: "8px", textAlign: "center",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"
                                }}>
                                    <ChevronRight size={14} color={palette.color} />
                                    <span style={{ fontSize: "10px", color: palette.color, fontWeight: "800" }}>Explore</span>
                                </div>
                            </div>
                        </GeoCard>
                    );
                })}
            </div>
        );
    };

    const renderZoneDrillDown = () => {
        if (!zoneDetail) return null;
        const palette = ZONE_PALETTE[selectedZone?.code] || { color: "#FF7900", bg: "rgba(255,121,0,0.1)", border: "rgba(255,121,0,0.3)", label: selectedZone?.code };

        const allStates = [...(zoneDetail.states || []), ...(zoneDetail.union_territories || [])];
        const filteredItems = allStates.filter(s => {
            if (filterType === "STATE") return s.type === "STATE";
            if (filterType === "UNION_TERRITORY") return s.type === "UNION_TERRITORY";
            return true;
        });

        return (
            <div>
                {/* Zone header */}
                <div style={{
                    background: palette.bg, border: `1px solid ${palette.border}`,
                    borderRadius: "14px", padding: "16px 20px", marginBottom: "20px",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                    <div>
                        <div style={{ fontWeight: "800", fontSize: "1.1rem", color: palette.color }}>{selectedZone?.name}</div>
                        <div style={{ fontSize: "12px", color: isDark ? "#CBD5E1" : "#475569" }}>
                            {zoneDetail.state_count} States · {zoneDetail.ut_count} Union Territories · {zoneDetail.total_units} total
                        </div>
                    </div>
                    <Layers size={24} color={palette.color} />
                </div>

                {/* States/UTs grid */}
                {filteredItems.length === 0 ? (
                    <EmptyState icon={MapPin} title="No State/UT records" description="No states or union territories found for this zone." />
                ) : (
                    <>
                        {/* States section */}
                        {(filterType === "ALL" || filterType === "STATE") && zoneDetail.states?.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#10B981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <CheckCircle2 size={13} /> States ({zoneDetail.states.length})
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
                                    {zoneDetail.states.map(s => renderStateCard(s))}
                                </div>
                            </div>
                        )}

                        {/* Union Territories section */}
                        {(filterType === "ALL" || filterType === "UNION_TERRITORY") && zoneDetail.union_territories?.length > 0 && (
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#3B82F6", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Landmark size={13} /> Union Territories ({zoneDetail.union_territories.length})
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
                                    {zoneDetail.union_territories.map(s => renderStateCard(s))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderStateCard = (s) => {
        const palette = ZONE_PALETTE[s.zone_code] || { color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.3)" };
        return (
            <GeoCard key={s.code} onClick={() => goToState(s)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                        <div style={{ fontWeight: "800", fontSize: "13.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{s.name}</div>
                        {s.capital && <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>Capital: {s.capital}</div>}
                    </div>
                    <TypeBadge type={s.type} />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "8px", fontSize: "11px" }}>
                    <span style={{ color: isDark ? "#CBD5E1" : "#475569" }}>
                        <strong style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>{s.district_count ?? 0}</strong> Districts
                    </span>
                    <span style={{ color: isDark ? "#CBD5E1" : "#475569" }}>
                        <strong style={{ color: isDark ? "#FFFFFF" : "#0F172A" }}>{s.cooperative_count ?? 0}</strong> Coops
                    </span>
                </div>
            </GeoCard>
        );
    };

    const renderStateDrillDown = () => {
        if (!stateDetail && !selectedState) return null;
        const detail = stateDetail || selectedState;
        const palette = ZONE_PALETTE[detail.zone_code || detail.zone?.code] || { color: "#FF7900", bg: "rgba(255,121,0,0.1)", border: "rgba(255,121,0,0.3)" };

        return (
            <div>
                {/* State header */}
                <div style={{
                    background: isDark ? "#0A1220" : "#FFFFFF",
                    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                    borderRadius: "14px", padding: "20px", marginBottom: "20px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                <h2 style={{ margin: 0, fontWeight: "800", fontSize: "1.25rem", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                                    {detail.name}
                                </h2>
                                <TypeBadge type={detail.type || "STATE"} />
                            </div>
                            {detail.capital && <div style={{ fontSize: "12.5px", color: isDark ? "#94A3B8" : "#64748B" }}>Capital: {detail.capital}</div>}
                            {detail.zone && <div style={{ fontSize: "12px", color: palette.color, fontWeight: "700", marginTop: "4px" }}>Zone: {detail.zone.name}</div>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>District Count</div>
                            <div style={{ fontWeight: "800", fontSize: "1.5rem", color: isDark ? "#FFFFFF" : "#0F172A" }}>{detail.district_count ?? districts.length}</div>
                        </div>
                    </div>
                </div>

                {/* Districts */}
                <div style={{ fontWeight: "800", fontSize: "14px", color: isDark ? "#FFFFFF" : "#0F172A", marginBottom: "12px" }}>
                    Districts ({districts.length})
                </div>

                {districts.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No districts registered"
                        description={`No district records exist for ${detail.name} yet. Districts will appear here once added to the database.`}
                    />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
                        {districts.map(d => (
                            <GeoCard key={d.code}>
                                <div style={{ fontWeight: "700", fontSize: "13.5px", color: isDark ? "#FFFFFF" : "#0F172A", marginBottom: "4px" }}>
                                    {d.name}
                                </div>
                                <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                                    {d.cooperative_count ?? 0} Cooperatives
                                </div>
                                <div style={{ fontSize: "10.5px", fontFamily: "monospace", color: isDark ? "#64748B" : "#94A3B8", marginTop: "4px" }}>
                                    {d.code}
                                </div>
                            </GeoCard>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderSearchResults = () => {
        if (!searchResults) return null;
        const levelColors = { ZONE: "#FF7900", STATE: "#10B981", UNION_TERRITORY: "#3B82F6", DISTRICT: "#F59E0B", COOPERATIVE: "#8B5CF6" };
        return (
            <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
                background: isDark ? "#0A1220" : "#FFFFFF",
                border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #E2E8F0",
                borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                maxHeight: "360px", overflowY: "auto", marginTop: "4px"
            }}>
                {searchLoading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>Searching...</div>
                ) : searchResults.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>No results found for "{searchQuery}"</div>
                ) : searchResults.map((r, i) => (
                    <button
                        key={i}
                        onClick={() => handleSearchResultClick(r)}
                        style={{
                            display: "flex", alignItems: "center", gap: "10px", width: "100%",
                            padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
                            borderBottom: i < searchResults.length - 1 ? (isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #F1F5F9") : "none",
                            textAlign: "left"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC"}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                        <span style={{
                            fontSize: "9px", fontWeight: "800", padding: "2px 6px", borderRadius: "4px",
                            background: `${levelColors[r.level]}18`, color: levelColors[r.level] || "#94A3B8",
                            flexShrink: 0, textTransform: "uppercase"
                        }}>{r.level === "UNION_TERRITORY" ? "UT" : r.level}</span>
                        <span style={{ fontWeight: "700", fontSize: "13px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{r.name}</span>
                        {r.zone_code && <span style={{ fontSize: "11px", color: "#94A3B8", marginLeft: "auto" }}>{r.zone_code}</span>}
                    </button>
                ))}
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="fade-in" style={{ paddingBottom: "40px" }}>

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "800", color: "#FF7900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                        <span>🇮🇳 SUPER ADMIN</span><ChevronRight size={12} /><span>Geography</span>
                    </div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
                        All-India Geography Command
                    </h1>
                    <p style={{ margin: "4px 0 0", color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
                        National 5-tier hierarchy — India → Zone → State/UT → District → Cooperative
                    </p>
                </div>
                <button
                    onClick={resetToIndia}
                    disabled={loading}
                    style={{
                        background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                        border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #CBD5E1",
                        color: isDark ? "#E2E8F0" : "#334155", padding: "8px 16px",
                        borderRadius: "8px", fontWeight: "700", fontSize: "12.5px",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                    }}
                >
                    <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} />
                    Refresh
                </button>
            </div>

            {/* ── Breadcrumb ───────────────────────────────────────────────── */}
            {level !== "india" && (
                <Breadcrumb crumbs={buildCrumbs()} onNavigate={handleCrumbNav} />
            )}

            {/* ── Summary bar (India level only) ──────────────────────────── */}
            {level === "india" && summary && renderSummaryBar()}

            {/* ── Search + Filter bar ──────────────────────────────────────── */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", position: "relative" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search zones, states, districts, cooperatives..."
                        style={{
                            width: "100%", paddingLeft: "36px", paddingRight: searchQuery ? "36px" : "12px",
                            height: "40px", borderRadius: "10px", fontSize: "13px", fontWeight: "500",
                            background: isDark ? "#0A1220" : "#FFFFFF",
                            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2E8F0",
                            color: isDark ? "#FFFFFF" : "#0F172A", outline: "none",
                            boxSizing: "border-box"
                        }}
                        onFocus={e => e.target.style.borderColor = "#FF7900"}
                        onBlur={e => e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setSearchResults(null); }} style={{
                            position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0
                        }}>
                            <X size={15} />
                        </button>
                    )}
                    {(searchResults !== null || searchLoading) && renderSearchResults()}
                </div>

                {/* Zone filter */}
                <select
                    value={filterZone}
                    onChange={e => setFilterZone(e.target.value)}
                    style={{
                        height: "40px", borderRadius: "10px", padding: "0 32px 0 12px",
                        fontSize: "13px", fontWeight: "600",
                        background: isDark ? "#0A1220" : "#FFFFFF",
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2E8F0",
                        color: isDark ? "#FFFFFF" : "#0F172A", cursor: "pointer", minWidth: "120px"
                    }}
                >
                    <option value="ALL">All Zones</option>
                    {zones.map(z => <option key={z.code} value={z.code}>{z.name}</option>)}
                </select>

                {/* Type filter */}
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{
                        height: "40px", borderRadius: "10px", padding: "0 32px 0 12px",
                        fontSize: "13px", fontWeight: "600",
                        background: isDark ? "#0A1220" : "#FFFFFF",
                        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #E2E8F0",
                        color: isDark ? "#FFFFFF" : "#0F172A", cursor: "pointer", minWidth: "140px"
                    }}
                >
                    <option value="ALL">All Types</option>
                    <option value="STATE">States Only</option>
                    <option value="UNION_TERRITORY">UTs Only</option>
                </select>
            </div>

            {/* ── Main content area ────────────────────────────────────────── */}
            {error ? (
                <ErrorState message={error} onRetry={loadIndia} />
            ) : loading ? (
                <LoadingState message={
                    level === "india" ? "Loading national geography data..." :
                    level === "zone" ? `Loading ${selectedZone?.name} states...` :
                    level === "state" ? `Loading ${selectedState?.name} districts...` :
                    "Loading..."
                } />
            ) : (
                <>
                    {level === "india" && renderZoneCards()}
                    {level === "zone" && renderZoneDrillDown()}
                    {level === "state" && renderStateDrillDown()}
                </>
            )}

            {/* ── Data source transparency notice ─────────────────────────── */}
            <div style={{
                marginTop: "32px", padding: "12px 16px",
                background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #E2E8F0",
                borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px"
            }}>
                <Hash size={13} color="#94A3B8" />
                <span style={{ fontSize: "11.5px", color: isDark ? "#64748B" : "#94A3B8" }}>
                    All geographic data is database-derived (geo_zones, geo_states, geo_districts, geo_cooperatives).
                    No data on this page is hardcoded or mocked. District and cooperative counts reflect only actual registered records.
                </span>
            </div>
        </div>
    );
}
