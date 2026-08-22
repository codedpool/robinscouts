"use client";

import { useState } from "react";

const fieldClass =
  "w-full rounded-md border border-[var(--paper-line)] bg-[#fffdf7] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--ink-soft)] focus:border-[var(--ember)] focus:ring-1 focus:ring-[var(--ember)]/30";

const labelClass = "font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-soft)]";

export default function PreferencesForm({ preferences, onChange }) {
  const [skillsText, setSkillsText] = useState(preferences.skills.join(", "));

  function update(patch) {
    onChange({ ...preferences, ...patch });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Role keyword</span>
        <input
          type="text"
          value={preferences.role}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="e.g. frontend"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Location</span>
        <input
          type="text"
          value={preferences.location}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="e.g. remote"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Type</span>
        <select
          value={preferences.employmentType}
          onChange={(e) => update({ employmentType: e.target.value })}
          className={fieldClass}
        >
          <option value="any">Any type</option>
          <option value="internship">Internship</option>
          <option value="entry-level">Entry-level</option>
          <option value="full-time">Full-time</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Experience</span>
        <select
          value={preferences.experience}
          onChange={(e) => update({ experience: e.target.value })}
          className={fieldClass}
        >
          <option value="any">Any experience</option>
          <option value="entry-level">Entry-level</option>
          <option value="senior">Senior</option>
        </select>
      </label>

      <label className="col-span-2 flex flex-col gap-1.5">
        <span className={labelClass}>Skills</span>
        <input
          type="text"
          value={skillsText}
          onChange={(e) => {
            setSkillsText(e.target.value);
            update({
              skills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            });
          }}
          placeholder="react, typescript, node"
          className={fieldClass}
        />
      </label>
    </div>
  );
}
