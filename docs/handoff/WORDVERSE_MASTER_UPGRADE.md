# WORDVERSE — MASTER UPGRADE PROMPT

**Version:** 1.0 · **Prepared:** 4 October 2026, Europe/Istanbul  
**For:** Codex CLI or Claude Code working inside the existing Wordverse repository  
**Specification language:** English · **User communication:** Turkish  
**Objective:** Rescue the visual direction and deliver a convincing, living, explorable universe without damaging the working learning application.

## Son kullanıcı düzeltmeleri · 2026-10-04

- Ana hareket/gaz uçuşu referansı **X videosunun sağ paneli**: https://x.com/ITangieff/status/2106060890407915571, 00:10–00:15. Kullanıcı açıkça doğruladı. Sf4oFaelTr4 gezegen videosu ikincil yüzey/terminator referansıdır; aşağıdaki eski “R5 primary / right-side” yorumu bu son karar tarafından değiştirilmiştir.
- **En uzak görünümde gök cisimleri küçük ışık noktaları gibi görünür.** Yaklaşınca yüzey, gaz ve morfoloji açılır. Uzakta büyük halo/şekil galerisi yok; OLED siyah korunur. Detaylı galaksi şekillerinin en uzakta gizli olması sürer. Bu LOD kabulü U2/U3 içinde ölçülür, mevcut uygulama tamamladı sayılmaz.

## Kullanım — önce bunu oku

Bu dosyayı mevcut proje klasörüne, `docs/handoff/WORDVERSE_MASTER_UPGRADE.md` yoluna koy. Codex veya Claude CLI'ı mevcut repo içinde aç; aşağıdaki başlangıç mesajını ver. Eski başlangıç promptunu bununla birlikte ayrı bir aktif görev olarak verme; bu belge yeni yükseltme görevidir.

```text
docs/handoff/WORDVERSE_MASTER_UPGRADE.md dosyasını baştan sona oku ve aktif yükseltme şartnamesi olarak uygula. Önce mevcut repo, AGENTS.md, CLAUDE.md, STATE.json ve HANDOFF.md ile gerçek durumu doğrula. Eski tamamlanan fazları başlatma. Masaüstündeki wordverse referans klasörünü bulup görselleri ve kısa video örneklerini incele; YouTube videolarını baştan sona izleme. Öncelikli referans Sf4oFaelTr4 videosunun 00:12–00:15 aralığı ve benim belirttiğim sağ taraftaki görüntüdür; hangi görüntü olduğunu doğrulamadan varsayma. U0'dan başlayıp U1 ve sonraki fazlara somut kod değişiklikleriyle devam et. Sadece plan yazıp durma. Türkçe iletişim kur, kullanıcı verisini koru, her adımda yeni görsel ve işlevsel kanıt üret. Testlerin geçmesini görsel kalite kabulü sayma. Her devirde bu dosyadaki kapsamı ve son tamamlanan U-fazını koru.
```

**Bu dosya proje kodu değildir.** Mevcut projeyi geliştirecek ajanın görev ve kabul sözleşmesidir. Güçlü bir prompt kaliteyi tek başına garanti etmez; aşağıdaki görsel karşılaştırmalar, çalışır sahneler ve doğrulama kapıları uygulanmalıdır.

---

## 1. Your assignment and the product outcome

Act as a senior real-time graphics engineer, technical artist and product engineer. Work on the existing application. Make engineering and art-direction decisions, implement them, inspect the result, correct defects and continue through the upgrade phases.

Wordverse turns learning records into a personal cosmos: **word → star**, **conjunction/linking expression → planet**, **collection → a personal galaxy associated with a real galaxy catalog identity**. Preserve this understandable relationship.

The current application has accumulated functionality but the visuals have drifted into repetitive sprites, decorative rings, particle diagrams and inconsistent scale. The user rejects that appearance. The assignment is a substantial rendering and experience upgrade, not another catalog-count increase or superficial CSS restyle.

Deliver two intentional experiences:

1. **Before login: the main onboarding/demo is a living, interactive cinematic universe.** The visitor can approach and travel among stars, planets, galaxies, asteroids, comets, nebulae and cosmic phenomena. It should invite exploration immediately.
2. **After login: the personal universe is OLED black, spacious and nebular.** Actual learning records create bright, convincingly rendered stars and planets in a stable central home region. This is the user's private, usable learning space. The spectacular demo choreography does not take over it.

Both use the same rendering foundations and quality standards. They have separate scene policies, datasets, event behavior and persistence boundaries.

The user's emphasis is **real-looking, alive, three-dimensional, luminous and professional**. Interpret this as convincing real-time cinematography inspired by astronomical imagery and the supplied references. Do not promise an exact observed 3D reconstruction, exhaustive simulation of the universe or film-rendering performance on every browser.

## 2. Authority, scope and established facts

### 2.1 Instruction precedence

The user's subsequent explicit instructions override this specification. This specification supersedes conflicting **older product/visual requirements** in the original master prompt, handoff and tests. Fresh repository evidence determines what is actually implemented. Keep historical decisions as history; update the current decision record instead of erasing it.

Do not treat an older HANDOFF or test expectation as permission to restore an unwanted design. Do not blindly prefer the snapshot if the live repository is newer. This specification does not override system instructions, tool restrictions or actual authorization boundaries.

### 2.2 Snapshot reviewed while preparing this prompt

| Item | Snapshot evidence; recheck in the live repo |
|---|---|
| Repository | `https://github.com/GhostFelina/wordverse-galaxy` |
| Development branch | `phase/4-universe` |
| Snapshot commit | `e75eccaee98f81bdf5a8c4f9c6bbc56cf03d4528` |
| Development package / production | `1.14.0` / `main`, `v1.11.0` |
| Stack | Vite, vanilla JavaScript + TypeScript modules, Three.js, Supabase; **not React/Next.js** |
| Package tools | Vitest, Playwright, ESLint, Prettier; package/lockfile are authoritative |
| Phase state | Original phases 0 and 1 complete; phase 4 active; phase 2 acceptance and phase 3 remainder deferred |
| Celestial layers | 200 nebula records, 1000 asteroid records, 1000 historical fireball records; 300 galaxy records available, galaxy renderer inactive at stage 2 |
| Historical local checks | 98 unit / 66 e2e, lint/typecheck/build reported passing; not evidence for new changes |
| Package integrity | 384 files, 203 text files; manifest hashes and text dump slices checked against the ZIP, no mismatch |
| Source archive SHA-256 | `8459eef68c3855f9ee3fd673426e1ed402540254645eca6a0238a4c29b6b2f6f` |

