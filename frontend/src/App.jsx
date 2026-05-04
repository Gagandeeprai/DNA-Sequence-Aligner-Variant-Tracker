import { useState } from 'react';
import axios from 'axios';
import MatrixView from './components/MatrixView';
import AlignmentView from './components/AlignmentView';
import MutationPanel from './components/MutationPanel';
import FastaUpload from './components/FastaUpload';
import { Dna } from 'lucide-react';

function App() {
  const [seq1, setSeq1] = useState('GATTACA');
  const [seq2, setSeq2] = useState('GATACA');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [activeStep, setActiveStep] = useState(null); // alignment col highlighted during traceback

  const ops = seq1.length * seq2.length;
  const isTooLarge = seq1.length > 500 || seq2.length > 500;
  
  let opsColor = 'text-emerald-400';
  if (ops >= 100000) opsColor = 'text-red-400';
  else if (ops >= 50000) opsColor = 'text-yellow-400';

  const handleAlign = async (e) => {
    e.preventDefault();
    if (isTooLarge) {
      setError("Input too large. Max allowed length = 500 due to O(n²) complexity.");
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    setActiveStep(null);
    try {
      const res = await axios.post('http://localhost:8000/align', { seq1, seq2 });
      setData(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) {
        setError(`Invalid DNA input: ${err.response?.data?.detail || ""}`);
      } else if (status === 408) {
        setError("Computation timeout. The alignment took too long to complete.");
      } else if (status === 500) {
        setError("Backend failure. The C++ engine encountered an error.");
      } else {
        setError(err.response?.data?.detail || err.message || "Alignment failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const parseFASTA = (text) => {
    return text
      .split("\n")
      .filter(line => !line.trim().startsWith(">")) // remove header
      .join("")                              // join lines
      .toUpperCase()
      .replace(/[^ACGT]/g, "");              // aggressively clean spaces, newlines, and 'N's
  };

  const handleFastaUpload = async (file, type) => {
    try {
      const text = await file.text();
      let seq = parseFASTA(text);
      
      if (!seq) {
        setError("Sequence is empty after parsing and cleaning non-ACGT characters.");
        return;
      }
      
      setError(null);
      setWarning(null);

      // Auto-truncate massive sequences
      if (seq.length > 500) {
        setWarning(`Sequence truncated to 500 bases for O(n²) memory constraints. Original length: ${seq.length.toLocaleString()} bases.`);
        seq = seq.slice(0, 500);
      }

      if (type === 1) setSeq1(seq);
      else setSeq2(seq);
    } catch (err) {
      setError("Failed to read FASTA file.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex items-center space-x-3 pb-6 border-b border-slate-700/50">
        <Dna className="w-10 h-10 text-emerald-400" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            DNA Sequence Aligner
          </h1>
          <p className="text-slate-400 text-sm mt-1">Needleman-Wunsch DP Core Engine</p>
        </div>
      </header>

      <form onSubmit={handleAlign} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div className="space-y-4">
          <FastaUpload label="Reference Genome (.fasta)" onFileSelect={(file) => handleFastaUpload(file, 1)} />
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Or enter sequence manually:</label>
            <input type="text" value={seq1} onChange={e => setSeq1(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-emerald-400 font-mono tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. GATTACA" required />
          </div>
        </div>
        <div className="space-y-4">
          <FastaUpload label="Target Genome (.fasta)" onFileSelect={(file) => handleFastaUpload(file, 2)} />
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Or enter sequence manually:</label>
            <input type="text" value={seq2} onChange={e => setSeq2(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-cyan-400 font-mono tracking-widest focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g. GATACA" required />
          </div>
        </div>
        <div className="md:col-span-2 mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <div className="text-sm font-mono text-slate-400">
              Operations = seq1.length {"\u00D7"} seq2.length = <span className={`font-bold ${opsColor}`}>{ops.toLocaleString()}</span>
              {ops > 1000000 && !isTooLarge && <span className="ml-3 text-yellow-500 text-xs">{"\u26A0"} This may take a few seconds</span>}
            </div>
            {isTooLarge && (
              <div className="text-red-400 text-sm font-semibold mt-2 sm:mt-0">
                Input too large. Max allowed length = 500 due to O(n²) complexity.
              </div>
            )}
          </div>
          <button type="submit" disabled={loading || isTooLarge || seq1.length === 0 || seq2.length === 0}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors shadow-lg flex justify-center items-center">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Computing alignment...
              </>
            ) : 'Align Sequences'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl shadow-lg">
          <span className="font-bold mr-2">Error:</span>{error}
        </div>
      )}

      {warning && (
        <div className="bg-amber-500/10 border border-amber-500/50 text-amber-400 p-4 rounded-xl shadow-lg">
          <span className="font-bold mr-2">Warning:</span>{warning}
        </div>
      )}

      {data && (
        <div className="space-y-8 fade-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AlignmentView 
                seq1={data.aligned_seq1} 
                seq2={data.aligned_seq2} 
                score={data.score} 
                computeTime={data.compute_time_ms}
                activeStep={activeStep} 
              />
              <MatrixView
                matrix={data.dp_matrix}
                dir={data.direction_matrix}
                path={data.traceback_path}
                rawSeq1={seq1}
                rawSeq2={seq2}
                onStepChange={setActiveStep}
              />
            </div>
            <div>
              <MutationPanel mutations={data.mutations} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
