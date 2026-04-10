import { useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight, Clock, Shield, Zap, Type } from "lucide-react";
import { createPolicyAPI, togglePolicyAPI, deletePolicyAPI } from "../services/api";

const POLICY_TYPES = [
  { value: "block_keywords", label: "Block Keywords", icon: Type },
  { value: "time_restriction", label: "Time Restriction", icon: Clock },
  { value: "role_restriction", label: "Role Restriction", icon: Shield },
  { value: "rate_limit", label: "Rate Limit", icon: Zap },
];

export function PolicyManager({ policies, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "block_keywords",
    blockedKeywords: "",
    timeRestriction: {
      enabled: true,
      allowedStartHour: 9,
      allowedEndHour: 18,
      allowedDays: [1, 2, 3, 4, 5],
    },
    roleRestriction: {
      enabled: true,
      blockedRoles: ["Employee"],
      action: "",
    },
    rateLimit: {
      enabled: true,
      maxActions: 50,
      windowMinutes: 60,
    },
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        isActive: true,
      };

      if (form.type === "block_keywords") {
        payload.blockedKeywords = form.blockedKeywords.split(",").map((k) => k.trim()).filter(Boolean);
      } else if (form.type === "time_restriction") {
        payload.timeRestriction = form.timeRestriction;
      } else if (form.type === "role_restriction") {
        payload.roleRestriction = form.roleRestriction;
      } else if (form.type === "rate_limit") {
        payload.rateLimit = form.rateLimit;
      }

      await createPolicyAPI(payload);
      setShowForm(false);
      setForm({ ...form, name: "", description: "", blockedKeywords: "" });
      onUpdate?.();
    } catch (err) {
      console.error("Create policy failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await togglePolicyAPI(id);
      onUpdate?.();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this policy?")) return;
    try {
      await deletePolicyAPI(id);
      onUpdate?.();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="policy-manager">
      {/* Header */}
      <div className="policy-header">
        <span>{policies?.length || 0} policies configured</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />
          New Policy
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form className="policy-form" onSubmit={handleCreate}>
          <input
            className="input"
            placeholder="Policy name..."
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Description (optional)..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="select"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {POLICY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {form.type === "block_keywords" && (
            <textarea
              className="textarea"
              placeholder="Comma-separated keywords to block: delete all, drop table, rm -rf..."
              value={form.blockedKeywords}
              onChange={(e) => setForm({ ...form, blockedKeywords: e.target.value })}
              style={{ minHeight: 80 }}
            />
          )}

          {form.type === "time_restriction" && (
            <div className="policy-time-fields">
              <div className="policy-field-row">
                <label className="label">Allowed Hours:</label>
                <input type="number" className="input" min="0" max="23" value={form.timeRestriction.allowedStartHour}
                  onChange={(e) => setForm({ ...form, timeRestriction: { ...form.timeRestriction, allowedStartHour: +e.target.value } })}
                  style={{ width: 80 }}
                />
                <span>to</span>
                <input type="number" className="input" min="0" max="23" value={form.timeRestriction.allowedEndHour}
                  onChange={(e) => setForm({ ...form, timeRestriction: { ...form.timeRestriction, allowedEndHour: +e.target.value } })}
                  style={{ width: 80 }}
                />
              </div>
            </div>
          )}

          {form.type === "rate_limit" && (
            <div className="policy-field-row">
              <label className="label">Max</label>
              <input type="number" className="input" value={form.rateLimit.maxActions}
                onChange={(e) => setForm({ ...form, rateLimit: { ...form.rateLimit, maxActions: +e.target.value } })}
                style={{ width: 80 }}
              />
              <label className="label">actions per</label>
              <input type="number" className="input" value={form.rateLimit.windowMinutes}
                onChange={(e) => setForm({ ...form, rateLimit: { ...form.rateLimit, windowMinutes: +e.target.value } })}
                style={{ width: 80 }}
              />
              <label className="label">minutes</label>
            </div>
          )}

          <div className="policy-form-actions">
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <div className="spinner"></div> : <Plus size={14} />}
              Create Policy
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Policy list */}
      <div className="policy-list">
        {(!policies || policies.length === 0) && !showForm && (
          <div className="approval-empty">
            <Shield size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p>No policies configured yet</p>
          </div>
        )}
        {policies?.map((p) => {
          const TypeIcon = POLICY_TYPES.find((t) => t.value === p.type)?.icon || Shield;
          return (
            <div key={p._id} className={`policy-item ${!p.isActive ? "policy-inactive" : ""}`}>
              <div className="policy-item-left">
                <div className={`policy-type-icon ${p.type}`}>
                  <TypeIcon size={14} />
                </div>
                <div>
                  <div className="policy-item-name">{p.name}</div>
                  <div className="policy-item-desc">
                    {p.type === "block_keywords" && `Blocks: ${p.blockedKeywords?.join(", ") || "none"}`}
                    {p.type === "time_restriction" && `${p.timeRestriction?.allowedStartHour}:00–${p.timeRestriction?.allowedEndHour}:00`}
                    {p.type === "role_restriction" && `Restricts: ${p.roleRestriction?.blockedRoles?.join(", ") || "none"}`}
                    {p.type === "rate_limit" && `${p.rateLimit?.maxActions} / ${p.rateLimit?.windowMinutes}min`}
                  </div>
                </div>
              </div>
              <div className="policy-item-actions">
                <button className="btn-icon" onClick={() => handleToggle(p._id)} title={p.isActive ? "Disable" : "Enable"}>
                  {p.isActive ? <ToggleRight size={20} style={{ color: "var(--risk-low)" }} /> : <ToggleLeft size={20} />}
                </button>
                <button className="btn-icon" onClick={() => handleDelete(p._id)} title="Delete">
                  <Trash2 size={16} style={{ color: "var(--risk-high)" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
