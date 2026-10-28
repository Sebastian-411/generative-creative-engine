// Reglas narrativas del guion (schemaVersion 2). Módulo PURO: funciones sobre el objeto
// script.json, sin fs ni imports del engine — importable desde check.mjs, selftest.mjs y
// cualquier tool futura. Opt-in: solo valida cuando script.schemaVersion === 2; un guion v1
// o sin schemaVersion es legacy y no se toca.
//
// Contrato de cada línea v2: role, value_from/value_to (giro de valor: polaridad '+'/'-' o
// palabras cortas), lesson, char_budget (opcional), out (opcional: transición de salida).
// Exenciones al giro: role 'cta' y 'respite'. Origen: "Narrativa numerada" del informe del
// harness (reglas sintetizadas — McKee/Wei Minglun vía sw-story-structure, MIT — sin citas
// literales); el vocabulario de `out` resume la tabla de transiciones de motion-craft.
//
// Hallazgo: { code, severity: 'FAIL' | 'WARN', lineId, message }.

export const EXEMPT_ROLES = ['cta', 'respite'];
export const HOOK_MAX_S = 3;
// Palabras/s del ritmo típico: el targetWps por defecto con el que voice.mjs mide sus tomas.
export const TYPICAL_WPS = 2.85;
// Vocabulario de transición de salida (resumen de motion-craft/references/transiciones.md):
// cut, cascade, zoom-in, zoom-out, blur, focus, whip, iris, color, world, morph, carry, drop,
// flash, wipe, pixel, glitch, light, burn, dissolve, burst.
export const OUT_TRANSITIONS = [
  'cut', 'cascade', 'zoom-in', 'zoom-out', 'blur', 'focus', 'whip', 'iris', 'color', 'world',
  'morph', 'carry', 'drop', 'flash', 'wipe', 'pixel', 'glitch', 'light', 'burn', 'dissolve', 'burst',
];

const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const normValue = (v) => String(v ?? '').trim().toLowerCase();

export function validateScript(script) {
  const findings = [];
  if (!script || script.schemaVersion !== 2) return findings; // opt-in: v1 o ausente = legacy intacto
  const lines = Array.isArray(script.lines) ? script.lines : null;
  if (!lines) {
    findings.push({ code: 'script_lines', severity: 'FAIL', lineId: null, message: 'el guion v2 necesita un arreglo "lines"' });
    return findings;
  }

  lines.forEach((line, i) => {
    if (!line || typeof line !== 'object') {
      findings.push({ code: 'line_invalid', severity: 'FAIL', lineId: `#${i + 1}`, message: `la línea ${i + 1} no es un objeto` });
      return;
    }
    const lineId = line.id || `#${i + 1}`;
    const role = typeof line.role === 'string' ? line.role.trim() : '';
    if (!role) findings.push({ code: 'role_missing', severity: 'FAIL', lineId, message: 'sin "role": el rol habilita las exenciones (cta/respite) y el orden payoff → cta' });
    const exempt = EXEMPT_ROLES.includes(role);

    // Giro de valor: value_from ≠ value_to y lección no vacía, salvo cta/respite.
    if (!exempt) {
      const from = line.value_from, to = line.value_to;
      if (from === undefined || to === undefined || from === null || to === null || !String(from).trim() || !String(to).trim()) {
        findings.push({ code: 'value_turn_missing', severity: 'FAIL', lineId, message: 'sin value_from/value_to: un beat sin giro de valor es exposición (fúndelo con otro o bórralo)' });
      } else if (normValue(from) === normValue(to)) {
        findings.push({ code: 'value_turn_flat', severity: 'FAIL', lineId, message: `value_from == value_to ("${from}"): el beat no gira` });
      }
      if (!line.lesson || !String(line.lesson).trim()) {
        findings.push({ code: 'lesson_missing', severity: 'FAIL', lineId, message: 'sin "lesson": cada golpe debe enseñar una cosa nueva' });
      }
    }

    // Presupuesto de caracteres: cuando se declara, se respeta (se cuenta text.length).
    if (line.char_budget !== undefined) {
      const budget = Number(line.char_budget);
      if (!Number.isFinite(budget)) {
        findings.push({ code: 'char_budget_invalid', severity: 'WARN', lineId, message: `char_budget "${line.char_budget}" no es un número: no se puede medir` });
      } else {
        const len = String(line.text ?? '').length;
        if (len > budget) findings.push({ code: 'char_budget', severity: 'FAIL', lineId, message: `texto de ${len} caracteres > char_budget ${budget}: recórtalo o sube el presupuesto` });
      }
    }

    // Transición de salida: opcional; si viene, va del vocabulario declarado.
    if (line.out !== undefined && !OUT_TRANSITIONS.includes(line.out)) {
      findings.push({ code: 'out_unknown', severity: 'WARN', lineId, message: `out "${line.out}" no está en el vocabulario de transiciones (${OUT_TRANSITIONS.join(', ')})` });
    }
  });

  // Gancho: la primera línea debería caber en ≤ 3 s al ritmo típico del motor (aviso, no bloqueo).
  const hook = lines[0];
  if (hook && typeof hook === 'object') {
    const est = words(hook.say || hook.text) / TYPICAL_WPS;
    if (est > HOOK_MAX_S) {
      findings.push({ code: 'hook_duration', severity: 'WARN', lineId: hook.id || '#1', message: `el gancho tarda ~${est.toFixed(1)}s a ${TYPICAL_WPS} palabras/s (límite ${HOOK_MAX_S}s): córtalo, divídelo o pídelo más rápido` });
    }
  }

  // Orden narrativo: el remate va antes del llamado a la acción.
  const payoffIdx = lines.findIndex((l) => l && l.role === 'payoff');
  const ctaIdx = lines.findIndex((l) => l && l.role === 'cta');
  if (payoffIdx >= 0 && ctaIdx >= 0 && payoffIdx > ctaIdx) {
    const p = lines[payoffIdx], c = lines[ctaIdx];
    findings.push({ code: 'payoff_order', severity: 'FAIL', lineId: p.id || `#${payoffIdx + 1}`, message: `el payoff (línea ${payoffIdx + 1}) va después del cta (línea ${ctaIdx + 1}): primero el remate, después la acción` });
  }

  return findings;
}