Read `ONCE_BUNU_OKU.md`, `WORDVERSE_CLAUDE_DEVIR.md`, `PAKET_BILGILERI.md` and the existing handoff first if using the transfer package. Read relevant source files from the repo/ZIP; the 2.6 MB complete dump is a searchable source fallback, not something to paste into the context in one block. The ZIP is a source snapshot, not a backup of live browser/user data and not a `.git` checkout.

### 2.3 Starting locations and checks

Known Windows clone: `C:\Users\User\Desktop\Projeler\kelime-evreni`. Known Mac clone: `/Users/felina/Projects/wordverse-galaxy`. These are candidates; detect the real OS, shell and existing clone before using them. Do not relocate the project.

Read `AGENTS.md`, `CLAUDE.md`, `docs/handoff/STATE.json`, `HANDOFF.md`, `MASTER_PROMPT.md`, `CLAUDE_BRIEF.md`, `KNOWN_ISSUES.md`, `TASKS.md`, `DECISIONS.md`, `CROSS_DEVICE.md` and `SERVICE_ACCESS.md`. Use `rg` for focused discovery. Check the working tree and correct remote/branch. Update with `fetch` and `pull --ff-only` only when appropriate to a clean, correct checkout. Preserve local modifications; no destructive reset, forced checkout, force push or blind stash.

Use the locked dependencies and existing `setup:device` / `doctor` helpers when needed. Verify the behavior of commands before execution. Start or reuse the local application on `http://127.0.0.1:5360/`. The Playwright fixture server uses **5350** and must stay separate.

### 2.4 Preserve working foundations

Keep TR/EN/ES, auth, offline stores, account ownership isolation, synchronization, backup/import/export, profile access, existing learning CRUD and collection relationships. Do not replace the project framework or database to solve visual problems. A renderer refactor is authorized; a ground-up application rewrite is not the default.

The known Supabase project is `mrkmtcpzyvooreeokmkp`. Visual work should normally need no database administration. Do not touch RLS, bypass Storage protections, push migrations to a guessed project or log secrets. Keep the existing deferred SMTP, paid plan, legal and real-device auth acceptance items deferred unless this upgrade actually depends on them.

## 3. Reference inspection: short, honest and actionable

### 3.1 Inspect the local Desktop folder

The user explicitly asks you to open the Desktop folder named **wordverse** and examine its images/videos. The environment preparing this prompt did **not** have access to the user's Windows or Mac Desktop. This inspection remains a mandatory local CLI task; do not claim it has already happened.

Resolve the actual Desktop path. On Windows account for Known Folder / OneDrive redirection; on macOS inspect the actual user's Desktop. Match the intended folder case-insensitively. If multiple candidates exist, prefer the direct Desktop folder and describe any ambiguity. Do not search private unrelated directories or move/delete reference originals.

Create a read-only inventory with filename, media type, dimensions, duration where available and the role each reference serves. Inspect all still images in that folder and sample relevant short video sections. Use contact sheets and local viewers where useful. Record the source path privately; commit only reference notes or cleared/synthetic media, not arbitrary private files.

If the folder is missing or inaccessible, report the precise limitation once, continue with available project assets and source analysis, and keep reference-specific matching pending. Do not keep asking the same location question or inventing image contents.

### 3.2 User-supplied links

| ID | Link | Inspection priority / sample |
|---|---|---|
| R1 | https://www.youtube.com/watch?v=ztVV54sPOns | Secondary overall travel/ambient reference; short samples only |
| R2 | https://www.youtube.com/watch?v=Ii9fO5Y7SVo&t=5487s | Secondary reference; sample near the linked 01:31:27 timestamp |
| R3 | https://www.youtube.com/shorts/zDXDLgrLxnA | Secondary short-form reference; representative frames/short segment |
| R4 | https://www.youtube.com/shorts/Y9eKC6x8Epc | Secondary short-form reference; representative frames/short segment |
| R5 | https://www.youtube.com/watch?v=Sf4oFaelTr4 | **Primary: 00:12–00:15, the user's specified right-side video/image** |

**Do not watch entire videos.** For long references, inspect a few representative frames and a short motion sample, typically 5–10 seconds; the primary requested segment is only 3 seconds. Do not download multi-hour videos. Use accessible lawful previews/local supplied media; respect access restrictions.

R5's page title was accessible during prompt preparation: *Space Ambient Music — Space Journey Relaxation — Flying in Planets*. Its player remained black/buffering at 00:12, so **the actual 12–15 second content, right-side crop, motion and audio were not visually/audibly verified**. R1/R2 had some discoverable metadata; R3/R4 content was not verified. Titles and thumbnails do not establish what happens in an exact segment. These links are inspection targets, not completed analyses.

The phrase “right-side video” is user-authored and important. Establish whether it refers to a split-screen region within the media or a local composite reference. Do not accidentally use a YouTube recommendation/sidebar as the visual target. If still ambiguous, continue independent foundation work and ask one focused clarification only when necessary to match that exact reference.

### 3.3 Produce `REFERENCE_ANALYSIS.md`

For each source record `verified frames`, `verified motion`, `verified audio`, `metadata only` or `unavailable`, plus the sampled time range. Separate direct observation from the user's description and your art-direction interpretation.

Extract concrete choices: camera pace and trajectory, object angular size, foreground/midground/background separation, gas depth, dust occlusion, stellar brightness falloff, palette, surface detail, transitions, event frequency and ambient audio texture. Translate each choice into a renderer requirement and a reproducible camera shot. A generic paragraph saying “cinematic, realistic” is insufficient.

Treat videos as inspiration. Do not embed their playback behind the app, extract their music, copy their watermark/branding or redistribute their footage as a default solution.

## 4. Product contract: two modes, one coherent engine

### 4.1 Mode definitions

| Mode | Content and persistence | Experience |
|---|---|---|
| `showcase-demo` | Seeded synthetic demo + astronomical scenery; ephemeral, no learning/account write path | Full-screen main onboarding; living cosmos; manual exploration and optional cinematic tour |
| `personal` | Active authenticated owner's actual records | Quiet OLED home; nebulae; central word-stars/conjunction-planets; real counts and learning interactions |
| `guest-personal` | Existing guest/offline records, retained in their current owner/store boundary | Preserve usable guest learning and explicit continuation; never replace it with a fabricated demo |

