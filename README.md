# VITALIS Medical Institute

A scroll-driven 3D story site for a **fictional** hospital. React + Vite + TypeScript, React Three Fiber / Drei, GSAP ScrollTrigger, Lenis, Tailwind v4, Framer Motion, Lucide.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
```

## How it fits together

- `src/lib/scroll.ts`: Lenis plus a per-section progress store (`enter`, `inner`). It is read every frame and never triggers a React render.
- `src/three/Director.tsx`: turns that progress into one camera path, picks the visible world (heart, tunnel, hospital, specialties, technology), and hides each world switch behind a colour veil.
- `src/three/*`: every 3D asset is procedural. The heart is an SDF of chamber ellipsoids, with great vessels, coronaries and a growing vascular network. The hospital campus, the specialty visuals and the surgical suite are built the same way, so there are no model downloads to fail. The later scenes are lazy-loaded chunks.
- `src/sections/*`: the HTML story layer. Its text timelines are scrubbed by GSAP ScrollTrigger.

## Fallbacks

- No WebGL, or the 3D scene crashes: a static backdrop is shown and all the content still works.
- Touch or small screens: lower geometry detail, no post-processing, lower pixel ratio.
- `prefers-reduced-motion`: no smooth scrolling, no parallax or auto-sway, a damped heartbeat, and text appears by opacity only.

## Placeholder content

The doctor profiles, facilities, technology list, contact details and address are all illustrative placeholders. The appointment form is a demo: nothing is sent or stored, and the UI says so.
