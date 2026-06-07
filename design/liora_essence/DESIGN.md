```markdown
# Design System Specification: The Culinary Editorial

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Digital Curator."** We are not building a standard e-commerce shop; we are designing a high-end digital gallery for culinary tools. 

To achieve a "Premium D2C" aesthetic that rivals Apple or Zara, the system moves away from rigid, boxy layouts in favor of **Intentional Asymmetry**. We utilize expansive white space (the "Breathing Room" principle) and overlapping elements to create a sense of depth and tactile quality. The goal is to make the user feel like they are flipping through a heavy-stock, matte-finish lifestyle magazine.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in earth-toned luxury, utilizing a Material Design-inspired functional logic to ensure accessibility while maintaining a bespoke feel.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a product description section using `surface-container-low` should sit directly against a `background` hero area without a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create "nested" depth:
- **Base Level:** `surface` (#fcf9f8) - The primary canvas.
- **Floating Elements:** `surface-container-lowest` (#ffffff) - Use for high-priority cards or modals to create a "lifted" effect.
- **Secondary Content:** `surface-container` (#f0edec) - Use for background sections to distinguish product specs from the main story.

### Glass & Gradient Signature
To provide a professional polish, main CTAs and Hero backgrounds should utilize subtle gradients. Transition from `primary` (#24331a) to `primary-container` (#3a4a2f) to provide visual "soul" and avoid the flatness of generic UI. Use **Glassmorphism** for sticky navigation bars: `surface` at 80% opacity with a 20px backdrop-blur.

---

## 3. Typography: Editorial Authority
The typography system relies on the contrast between the intellectual, high-contrast serif (`newsreader`/`playfair`) and the functional, modern sans-serif (`inter`).

- **Display & Headline (Newsreader):** These are your "Editorial Voices." Use `display-lg` (3.5rem) for hero headers with tight letter-spacing (-0.02em). This conveys the LIORA brand’s authoritative, toxin-free stance.
- **Body (Inter):** The "Functional Voice." Use `body-lg` (1rem) for product descriptions with generous line-height (1.6) to ensure a premium, readable feel.
- **Labels (Inter Bold):** Use `label-md` (0.75rem) in all-caps with 0.1em letter-spacing for category tags or "Healthy Living" callouts.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines to define hierarchy. We use light and tone.

- **The Layering Principle:** Stack `surface-container-lowest` cards on `surface-container-low` backgrounds. This creates a soft, natural lift that feels like fine paper.
- **Ambient Shadows:** When a floating effect is required (e.g., a "Quick Buy" modal), use an extra-diffused shadow: `offset-y: 12px, blur: 40px, color: rgba(28, 27, 27, 0.05)`. The shadow must mimic natural ambient light, never a dark grey drop.
- **The Ghost Border Fallback:** If a border is required for accessibility (e.g., in a high-contrast input field), use `outline-variant` (#c5c8bd) at **20% opacity**. 100% opaque borders are strictly forbidden.

---

## 5. Components: Minimalist Primitives

### Buttons
- **Primary:** `primary` background, `on-primary` text. `xl` (0.75rem) rounded corners. Subtle gradient transition to `primary-container` on hover.
- **Secondary:** `outline` border (at 30% opacity) with `primary` text. No background fill.
- **Tertiary/Ghost:** `on-surface` text with a 1px underline that expands to 2px on hover. No container.

### Input Fields
- Avoid the "boxed" look. Use a `surface-container-highest` background with a `sm` (0.125rem) bottom-only border in `primary`. Label should use `label-sm` positioned 8px above the input.

### Cards (Product & Recipe)
- **Rule:** Forbid divider lines. Separate content using `Spacing 6` (2rem) of vertical white space.
- Images should use `xl` (0.75rem) corner radius. Use `surface-container-low` as a placeholder color for image loading states to maintain the tonal aesthetic.

### Additional Signature Component: The "Ingredient Chip"
- Used for highlighting LIORA's toxin-free materials (e.g., "PFOA-Free"). 
- **Style:** `secondary-container` (#fedb98) background, `on-secondary-container` (#785f28) text, `full` rounding.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use asymmetrical margins. For example, a hero image can be offset to the right by `Spacing 12` while text sits `Spacing 24` from the left.
- **Do** use "Macro-Photography" for products, allowing the UI to bleed into the photography.
- **Do** use `surface-bright` for flash-sale or high-alert banners to maintain elegance while grabbing attention.

### Don’t:
- **Don’t** use pure black (#000000). Always use `on-background` (#1c1b1b) for text to keep the look "expensive."
- **Don’t** use standard 8pt increments for every single gap. Use `Spacing 16` (5.5rem) or `Spacing 20` (7rem) between major sections to enforce the "High-End" feel.
- **Don’t** use icons with heavy fills. Use thin-stroke (1px or 1.5px) linear icons to match the weight of the `Inter` body text.

---

## 7. Spacing & Grid System
While based on an 8pt grid, the system prioritizes "Macro-Spacing":
- **Container Max-Width:** 1440px.
- **Section Padding:** Minimum `Spacing 12` (4rem) vertical padding between homepage modules.
- **Gutter:** `Spacing 4` (1.4rem) between grid columns to allow the product photography to breathe.```