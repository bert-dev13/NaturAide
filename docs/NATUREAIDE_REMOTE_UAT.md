# NatureAide - Remote Client Testing Guide (ngrok Integration)

This guide describes how to run NatureAide and start the secure public HTTPS tunnel using the integrated ngrok launcher:

```bash
npm run dev:share
```

---

## 1. Quick Start Workflow

To host a remote testing session for a client:

1. **Start MySQL**:
   - Open **XAMPP Control Panel**.
   - Start the **MySQL** module (runs on `localhost:3306`).

2. **Open Terminal**:
   ```powershell
   cd natureaide
   ```

3. **Start Combined Dev & Tunnel Environment**:
   ```bash
   npm run dev:share
   ```

4. **Observe Terminal Output**:
   Next.js and ngrok start in parallel:

   ```text
   Starting NatureAide and the public link.
   Keep this window open. Ctrl+C stops all of them.

   PUBLIC CLIENT TEST URL:
   https://xxxx.ngrok-free.dev

   Leave this window open. Ctrl+C stops the app and this link.
   ```

5. **Copy the Public URL**:
   Copy the `https://xxxx.ngrok-free.dev` URL and send it to your client along with their test credentials.

6. **Keep Terminal Open**:
   Leave the terminal running for the duration of the testing session.

7. **Stop Remote Access**:
   Press **Ctrl + C** in the terminal. Both Next.js and the ngrok tunnel terminate cleanly.

---

## 2. Available NPM Development Commands

| Command | Description |
| :--- | :--- |
| `npm run dev:share` | **Combined Mode**: Starts Next.js + ngrok tunnel in one command with preflight status checks. |
| `npm run tunnel` | **Tunnel-Only Mode**: Starts only the ngrok tunnel on port 3000. |
| `npm run dev` | **Standard Dev Mode**: Starts Next.js development server on `http://localhost:3000`. |
| `npm run build` | Compiles the production build for validation. |
| `npm run start` | Runs the standalone Next.js production server. |

---

## 3. Environment Configuration

Configuration variables are read from `.env.local` (which is gitignored):

```ini
# MySQL Database Connection (Localhost Only)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=natureaide_db

# Security & Authentication Token
AUTH_SECRET=natureaide_super_secret_jwt_key_2026_botanical_security_token_xyz987

# xAI Grok API Configuration (Server-Side Only)
XAI_API_KEY=your_xai_key_here
XAI_BASE_URL=https://api.x.ai/v1
XAI_MODEL=grok-4.7

```

---

## 4. Test Accounts for Remote Clients

Send the appropriate test credentials privately to your client:

| Role | Test Email | Portal Destination |
| :--- | :--- | :--- |
| **Community** | `community@natureaide.test` | `/community` (or `/community/ask`) |
| **Researcher** | `researcher@natureaide.test` | `/researcher` |
| **Reviewer** | `reviewer@natureaide.test` | `/reviewer` |
| **Admin** | `admin@natureaide.test` | `/admin` |

---

## 5. Security & Isolation Safeguards

- **Strict Port Isolation**: The ngrok tunnel forwards exclusively to Next.js on port 3000 (`http://localhost:3000`). Port 3306 (MySQL), Apache, phpMyAdmin, and development file directories are never exposed.
- **Server-Side API Key Protection**: `XAI_API_KEY` and `NGROK_AUTHTOKEN` are evaluated strictly on the server and are never included in browser client bundles, network payloads, or logs.
- **Zero Fabrication & MySQL Grounding**: Even over remote UAT, Ask NatureAide's responses are strictly grounded on verified MySQL botanical monographs.
- **Clean Process Teardown**: Pressing **Ctrl + C** terminates the child process tree on Windows, preventing orphan processes.
