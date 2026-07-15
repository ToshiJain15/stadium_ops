# FIFA 2026 Stadium Operations Assistant & AI Copilot

An AI-enhanced stadium operations hub and VIP concierge experience platform for the FIFA World Cup 2026 at Lusail Stadium. This project is built specifically for **Virtual: PromptWars**.

---

## 🎯 Chosen Vertical
**Smart Infrastructure & Generative Assistant (Operations & Concierge)**

---

## 💡 System Design & Logic

The system utilizes a hybrid intelligence approach, combining live Generative AI with local operational backup engines:

```
                  ┌──────────────────────────────┐
                  │   3D HTML5 / Three.js Client │
                  └──────────────┬───────────────┘
                                 │
                     POST Inquiries / Telemetry
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Django Backend Service    │
                  └──────────────┬───────────────┘
                                 │
                   Check Gemini API Key Configured
                                 ├───► [YES] ──► Call Google Gemini API (1.5 Flash)
                                 │               (Generates dynamic answers & warnings)
                                 │
                                 └───► [NO] ───► Fallback to Local Mock Engine
                                                 (Returns tailored geological/concierge rules)
```

1. **AI Copilot (Tournament Overview Tab)**: Direct REST queries to Gemini 1.5 Flash to request predictions on crowd bottleneck points, security protocols, or HVAC loads based on current telemetry state.
2. **VIP Royal Concierge (Fan Experience Tab)**: Supports elegance and politeness standards in 6 pre-configured languages (EN, AR, FR, ES, PT, ZH) to coordinate helicopter pickups, VIP menu catering adjustments, and temperature setpoints.
3. **Real-time Telemetry Simulator**: Periodically updates crowd levels, gate capacity wait times, sensor indicators, and fan sentiment pulses.
4. **Auto-Tour Guided View**: A Three.js camera controller that animates viewpoint coordinates continuously for automated walkthrough presentations.

---

## 📁 Repository Optimization

* **Repository Size**: **234 KB (0.23 MB)** — Extremely light and well under the **10 MB limit** (uses CDNs for heavy libraries like Three.js and Tailwind).
* **Self-Contained Database**: Configured to run on SQLite without setting up external servers.
* **Accessibility Integrated**: High Contrast modes, voice audio synthesis navigation, and wheelchair-accessible step-free routing modifiers built-in.

---

## 🚀 How to Install and Run

1. Clone the repository:
   ```bash
   git clone <your-repo-link>
   cd stadium-ops-django
   ```
2. Create and fill out the local configuration in `.env` (a template is available in `.env.example` containing fallback values):
   ```env
   SECRET_KEY=highly-secure-production-random-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Launch the application:
   ```bash
   python manage.py runserver 8000
   ```
6. Open your browser and navigate to: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 🧪 Verification & Testing

Run unit and integration test assertions directly via Django's test utility:
```bash
python manage.py test dashboard
```

---

## ✨ Features & Engineering Enhancements

### 1. Front-end Component Modularization
- Replaced the monolithic index structure with self-contained, clean Django sub-templates under `dashboard/templates/dashboard/components/` (including `header.html`, `sidebar.html`, tab contents, and `modals.html`).
- Decoupled Three.js visualization engine (`stadium_map_3d.js`) and UI controller script (`dashboard.js`) for modular maintenance.

### 2. High-Grade Security & AI Defense
- **Prompt Injection Defense**: Encapsulates user inputs within strict data boundaries (`==== USER QUERY BOUNDARY ====`) instructing the LLM (Gemini 1.5 Flash) to treat queries strictly as data and ignore adversarial prompt overrides.
- **Asynchronous Rate Limiting**: Added a backend rate-limiting middleware/check via Django's memory cache, allowing up to `5 requests per minute` per client IP to safeguard resource allocation.
- **CSRF Protection**: Native CSRF token verification is attached to all state-changing AJAX POST queries dynamically using `X-CSRFToken` headers.
- **Content Security Policy (CSP)**: Integrated custom middleware enforcing strict CSP headers to protect against cross-site scripting (XSS) and frame injection.

### 3. Accessible & Inclusive Design
- **Map Accessibility Fallback**: Built a visually hidden screen-reader fallback (`<div class="sr-only">`) to expose 3D map data semantically to users with visual impairments.
- **Focus Rings**: Standardized CSS `:focus-visible` outline styles (`#00E5FF`) on all button controls, tabs, and sidebar entries to guarantee screen-reader and keyboard-only friendliness.
- **Inclusive Toggles**: High-contrast theme toggle, step-free wheelchair routing selector, and text-to-speech audio assistant.

### 4. High-Efficiency Asynchronous Architecture
- Converted all views to `async def` to unlock concurrent async requests in Python 3.14/Django.
- Switched the standard blocking HTTP request layer to an asynchronous client via `httpx.AsyncClient` for external API communication.
- Implemented **Cache-Aside Optimization** (30s TTL) for the computationally intensive `analytics_api` telemetry calculation to conserve CPU cycles.

### 5. Graceful Degradation (Local Failover)
- The system automatically triggers the local backup telemetry and rules engine on Gemini network failure, missing API keys, or rate limits.
- Responses on fallback paths carry a `"mock_mode": true` parameter, triggering a prominent UI badge (`🟠 [FALLBACK MODE]`) to keep operators fully informed of system state.

### 6. Production-Ready Deployment configuration
- **Reverse Proxy Support**: Engineered with `SECURE_PROXY_SSL_HEADER` and `CSRF_TRUSTED_ORIGINS` to securely bridge HTTPS load balancers without breaking forms or CSRF checks.
- **Hugging Face Spaces**: Pre-packaged with a custom `Dockerfile` enforcing user ID `1000`, port `7860`, and `gunicorn` binding specifically tailored for seamless HF deployment.
- **Render.com Ready**: Ships with a ready-to-run `build.sh` script to automate dependency installs, static file collection (`whitenoise`), and database migrations on modern PaaS providers.