Model authentication transitions explicitly: initializing, signed out, signing in, signed in, signing out and load/error/offline conditions. These are application states, not extra duplicate render engines.

“Demo only on the main onboarding” means the staged showcase and fabricated showcase content are confined to that entry surface. Do not inject demo records or forced cinematic sequences into authenticated home/profile, collection screens or the user's learning session. An explicit return to the public demo is possible but must clearly change mode.

An authenticated returning user opens directly into their personal universe. Do not flash demo objects while resolving the session. A failed sign-in stays recoverable. Logout disposes personal scene resources and labels without exposing the previous owner's records; retains existing guest data under its separate boundary.

### 4.2 Demo experience

The cosmos is the primary screen, not a tiny canvas inside a marketing card. Keep a restrained logo, short introduction, sign-in/enter action, sound toggle and discovery hint. Reveal additional controls progressively; avoid permanent technical dashboards or giant panels covering the universe.

Offer **Explore** and an optional **Cinematic tour**. The latter is driven by an actual camera through the scene. Manual input interrupts the tour cleanly; it never fights the camera. A pause/reset/home action stays accessible. Automatic travel is disabled with reduced motion.

Zoom and navigation reveal galaxies, nebulae, planets and local systems progressively. The farthest view presents dark cosmic breadth and stellar depth; preserve the latest existing rule that distinct galaxy shapes are **not rendered as a visible gallery at maximum distance**. They emerge as the camera approaches their regions. This staged visibility is artistic navigation, not a claim about physically correct astronomical visibility.

### 4.3 Personal universe and stable center

Start with dark space, restrained gas/dust and an understated home galaxy environment. Empty accounts have **zero user-created celestial objects**. Decorative background stars may exist, but cannot masquerade as records or inflate counts. A collection can exist with no entries.

Adding a word creates one persistent star; adding a conjunction/linking expression creates one persistent planet. Show a short birth/formation cue after local persistence is confirmed, or visibly flag unsaved state when durability fails. Reloading, receiving a sync echo or rebuilding the renderer must not replay the creation celebration or create another object.

Every collection has a stable home-galaxy anchor. The active collection's star/planet cluster lives in that galaxy's central home region, and the home camera centers it. Selecting another collection changes the active anchor smoothly while preserving all entries. These anchors form an intentionally arranged personal universe; do not assert a physical center of the real universe.

Keep local star–planet arrangements spacious enough to read and select. User planets may orbit a nearby word-star where a valid host relationship exists, or sit in a stable local system. They must not all revolve around an arbitrary screen pivot or silently acquire fabricated word relationships.

Do not interpret “galaxies in the center” as one new galaxy per word. Preserve collection → galaxy and entry → star/planet. A collection's appearance can gradually gain visible detail as it grows, without changing stored relationships or obscuring the central learning region.

### 4.4 Identity and position stability

Separate **stored entry coordinates**, **local layout**, **collection anchor transform** and **camera transform**. Rendering transforms must not rewrite historical coordinates just to make a prettier center.

The snapshot's `coreOrbit(entry, count)` changes its compression limit with entry count; the first two oldest stars also become an animated binary around hard-coded `x=31`. Audit this behavior. Adding a record must not re-layout every existing star or silently force two unrelated records into a binary. Prefer stable per-entry seeded placement/local visual transforms and explicit user placement with a documented coordinate mapping.

Keep seeds, chosen planet archetypes, galaxy bindings and manual placement stable across reload, collection changes, import/export and sync. Introduce additive metadata only where justified, through the existing normalized/merged schema. New fields must survive old backups and round trips. Unknown data must not be erased by older serializers.

## 5. Visual direction and scientific honesty

### 5.1 OLED and composition

Use `#000000` for empty space and the renderer clear/background color. Keep broad areas of genuine black; localized luminous stars, gas and event light provide contrast. Avoid a full-screen blue/gray fog, permanent glow wash, visible texture rectangles, blanket grain and crushed surfaces with no detail.

Compose foreground, middle and distant layers with intentional depth. Camera movement should produce relative parallax and occlusion; near detail is world-positioned. Sky/very distant backgrounds can be inexpensive, but cannot be the entire depth illusion. Prefer restrained astronomical palettes: warm stellar cores, cooler reflection gas, selective emission color and absorbing dark dust.

Do not equate “real” with saturation, more particles or stronger bloom. Define calibrated exposure and contrast for all object families. Keep labels and cards legible without making the nebula into a flat UI backdrop.

### 5.2 Stars

Use distant point/impostor representations only at appropriate angular sizes. Crossfade to a detailed stellar body at close range: coherent spherical volume, limb darkening, photospheric granulation, subtle surface activity, emission and an irregular restrained corona. The center must remain a star surface, not a circular blurred sticker.

Use plausible temperature-based stellar color and deterministic variation in size, intensity and activity. Catalog identity and measured parameters are optional bindings to actual sources, not something to invent for every learning record. A word-star is a learning representation, not a newly observed physical star.

Tiny distant lights can bloom gently. A nearby star should not have permanent oversized cross-spikes, concentric graphic rings or a neon outline. Telescope-style diffraction is an optional observational look rather than the physical anatomy of a naked-eye star; keep it subtle and off the near-body rendering.

Retain meaningful age/evolution behavior, but do not claim all stars follow a blue → yellow → red sequence based solely on time. Later evolution depends on the chosen stellar model/mass; the learning timeline is explicitly compressed and artistic. Never destroy a learning record during an event.

### 5.3 Planets

Conjunctions must look like planets: lit spherical bodies, coherent normals, detail that holds up at the supported close distance, dark night side, a believable terminator and reflected host-star illumination. Planets do not emit stellar light just to become visible.

Build distinct rocky, terrestrial/cloud-bearing, gas giant, ice giant, ringed and volcanic archetypes where appropriate. Atmosphere belongs only to suitable bodies. Rings are tilted 3D geometry with texture/structure and plausible occlusion; they cannot be generic identical decorative hoops. Audit the snapshot shader's local-space normal and fixed light convention so rotation and view angle remain coherent.

Use verified, licensed Solar System maps where appropriate. For exoplanets use measured catalog parameters where available and label the surface as an artistic interpretation. A real catalog name does not supply a photographed surface.

### 5.4 Nebulae

The snapshot uses distant layered atlas quads and one selected near raymarched box. Retain useful economical distant representations, but upgrade the near approach into a convincing gas/dust volume with filaments, depth, heterogeneous density, absorption and embedded illumination.

