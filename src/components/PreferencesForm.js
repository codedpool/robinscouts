"use client";

import { useState } from "react";

const fieldClass =
  "rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[#f5f1e8] outline-none placeholder:text-white/30 focus:border-[#ee5a2c] focus:ring-1 focus:ring-[#ee5a2c]/30";

export default function PreferencesForm({ preferences, onChange }) {
  const [skillsText, setSkillsText] = useState(preferences.skills.join(", "));

  function update(patch) {
    onChange({ ...preferences, ...patch });
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-white/8 pb-5">
      <input
        type="text"
        value={preferences.role}
        onChange={(e) => update({ role: e.target.value })}
        placeholder="Role keyword"
        className={`w-28 ${fieldClass}`}
      />
      <input
        type="text"
        value={preferences.location}
        onChange={(e) => update({ location: e.target.value })}
        placeholder="Location"
        className={`w-28 ${fieldClass}`}
      />
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
      <select
        value={preferences.experience}
        onChange={(e) => update({ experience: e.target.value })}
        className={fieldClass}
      >
        <option value="any">Any experience</option>
        <option value="entry-level">Entry-level</option>
        <option value="senior">Senior</option>
      </select>
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
        placeholder="Skills (comma-separated)"
        className={`w-56 flex-1 ${fieldClass}`}
      />
    </div>
  );
}
