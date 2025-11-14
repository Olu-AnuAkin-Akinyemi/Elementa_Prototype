# ELEMENTA Prototype

ELEMENTA is a browser-based reflective journaling experience inspired by the five classical elements. Each element drives a distinct set of prompts, 3D geometry, and visual accents to encourage different emotional and mental states, while local storage keeps reflections handy between sessions.

## Project Layout

```
client/
├── index.html          # Main document with DOM structure and module loader
├── css/styles.css      # Aurora-inspired styling for the journaling surface and UI chrome
├── js/
│   ├── main.js         # Entry point that bootstraps the app
│   ├── core/pure.js    # Element prompts, helpers, and data-only logic
│   ├── infra/messenger.js # LocalStorage + MediaRecorder infrastructure
│   ├── ui/scribe.js    # DOM + THREE.js helpers and renderers
│   └── app/commander.js   # Orchestration logic binding UI, core, and infra
```

The repository root only keeps documentation and cross-cutting configs (e.g., `.gitignore`). All runtime dependencies should be installed from within `client/` so deployments stay isolated.

## Element Breakdown

| Element | Geometry | Color Tone | Prompt Focus |
|---------|----------|------------|--------------|
| **Earth** | Cube | Warm ochre/brown | Grounding, physical sensations, stability |
| **Water** | Icosahedron | Deep teal/blue | Emotional flow, release, flexibility |
| **Fire** | Tetrahedron | Ember orange/red | Passion, action, creative spark |
| **Air** | Octahedron | Muted sky tones | Clarity, thoughts, mental spaciousness |
| **Spirit** | Dodecahedron | Ethereal violet | Connection, gratitude, soulful awareness |

Each element page pairs its geometry with a rotating THREE.js mesh, a contextual prompt, and tinted UI touches to reinforce the intended mood.

## Running Locally

1. **Install dependencies inside `client/`:**
   ```bash
   cd client
   npm install
   ```
2. **Start a dev server** (feel free to swap `serve` with your preferred static host):
   ```bash
   npm run dev
   # or: npx serve
   ```
3. Open the printed localhost URL in a browser that supports ES modules, LocalStorage, and the MediaRecorder API (Chrome, Edge, or Firefox recommended).

## Usage Tips

- Navigate between elements using the 3D icons in the bottom nav. Each switch updates the display prompt automatically.
- Type reflections in the textarea, then hit **Save Entry**; entries persist in LocalStorage and can be revisited/moved/deleted via the entries modal (hamburger button on the right edge).
- Use the glowing record button to capture an audio note (prototype stub logs the blob and demonstrates microphone handling).
- A small status message under **Save Entry** reminds users to type something first and confirms successful saves.

## Contributing

Contributions are welcome! If you're sharing improvements:

1. Fork the repo and create a feature branch.
2. Keep code organized by the existing directories (`core`, `infra`, `ui`, `app`).
3. Document UI or architectural decisions in the README or inline comments when the intent may be non-obvious.
4. Submit a PR describing the change, screenshots for UI tweaks, and steps to reproduce/test.

Feel free to open issues for bug reports, enhancement ideas (new prompts, animations, or export workflows), or questions about the architecture.

---
Crafted with mindfulness and geometry ✨