Emit/reflection/dark nebulae, supernova remnants and planetary nebulae need differentiated structures. Gas must not repeatedly look like an identical donut, smooth fog sheet or colored soap bubble. Suppress atlas duplicates when the close representation is visible; ensure nearby unrelated billboards do not cut through the selected cloud or fill its interior.

Do not increase raymarch steps globally without measuring GPU cost. Use bounded hero volumes, spatial density organization, quality tiers and deliberate transitions. Test passing near and into a cloud from several angles, not only a single flattering still.

### 5.5 Galaxies

Provide differentiated spiral, barred spiral, elliptical, lenticular, irregular and interacting morphology. Use structured stellar distributions, bulge light, dust lanes, gas and star-forming regions; these must read as galaxies rather than dotted spiral diagrams.

Avoid merely switching `CELESTIAL_STAGE` from 2 to 3 and declaring the old atlas upgraded. A catalog preview/point cloud can remain useful in the atlas UI; the explorable hero representation needs a new quality check.

At close distances the camera travels into a galaxy's stellar/gas environment instead of hitting a flat billboard. Preserve seeded structure and continuous scale. Collection home regions integrate into their selected galaxy while staying discoverable through Home/search.

### 5.6 Asteroids, meteors and comets

Asteroids have varied irregular geometry, roughness, surface breakup, believable illumination and scale. Use coarse distant geometry and better near detail; avoid identical low-poly spheres or rocks occupying every nebula indiscriminately.

Distinguish meteoroids in space from **meteors in a planetary atmosphere**. Keep CNEOS historical records as sourced historical replay, not live random intergalactic events. Missing measurements remain unknown; do not fabricate an observed track.

Comets have a nucleus, coma, curved dust tail and straighter ion tail governed by the stellar illumination/wind direction. World-space trails evolve along their motion and respond to camera parallax. A screen-fixed sprite sliding at a timed interval is not the final comet implementation.

### 5.7 Black holes and extreme objects

Include black holes with a credible dark shadow, selected accretion-disc states, orientation-dependent structure and a bounded approximation of gravitational lensing. A black disk with a colored ring is insufficient for the hero close-up. Not every black hole needs a bright disc or jet.

Neutron stars, pulsars and magnetars have distinct behavior. Make observer-visible phenomena and artistic/time-compressed representations explicit in information cards. Radio bursts and gravitational waves must not be described as literal visible glowing rings in vacuum. Educational lensing/wave overlays are optional and labeled.

### 5.8 Meaning of “realistic”

Maintain four distinctions: real catalog identity; measured/unknown physical fields; artistically arranged scene coordinates; real-time interpretation of appearance/time. Use short disclosure in object detail/about, without drowning the user interface in implementation text.

There is no requirement to simulate every physical event in existence. There is a requirement to build the named phenomena convincingly and extend the engine with a broad, researched catalog. Sources must support claims; licenses must support assets.

## 6. Engine boundaries and renderer rescue

Use the installed Three.js version first. Verify current official documentation and the pinned package behavior before adding postprocessing or adopting examples. Do not assume current docs match r180 exactly. Keep dependencies purposeful and no paid renderer/service subscriptions by default.

Audit `src/main.js`, `cosmic-field.js`, `celestial-system.js`, `nebula-volume.js`, `catalog-layer.js`, `catalog-shape.js`, `catalog-overview.js`, `local-galaxy-layout.js`, `universe-travel.js`, `flight-field.js`, `space-details.js`, the data model, account sync integration and existing fixture harnesses.

The inspected snapshot renders direct to `renderer.render(scene,camera)` with sprite-based user stars, timed screen-relative comet/meteor effects and shared celestial mounting. These are concrete refactoring targets, not proof that every frame is currently broken. Inspect the current checkout before replacing a newer solution.

### 6.1 Responsibilities to establish incrementally

| Responsibility | Contract |
|---|---|
| Experience/mode controller | Selects demo, guest or owner content; guards transitions and async races |
| Universe renderer | Scene/render lifecycle, resize, exposure/postprocess and resource ownership |
| Camera/travel controller | Manual exploration, optional tour, focus, home and interruption behavior |
| Stellar / planet / nebula / galaxy / small-body renderers | Own LODs, shared materials, asset use and disposal per family |
| Catalog registry | Sourced real identities, known/unknown fields, scene mappings and attribution |
| Personal universe adapter | Reads domain records and produces visual instances; never writes learning data per frame |
| Event director | Bounded state machines, spatial prerequisites, rarity and replay/observation separation |
| Audio engine | Gesture-gated audio lifecycle, mixer, sound design and preference behavior |
| Quality controller | Measured adaptive settings, predictable tiers and user override |

These are responsibilities, not a mandate for ten new frameworks or an exact directory tree. Prefer focused modules that fit the current project. Move functionality behind small interfaces with characterization tests; keep the application usable during refactoring.

Use shared geometry/materials and bounded pools. Dispose owned textures, geometries, materials, render targets, audio nodes and listeners exactly once. Cancel stale async mounts/asset responses when mode or owner changes. Rendering failures must leave list-based learning, account controls and export reachable.

### 6.2 Rendering pipeline

Establish a consistent linear-light workflow, texture color-space annotations, HDR emission where supported, calibrated tone mapping and output conversion. Audit custom shader output paths for double conversion or missing transforms.

Use restrained selective/luminance bloom; do not bloom black space, UI labels or every reflective planet indiscriminately. Keep CSS UI outside the postprocessing canvas. Include resize, pixel-ratio changes, render-target disposal and lower-tier fallback. Test the exact installed Three.js version's color handling rather than copying generic settings.

Build LOD transitions by apparent/projected size and distance with hysteresis and deterministic crossfades. An impostor should hand off to a volume/body without duplicating brightness, popping, changing identity or creating a black frame.

### 6.3 Camera and scale

Zoom must feel like travel into space, not enlarging a wallpaper or changing only FOV. Use coherent world movement, controlled acceleration/damping and stable focus targets. Manual pan/orbit/fly controls should be understandable; choose the simplest combination that satisfies free exploration and document it.

Handle huge scale ranges without depth precision failure: evaluate scaled domains, camera-relative rendering/floating origin or bounded nested local spaces. Keep world/domain coordinates and ownership independent of render-origin shifts. Do not assume physical light-year distances fit in one camera near/far range.

Support wheel, drag, touch pinch/pan and accessible keyboard equivalents. Wheel/touch over a form, list or modal does not accidentally fly the universe. Home returns to the active collection anchor from any exploration scale. Focus uses stable record identity and remains correct while objects move.

