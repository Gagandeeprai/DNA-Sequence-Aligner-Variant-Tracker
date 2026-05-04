# DNA Sequence Aligner & Variant Tracker - Task Plan

## Phase 1: Planning and Theory Formulation (Current)
- [x] Define strict algorithmic requirements and formal definitions.
- [x] Establish JSON schema contract between C++ core and FastAPI layer.
- [x] Formulate recurrences and time/space complexity proofs.

## Phase 2: C++ Core Engine
- [x] Set up C++ project structure.
- [x] Implement strict Discrete Mathematics constraints (Input validation over Set S).
- [x] Implement Needleman-Wunsch with DP Table matrix generation.
- [x] Implement traceback logic and construct optimal alignment.
- [x] Serialize output precisely to the defined JSON schema.
- [x] Compile and test binary with isolated test cases.

## Phase 3: Python FastAPI Bridge
- [x] Initialize FastAPI project.
- [x] Implement endpoints to receive sequence parameters.
- [x] Securely execute the C++ binary via subprocess.
- [x] Capture stdout, validate against JSON schema, and handle runtime errors.
- [x] Expose the processed JSON payload to the frontend.

## Phase 4: React + Tailwind Visualization
- [x] Initialize React project (Vite) with Tailwind CSS.
- [x] Build DP Matrix grid visualization (coloring based on score values).
- [x] Implement traceback path overlay on the DP Matrix.
- [x] Build visual alignment view (match=green, mismatch=red, gap=yellow).
- [x] Build structured mutation panel explaining operational steps.

## Phase 5: Integration and Final DAA/DMS Verification
- [ ] End-to-end testing.
- [ ] Verify exact time/space complexity manifestations in large sequences.
- [ ] Verify overlapping subproblems via edge case validation.
- [ ] Final code walk-through preparation for Viva.
