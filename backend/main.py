from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json
import os
import re

app = FastAPI(title="DNA Sequence Aligner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SequenceRequest(BaseModel):
    seq1: str
    seq2: str

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CPP_BINARY = os.path.join(BASE_DIR, '..', 'core', 'aligner.exe')

@app.post("/align")
async def compute_alignment(req: SequenceRequest):
    seq1 = req.seq1.upper()
    seq2 = req.seq2.upper()

    try:
        # Securely execute C++ binary via subprocess
        process = subprocess.Popen(
            [CPP_BINARY, seq1, seq2],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(timeout=5)
        
        if process.returncode != 0:
            # Pass domain errors and constraints through directly
            if "error" in stderr or "error" in stdout:
                error_msg = stderr.strip() if stderr else stdout.strip()
                raise HTTPException(status_code=400, detail=error_msg)
            raise HTTPException(status_code=500, detail="C++ Engine execution failed.")

        # Decode strictly validated payload
        result = json.loads(stdout)
        return result

    except subprocess.TimeoutExpired:
        process.kill()
        raise HTTPException(status_code=408, detail="Computation timed out. O(n*m) bound exceeded.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse strict JSON from C++ engine.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from typing import Optional

@app.post("/upload-fasta")
async def upload_fasta(file1: Optional[UploadFile] = File(None), file2: Optional[UploadFile] = File(None)):
    def parse_fasta(content: str) -> str:
        lines = content.splitlines()
        seq = "".join(line.strip() for line in lines if not line.startswith('>'))
        seq = seq.upper()
        if not seq:
            raise ValueError("Sequence is empty after parsing.")
        if not re.fullmatch(r"[ACGT]+", seq):
            raise ValueError("Invalid characters in FASTA. Only A, C, G, T allowed.")
        return seq

    try:
        res = {}
        if file1:
            content1 = (await file1.read()).decode("utf-8")
            res["seq1"] = parse_fasta(content1)
        if file2:
            content2 = (await file2.read()).decode("utf-8")
            res["seq2"] = parse_fasta(content2)
        
        if not res:
            raise ValueError("No files provided.")
            
        return res
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse files: {str(e)}")
