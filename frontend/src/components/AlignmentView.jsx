import React, { useMemo } from 'react';

export default function AlignmentView({ seq1, seq2, score, computeTime, activeStep }) {
  const len = seq1.length;

  const cols = useMemo(() => Array.from({ length: len }, (_, i) => {
    const c1 = seq1[i];
    const c2 = seq2[i];
    if (c1 === '-' || c2 === '-') return 'gap';
    if (c1 === c2) return 'match';
    return 'mismatch';
  }), [seq1, seq2]);

  const counts = cols.reduce((acc, k) => { acc[k] = (acc[k] || 0) + 1; return acc; }, {});

  const cellStyle = {
    match:    'bg-emerald-500/20 border-emerald-500/60 text-emerald-300',
    mismatch: 'bg-red-500/20 border-red-500/60 text-red-300',
    gapEmpty: 'bg-amber-500/25 border-amber-400/70 text-amber-300',
    gapChar:  'bg-slate-800 border-slate-600 text-slate-300',
  };
  
  const connectorStyle = {
    match:    { sym: '\u2502', cls: 'text-emerald-500' }, // Vertical bar
    mismatch: { sym: '\u2715', cls: 'text-red-500' },     // Multiplication X
    gap:      { sym: ' ', cls: 'text-slate-700' },
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
        <h2 className="text-xl font-semibold text-slate-100">Optimal Alignment</h2>
        <div className="flex items-center gap-5">
          <div className="flex gap-3 text-xs">
            {[['emerald','Match', counts.match||0], ['red','Mismatch', counts.mismatch||0], ['amber','Gap', counts.gap||0]].map(([c,l,n]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full bg-${c}-500`} />
                <span className="text-slate-400">{l} ({n})</span>
              </span>
            ))}
          </div>
          <div className="bg-slate-900 px-4 py-1.5 rounded-lg border border-slate-700 flex items-center gap-4">
            <div>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider block leading-none mb-1">Compute Time</span>
              <span className="text-sm font-mono text-indigo-400">{computeTime ? computeTime.toFixed(2) : '0.00'} ms</span>
            </div>
            <div className="w-px h-6 bg-slate-700"></div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider block leading-none mb-1">Score</span>
              <span className="text-lg font-bold text-white leading-none">{score}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="inline-grid gap-y-0"
          style={{ gridTemplateColumns: `3.5rem repeat(${len}, 2.25rem)`, minWidth: 'max-content' }}
        >
          {/* Row: Seq 1 label + chars */}
          <div className="flex items-center justify-end pr-3 text-xs text-slate-500 font-mono h-9">Seq 1</div>
          {seq1.split('').map((c, i) => (
            <div
              key={i}
              className={[
                'h-9 w-9 flex items-center justify-center rounded-md border text-sm font-bold font-mono transition-all duration-200',
                cols[i] === 'gap' ? (c === '-' ? cellStyle.gapEmpty : cellStyle.gapChar) : cellStyle[cols[i]],
                activeStep === i ? 'ring-2 ring-white scale-110 z-10' : '',
              ].join(' ')}
            >
              {c}
            </div>
          ))}

          {/* Row: connectors */}
          <div className="h-5" />
          {cols.map((k, i) => (
            <div
              key={i}
              className={`h-5 w-9 flex items-center justify-center text-xs font-bold ${connectorStyle[k].cls}`}
            >
              {connectorStyle[k].sym}
            </div>
          ))}

          {/* Row: Seq 2 label + chars */}
          <div className="flex items-center justify-end pr-3 text-xs text-slate-500 font-mono h-9">Seq 2</div>
          {seq2.split('').map((c, i) => (
            <div
              key={i}
              className={[
                'h-9 w-9 flex items-center justify-center rounded-md border text-sm font-bold font-mono transition-all duration-200',
                cols[i] === 'gap' ? (c === '-' ? cellStyle.gapEmpty : cellStyle.gapChar) : cellStyle[cols[i]],
                activeStep === i ? 'ring-2 ring-white scale-110 z-10' : '',
              ].join(' ')}
            >
              {c}
            </div>
          ))}

          {/* Row: column indices */}
          <div className="h-5" />
          {Array.from({ length: len }, (_, i) => (
            <div key={i} className={`h-5 w-9 flex items-center justify-center text-[10px] font-mono ${activeStep === i ? 'text-white font-bold' : 'text-slate-600'}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
