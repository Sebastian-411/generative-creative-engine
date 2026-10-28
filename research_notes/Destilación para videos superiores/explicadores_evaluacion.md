# Explainer-video workflows, evaluation gates and benchmarks (explainroo, reelbench-skills, agentskillshub video runs)

Researched 2026-10-27. Research-only; nothing in the plugin was edited. All repo claims below were verified against actual files (raw README / AGENTS.md / skills / scripts / demo outputs), not just marketing pages.

Primary sources:
- explainroo: [GitHub repo](https://github.com/vincentsch/explainroo) · [AGENTS.md (raw)](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md) — **MIT license** (badge on repo page); bundled fonts under SIL OFL per [README credits](https://github.com/vincentsch/explainroo#credits-and-license).
- reelbench-skills: [GitHub repo](https://github.com/eternityspring/reelbench-skills) · [skills/video-shots/README.en.md (raw)](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md) — **Apache-2.0 license** (badge on repo page); methodology learned from [shuohao-skills](https://github.com/eternityspring/shuohao-skills) (Apache-2.0, per its Credits section).
- agentskillshub: [best/claude-video-skills/](https://agentskillshub.top/best/claude-video-skills/) and the run pages for [explainroo](https://agentskillshub.top/best-runs/video/vincentsch__explainroo.html), [claude-code-video-toolkit](https://agentskillshub.top/best-runs/video/digitalsamba__claude-code-video-toolkit.html), [hypit](https://agentskillshub.top/best-runs/video/hypit-ai__hypit.html); methodology lives in [ops/video-runs/score_video.py](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/score_video.py), [ops/video-runs/in/brief.md](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/in/brief.md) and [ops/video-runs/RESULTS.md](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/RESULTS.md) (repo zhuyansen/agent-skills-hub).

---

## What concrete explainer-video workflows exist, and does the code back the claims?

### Takeaway
explainroo is a well-verified, fully local (no-key) explainer pipeline whose agent workflow (script → voice → word-cued scenes → automated layout/speech checks → still review → render → file-level verify) is documented in its AGENTS.md and backed by a Gradle of subcommands; reelbench-skills does the reverse direction (finished film → measured shot table) with 15 deterministic quality gates and a published real-output fixture that matches its README numbers.

### Cited Findings
- explainroo's workflow is a two-file contract the agent writes: `script.md` (scene-structured narration with `[#marker]` cue points, `[pause]`, `{shown|spoken}` pronunciation overrides) and `scenes.js` (one drawing function per scene, every picture tied to a spoken word via `at: 'word'` or `at: '#marker'`) — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- Its pipeline steps verified in AGENTS.md: `doctor` (environment + model download, ~400 MB once) → `init` (six looks: paper, clean, chalk, blueprint, midnight, editorial; eight platform sizes) → `voice` (Kokoro local TTS, 54 voices, Whisper word timing; ElevenLabs or human recording optional) → `check` → `still`/`sheet` → `render` (MP4 + `.srt`/`.vtt`/cover/chapters) → `verify`. The repo GitHub page confirms the same architecture (Kokoro voice, Whisper timing, Chrome canvas renderer, ffmpeg) — [repo](https://github.com/vincentsch/explainroo).
- Product demos: `explainroo capture videos/<name> https://site.com --mobile` opens the site in a fresh cookie-free browser and saves screenshots (`page.png`, `full.png` up to 8000 px tall at 2× density, mobile variants), `capture.json` with colors, fonts, logo candidates and the page's exact wording, plus downloadable font files and a paste-ready `brand`/`fonts` JSON block for `video.json` — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md). A working product-demo example ships at `examples/unspar-demo` (linked from [README](https://github.com/vincentsch/explainroo#product-demos)).
- reelbench-skills contains three skills: **video-shots** (shot breakdown of a finished film), **video-sync** (composite showing footage + current shot data switching at every cut), **video-scrub** (metadata stripping with byte-level verification) — [skills/video-shots/README.en.md](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md) and [repo README](https://github.com/eternityspring/reelbench-skills).
- reelbench's core design line: "shot boundaries are measured, not eyeballed" — ffmpeg measures cuts, durations (2 decimals) and median frame difference; the model only judges size, category, camera, frame description and rhythm; **15 deterministic code gates** validate every result and a wrong call is blocked on the spot — [video-shots README](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md).
- Reproducibility of reelbench is real, not claimed: `demo-report/` at repo root is complete pipeline output for a 202.9 s film (53 shots, 3.83 s average shot length, 15.7 cuts/min, all 15 gates green) — I fetched [demo-report/shots.md (raw)](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/demo-report/shots.md) and confirmed the same numbers and all 15 gates marked ✅, including two non-blocking hints (shot S46 annotated "static" while measured frame change was 12.3; six consecutive "closing" end cards flattening rhythm).
- The 15 gates each have a breaking test case: `node scripts/selftest.mjs` runs 449 assertions proving each gate actually blocks — [video-shots README](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md).
- No npm dependencies, no API keys for reelbench (node ≥ 18 + ffmpeg/ffprobe), install via symlink so `git pull` updates immediately — [repo README](https://github.com/eternityspring/reelbench-skills).
- explainroo's README claims tests run on Linux, macOS and Windows for every change, and the repo has a `.github/workflows/` directory — [repo](https://github.com/vincentsch/explainroo); I did not read the workflow files themselves (see Gaps).
- Marketing claims to distrust: hypit's tagline "Clone any viral video… swap the face… ship 100 variants in one command, and get your 100M views" ([hub listing](https://agentskillshub.top/best/claude-video-skills/)) — promotional, unverified, and its own test run showed a silent audio track while the table said "sound: yes" (see benchmark section below).

### Inferences
- explainroo's `script.md` + word-anchored `scenes.js` approach and our plugin's `stage.at/word` approach converge on the same principle (voice is the clock), so workflow ideas port over with little friction.
- reelbench is complementary rather than competing: it audits finished video (including AI-generated film), which is exactly the job our `video-review` skill does by hand — its gates could partially mechanize that.

### Gaps
- Dependency licenses beyond the project license were not independently verified (README says MIT for the project, OFL for bundled fonts; it does not state Kokoro's license — only that credits go to Kokoro/Whisper/Rough.js/Lucide/MathJax/Playwright/ffmpeg).
- Individual explainroo source files (e.g., the layout-check implementation under `src/`) were not read; the QA gate descriptions come from AGENTS.md and README, which are consistent but are self-descriptions.
- The `.github/workflows` contents (what OS matrix actually runs) were not inspected.
- huypit's own repo was not fetched; its 4/4 run score says nothing about its viral-cloning claims.

---

## How does agentskillshub score video runs, and how objective is it?

### Takeaway
The scoring is unusually honest for an aggregator — four file-derived checks (playable H.264, exact spec, copy readable in sampled frames, motion above noise) with measured values, a published script, a no-skill control run, and an explicit "we do not score looks" disclaimer — but every check is a legal floor, not quality: all 16 skills passed, ranking is secretly by build time, "sound" is detected as mere audio-track presence (one flagged "yes" file was −91 dB silence), and look judgments are by eye.

### Cited Findings
- The four checks ([round-run page](https://agentskillshub.top/best-runs/video/vincentsch__explainroo.html), [benchmark page](https://agentskillshub.top/best/claude-video-skills/)): (1) renders to a playable file (codec check: H.264), (2) length/size/fps as asked, (3) all five lines of copy readable in frames sampled at 2/s, (4) the picture moves (held-still frame pairs below threshold).
- The brief fixed every variable: 15-s promo for a made-up app ("Tidepool", water-quality app), five fixed copy lines, 1920×1080 @ 30 fps, **no voice-over, no API keys, draw with code**; machine had Node 22, Python 3, Chromium, ffmpeg — [in/brief.md (raw)](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/in/brief.md).
- Verified scoring script mechanics ([score_video.py (raw)](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/score_video.py)):
  - Spec check: `SECONDS=(14.5,15.5)` tolerance, exact 1920×1080, `round(fps)==30`, `codec=="h264"` — measured with ffprobe (via a dockerized `measure_video.py`).
  - Copy readability: a model (gpt-6-astra, temperature 0) reads the sampled frames in **three passes with majority vote**, asked to return per-line frames where the whole line is visible and legible, plus any **other text on screen** ("other_text") — i.e., it also catches hallucinated/added copy.
  - Calibration honesty: `READABLE_FRAMES=1` was chosen because on the control video the reader marked a line "it could plainly read in two frames" as not — so they use the paper's strict match but only require one valid frame; the method cites Deganutti et al. that models read rendered text far better than OCR (0.940 vs 0.659 on perfect renders).
  - Motion check: mean frame-to-frame change > 0.004 and not more than half dark frames.
  - Reproducibility artifacts: each run records `measure.json`, `copy.json`, `commit.txt` (first 12 chars of the skill's commit shown in the table), and the script generates both `results.json` and `RESULTS.md`.
  - The "Sound" column is set by `m["audio"]` — presence of an audio track, not audible sound.
- [RESULTS.md (raw)](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/RESULTS.md) full table (2026-10-11): all 16 skills **and** the no-skill control passed 4/4 with 5/5 lines readable; held-frame shares ranged 0%–48% (explainroo 0%, hypit 0%, digitalsamba toolkit 24%, remotion-dev 34%, hyperframes 38%, lottie 34%, motion-graphics 48%, onetake 45%); time to build 2.0–23.5 min.
- The hub's own stated limitations ([benchmark page](https://agentskillshub.top/best/claude-video-skills/)): "The brief is short and simple, so it cannot separate these skills on reliability: every one passed. One run per skill; a second run would look different. The look is our judgement by eye, not a measurement, and nobody rated the films for quality. … The copy was read off the frames by a model, whose frame numbers we found to be off by one in places." Also: security grades "read what a repository says and contains; it does not watch the tool run", and "No one pays to be listed or ranked here."
- Concrete objectivity failure to cite: hypit's run page ([hypit run](https://agentskillshub.top/best-runs/video/hypit-ai__hypit.html)) says in the session's closing message, "I left the video silent… the file still contains an audio track, but it's pure silence (−91 dB)" — yet RESULTS.md and the table print "Sound: yes" for hypit. The four binary checks all passed regardless.
- Under Moves differ wildly despite identical pass status: digitalsamba's film held still on **24%** of sampled frame pairs (echoing the benchmark page's own concern "a picture that actually moves, or is it slides with a fade?" — [toolkit run](https://agentskillshub.top/best-runs/video/digitalsamba__claude-code-video-toolkit.html)) vs explainroo/hypit at 0%.
- The hub's summary is editorial, not scored: its top pick for "a finished film fast" is explainroo "★ 616" and it openly ranks by time taken; the "a look of its own vs close to the no-skill film" grouping is by visual inspection — [benchmark page](https://agentskillshub.top/best/claude-video-skills/).
- Star counts shown next to skills are inconsistent between pages of the same site (explainroo ★ 616 on the run page vs ★ 523 in RESULTS.md vs ★ 616 in the catalog; hypit ★ 20,799 vs 26.1k) because the catalog refreshes every 8 h; they are proxies for attention, not quality — [run pages vs RESULTS.md](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/RESULTS.md).

### Inferences
- Treating the results as a **floor metric** is legitimate: if a tool cannot pass playable/spec/copy/moves in a no-key sandbox, that is a real defect signal. Reading anything more into 4/4 is not — the ceiling is closed at "everyone passes".
- The genuinely informative columns are the continuous ones: held-frame %, build minutes, and the frame contact strips (frames sampled twice a second, published per run). Binary pass/fail is where the ranking degenerates.
- "Sound: yes" as implemented would classify mute-rendered video as having passed audio; any benchmark we build must measure actual loudness (e.g., RMS or LUFS), not stream presence.
- The benchmark is reproducible in our favor: single tookaway script + commit hashes + published frame strips means we could re-run their scoring script against our own renders and sit on the same comparison axis.

### Gaps
- The exact `MOVES` threshold effect on long fade-heavy films (e.g., whether 48% still-share for motion-graphics still passed 4/4 because of enough motion elsewhere) was not deep-dived per film; the strips (JPGs) were not downloaded for visual re-check.
- `ops/video-runs/SOURCES.md` (why these four checks) and `measure_video.py` were not fetched; the four checks are documented in score_video.py's docstring and from the run pages.
- agent-skills-hub repo's own license and the "42 published security rules" were not reviewed here.

---

## What visual review loops exist, and what evaluation gates should a plugin add?

### Takeaway
Three verified review loops: explainroo's agent-side loop (code-level `check` plus stills/contact sheets the agent inspects, plus file-level `verify` on the rendered MP4), reelbench's measured-vs-judged split with 15 code gates proven by breaking-case tests, and the hub's file-derived scoring. The most adaptable idea: deterministic gates that measure the rendered file rather than trust the code, each with a breaking test case.

### Cited Findings
- **explainroo's `check` (code-level, pre-render)** — per [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md): layout, timing and pronunciation problems; text off-frame, too small text, overlapping text, long stretches with nothing new on screen ("something changes every 2 to 4 seconds" is a rule `check` enforces), caption-band intrusion, contrast too low between ink/muted and background in custom looks. A feed-size re-check exists: `check --view-width 854` warns when visible text would shrink below 16 px in a Reddit-sized player, plus a 0.4448-scale still review to judge post-compression legibility.
- **explainroo's `verify` (file-level, post-render)**: measures loudness (target −14 LUFS default), looks for black frames and silence, and re-runs the speech check on the finished audio to confirm the voice is still intelligible over music — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- **explainroo's still loop**: `still` (end of scene / any time), `sheet --scene x` (one scene over time), full video sheet; AGENTS.md tells the agent (explicitly, because "You cannot watch the video") to open images and judge like a viewer: text big enough, cut-off/overlap, half-empty frames, does the sheet show something new every few seconds.
- **Speech-accuracy gate**: the `voice` command prints how many words the speech check (Whisper ASR listening to the rendered voice) confirmed; an unconfirmed word likely got mispronounced and the agent fixes it with a `{shown|spoken}` override. Cross-language variants: Japanese compares kana readings, Chinese compares tone-free pinyin with Simplified/Traditional equivalence — engineered to avoid false positives from ASR spelling variance — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- **reelbench's 15 gates (validated outputs)** — [video-shots README](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md): timeline continuity; duration self-consistency; shot numbering discipline (S01, zero-padded — number doubles as filename, a template-injection-style hygiene); three vocabularies (size/category/camera) checked term by term, blank = fail; frame description must be long enough (≥8 English words), no filler ("visually stunning"), no "This shot…" openers; duplicate descriptions taken as making a miss — "nobody looked twice"; category required evidence (dialogue needs a spoken line, empty shots may not contain people); camera-claim vs measured-motion gate; boundaries must be declared from detection (`manualCuts`), hand edits fail; keyframes present (missing reported, never faked); rhythm annotations all-or-none specific.
- **Camera-claim gate asymmetry**: only hallucinated motion is blocked (claiming push/pan/zoom while measured change ≈ 0); the reverse only raises a hint — "A gate that fires wrongly is worse than no gate" — [video-shots README](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md). Their `S46 static, measured 12.3` example hint also appears in [demo-report/shots.md](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/demo-report/shots.md).
- **Contact-sheet reading discipline**: two keyframes per shot at 15% and 85% ("frame a" content vs "frame b" camera work) tiled into contact sheets; the framing comparison across sheets is how a camera move is inferred — prevents frame-by-frame token burning and hallucination.
- The hub's methodology paper anchors ([cited on benchmark page](https://agentskillshub.top/best/claude-video-skills/)): TheoremExplainAgent (ACL 2025, arXiv 2502.19400) — best agent rendered 93.8% of explainer videos and most rendered videos still had minor layout problems; MoVer (SIGGRAPH 2025, arXiv 2502.13372) — 58.8% of motion graphics matched the request first-try, 93.6% after up to 50 automatic verification-correction rounds; Deganutti et al. (ICML 2026 workshop, arXiv 2605.16223) — model-read text beats OCR; Code2Video (arXiv 2510.01174); SkillsBench (arXiv 2602.12670) — a benchmark of agent skills across tasks. These are hub-cited numbers, not individually verified by this research.

### Inferences
- The three-page chain (code check → stills viewer → file-level verify) maps exactly onto our existing `check.mjs` + `stills.mjs --review` + contact sheets, but **our missing rung is the file-level verify** (post-render loudness/black-frame/silence/voice-clarity measurement). explainroo's run-page logs show `verify` catching color-range real output like digitalsamba's manual color-range bug class too.
- Two cheap measurable QA axes we don't currently flag: (a) index-level **"something changed every 2–4 s"** detection directly off rendered frame sampling (the hub's mean frame change / held-frame share), (b) **audible-audio validation** (RMS/LUFS > floor).
- Deterministic gates that "say they are skipping" when an input is missing (reelbench) is a good pattern for our check.mjs: never silently pass; report unreadable as unreadable.

### Gaps
- Whether explainroo's `check` catches overlapping text it doesn't see (clipped text behind panels) — AGENTS.md notes `check` does not see clipping-by-`s.camera` and treats clipped-away text as visible; edge cases remain human.
- The internal implementation of explainroo's layout/speech checks (how overlap/tolerance is computed) was not read from `src/`.

---

## What website/product-capture techniques are evidenced?

### Takeaway
The strongest verified technique is explainroo's `capture` command: a fresh-profile headless browser snapshot that harvests screenshots (page + full-page at 2× density, mobile), design tokens (colors, fonts, logo candidates) and the page's exact wording as the source of truth, plus hard truthfulness rules for demos.

### Cited Findings
- `explainroo capture videos/<name> https://example.com --mobile` saves `page.png` (first screen), `full.png` (whole page up to 8000 px tall, 2× density so the camera can zoom without softening), mobile variants, `capture.json` (colors, fonts, logo candidates, wording: headings, navigation, buttons, form labels), up to three logo files, and Google-Fonts-served font files with license-file requirement, then prints a `brand`/`fonts` block for `video.json` — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- Truthfulness rules for product demos, same source: copy labels/buttons/status names exactly from the product's templates or language files; show only features that exist and customers can use; exclude admin/debug screens and unbuilt plans; example data must look like example data (`example.com`, made-up projects); never invent customers, numbers or results; claims in narration must come from the product's live website; show prices only if the website shows them; ask the user if the site and app conflict.
- Demo scene craft: rebuild screens with the `s.ui` kit (browser frames, panels, buttons, inputs, dropdowns, toggles, cursor with typed-text clicks with SFX), cursor last so it stays on top; camera zooms must be either ≤1.1 (headline stays visible) or ≥1.3 (headline exits frame) to avoid half-cut headlines; zoomed-in looks must be checked from stills; keep typing audio quiet so `verify`'s voice-clarity check isn't degraded — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- Wording-as-source: for outcome grammar, "The live site is the source of truth for claims and wording" — a discipline stronger than our "brand tokens" policy because it forces text verbatim from the actual product.
- digitalsamba's toolkit run shows the complementary reality without API keys: most of its AI-asset workflow (voiceover, images, AI music, video clips) "all need cloud GPU endpoints or API keys", so the run reused only its product-demo Remotion template + local Chromium render, and even needed a **manual ffmpeg conversion to fix a full-range color file** some players mishandle — [toolkit run page](https://agentskillshub.top/best-runs/video/digitalsamba__claude-code-video-toolkit.html).

### Inferences
- 2× DPI full-page screenshot is the one detail that makes site screenshots usable in zoom-heavy motion (we render at 1920×1080 and presently grab single screenshots); a zoomed-in motion piece on a 1× screenshot turns soft.
- "Cookie banners and chat widgets can appear in screenshots; use crops that don't include them" is a pragmatic micro-rule worth copying into our site-включение workflow docs.
- Both India the toolkit case (big toolkit, few steps usable without keys) vs explainroo (smaller but 100% no-key-capable) hints: a plugin should degrade gracefully when a cloud key is absent, not half-fail.

### Gaps
- `explainroo capture`'s handling of login-walled or JS-heavy SPAs was not tested here (fresh-profile = no logins by design).
- No direct evidence files for the Unspar demo were fetched (`examples/unspar-demo` not read project-by-project).

---

## What makes an explainer visually clear and trustworthy?

### Takeaway
Clear explainers follow voice-pixel lockstep: text appears when it is spoken, one idea per scene on mostly-static layouts, tight size floors measured in pixels with automated less-than-16px and safe-area checks, and trust comes from verifiable claims, exact wording, and measured checks (ASR round-trip, loudness, no invented numbers).

### Cited Findings
- Size floors on a 1920×1080 canvas: titles 80–110 px, labels 40–56 px, small text ≥ 32 px, all inside the safe area — plus the feed-player re-check at 854 px width warning under 16 px text (Reddit) and a 0.4448-scale still check to judge post-compression legibility — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- Visual density rules, same source: show it when it is said (word cues); something changes every 2–4 s; at most 5–6 elements on screen simultaneously, with `out` removal before the next idea; short screen text (labels, numbers, key phrases — never full narration on screen; if captions are on, do not also print the spoken sentence); same meaning, same color across scenes; accent color reserved for the single most important thing; end on a clear frame that states the main point.
- Voice-writability rules that make narration trustworthy-sounding: plain conversational sentences of 8–18 words, one idea each; "Every sentence adds a fact"; explicit bans on AI tics ("Just code.", "not X, but Y" twists, colon reveals, chains of three short sentences, metaphors; filler words like "just", "simply", "really", "actually", "exactly"); no telling viewers to do obvious things ("Let's dive in"); end with a plain sentence summarizing the main point — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md).
- Fact discipline before visual work: "Write down the facts you will use. Never make up numbers, quotes or claims. If a number matters and you cannot check it, leave it out" — [AGENTS.md](https://raw.githubusercontent.com/vincentsch/explainroo/main/AGENTS.md). This pre-empts the fact-checker problem at script level.
- The benchmark's own framing after 16 runs: what differentiates quality code-video is copy fidelity (never missing or invented), achieved by reading rendered frames rather than trusting code — "Layout is where code-made video goes wrong" — [benchmark page](https://agentskillshub.top/best/claude-video-skills/).
- Trust-from-craft demos in the winners' run notes: explainroo's own copy discipline in the test run was "each of the five lines gets its own scene, in order and word for word, with nothing else written on screen" ([explainroo run](https://agentskillshub.top/best-runs/video/vincentsch__explainroo.html)); digitalsamba's version described pixel actions matched to semantics (rain countdown ring without numbers, beaches dotting the coast) [toolkit run](https://agentskillshub.top/best-runs/video/digitalsamba__claude-code-video-toolkit.html).

### Inferences
- "Nothing else written on screen" (anti-extra copy, measured as `other_text`) is itself a trust metric: a surprising number of hallucinated taglines would be visually caught by the same model reads the hub already performs.
- The "clear last frame that states the main idea" plus a static suitable-for-thumbnail cover echoes our ¡Posterior/póster framework, adding a mechanical touch: sinks a specific cover still at `auto` (end-of-first-scene) or time-coded.
- Karaoke-style lighting word-by-word captions on vertical video are checked by ASR round-trip; ours render captions from known timings — but adding our own captions' legibility check at feed-width is untested in our pipeline.

### Gaps
- No published user-perception evidence (eye-tracking, retention A/B) backs these size/period rules; they are practitioner heuristics from one author and one benchmark's editorial classifications.
- Which of the 16 test films "looks trustworthy" was never rated — even the hub's nod to "How good a film looks is not scored" ([score_video.py docstring](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/score_video.py)).

---

## Which benchmarks are useful vs vanity? What should our plugin adopt, defer, or reject?

### Takeaway
Useful benchmarks: file-derived, threshold-bearing checks with published scripts, fixed brief, control runs, and datasets of artifacts/commits for re-runs. Vanity: star counts, binary pass counts on a trivially-easy brief, security grades from README reading, "looks" expressed as ranking. Adopt for our plugin: a post-render `verify` rung, held-frame/motion metric, audible-sound check, caption/safe-zone + feed-width check, model-read copy fidelity in the final review, and deterministic gates with breaking-case self-tests.

### Cited Findings
- All 16 skills and the control pass 4/4 on a shared brief; ranking is thus by build time and appearance only — explicitly stated as binary-ceiling limitations by the hub itself ("cannot separate these skills on reliability", "Judged by eye") — [RESULTS.md (raw)](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/RESULTS.md) and [benchmark page](https://agentskillshub.top/best/claude-video-skills/).
- The hub freely acknowledges: single run; model-reading of copy; off-by-one frame errors; security grade is repo reading, not execution; no paid placement — [benchmark page](https://agentskillshub.top/best/claude-video-skills/).
- Continuous metrics carry signal where pass/fail doesn't: held-frame triage 0–48% (fades vs living motion), 2.0–23.5 min build times, and look classification into "10 with a look of their own, 6 like the control" — note the dismissed "close to no-skill" group includes 20k+ star hypit, showing stars don't predict visual distinction — [RESULTS.md (raw)](https://raw.githubusercontent.com/zhuyansen/agent-skills-hub/main/ops/video-runs/RESULTS.md).
- Scholar-precedent numbers cited by the hub for why iteration and layout checks matter — TheoremExplainAgent, MoVer, Deganutti — see [benchmark page](https://agentskillshub.top/best/claude-video-skills/) citation list.
- reelbench's design philosophy as an anti-vanity proof: "a checklist the model polices itself against is worthless" — all gates are deterministic code, each with a proven breaking case in a 449-assertion self-test — [video-shots README](https://raw.githubusercontent.com/eternityspring/reelbench-skills/main/skills/video-shots/README.en.md).

### Inferences — recommendations (adopt / defer / reject)

**Adopt** (evaluation gates our plugin lacks, mapped to our check.mjs/stills.mjs/mix/review):
1. **Post-render `verify` pass** (explainroo pattern): measure the delivered MP4 for loudness vs −14 LUFS target, black frames, silence, and voice-clarity-intelligibility over music via ASR round-trip. Our check.mjs never opens the rendered file today.
2. **Held-frame / motion-share metric** (hub's `mean_change` + still-pair share): automatically classify "slideswith-fade" output and surface it in `stills.mjs --review` alongside the phone/beats/cuts sheets; a two-digit share (like digitalsamba's 24%) becomes a numeric finding.
3. **Audible-sound check** at mix time: fail on an effectively silent track (RMS/LUFS floor); directly motivated by hypit's −91 dB "sound: yes" false positive.
4. **Feed-width legibility re-check**: run check at feed player width (e.g., 854-equivalent) and warn on text under ~16 px; plus a post-compression still at reference-scale to catch "readable in source, unreadable when streamed".
5. **Copy-fidelity against the brief's lines** for on-screen text: model-read sampled frames in N-pass majority, list required lines found + any extra text; cheap to bolt onto stills-to-frames contact sheets we already build.
6. **Deterministic gates with breaking-case unit tests** (reelbench's selftest): every check.mjs rule ships with a fixture that is expected to fail it; also adopt their skip-reporting discipline (empty input ⇒ reported skip, not silent pass).
7. **Safe-zone rules as data** for platform overlays (Shorts/TikTok/Reels button zones), backed by our phone sheet; our plugin has this as craft (visual check) but not as a measured gate with numeric zones.
8. **"Something changes every 2–4 s" auto-flag** from rapid frame sampling (explainroo's still-sheet rule encoded as a gate).

**Defer**:
- Token-heavy automated shot-breakdown pipeline (video-shots-style reports) — most valuable when repurposing footage or auditing AI-generated film; our engine builds every frame from code and already knows its scene structure, so the measured need is low.
- A formal "look-of-its-own vs control" evaluation round with human-by-eye classes — valuable but needs production of a shared brief we don't have yet; model-read copy fidelity gains more value first.
- Karaoke word-by-word caption redesign — ours already word-lights? (needs confirmation from our engine's docs before committing; not verified in this research).
- Camera-claim-vs-motion gate (reelbench) — deserves adoption logic for any AI-video-imitation feature, not for our own render path today.

**Reject**:
- Star counts, download counts, or "spots on lists" as quality proxies for anything in our docs or marketing — documented to diverge (hypit 20k+ stars sits in the "looks like the no-skill baseline" group).
- Binary "it passed" gate conclusions from a too-easy fixed brief, especially sound-detection-by-stream-presence.
- Aggregator security grades as a substitute to actually reading a repo's code before installs — the hub itself disclaims execution-time coverage.
- roger video toolkits whose core asset steps need paid keys (hypit's claims, digitalsamba's AI-asset steps) for our no-key base path; they are still viable for host-of-our-choice extensions, but not as the engine core.
- Claiming our outputs "passed benchmark X" without re-running the published script ourselves — the hub's numbers are one-run artifacts, not stable skill rankings.

### Gaps
- No direct measure of how sensitive held-frame % is to threshold choice (`MOVES=0.004`): sensitivity analysis not published.
- The "one run per skill" complaint could not be retested (would require re-running their sandbox; out of scope here).
- onetake's claimed "continuity measured by an oracle" (catalog blurb) was not investigated; it may be another adoptable metric for our "nothing cuts" style prompts.