## 7. Living phenomena and event coverage

Build an event registry and event director. Each event has a stable ID/seed, source notes, family, mode eligibility, spatial prerequisites, duration/time-compression note, rarity, intensity, quality cost, reduced-motion behavior, audio cue and lifecycle: prepare → appear → evolve → decay → dispose.

Keep astronomical atmosphere, seeded demo choreography, synthetic lab replay and personal creation/milestone events separate. The demo may schedule a cinematic discovery; the personal home stays calm with decorative/extreme events restrained or explicitly enabled. Existing records do not get deleted, displaced or converted by a background explosion.

As an initial tunable policy, allow at most one dominant high-intensity event in the current view, with quiet intervals and a global flash budget. Set actual rates after visual testing. Most events belong to local regions and relevant scale; an active scene is not continuous fireworks.

### 7.1 Required first premium phenomena

Implement and validate these before expanding to the full taxonomy: star formation, solar/stellar flare, comet passage, planetary atmospheric meteor/fireball, asteroid encounter/impact context, core-collapse supernova, neutron-star merger/kilonova, black-hole lensing/accretion scene and interacting/merging galaxies. The merger is a compressed visualization; do not show galaxy collision as solid discs crashing and exploding.

### 7.2 Expansion registry — at least 50 distinct phenomena

The older product target of ≥50 is retained as an **event/phenomenon catalog**, not a claim that 50 unrelated explosions should run together. Distinguish transient events, periodic observations and persistent environments. Track implementation and visual evidence for each row.

| Family | Distinct phenomena to implement over the expansion stages |
|---|---|
| Stellar birth / environments (1–6) | 1. Molecular-cloud collapse; 2. Protostar formation; 3. Herbig–Haro jet evolution; 4. Protoplanetary disc evolution; 5. Stellar-wind bubble expansion; 6. Young cluster emergence from gas |
| Stellar activity / variation (7–16) | 7. Stellar flare; 8. Coronal mass ejection; 9. Starspot rotation; 10. Cepheid pulsation; 11. Mira pulsation; 12. Eclipsing binary; 13. Cataclysmic dwarf-nova outburst; 14. Classical nova; 15. Luminous-blue-variable eruption; 16. Wolf–Rayet colliding-wind structure |
| Stellar endings (17–23) | 17. Type Ia supernova; 18. Type II supernova; 19. Type Ib supernova; 20. Type Ic supernova; 21. Planetary-nebula ejection; 22. Supernova-remnant expansion; 23. White-dwarf accretion episode |
| Compact objects / relativistic phenomena (24–33) | 24. Pulsar-beam sweep; 25. Magnetar giant flare; 26. Neutron-star merger/kilonova; 27. Black-hole merger with optional labeled wave visualization; 28. Neutron-star/black-hole merger; 29. Tidal disruption event; 30. Relativistic jet evolution; 31. Accretion-disc variability; 32. Gamma-ray burst observational visualization; 33. Fast radio burst observational visualization |
| Galactic / optical phenomena (34–40) | 34. Interacting-galaxy tidal tails; 35. Galaxy merger sequence; 36. Starburst region ignition; 37. Gravitational-lensing Einstein ring; 38. Microlensing brightness event; 39. Light echo; 40. Active-galactic-nucleus variability |
| Small bodies (41–47) | 41. Asteroid close passage; 42. Asteroid rotation/tumbling; 43. Small-body collision with debris; 44. Comet perihelion passage with twin tails; 45. Comet fragmentation; 46. Atmospheric meteor shower; 47. Atmospheric bolide/fireball |
| Planetary / observational (48–53) | 48. Planetary impact and ejecta; 49. Aurora; 50. Exoplanet transit; 51. Eclipse/occultation; 52. Planetary ring shadow variation; 53. Volcanic plume activity |

Research the prerequisites, observability and morphology for each. Distinct types can share underlying rendering families, but simply recoloring one explosion 50 times does not meet coverage. Avoid falsely treating every radio/high-energy phenomenon as visible optical emission. Use physically informed behavior and explain observational/schematic choices.

Make all implemented phenomena accessible in a deterministic **development-only synthetic event lab** so rare events can be checked without waiting. Add observation journaling later through existing safe persistence; viewing a demo or test fixture must not update a real user's history.

## 8. Original, rights-cleared ambient audio

Audio is part of this upgrade, not an optional forgotten backlog item. Match the reference **mood**: spacious sustained pads/drones, slowly evolving texture, restrained shimmering overtones and subtle event cues. Do not copy a melody, recording or sampled soundtrack. There must be no YouTube embed dependency.

The first deliverable should be an **original procedural Web Audio soundscape** authored for Wordverse: controlled oscillators, seeded noise, filters, slow modulation, original envelopes, spatial ambience and bounded delay/reverb. Save the synthesis code and patch/preset metadata. No third-party audio sample is needed for the initial version. Optimize generation; avoid expensive per-frame convolution rebuilding.

The user's “telifsiz” requirement means audio without third-party unverified reuse/royalty obligations. Do not claim every ambient recording on YouTube is copyright-free. For later recorded assets, prefer explicitly verified CC0/public-domain material or originals with documented rights; do not silently substitute attribution-required/restricted material. Keep asset-specific provenance/license text and release/download dates.

Provide separate music/ambience and effects levels, a master mute and remembered preference. Start muted and require an explicit user gesture to enable/resume audio; choosing login is not permission to blast sound. Respect browser audio policies. Do not claim you tested sound if you only inspected code.

Transitions between demo and personal mode crossfade without duplicate AudioContexts, clicks, clipping or abrupt loud effects. Lower/stop audio on hidden tabs, handle suspended contexts and mobile background interruptions. Provide a quiet personal-learning mix. Event sounds are artistic sonification, not a claim that sound propagates through vacuum.

Expose only simple product controls. Mixer debug graphs belong in the development lab. Measure peak headroom/no clipping and check seamless looping or continuous generation over several minutes. Record actual listening verification separately from automated state tests.

## 9. Upgrade phases and concrete exits

Use **U0–U9** to avoid confusing this rescue with the original product's phases 0–9. Preserve original completed/deferred phase state. Track current U-phase and next action separately in handoff/state without breaking existing scripts.

