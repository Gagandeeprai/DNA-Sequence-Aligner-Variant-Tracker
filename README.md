# DNA Sequence Aligner & Variant Tracker 🧬

A production-grade, full-stack DNA Sequence Alignment tool designed with an emphasis on high performance, strict input validation, and clear visualization of genetic variants.

## 🌟 Key Features

*   **High-Performance Core:** The alignment algorithm is written in C++ for maximum speed and efficiency, ensuring exact $O(n \times m)$ time complexity operations.
*   **Robust Backend:** A Python FastAPI backend securely orchestrates the C++ binary and handles the client requests and JSON data formatting.
*   **Interactive Visualization:** A beautiful React, Vite, and Tailwind CSS frontend that renders the Dynamic Programming matrix and alignment strings dynamically.
*   **Safety Guards & Feedback:** Built-in safeguards to truncate sequences exceeding 500 bases (with amber UI warnings) to guarantee browser stability and responsiveness.
*   **FASTA Support:** Client-side parsing and validation for FASTA files, accepting strictly `A, C, G, T` nucleotides.

## 🏗️ Architecture

This project is separated into three highly decoupled modules:

1.  **`/core` (C++ Engine)**
    *   Contains `aligner.cpp` which processes two sequences and outputs the alignment matrix and result strings via standard output as a structured JSON object.
2.  **`/backend` (Python FastAPI)**
    *   Serves as the API layer (`main.py`). Validates inputs, spawns the C++ binary securely via subprocesses, handles timeouts, and serves the results to the frontend.
3.  **`/frontend` (React + Vite)**
    *   The user interface. Handles user input, file uploads, sequence validation, and visually renders the alignment matrix and mutations in a user-friendly manner.

## 🚀 Getting Started

### Prerequisites
*   Node.js (for the frontend)
*   Python 3.8+ (for the backend)
*   A C++ compiler (if you wish to recompile the core engine)

### 1. Setup Backend
```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```
*The API will be available at `http://localhost:8000`*

### 2. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The web app will be available at `http://localhost:5173`*

### 3. Core Engine (Optional)
If you make changes to `core/aligner.cpp`, you will need to recompile the executable:
```bash
cd core
g++ aligner.cpp -o aligner.exe
```

## 📚 Academic Context
This project was developed to meet rigorous academic standards for Design and Analysis of Algorithms (DAA) and Database Management Systems (DMS) principles, emphasizing algorithmic integrity, secure input handling, and strict architectural separation.
