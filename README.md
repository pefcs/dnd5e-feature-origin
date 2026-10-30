
# D&D5e Feature Origin Setter
Adds a **Feature origin** dropdown to D&D5e **feature** item sheets so you can set
`flags.dnd5e.advancementOrigin`. This makes manually-added features sort under the correct
**Class / Subclass / Species / Race / Background** on the Actor sheet in D&D 5e 6.x
(and retains support for legacy Race items).

## Why?
When you drag a feature into an Actor, dnd5e won't always set the origin. Setting
`flags.dnd5e.advancementOrigin` to the owning item's id (e.g., a class id, a subclass id,
the race id, or the background id) fixes sorting.

## How it works
- Open a **Feature** on an **Actor** (embedded item).
- Under **Type / Feature Type** you'll see a **Feature origin** dropdown.
- Pick any of: Species, legacy Race, Background, any Class, or any Subclass present on that Actor.
- The module writes to `flags.dnd5e.advancementOrigin` on the feature.

If you open a compendium/world feature (not embedded on an actor), the control is disabled
because there is no Actor context. Edit it after it is on the Actor.

## Settings
- **Debug logging** (world): console logs.
- **Show toasts** (client): small “updated” notifications.

## Compatibility
- Foundry **v14** (minimum 14.369; not runtime-tested)
- **D&D5e 6.x** (minimum 6.0.6; not runtime-tested)
- No sheet replacement; the default sheet is extended non‑destructively.

## Install
1. Copy this folder to your `/Data/modules/dnd5e-feature-origin/`.
2. Enable the module in **Manage Modules**.
3. Open a Feature on an Actor and set **Feature origin**.

## Notes
- The dropdown is populated from the Actor: `details.race`, `details.background` and embedded
  `class` / `subclass` items.
- If the feature already has a custom origin id not present on the Actor, it’s shown as
  **Custom ID** so you don’t lose it.