Each phase requires a working result, current evidence and an exit review. Passing automated tests confirms behavior, not photorealism. “Implemented”, “visually inspected”, “reference matched” and “user accepted” are separate statuses. Continue routine work autonomously; do not introduce an approval question at every phase. Where a reference cannot be inspected, keep matching pending and continue independent work honestly.

### U0 — Ground truth, references and a precise rescue plan

Verify repo/device/data boundaries; inspect current code, docs and relevant historical screenshots. Inspect available Desktop references and short video samples. Capture current synthetic demo/personal views from the running checkout; do not substitute old screenshots.

Produce a brief defect list ranked by user impact, a requirement matrix keyed to section 11, reference analysis and a rollback plan. Record existing failures. Make a scoped initial implementation plan and proceed into U1; do not finish the session at a plan alone.

**Exit:** verified starting state; references honestly classified; reproducible baseline shots; data invariants; the first concrete implementation underway.

### U1 — Mode separation and safe scene lifecycle

Introduce mode policies and synthetic demo input isolated from owner/guest stores. Preserve sign-in/logout, profile, collection and guest flows. Prevent async demo/owner races, empty-count fake content and renderer/audio leaks.

**Exit:** demo only on onboarding; returning authenticated user sees their own universe; logout/account switch cannot flash another user's labels; guest records remain accessible; no demo writes to learning stores.

### U2 — Premium reference scene: star + planet + nebula

Build one development fixture that shares the production rendering path and contains a high-quality close star, an illuminated planet and a nebula volume. Establish exposure/bloom/color pipeline and distant/near transitions. Use this single scene to solve quality before multiplying content.

Capture the same camera path before/after, including orbit/lateral movement through foreground gas and approach to the stellar surface/planet terminator. Compare against verified reference crops where available. Iterate the actual deficiencies. This is the first major visual gate.

**Exit:** star reads as a close stellar body; planet reads as illuminated volume; gas reads as depth and absorbing dust; black space remains black; no donut/sprite/card defects at supported close range; measured frame cost and current comparison evidence.

### U3 — Continuous exploration and scale/LOD coherence

Implement reliable travel, focus, home, touch and keyboard behavior. Add interruption of automatic tour, stable transforms and seam-free LOD handoffs. Test approach, traversal, reversal and recovery at extreme zoom.

**Exit:** distant → galaxy region → nebula/local system → close body → home works continuously; camera does not jump or fight input; stable object identities and no clipping/brightness duplication; no viewport overflow.

### U4 — Personal home and real learning-driven birth

Integrate the premium renderers with real entry/collection adapters. Persist stable visual metadata through existing storage/sync. Replace count-dependent displacement and inappropriate forced binary behavior. Implement short idempotent birth cues and planet selection. Keep forms/detail/search/list usable at all scales.

**Exit:** create word/conjunction → one correct bright object in central home; reload/offline/sync/import preserve identity and placement; update does not become create; zero-entry account remains truthful; active collection switches smoothly; Home never loses the records.

### U5 — Diverse galaxies, catalogs and small-body environments

Reintroduce galaxy rendering only after its morphology/close traversal passes the visual gate. Upgrade nebula variety, planet families, comets and asteroid regions. Reuse sourced records, lazily load heavy layers and keep maximum-distance galaxy visibility rule.

Retain previous product catalog targets: ≥200 real nebula records; ≥1000 combined asteroid/meteor records; ≥150 distinct real galaxy records (300 already available); ≥250 planet catalog identities across Solar System/exoplanets; ≥25 constellations if still in the original scope. Existing 1000+1000 small-body data already exceeds the combined target—do not re-fetch duplicate catalogs just to inflate counts.

Not all objects render simultaneously. Catalog completeness, renderer diversity and near-view quality are independently checked. Planet surfaces not observed are labeled artistic. Constellation catalogs/lines remain optional visible layers so the demo does not become a chart.

**Exit:** multiple galaxies demonstrably differ; camera can enter their environment; varied planets/nebulae/rocks/comets look convincing; existing catalog sources/licenses preserved; no false catalog count substitution for visual acceptance.

### U6 — Premium living events and black-hole scene

Implement the first premium set in section 7.1 plus event director/lab, safe reduced motion and restrained demo scheduling. Add the staged galaxy interaction and neutron-star merger, not only comets and star flares.

**Exit:** each named first-set phenomenon has a deterministic replay and current clip, credible morphology, lifecycle/disposal, info card and mode policy; no destructive effects on records; no constant fireworks; black-hole lensing/accretion scene validated from several angles.

### U7 — Ambient audio integration

Deliver original procedural ambient audio, event cues, gesture gating, mixing and lifecycle behavior. Inspect reference audio briefly if accessible and document the interpretation. Check it on desktop/mobile environments available to you; inaccessible listening/device coverage stays explicit.

**Exit:** actual playable original soundscape, mute/volume preferences, seamless mode transitions, no clipping/doubled contexts and documented original authorship/licensing; playback/auditory checks clearly distinguished.

### U8 — Event breadth, responsiveness and sustained performance

Expand the 53-phenomenon registry in grouped, visually checked batches. Complete ≥50 distinct implemented phenomena without counting dormant stubs or color variants. Finish catalog/render coverage still outstanding from U5, accessibility, weak-device fallback and profile/list integration regressions.

Measure 5000 synthetic learning records as well as scenery/event stress. Validate sustained travel, birth batches, collection switching and teardown. Use adaptive quality to retain design character while reducing cost.

**Exit:** required coverage documented with sources and individual evidence; frame/memory/load budgets measured on named devices; keyboard/reduced-motion/fallback usable; privacy-safe responsive evidence; no new storage/auth regression.

### U9 — Integration acceptance and durable handoff

Run current full automated gates, manual exploration and data-preservation scenarios. Capture a short genuine app demonstration from the actual renderer and a before/after report. Update original phase 4/6 statuses honestly: this upgrade is not automatic completion of auth, profile, FSRS, PWA, legal or all original phases.

Keep work on the development branch, commit meaningful checkpoints and push as authorized by the established repo workflow. Verify remote CI and available preview for the actual commit. Preserve the existing no-main-merge/no-production-release constraint until original phase-4 requirements and the release decision are satisfied. Do not publish social messages on the user's behalf.

**Exit:** acceptance matrix with implemented/verified/pending distinctions; portable next-session instructions; no unverified “ultra realistic / zero error / all done” claim; original deferred backlog retained.

## 10. Performance, device and verification contract

### 10.1 Initial budgets — measure before revising

