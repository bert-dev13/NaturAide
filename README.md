# NatureAide

NatureAide is an evidence-based botanical medicine and scientific validation platform featuring verified Philippine medicinal plant monographs, commercial herbal product evidence matching, an AI conversational assistant, and an in-silico molecular docking pipeline with AutoDock Vina and RDKit.

---

## Development Setup (Windows)

NatureAide provides an automated, reproducible setup script that configures the Next.js application, database connectivity, and the complete molecular docking toolchain on any Windows machine.

### Prerequisites

Ensure the following prerequisites are installed on your Windows system before cloning:

1. **Node.js LTS** (v20+ or v22+): Download from [nodejs.org](https://nodejs.org/). (Includes `npm`).
2. **Python 3.11** (Strictly Python 3.11.x):
   - In PowerShell, run:
     ```powershell
     winget install Python.Python.3.11
     ```
     or download from [python.org Python 3.11](https://www.python.org/downloads/release/python-3119/).
   - *Important:* Ensure **"Add python.exe to PATH"** is checked during installation. (Python 3.14+ is not yet supported by precompiled scientific wheels like RDKit).
3. **MySQL Server** (e.g., via [XAMPP](https://www.apachefriends.org/)):
   - Start the MySQL service on default port `3306`.
4. **Git for Windows**: Download from [git-scm.com](https://git-scm.com/).

---

### Setup Workflow (4 Commands)

Open PowerShell or Command Prompt in your preferred workspace directory and execute:

```powershell
git clone https://github.com/bert-dev13/NaturAide.git
cd natureaide
npm install
npm run setup
```

#### What `npm run setup` Does Automatically:
- Creates `.env.local` safely from `.env.example` (if not already present) without overwriting existing secrets.
- Verifies a strictly compatible Python 3.11 runtime.
- Creates an isolated project-local virtual environment (`.docking-venv`).
- Automatically installs pinned cheminformatics libraries from `requirements-docking.txt`:
  - `rdkit==2026.9.1`
  - `meeko==0.8.0`
  - `gemmi==0.7.5`
  - `openbabel-wheel==3.1.1.23` (`obabel.exe`)
  - `scipy==1.17.1`
  - `numpy==2.4.6`
  - `pillow==13.0.0`
- Downloads and provisions the official **AutoDock Vina v1.2.7** binary (`tools/vina/vina.exe`) with SHA-256 integrity check.
- Verifies MySQL connectivity and applies pending database migrations non-destructively.
- Runs an end-to-end docking smoke test (3D conformer preparation via RDKit ETKDGv3 and Meeko PDBQT).

---

### Running the Application

Once setup is complete, you can start the application:

#### Development with Public Tunneling (Recommended for Remote & Mobile Testing):
```powershell
npm run dev:share
```
- Performs preflight checks on MySQL, Python 3.11, RDKit, and AutoDock Vina.
- Launches Next.js on `http://localhost:3000`.
- Launches a secure public HTTPS reverse proxy tunnel via ngrok.
- **Zero manual virtual environment activation required** — `npm run dev:share` directly executes `.docking-venv\Scripts\python.exe` and `tools\vina\vina.exe`.

#### Local Development Server:
```powershell
npm run dev
```

---

### Testing & Verification

- **Docking Integration Test**:
  ```powershell
  npm run test:docking
  ```
  Runs a real in-silico simulation (Aspirin conformer generation, Gasteiger charges, AutoDock Vina binding energy calculation).

- **Chatbot Grounding Test**:
  ```powershell
  npm run test:chat
  ```
  Runs conversational AI routing and verified monograph grounding tests.

---

## License

NatureAide Academic & Botanical Research Platform.
