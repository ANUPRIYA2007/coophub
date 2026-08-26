import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarProfileService } from "../../../services/pillar/profileService";
import { pillarOrderService } from "../../../services/pillar/orderService";
import { pillarEarningsService } from "../../../services/pillar/earningsService";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  ClipboardList,
  Wallet,
  Clock,
  TrendingUp,
  MapPin,
  Calendar,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Phone,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [isAvailable, setIsAvailable] = useState(true);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [orderMetrics, setOrderMetrics] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    nextBooking: null,
  });

  const [earningsSummary, setEarningsSummary] = useState({
    today: 0,
    total: 0,
    pending: 0,
    paid: 0,
  });

  useEffect(() => {
    if (profile?.is_available !== undefined) {
      setIsAvailable(profile.is_available);
    }
  }, [profile]);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoadingMetrics(false);
        return;
      }
      setLoadingMetrics(true);

      const [ordersRes, earningsRes] = await Promise.all([
        pillarOrderService.getOrders(user.id),
        pillarEarningsService.getEarningsSummary(user.id),
      ]);

      const allOrders = ordersRes.data || [];
      const pendingList = allOrders.filter((o) => o.status === "pending");
      const activeList = allOrders.filter((o) => ["accepted", "onTheWay", "arrived", "inProgress"].includes(o.status));
      const completedList = allOrders.filter((o) => o.status === "completed");

      setOrderMetrics({
        pending: pendingList.length,
        active: activeList.length,
        completed: completedList.length,
        nextBooking: pendingList[0] || activeList[0] || null,
      });

      if (earningsRes && earningsRes.summary) {
        setEarningsSummary(earningsRes.summary);
      }

      setLoadingMetrics(false);

      // GSAP Stagger Entrance for Dashboard elements
      setTimeout(() => {
        gsap.fromTo(
          ".gsap-fade-card",
          { opacity: 0, y: 22, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: "power2.out" }
        );
      }, 50);
    }

    loadData();
  }, [user]);

  const handleToggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    setLoadingToggle(true);
    if (user?.id) {
      await pillarProfileService.updateAvailability(user.id, nextState);
    }
    setLoadingToggle(false);
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      {/* Top Banner: Greeting & Live Availability Toggle */}
      <div
        className="card gsap-fade-card"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
          color: "white",
          marginBottom: "var(--space-6)",
          padding: "var(--space-6)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 10px 25px rgba(27, 42, 74, 0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <span className="badge badge-secondary" style={{ color: "white", fontWeight: "700" }}>Pillar Portal</span>
              <span style={{ fontSize: "var(--font-size-xs)", opacity: 0.95, fontWeight: "700", letterSpacing: "0.5px" }}>ID: {profile?.pillar_code || "PIL-CHE-042"}</span>
            </div>
            <h1 style={{ fontSize: "var(--font-size-3xl)", fontWeight: "800", margin: 0, color: "white" }}>
              {t("common.welcome")}, {profile?.full_name || "Pillar"}!
            </h1>
            <p style={{ opacity: 0.9, fontSize: "var(--font-size-sm)", marginTop: "4px" }}>
              {isAvailable
                ? "You are currently ONLINE and ready to receive customer bookings."
                : "You are currently OFFLINE. Switch on to start accepting incoming service requests."}
            </p>
          </div>

          {/* Availability Switch */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              padding: "var(--space-3) var(--space-5)",
              borderRadius: "var(--radius-xl)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <span className={`status-dot ${isAvailable ? "available" : "offline"}`} style={{ width: "10px", height: "10px" }}></span>
              <span style={{ fontWeight: "700", fontSize: "var(--font-size-sm)", color: "white" }}>
                {isAvailable ? t("dashboard.available") : t("dashboard.offline")}
              </span>
            </div>

            <button
              className={`btn btn-sm ${isAvailable ? "btn-success" : "btn-outline"}`}
              style={{ color: "white", borderColor: "white" }}
              onClick={handleToggleAvailability}
              disabled={loadingToggle}
            >
              {isAvailable ? "Go Offline" : "Go Online"}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-4" style={{ marginBottom: "var(--space-6)" }}>
        <div className="card gsap-fade-card" onClick={() => navigate("/dashboard/orders")} style={{ cursor: "pointer" }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", fontWeight: "500" }}>
                {t("dashboard.todayOrders")}
              </span>
              <span style={{ background: "rgba(27, 42, 74, 0.08)", padding: "8px", borderRadius: "var(--radius-md)", color: "var(--color-primary)" }}>
                <ClipboardList size={20} />
              </span>
            </div>
            <div style={{ fontSize: "var(--font-size-3xl)", fontWeight: "800", color: "var(--color-primary)", marginTop: "var(--space-2)" }}>
              {orderMetrics.pending + orderMetrics.active} Active
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
              <TrendingUp size={12} /> {orderMetrics.pending} new pending request(s)
            </span>
          </div>
        </div>

        <div className="card gsap-fade-card" onClick={() => navigate("/dashboard/earnings")} style={{ cursor: "pointer" }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", fontWeight: "500" }}>
                {t("dashboard.todayEarnings")}
              </span>
              <span style={{ background: "rgba(245, 124, 32, 0.1)", padding: "8px", borderRadius: "var(--radius-md)", color: "var(--color-secondary)" }}>
                <Wallet size={20} />
              </span>
            </div>
            <div style={{ fontSize: "var(--font-size-3xl)", fontWeight: "800", color: "var(--color-secondary)", marginTop: "var(--space-2)" }}>
              ₹{earningsSummary.today.toLocaleString()}
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              Total: ₹{earningsSummary.total.toLocaleString()} recorded
            </span>
          </div>
        </div>

        <div className="card gsap-fade-card" onClick={() => navigate("/dashboard/history")} style={{ cursor: "pointer" }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", fontWeight: "500" }}>
                {t("dashboard.completedOrders")}
              </span>
              <span style={{ background: "rgba(16, 185, 129, 0.1)", padding: "8px", borderRadius: "var(--radius-md)", color: "var(--color-success)" }}>
                <CheckCircle size={20} />
              </span>
            </div>
            <div style={{ fontSize: "var(--font-size-3xl)", fontWeight: "800", color: "var(--color-success)", marginTop: "var(--space-2)" }}>
              {orderMetrics.completed} Jobs
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              ⭐ 5.0 Rating
            </span>
          </div>
        </div>

        <div className="card gsap-fade-card" onClick={() => navigate("/dashboard/earnings")} style={{ cursor: "pointer" }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", fontWeight: "500" }}>
                {t("dashboard.pendingPayments")}
              </span>
              <span style={{ background: "rgba(245, 158, 11, 0.1)", padding: "8px", borderRadius: "var(--radius-md)", color: "var(--color-warning)" }}>
                <Clock size={20} />
              </span>
            </div>
            <div style={{ fontSize: "var(--font-size-3xl)", fontWeight: "800", color: "var(--color-warning)", marginTop: "var(--space-2)" }}>
              ₹{earningsSummary.pending.toLocaleString()}
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "4px", display: "block" }}>
              Paid out: ₹{earningsSummary.paid.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-3" style={{ gap: "var(--space-6)" }}>
        {/* Next Active Booking Card */}
        <div className="card" style={{ gridColumn: "span 2" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700" }}>{t("dashboard.nextBooking")}</h3>
            <Link to="/dashboard/orders" className="btn btn-ghost btn-sm" style={{ color: "var(--color-secondary)" }}>
              {t("dashboard.viewAll")} <ChevronRight size={16} />
            </Link>
          </div>

          <div className="card-body">
            {orderMetrics.nextBooking ? (
              <div
                style={{
                  border: "1px solid var(--color-border-light)",
                  borderRadius: "var(--radius-xl)",
                  padding: "var(--space-6)",
                  background: "var(--color-surface-hover)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                  <div>
                    <span className="badge badge-warning" style={{ marginBottom: "6px" }}>
                      {orderMetrics.nextBooking.status.toUpperCase()}
                    </span>
                    <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: "700" }}>
                      {orderMetrics.nextBooking.service_name}
                    </h2>
                    <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
                      Order Code: #{orderMetrics.nextBooking.booking_code || orderMetrics.nextBooking.id.slice(0, 8)}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: "800", color: "var(--color-secondary)" }}>
                    ₹{orderMetrics.nextBooking.total_amount || orderMetrics.nextBooking.base_amount || 0}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Calendar size={16} color="var(--color-text-muted)" />
                    <span>{orderMetrics.nextBooking.scheduled_date || "Today"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <MapPin size={16} color="var(--color-text-muted)" />
                    <span>{orderMetrics.nextBooking.service_address} (Customer: <strong>{orderMetrics.nextBooking.customer_name}</strong>)</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate("/dashboard/orders")}>
                    View Details
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => navigate("/dashboard/orders")}>
                    Manage Order
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "var(--space-8)" }}>
                <ClipboardList size={36} color="var(--color-text-muted)" />
                <h4 className="empty-state-title">No upcoming bookings</h4>
                <p className="empty-state-text">When a customer in your coverage area books your service, it will be highlighted right here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & AI Assistant Promo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <div
            className="card"
            style={{
              background: "linear-gradient(135deg, rgba(245, 124, 32, 0.08), rgba(245, 124, 32, 0.02))",
              border: "1px solid rgba(245, 124, 32, 0.2)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <div className="card-body" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "74px",
                  height: "74px",
                  borderRadius: "50%",
                  margin: "0 auto var(--space-3)",
                  overflow: "hidden",
                  border: "2px solid var(--color-secondary)",
                  boxShadow: "0 4px 12px rgba(245, 124, 32, 0.25)",
                }}
              >
                <img
                  src="/assets/images/mascot-hero.png"
                  alt="CoopBot"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700" }}>CoopBot AI Assistant</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", marginTop: "4px", marginBottom: "var(--space-4)" }}>
                Continuous 24/7 AI companion ready with text & voice in Tamil, Hindi, Telugu, Kannada, and English.
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ width: "100%" }}
                onClick={() => {
                  const trigger = document.querySelector(".btn-icon[title='CoopBot AI Assistant']") || document.querySelector("button[title='CoopBot AI Assistant']");
                  if (trigger) trigger.click();
                }}
              >
                <Sparkles size={16} /> Open AI Assistant
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 style={{ fontSize: "var(--font-size-base)", fontWeight: "600" }}>Quick Access</h4>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Link to="/dashboard/chat" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
                <MessageSquare size={16} /> Customer Messages
              </Link>
              <Link to="/dashboard/support" className="btn btn-outline btn-sm" style={{ justifyContent: "flex-start" }}>
                <Phone size={16} /> Support Tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
