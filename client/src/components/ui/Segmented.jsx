import React from "react";
import "./segmented.css";

/**
 * Segmented
 * - single: value = string
 * - multi:  value = string[]
 */
export default function Segmented({
  options = [],        // [{value, label, title?}]
  value,
  onChange,
  multi = false,
  size = "md",         // sm | md
  className = "",
  ariaLabel
}) {
  const isOn = v => (multi ? (value || []).includes(v) : value === v);
  const toggle = v => {
    if (!multi) return onChange?.(v);
    const set = new Set(value || []);
    set.has(v) ? set.delete(v) : set.add(v);
    onChange?.(Array.from(set));
  };

  return (
    <div className={`seg-group seg-${size} ${className}`} role="group" aria-label={ariaLabel}>
      {options.map((o, i) => (
        <button
          key={o.value}
          className={`seg-btn ${isOn(o.value) ? "is-active" : ""} ${i===0?"is-first":""} ${i===options.length-1?"is-last":""}`}
          title={o.title || o.label}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
