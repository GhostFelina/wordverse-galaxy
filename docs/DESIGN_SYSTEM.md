# Wordverse interface foundations

The desktop atlas uses a dark observational setting, warm ivory actions and restrained copper accents. Orion and personal words retain the primary visual hierarchy. Learning panels share the same typography, surfaces and feedback as the home.

## Tokens and type

`src/home-design.css` defines the shell; `src/learning-design.css` extends its semantic tokens across learning surfaces and native dialogs. Space Grotesk is the display/word face and DM Sans is the reading/control face. Both fonts are local. Personal words wrap in detail and recall views; atlas rows truncate long labels while the full record remains available on selection.

| Role | Token | Value |
| --- | --- | --- |
| Primary text and action | `--atlas-paper` | `#f4efe7` |
| Emphasis | `--atlas-light` | `#eed6b9` |
| Copper | `--atlas-copper` | `#d9b68e` |
| Reading surface | `--atlas-surface` | `#14161d` |
| Input surface | `--atlas-input` | `#0d0f15` |
| Secondary text | `--atlas-secondary` | `#bdb5ab` |
| Supporting text | `--atlas-subtle` | `#a39b91` |
| Surface border | `--atlas-border` | `#e8d8c626` |
| Selected surface | `--atlas-selected` | `#d9b68e14` |

Headings use negative tracking with regular weight. Form labels use small restrained letterspacing. Dates/counts use tabular numerals. Most fields and primary actions are at least 44–48px high; existing compact scene controls remain compatible with the current mobile layout.

## Interaction

- `/` opens the atlas outside editable controls. `Control+K` or `Meta+K` opens it or focuses its search. An open form or native dialog retains its editing context.
- The atlas navigation exposes the shortcut in its title and accessible metadata; a small `/` key is visible on wider desktop headers.
- Side panels are labeled modal dialogs. Tab/Shift+Tab cycle through the active panel; Escape returns focus to its opener. Scheduled autofocus checks that the panel is still active and has not already received user focus.
- Native dialogs retain browser focus management. Home recall returns to its home trigger; atlas recall returns to atlas navigation.
- Meaning stays concealed until explicitly revealed. Recall and navigation never write learning scores or alter stored records.
- Home recall is available only for a ready identity with records in the active galaxy; it is hidden for empty and demonstration states.

## Responsive and feedback states

Forms use consistent spacing and equal-height entry choices, including longer translations. Side panels scroll independently. Search has one containing focus ring, selected filters have a warm border/fill, and disabled controls retain a stable position. Close/reveal/record actions have clear hit areas. Empty results, loading copy, graphics fallback, notification, card export and account/profile dialogs use the shared palette.

Reduced motion removes panel, backdrop, row, focus-action and toast transitions. Existing scene animation preferences are independent and preserved. The current pass retains compact-screen access; a dedicated mobile product design remains separate.

## Evidence

`node scripts/capture-learning-design.mjs` creates isolated synthetic screenshots and a SHA256 manifest under `docs/handoff/evidence/2026-10-14-learning-design`. Set `WORDVERSE_CAPTURE_BROWSER=chrome` for the installed Chrome channel; the script otherwise uses Playwright Chromium. It checks desktop locales, first/empty states, menus, recall/form bounds and unchanged synthetic records.

Test-generated screenshots use Playwright's per-test output directory. Historical checked-in evidence is never refreshed implicitly by running tests. Visual inspection and these checks do not establish universal device performance or full accessibility compliance.
