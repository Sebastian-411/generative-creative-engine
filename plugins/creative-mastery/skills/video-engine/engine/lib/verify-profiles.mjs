// Perfiles de umbrales del oráculo post-render: LA única fuente de números para verify, bench,
// analyze-reference y selftest. Objetos de datos puros (sin fs): se importan sin efectos.
// Un número de umbral vive exactamente aquí; los tools lo importan, no lo re-declaran.
// Procedencia: minMeanNorm = check del hub (movimiento > 0.004 normalizado 0-1); loudness social -14 LUFS
// / pico -2 dBTP y youtube -16 ±0.5 / ≤ -1 dBTP son especificación de plataforma; quietud y cadencia son
// heurísticas en modo aviso (WARN) hasta recalibrar con renders reales; benchmark mide, no juzga el estilo.
const PROBE = { scalePx: 320, hz: 2, quietDiffMax: 0.5, sceneThreshold: 0.3 };
const REST = { quietPctMin: 25, calmRunMinS: 1 };
const AUDIO = { clipFailFrac: 0.0005, peakWarnDb: -1, peakFailDb: -0.5, floorDb: -55 };
const ASR = { passSim: 0.7, warnSim: 0.5 };
const LOUDNESS_SOCIAL = { targetLufs: -14, tolPass: 1, tolWarn: 2, peakTargetDbtp: -2, peakFailDbtp: -1 };
const LOUDNESS_YOUTUBE = { targetLufs: -16, tolPass: 0.5, tolWarn: 1, peakTargetDbtp: -1, peakFailDbtp: -1 };

export const PROFILES = {
  social: {
    id: 'social',
    label: 'social (reels / shorts / tiktok)',
    specs: { minShortSide: 1080, fpsMin: 24, fpsMax: 60, durMin: 3, durMax: 90 },
    cuts: { sceneThreshold: PROBE.sceneThreshold },
    movement: { scalePx: PROBE.scalePx, hz: PROBE.hz, quietDiffMax: PROBE.quietDiffMax, minMeanNorm: 0.004, quietWarnPct: 40, quietWarnRunS: 4 },
    rest: REST,
    cadence: { cvMin: 0.25 },
    audio: AUDIO,
    loudness: LOUDNESS_SOCIAL,
    black: { warnSec: 1, failPct: 10 },
    asr: ASR,
  },
  youtube: {
    id: 'youtube',
    label: 'youtube (long-form / ads)',
    specs: { minShortSide: 1080, fpsMin: 24, fpsMax: 60, durMin: 5, durMax: 600 },
    cuts: { sceneThreshold: PROBE.sceneThreshold },
    movement: { scalePx: PROBE.scalePx, hz: PROBE.hz, quietDiffMax: PROBE.quietDiffMax, minMeanNorm: 0.004, quietWarnPct: 50, quietWarnRunS: 6 },
    rest: REST,
    cadence: { cvMin: 0.25 },
    audio: AUDIO,
    loudness: LOUDNESS_YOUTUBE,
    black: { warnSec: 1, failPct: 10 },
    asr: ASR,
  },
  benchmark: {
    id: 'benchmark',
    label: 'benchmark (mide referencias y renders; no juzga el estilo)',
    specs: { minShortSide: 0, fpsMin: 0, fpsMax: 240, durMin: 1, durMax: 3600 },
    cuts: { sceneThreshold: PROBE.sceneThreshold },
    movement: { scalePx: PROBE.scalePx, hz: PROBE.hz, quietDiffMax: PROBE.quietDiffMax, minMeanNorm: 0.002, quietWarnPct: 60, quietWarnRunS: 8 },
    rest: REST,
    cadence: null,
    audio: AUDIO,
    // advisory: el benchmark mide el loudness pero no bloquea por él — verify capitaliza FAIL a WARN.
    loudness: { ...LOUDNESS_SOCIAL, advisory: true },
    black: { warnSec: 5, failPct: 50 },
    asr: ASR,
  },
};
