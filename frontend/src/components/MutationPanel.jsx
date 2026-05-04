import React, { useState, useMemo } from 'react';
import { ArrowRight, Trash2, Plus, Check, ChevronDown, ChevronRight } from 'lucide-react';

const META = {
  match:        { Icon: Check,      label: 'Match',        bg: 'bg-emerald-900/30 border-emerald-700/50', text: 'text-emerald-400', pill: 'bg-emerald-900/40 text-emerald-300 border-emerald-800' },
  substitution: { Icon: ArrowRight, label: 'Substitution', bg: 'bg-red-900/30 border-red-700/50',         text: 'text-red-400',     pill: 'bg-red-900/40 text-red-300 border-red-800'             },
  deletion:     { Icon: Trash2,     label: 'Deletion',     bg: 'bg-yellow-900/30 border-yellow-700/50',   text: 'text-yellow-400',  pill: 'bg-yellow-900/40 text-yellow-300 border-yellow-800'     },
  insertion:    { Icon: Plus,       label: 'Insertion',    bg: 'bg-cyan-900/30 border-cyan-700/50',       text: 'text-cyan-400',    pill: 'bg-cyan-900/40 text-cyan-300 border-cyan-800'           },
};

// Group consecutive mutations of the same type into runs
function groupMutations(mutations) {
  if (!mutations.length) return [];
  const groups = [];
  let cur = { ...mutations[0], items: [mutations[0]], startIdx: 0 };

  for (let i = 1; i < mutations.length; i++) {
    const m = mutations[i];
    if (m.type === cur.type) {
      cur.items.push(m);
    } else {
      groups.push({ ...cur, endIdx: i - 1 });
      cur = { ...m, items: [m], startIdx: i };
    }
  }
  groups.push({ ...cur, endIdx: mutations.length - 1 });
  return groups;
}

export default function MutationPanel({ mutations }) {
  const [expanded, setExpanded] = useState({});
  const groups = useMemo(() => groupMutations(mutations), [mutations]);

  const counts = Object.fromEntries(Object.keys(META).map(k => [k, 0]));
  mutations.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++; });

  const toggleGroup = (idx) => setExpanded(e => ({ ...e, [idx]: !e[idx] }));

  return (
    <div className="bg-slate-800/80 border border-slate-700 shadow-xl rounded-2xl p-6 flex flex-col h-full max-h-[780px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-100">Variant Tracker</h2>
        <span className="px-3 py-1 text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300 rounded-full">
          {mutations.length} ops
        </span>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(META).map(([type, m]) => (
          <div key={type} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${m.bg}`}>
            <m.Icon className={`w-3.5 h-3.5 shrink-0 ${m.text}`} />
            <span className="text-slate-400">{m.label}</span>
            <span className={`ml-auto font-bold ${m.text}`}>{counts[type]}</span>
          </div>
        ))}
      </div>

      {/* Grouped operation list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {groups.map((grp, idx) => {
          const m    = META[grp.type] || META.match;
          const Icon = m.Icon;
          const isMulti   = grp.items.length > 1;
          const isOpen    = expanded[idx];

          return (
            <div key={idx} className={`rounded-xl border transition-colors ${m.bg}`}>
              {/* Group header row */}
              <div
                className={`flex items-center gap-3 p-3 ${isMulti ? 'cursor-pointer hover:brightness-125' : ''}`}
                onClick={() => isMulti && toggleGroup(idx)}
              >
                <span className="text-[11px] font-bold text-slate-500 w-7 flex items-center justify-center shrink-0">{grp.startIdx + 1}</span>
                <div className={`p-1.5 rounded-md bg-slate-950 shrink-0 ${m.text}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${m.text}`}>{m.label}</span>
                    {isMulti && (
                      <span className="text-xs text-slate-400">
                        {'\u00D7'}{grp.items.length} <span className="text-slate-500">(cols {grp.startIdx+1}{'\u2013'}{grp.endIdx+1})</span>
                      </span>
                    )}
                    {!isMulti && grp.items[0].detail && (
                      <span className={`font-mono text-xs px-2 py-0.5 rounded border ${m.pill}`}>
                        {grp.items[0].detail}
                      </span>
                    )}
                  </div>
                  {!isMulti && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {grp.type === 'insertion' ? `relative to seq1 pos ${grp.items[0].pos}` : `seq1 pos ${grp.items[0].pos}`}
                      &nbsp;·&nbsp;aligned col {grp.items[0].aligned_index}
                    </div>
                  )}
                </div>
                {isMulti && (
                  <span className={`ml-auto shrink-0 ${m.text}`}>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                )}
              </div>

              {/* Expanded detail rows */}
              {isMulti && isOpen && (
                <div className="border-t border-slate-700/50 divide-y divide-slate-700/30">
                  {grp.items.map((mut, k) => (
                    <div key={k} className="flex items-center gap-3 px-4 py-2 text-xs">
                      <span className="text-slate-600 w-7 flex justify-center font-mono">{grp.startIdx + k + 1}</span>
                      {mut.detail && (
                        <span className={`font-mono px-2 py-0.5 rounded border ${m.pill}`}>{mut.detail}</span>
                      )}
                      <span className="text-slate-500">
                        {mut.type === 'insertion' ? `pos ${mut.pos}` : `seq1 pos ${mut.pos}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
