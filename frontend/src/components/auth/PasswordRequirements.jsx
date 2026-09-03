import React from "react";
import { Check, X } from "lucide-react";
import { checkPasswordRequirements } from "../../utils/passwordPolicy";
import "./PasswordRequirements.css";

export const PasswordRequirements = ({ password = "" }) => {
  const reqs = checkPasswordRequirements(password);

  const items = [
    { key: "length", label: "8–25 characters", met: reqs.length },
    { key: "uppercase", label: "One uppercase letter (A-Z)", met: reqs.uppercase },
    { key: "lowercase", label: "One lowercase letter (a-z)", met: reqs.lowercase },
    { key: "number", label: "One number (0-9)", met: reqs.number },
    { key: "special", label: "One special character (!@#$%...)", met: reqs.special },
  ];

  return (
    <div className="password-requirements-card animate-fade-in">
      <span className="requirements-title">Password requirements</span>
      <ul className="requirements-list">
        {items.map(({ key, label, met }) => (
          <li key={key} className={`requirement-item ${met ? "item-met" : "item-unmet"}`}>
            <span className="requirement-icon">
              {met ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={2.5} />}
            </span>
            <span className="requirement-label">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
