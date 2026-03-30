# Magic Studio Interface Density Design

**Context**

Magic Studio currently applies a single settings-driven `appearance.fontSize` and `appearance.lineHeight` pair to the whole shell. That keeps the UI stable, but it exposes low-level typography controls directly and offers no product-level guidance for different workspace densities.

**Decision**

Adopt a stable interface-density model instead of runtime screen-size-driven auto font changes.

- Primary control: `compact`, `standard`, `comfortable`, `auto`
- Internal stable state: `custom`
- Default: `standard`
- `auto` is recommendation-based, not continuously adaptive
- Editor and terminal typography remain independent from shell density

**Product Rules**

1. The shell must not change density automatically during normal use because of window resize, monitor switch, or scale-factor changes.
2. Choosing `auto` computes a recommendation immediately, persists the resulting typography values, and marks the shell as `auto`.
3. Manual edits to shell font size or line height switch the shell to `custom`.
4. Returning to a preset (`compact`, `standard`, `comfortable`) reapplies the preset metrics exactly.
5. Legacy settings without density metadata must be normalized safely:
   - `13 / 1.5` maps to `standard`
   - `12 / 1.4` maps to `compact`
   - `14 / 1.6` maps to `comfortable`
   - everything else maps to `custom`

**Auto Recommendation**

Recommendation uses window width first and scale factor second.

- `windowWidth <= 1280` => `compact`
- `1281 <= windowWidth <= 1720` => `standard`
- `windowWidth > 1720` => `comfortable`
- if `devicePixelRatio >= 1.25`, cap the recommendation at `standard`

This keeps the recommendation stable, respects OS scaling, and avoids over-enlarging already scaled displays.

**Implementation Shape**

- Extend appearance settings with `densityMode`
- Add a dedicated density service to:
  - resolve presets
  - recommend `auto`
  - infer legacy density state
  - mark manual overrides as `custom`
- Keep `ThemeManager` simple: it applies persisted typography and emits a density attribute for CSS hooks
- Add a dedicated `AppearanceSettings` screen section for density selection, recommendation action, and advanced typography controls

**Testing**

- Unit tests for density recommendation and normalization
- Settings service tests for legacy normalization
- Theme manager tests for `data-density` and typography variables