| Area | Target / rule |
|---|---|
| Desktop | Target 60 FPS at a documented viewport/quality on a named representative device; record median and p95 frame times |
| Mobile | Target ≥30 FPS with an adapted quality tier on a named actual device; emulation is layout evidence, not physical-device FPS |
| Synthetic personal stress | 5000 actual synthetic entry objects with selection/search/birth/collection interactions; decorative star count is not an equivalent workload |
| Loading | Useful lightweight first scene before heavy catalogs/hero textures; record compressed transferred bytes and first-interactive timing under stated network conditions |
| Travel stability | Sustained 2-minute representative traversal/event run; capture hitches and p95, not a one-frame FPS counter |
| Resource stability | Repeat enter/exit/mode/collection switches at least 10 times; bounded pools/caches, no monotonic growth of owned GPU/audio resources |
| Quality tiers | Explicit high/medium/low, adaptive option and user override; use timing/capabilities, not viewport width alone |

Treat these as initial acceptance goals. If a named target cannot be reached, identify the measured bottleneck, provide an effective lower-cost implementation/tier and keep the target pending. Never fabricate physical device coverage or benchmark numbers.

Tune dynamic DPR, bounded raymarch cost, active hero volumes, texture compression/atlases where justified, culling, instancing, render-target resolution and asset caching. Avoid per-frame object allocation, domain persistence writes or a global particle increase. Test custom shader compilation failures, resize, WebGL context loss/restore and missing assets. A low-quality/list fallback should remain attractive and useful.

### 10.2 Automated and manual gates

