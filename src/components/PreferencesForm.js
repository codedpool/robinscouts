"use client";

import { useState } from "react";

export default function PreferencesForm({ preferences, onChange }) {
  const [skillsText, setSkillsText] = useState(preferences.skills.join(", "));
  const [open, setOpen] = useState(false);

  function update(patch) {
    onChange({ ...preferences, ...patch });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-900"
      >
        <span>Match preferences</span>
        <span className="text-slate-400">{open ? "Hide" : "Edit"}</span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Role keyword
            <input
              type="text"
              value={preferences.role}
              onChange={(e) => update({ role: e.target.value })}
              placeholder="e.g. backend"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Location
            <input
              type="text"
              value={preferences.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="e.g. Remote or Bangalore"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Employment type
            <select
              value={preferences.employmentType}
              onChange={(e) => update({ employmentType: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="any">Any</option>
              <option value="internship">Internship</option>
              <option value="entry-level">Entry-level</option>
              <option value="full-time">Full-time</option>
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Experience level
            <select
              value={preferences.experience}
              onChange={(e) => update({ experience: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="any">Any</option>
              <option value="entry-level">Entry-level</option>
              <option value="senior">Senior</option>
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600 sm:col-span-2">
            Skills (comma-separated)
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
              placeholder="e.g. python, react, kubernetes"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      )}
    </div>
  );
}
