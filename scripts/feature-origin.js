const MOD_ID = "dnd5e-feature-origin";

function setting(key){ return game.settings.get(MOD_ID, key); }
function dbg(...a){ if (setting("debug")) console.log(`[${MOD_ID}]`, ...a); }
function note(msg){ if (setting("toasts")) ui.notifications?.info(msg); }
function err(msg){ ui.notifications?.error(`[${MOD_ID}] ${msg}`); }

/** Build origin choices for an embedded feat item. */
function buildOriginChoices(item) {
  const choices = [{ value: "", label: "— None —" }];
  const actor = item?.actor ?? item?.parent;
  if (!actor) {
    return { choices, disabled: true };
  }

  const items = actor.items ?? [];
  const byId = new Map(items.map(i => [i.id, i]));
  const pushItem = (it, kind) => {
    if (!it) return;
    const nm = it.name ?? it.id;
    choices.push({ value: it.id, label: `${kind}: ${nm}` });
  };

  // Species (current D&D 5e) and legacy Race / Background embedded Items.
  // Keep legacy race support so older worlds and imported content still work.
  const species = items.filter(i => i.type === "species");
  for (const sp of species) pushItem(sp, "Species");

  const races = items.filter(i => i.type === "race");
  for (const race of races) pushItem(race, "Race");

  const backgrounds = items.filter(i => i.type === "background");
  for (const bg of backgrounds) pushItem(bg, "Background");

  // Class / Subclass embedded items
  for (const c of items.filter(i => i.type === "class")) pushItem(c, "Class");
  for (const sc of items.filter(i => i.type === "subclass")) pushItem(sc, "Subclass");

  // Preserve an existing custom id not present on Actor
  const current = item.getFlag("dnd5e","advancementOrigin");
  if (current && !choices.some(c => c.value === current)) {
    choices.unshift({ value: current, label: `Custom ID: ${current}` });
  }

  return { choices, disabled: false };
}

/** Inject the control into ItemSheet5e (feat) – no jQuery. */
function injectOriginControl(app, htmlRoot) {
  try {
    const root = htmlRoot instanceof HTMLElement ? htmlRoot : (htmlRoot?.[0] instanceof HTMLElement ? htmlRoot[0] : null);
    if (!root) return;

    const item = app.item ?? app.document;
    if (!item || item.type !== "feat") return;

    const { choices, disabled } = buildOriginChoices(item);
    const current = item.getFlag("dnd5e", "advancementOrigin") ?? "";
    dbg("Injecting Feature origin for", item.name, { current, choices });

    // Avoid duplicates
    root.querySelectorAll(".feature-origin-group").forEach(el => el.remove());

    // Anchor: Feature Type row; fallback first .form-group
    const featureTypeSelect =
      root.querySelector('select[name="system.type.value"]') ||
      root.querySelector('select[name="system.type.subtype"]');
    const anchor =
      featureTypeSelect?.closest(".form-group") ||
      root.querySelector(".form-group");
    if (!anchor) return;

    const selectId = `feature-origin-${item.id}-${foundry.utils.randomID()}`;
    const optionsHtml = choices.map(c => {
      const selected = c.value === current ? " selected" : "";
      const label = foundry.utils.escapeHTML(c.label);
      const value = String(c.value ?? "");
      return `<option value="${value}"${selected}>${label}</option>`;
    }).join("");

    const block = document.createElement("div");
    block.className = "form-group feature-origin-group";
    block.innerHTML = `
      <label>Feature origin</label>
      <div class="form-fields">
        <select id="${selectId}" name="flags.dnd5e.advancementOrigin" ${disabled ? "disabled" : ""}>
          ${optionsHtml}
        </select>
      </div>
    `;

    anchor.after(block);

    // Change handler – update + force Actor sheet regroup
    const sel = block.querySelector("select");
    sel?.addEventListener("change", async ev => {
      const val = ev.currentTarget.value.trim();
      try {
        await item.update({ "flags.dnd5e.advancementOrigin": val || null });

        const actor = item.actor ?? item.parent;
        if (actor?.sheet) {
          try { actor.reset(); } catch (_e) { /* ok */ }
          setTimeout(() => actor.sheet.render(true), 25);
        }

        const label = choices.find(c => c.value === val)?.label ?? "None";
        note(`Feature origin → ${label}`);
        dbg("Updated advancementOrigin", { item: item.name, value: val });
      } catch (e) {
        console.error(e);
        err("Failed to update Feature origin. See console.");
      }
    });
  } catch (e) {
    console.error(`[${MOD_ID}] injectOriginControl error`, e);
  }
}

Hooks.once("init", () => {
  game.settings.register(MOD_ID, "debug", {
    name: "Debug logging",
    hint: "Write extra logs to the console.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  game.settings.register(MOD_ID, "toasts", {
    name: "Show toasts",
    hint: "Show a small notification after changing a feature's origin.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
  console.log(`[${MOD_ID}] init`);
});

// D&D 5e item sheet hook. Keep this for system versions that dispatch it.
Hooks.on("renderItemSheet5e", injectOriginControl);

// Foundry v14 / D&D 5e 6.x ApplicationV2 fallback.
// ApplicationV2 render hooks pass the root HTMLElement directly.
Hooks.on("renderApplicationV2", (app, element) => {
  const className = app?.constructor?.name?.toLowerCase?.() ?? "";
  if (!className.includes("itemsheet5e")) return;
  injectOriginControl(app, element);
});

// Fallback for other 5e item sheets
Hooks.on("renderItemSheet", (app, html) => {
  try {
    const item = app?.item ?? app?.document;
    if (!item || item.type !== "feat") return;
    if (!app.constructor.name?.toLowerCase()?.includes("5e")) return;
    injectOriginControl(app, html);
  } catch (_e) { /* no-op */ }
});
