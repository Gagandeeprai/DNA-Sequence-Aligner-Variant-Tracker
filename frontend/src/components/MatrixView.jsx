import React, { useState, useEffect, useCallback, useMemo } from 'react';

const DIR_ICON  = { D: '\u2196', U: '\u2191', L: '\u2190', S: '\u00B7' };
const DIR_LABEL = { D: 'Diag (Match/Sub)', U: 'Up (Deletion)', L: 'Left (Insertion)' };

function heatBg(score, min, max) {
  if (max === min) return undefined;
  const t = (score - min) / (max - min);
  if (t < 0.5) return `rgba(239,68,68,${(1 - t * 2) * 0.45})`;
  return `rgba(16,185,129,${(t - 0.5) * 2 * 0.45})`;
}

export default function MatrixView({ matrix, dir, path, rawSeq1, rawSeq2, onStepChange }) {
  const [showArrows,    setShowArrows]    = useState(true);
  const [showHeatmap,   setShowHeatmap]   = useState(true);
  const [showDecisions, setShowDecisions] = useState(false);
  const [selectedCell,  setSelectedCell]  = useState(null);
  const [stepIndex,     setStepIndex]     = useState(-1);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [speed,         setSpeed]         = useState(500);

  const n = matrix.length - 1;
  const m = matrix[0].length - 1;

  const { hMin, hMax } = useMemo(() => {
    let hMin = Infinity, hMax = -Infinity;
    matrix.forEach(r => r.forEach(v => { if (v < hMin) hMin = v; if (v > hMax) hMax = v; }));
    return { hMin, hMax };
  }, [matrix]);

  const pathSet = useMemo(() => new Set(path.map(p => `${p[0]},${p[1]}`)), [path]);
  const activeCell = stepIndex >= 0 && stepIndex < path.length ? path[stepIndex] : null;

  // Reset playback when sequences change
  useEffect(() => {
    setStepIndex(-1);
    setIsPlaying(false);
    setSelectedCell(null);
  }, [path]);

  // Sync alignment highlight to parent
  useEffect(() => {
    if (!onStepChange) return;
    onStepChange(activeCell ? path.length - 2 - stepIndex : null);
  }, [stepIndex, activeCell, onStepChange, path.length]);

  // Auto-advance playback
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIndex >= path.length - 1) { setIsPlaying(false); return; }
    const id = setTimeout(() => setStepIndex(s => s + 1), speed);
    return () => clearTimeout(id);
  }, [isPlaying, stepIndex, path.length, speed]);

  const handlePlay  = () => { if (stepIndex >= path.length - 1) setStepIndex(0); setIsPlaying(true); };
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => { setIsPlaying(false); setStepIndex(-1); onStepChange?.(null); };
  const handleStep  = () => { setIsPlaying(false); setStepIndex(s => Math.min(s + 1, path.length - 1)); };

  const computePriors = useCallback((i, j) => {
    if (i === 0 && j === 0) return null;
    const diag = (i > 0 && j > 0) ? matrix[i-1][j-1] + (rawSeq1[i-1] === rawSeq2[j-1] ? 1 : -1) : null;
    const up   = i > 0 ? matrix[i-1][j] - 2 : null;
    const left = j > 0 ? matrix[i][j-1] - 2 : null;
    return { diag, up, left };
  }, [matrix, rawSeq1, rawSeq2]);

  const hov    = selectedCell ? computePriors(selectedCell.i, selectedCell.j) : null;
  const hovDir = selectedCell ? dir[selectedCell.i][selectedCell.j] : null;
  const curDir = activeCell  ? dir[activeCell[0]][activeCell[1]] : null;

  const colTemplate = `2.75rem 2.75rem ${Array(m + 1).fill('2.75rem').join(' ')}`;

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col gap-4">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 mb-1">DP Matrix Traceback</h2>
          <p className="text-[11px] text-slate-400 font-mono">dp[i][j] = optimal alignment score for prefixes X[1..i], Y[1..j]</p>
          <p className="text-[11px] text-slate-500 font-mono">Space: O(n{"\u00D7"}m)  {"\u00B7"}  Traceback: O(n+m)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[['Arrows', showArrows, setShowArrows], ['Heatmap', showHeatmap, setShowHeatmap], ['DP Decisions', showDecisions, setShowDecisions]].map(([lbl, val, set]) => (
            <button key={lbl} onClick={() => set(v => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${val ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
              {val ? '✓ ' : ''}{lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Playback controls */}
      <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Traceback Playback</span>
        <button onClick={isPlaying ? handlePause : handlePlay}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
          {isPlaying ? `\u23F8 Pause` : `\u25B6 Play`}
        </button>
        <button onClick={handleStep} disabled={isPlaying || stepIndex >= path.length - 1}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-slate-200 text-sm font-semibold transition-colors">
          Step {"\u2192"}
        </button>
        <button onClick={handleReset}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold transition-colors">
          {"\u21BA"} Reset
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">Speed:</span>
          {[['Fast',200],['Normal',500],['Slow',900]].map(([l,ms]) => (
            <button key={l} onClick={() => setSpeed(ms)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${speed === ms ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-mono">{stepIndex < 0 ? '\u2013' : stepIndex + 1}/{path.length}</span>
      </div>

      {/* Active step info bar */}
      {activeCell && (
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2">
          <span className="text-slate-400">Step {stepIndex + 1}:</span>
          <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-white">dp[{activeCell[0]}][{activeCell[1]}] = {matrix[activeCell[0]][activeCell[1]]}</span>
          {curDir && curDir !== 'S' && (
            <span className={`px-2 py-0.5 rounded font-bold ${curDir==='D'?'bg-emerald-900/50 text-emerald-400':curDir==='U'?'bg-yellow-900/50 text-yellow-400':'bg-cyan-900/50 text-cyan-400'}`}>
              {DIR_ICON[curDir]} {DIR_LABEL[curDir]}
            </span>
          )}
        </div>
      )}

      {/* DP decision hover panel */}
      <div className={`border rounded-xl p-3 text-xs font-mono transition-all duration-200 ${selectedCell && hov ? 'bg-slate-950 border-slate-600' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
        {selectedCell && hov ? (
          <>
            <div className="text-slate-100 font-bold mb-2">
              F({selectedCell.i},{selectedCell.j}) = max{"{\u2026}"} = <span className="text-white">{matrix[selectedCell.i][selectedCell.j]}</span>
            </div>
            {selectedCell.i > 0 && selectedCell.j > 0 && (
              <div className="text-slate-400 text-[11px] mb-2">
                s({rawSeq1[selectedCell.i-1]}, {rawSeq2[selectedCell.j-1]}) = {rawSeq1[selectedCell.i-1]===rawSeq2[selectedCell.j-1] ? '+1 (match)' : '\u22121 (mismatch)'}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {[
                {key:'D', lbl:'\u2196 Diag',     val: hov.diag},
                {key:'U', lbl:'\u2191 Up+gap',   val: hov.up},
                {key:'L', lbl:'\u2190 Left+gap', val: hov.left},
              ].map(({key,lbl,val}) => {
                const chosen = hovDir === key;
                return (
                  <div key={key} className={`p-2 rounded-lg border ${chosen ? key==='D'?'border-emerald-500 bg-emerald-900/30 text-emerald-300':key==='U'?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-cyan-500 bg-cyan-900/30 text-cyan-300' : 'border-slate-700 text-slate-500'}`}>
                    <div className="text-[10px] mb-1 opacity-70">{lbl}</div>
                    <div className="text-base font-bold">{val !== null ? val : 'N/A'}</div>
                    {chosen && <div className="text-[9px] mt-1 uppercase tracking-wider font-bold opacity-80">{"\u2713"} chosen</div>}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <span className="text-slate-500">Click any cell {"\u2192"} see full F(i,j) recurrence breakdown</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
        <span><span className="text-emerald-400 font-bold">{"\u2196"}</span> Diag {"\u2014"} match/substitution</span>
        <span><span className="text-yellow-400 font-bold">{"\u2191"}</span> Up {"\u2014"} deletion</span>
        <span><span className="text-cyan-400 font-bold">{"\u2190"}</span> Left {"\u2014"} insertion</span>
        {showHeatmap && <><span className="text-red-400">{"\u25A0"} low</span><span className="text-emerald-400">{"\u25A0"} high</span></>}
      </div>

      {/* Matrix */}
      <div className="overflow-auto pb-2">
        <div className="inline-block min-w-max">
          {/* Column headers */}
          <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: colTemplate }}>
            <div /><div className="w-11 h-11 flex items-center justify-center text-slate-500 font-bold">{"\u03B5"}</div>
            {rawSeq2.split('').map((c,j) => (
              <div key={j} className="w-11 h-11 flex items-center justify-center text-cyan-400 font-bold">{c}</div>
            ))}
          </div>

          {matrix.map((row, i) => (
            <div key={i} className="grid gap-1 mb-1" style={{ gridTemplateColumns: colTemplate }}>
              <div className="w-11 h-11 flex items-center justify-center text-emerald-400 font-bold">
                {i === 0 ? 'ε' : rawSeq1[i-1]}
              </div>
              {row.map((score, j) => {
                const onPath    = pathSet.has(`${i},${j}`);
                const isCurrent = activeCell && activeCell[0]===i && activeCell[1]===j;
                const isSelected= selectedCell?.i===i && selectedCell?.j===j;
                const d         = dir[i][j];

                let cls = 'group w-11 h-11 relative flex items-center justify-center rounded-lg text-sm font-mono font-bold cursor-pointer select-none transition-all duration-150 ';
                let bgStyle = undefined;
                if (isCurrent) {
                  cls += 'bg-white text-slate-900 ring-4 ring-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)] scale-110 z-20 ';
                } else if (onPath) {
                  cls += 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)] scale-105 z-10 ';
                } else {
                  cls += 'border border-slate-700 text-slate-300 hover:bg-slate-700 hover:scale-105 hover:z-10 ';
                  if (showHeatmap) bgStyle = { backgroundColor: heatBg(score, hMin, hMax) };
                  if (isSelected) cls += 'ring-2 ring-indigo-400 scale-105 z-10 ';
                  if (showDecisions && d !== 'S' && d !== ' ') {
                    if (d==='D') cls += 'border-emerald-700/60 ';
                    else if (d==='U') cls += 'border-yellow-700/60 ';
                    else cls += 'border-cyan-700/60 ';
                  }
                }

                return (
                  <div key={j} className={cls} style={bgStyle}
                    onClick={() => setSelectedCell(isSelected ? null : {i,j})}>
                    <span className="relative z-10">{score}</span>
                    {showArrows && d && d!=='S' && d!==' ' && (
                      <span className={`absolute top-0.5 right-0.5 text-[8px] leading-none z-20 transition-opacity duration-200 ${onPath?'text-emerald-100/70':d==='D'?'text-emerald-500/40 group-hover:opacity-100':d==='U'?'text-yellow-500/40 group-hover:opacity-100':'text-cyan-500/40 group-hover:opacity-100'}`}>
                        {DIR_ICON[d]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