Use the repository scripts, verified from current `package.json`: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`, `npm run format:check`; `npm run check` composes the main gates. Add new files to formatting/type/lint coverage as needed—the snapshot formatter has an explicit file list.

Run targeted meaningful tests during a change, then full gates at integrated phase checkpoints. Do not repeat the full suite after every shader-number tweak unless a new risk warrants it. Write tests for owner/mode isolation, async cancellation, entry identity, round-trip metadata, camera transforms/LOD handoff and event idempotency/lifecycle. Do not write dozens of tests that merely repeat constant values or claim to prove aesthetic quality.

When requirements deliberately change, update obsolete test expectations and explain the decision. The deferred old galaxy tests must be reconsidered/reactivated for the new experience; do not count skipped/deferred cases as passing. Do not loosen timeouts or tolerances to conceal broken rendering.

Manually inspect desktop/tablet/mobile layouts at **1440, 768 and 390 CSS px widths**. Include a 2560×1440 desktop check when available. Cover TR/EN/ES; dark scene under light/dark UI preference; normal/reduced motion; mouse/touch/keyboard; demo/personal/guest. The scene remains OLED dark even when UI theme changes.

### 10.3 Reproducible visual evidence

Create synthetic fixtures using the real production rendering modules, a frozen seed/time and fixed camera paths. Evidence must include commit, viewport/DPR, device/browser, quality tier, mode, fixture version and source-reference verification status.

Required shots/clips: farthest black-space view; galaxy approach; gas fly-through with lateral parallax; close stellar surface; planetary terminator and ring angle; central personal home with zero/one/many entries; word birth; conjunction formation; comet twin tails; supernova; kilonova; black hole; galaxy merger; mode/owner transition; reduced-motion and fallback.

Use side-by-side **current before/after** and verified reference comparisons. Historical package screenshots are useful baselines but not proof of the latest appearance. Hide real learning text and never commit private account screenshots.

Assess 0–5 for depth/occlusion, material/light, morphology, motion/continuity and visual restraint. A score is a reviewer rubric, not objective proof. Aim for at least 4 in each relevant dimension and no blocking defect; report the actual observations, avoid self-awarding generic 5/5. Only the user can express user acceptance.

Blocking visual defects include close-up flat-star stickers, repeated nebula donuts, obvious billboard edges, unchanged point-only galaxy diagrams, bright washed-out black space, low-poly hero rocks, identical planet rings, sudden identity/scale swaps, camera-fixed comet tails, user objects lost outside the center, and constant overwhelming explosions.

## 11. Requirement traceability and completion checklist

Maintain this mapping in `UPGRADE_ACCEPTANCE.md`. For each row record implementation paths, fixture/clip, current automated result, manual observation and remaining limitation. Mark a row complete only when its observable behavior is demonstrated.

| ID | Requirement | Observable acceptance |
|---|---|---|
| WV-U01 | Demo confined to main onboarding | No fabricated showcase objects or forced tour in personal home/profile |
| WV-U02 | Full-screen living cosmos | Interactive renderer continuously animates world objects; not a background video |
| WV-U03 | Explore through zoom/navigation | Approach/travel among body families with parallax, stable identity and Home |
| WV-U04 | OLED black personal space with nebulae | Empty-space pixels stay black; localized gas/dust depth, no uniform fog wash |
| WV-U05 | Word → bright realistic star | One persisted record creates one selectable close-body/LOD star |
| WV-U06 | Conjunction → realistic planet | One persisted record creates one textured/lit stable planet, with readable night/day |
| WV-U07 | Central personal stars/planets/galaxies | Stable home anchors; additions do not scatter/re-layout prior records |
| WV-U08 | Diverse galaxies and nebulosity | Different morphology; close traversal; no repetition-only procedural template |
| WV-U09 | Asteroids, meteors and comets | Varied surfaces, contextual atmospheric meteors, evolving world-space twin tails |
| WV-U10 | Supernovae and neutron-star mergers | Distinct sourced deterministic sequences with current clips |
| WV-U11 | Galaxy collision/merger | Tidal deformation and merger progression in a time-compressed visualization |
| WV-U12 | Black holes | Credible shadow/disc/lensing scene; optional physical state variation |
| WV-U13 | Broad living phenomena | ≥50 implemented registry entries, with family-specific behavior, sources and evidence |
| WV-U14 | Reference inspection | Desktop inventory and short samples; R5 exact 12–15/right-side target verified or clearly pending |
| WV-U15 | Original rights-cleared space ambience | Actual procedural ambient playback and documented authorship; no copied recording |
| WV-U16 | Data/auth/guest preservation | Reload/offline/import/sync/account-switch tests and non-destructive migration coverage |
| WV-U17 | Responsive, motion-aware performance | Named-device measurements, current width/locale checks and usable fallback |
| WV-U18 | Durable CLI continuation | Updated current state/decisions/next action and commit-linked evidence |

## 12. Handoff and drift prevention

Save this file as `docs/handoff/WORDVERSE_MASTER_UPGRADE.md`. Link it from the current HANDOFF, AGENTS/CLAUDE entry points and task list so a new agent does not resume the old visual interpretation. Preserve the original `MASTER_PROMPT.md` as the base product specification; annotate its conflicting visual clauses as superseded rather than silently rewriting history.

Create or extend only purposeful documentation:

- `UPGRADE_STATE.md` (or compatible state fields): current U-phase, last verified commit, active task, exact next action, blockers and pending user acceptance.
- `REFERENCE_ANALYSIS.md`: source/sample verification and translated design requirements.
- `VISUAL_DIRECTION.md`: palette/exposure, body-family quality rules, golden camera shots and tier behavior.
- `UPGRADE_ACCEPTANCE.md`: WV-U01–18, evidence, failures and coverage.
- `docs/audio/README.md`: original patch design, asset provenance, playback/mixing behavior.

Keep these concise and aligned with the existing handoff system. Do not create multiple conflicting roadmaps or inflate documentation instead of implementation. Use one explicit supersession record for decisions such as demo/personal separation and old galaxy-stage assumptions.

Before context exhaustion or switching Codex/Claude/device, record exact file paths, unfinished modifications, failing command output summary, last screenshots, whether any owner/migration work occurred and the next implementable action. Do not mark the phase complete just to leave a clean-looking handoff. Agents operate sequentially on the same authorized branch, not competing unsynchronized copies.

Provide short Turkish progress updates describing outcome/defect/next action. When the user says **Durum Analiz**, inspect current state and show `| Durum | İş | Sonuç / kalan adım |`, then continue. When the user says **devam**, resume the next recorded action without re-running the original project audit from scratch.

## 13. Non-negotiable failure prevention

- Do not sacrifice data safety or learning usability for visual spectacle.
- Do not claim reference matching when the frame/audio was inaccessible.
- Do not claim the Desktop folder was inspected unless it was actually accessible.
- Do not make “more records/particles” the answer to rejected visual quality.
- Do not enable the old galaxy renderer unchanged and rename it professional.
- Do not replace close geometry/volume with a bigger blurred PNG.
- Do not let demo/background events pollute user persistence or counts.
- Do not let scene updates change persisted coordinates without a documented reversible migration.
- Do not fabricate astronomy, physical distances, missing measurements or asset licenses.
- Do not promise full general relativity/N-body physics to justify a convincing artistic approximation.
- Do not silently discard incomplete old features; retain the deferred original backlog.
- Do not turn every phase into a permission request or stop after a plan.
- Do not claim all work passed using the snapshot's historical tests or CI.
- Do not release to production, merge main, add paid services or post externally outside established authorization.

## 14. Start execution now

1. Read this entire specification and the live repository entry/handoff files.
2. Confirm OS, shell, checkout, branch, local modifications and current checkpoint; preserve all work.
3. Locate the Desktop `wordverse` references and inspect images/short samples. Prioritize R5 00:12–00:15; honestly record what is accessible.
4. Open the current local app with synthetic evidence and identify the biggest visible defects in demo vs personal behavior.
5. Record U0 findings, acceptance mapping and the immediate implementation plan.
6. Implement U1, then the U2 premium scene. Do not finish at documentation or a plan. Continue through independent work while any unavailable reference remains pending.
7. Verify each integrated result, fix defects, preserve current evidence and handoff, commit/push according to the established repo workflow, and advance to the next U-phase only when its dependencies are satisfied.

Your first user-facing update should briefly name the current verified state, the top visual defects and the concrete change you are implementing next. Your session-end report should state what changed, what was actually tested/seen/heard, what remains unresolved and the exact next action. The intended outcome is a convincing playable universe and a stable personal learning home, not an impressive-sounding completion report.

---

## Appendix A — Preparation findings, not live acceptance

The transfer documents, integrity manifest/history and relevant renderer/storage architecture were examined for this specification. All 384 ZIP files matched manifest hashes; all 203 text slices matched the complete source dump. This validates package integrity, not application quality or current remote state.

Three historical synthetic screenshots were visually inspected: `2026-10-03-stars-near-1440.png`, `2026-10-03-nebula-flight-1440.png`, `2026-10-03-catalog-focus.png`. They showed a predominantly point-star field, an atmospheric but broad/soft gas presentation with repeated ring silhouettes, and sparse point-drawn galaxy morphology. Those observations support the upgrade priorities; the screenshots are not all from the newest final renderer and are not a current runtime benchmark.

Code inspected included the main rendering path, personal star/planet construction, `coreOrbit`, celestial stage mounting, near-nebula volume, galaxy layer and attribution records. The near word-star path uses glow/core sprites, the planet shader uses a fixed light convention, the nebula volume is a single bounded selected box, and the old galaxy layer combines point distributions with sprite haze. These findings must be rechecked against the live clone.

No code was executed against the user's account, no live learning data was modified, and no live acceptance test is claimed by the preparation of this document. The user Desktop and reference video frames/audio remained unavailable. The local CLI must complete those checks where accessible.

## Appendix B — Primary research entry points for implementation

These are starting points to verify during implementation, not a guarantee that every linked page or asset has been inspected/licensed. Keep the repo's existing `ATTRIBUTIONS.md`, catalog provenance and astronomy references.

| Area | Primary source / use |
|---|---|
| Three.js bloom | https://threejs.org/docs/pages/UnrealBloomPass.html — inspected during preparation; validate against installed package/version and the actual composer workflow |
| Three.js source | https://github.com/mrdoob/three.js — use the tag matching the lockfile for shader/color/postprocessing implementation details |
| Black-hole appearance | https://science.nasa.gov/universe/black-holes/anatomy/ — accessible primary entry point; research lensing, shadow/disc and observability |
| Meteor terminology/context | https://science.nasa.gov/solar-system/meteors-meteorites/ — accessible primary entry point; distinguish atmospheric meteors from objects in space |
| Small-body source already used | https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html — inspect importer/current provenance before any new request |
| Historical fireballs already used | https://ssd-api.jpl.nasa.gov/doc/fireball.html — preserve nullable measurements and historical replay labeling |
| Galaxies/nebula data already used | https://github.com/mattiaverga/OpenNGC — preserve pinned revision and CC BY-SA attribution for adapted data |
| Exoplanet identities/parameters | https://exoplanetarchive.ipac.caltech.edu/ — research measured parameters; do not invent photographed surfaces |
| New phenomenon research | NASA Science, ESA/Hubble/Webb and primary papers as appropriate; record exact checked source per implemented event |

