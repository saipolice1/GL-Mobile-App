# TODO / Parked Tasks

Keep this file up to date and pushed — Codespace-local notes are lost when a Codespace is deleted.

## ⚠️ BLOCKER: live code is not in git

- Store version: **1.0.18** on both App Store (iOS) and Google Play (Android). Live OTA: **v2026-07-16.2** (`f162fdcd`, published 2 Sep 2026, runtime 1.0.18).
- Repo HEAD (`1dd82b7`, 2026-04-22) only contains OTAs up to 22 Apr 2026.
- Source for the 5 Jun → 2 Sep 2026 OTAs (18 updates below) was never pushed and was lost with deleted Codespace "super fishstick" (deleted ~2 Oct 2026).
- **Do NOT publish an OTA from this repo** — it targets runtime 1.0.18 and would roll every live user back to April.
- **Do NOT build 1.0.19 until all items below are restored.**

### Missing changes (from `eas update:list`, oldest first)
- [ ] 5 Jun — fix: handle SESSION_REVOKED error on checkout redirect session (`d52fd61d`)
- [ ] 14 Jul — Crash fixes, error boundary, UI polish, variant pricing, address prefill, cart reminders, notification inbox (v2026-07-13.1, `edc7eed6`)
- [ ] 14 Jul — Skeleton loading on pull-to-refresh, launch screen progress bar (v2026-07-14.1, `27974923`)
- [ ] 14 Jul — Floating glass-style pill tab bar, compact height (v2026-07-14.2, `14f44cc7`) ← expo-blur needed for real glass
- [ ] 14 Jul — Floating pill overlay (content scrolls behind), in-cart product badges, opacity tune, launch fixes (v2026-07-14.3, `1460ab4d`)
- [ ] 15 Jul — Session-expiry fix, distinct stock badges + cart badges everywhere, tab selection state (v2026-07-15.1, `5b4f07c1`)
- [ ] 15 Jul — Tab selection blob refinement (v2026-07-15.2, `d21032f9`)
- [ ] 15 Jul — Sliding tab selection blob with stretch animation (v2026-07-15.3, `009e9d92`)
- [ ] 15 Jul — Capsule tab blob (full slot width), dark brown selection (v2026-07-15.4, `7a6baa8e`)
- [ ] 15 Jul — Wider capsule tab blob matching reference proportions (v2026-07-15.5, `23d533bb`)
- [ ] 15 Jul — Compact tab bar: reduced vertical padding, wider-reading blob (v2026-07-15.6, `2c183b8d`)
- [ ] 15 Jul — WEB order channel (edit experiment), white-chip stock badges (v2026-07-15.7, `73a58667`)
- [ ] 7 Aug — Fix white space under category rows + Recently Viewed hidden by tab bar (v2026-07-15.8, `8773bd88`, republished `583f7cb6`, `64f5af53`)
- [ ] 2 Sep — Force-update store fallback fix + quieter thank-you diagnostics (v2026-07-15.9, `2938678b`)
- [ ] 2 Sep — Dedupe startup API calls, remove debug logging, small-phone scaling (v2026-07-16.1, `9ef0270d`)
- [ ] 2 Sep — Fix tab bar overflow on small phones (v2026-07-16.2, `f162fdcd`)

### Recovery steps
- [ ] Look for another local clone containing commit `84443cc` (source of `f162fdcd` — never pushed to GitHub)
- [x] `eas update:list --json` — full messages (see list above)
- [x] Download + decompile `f162fdcd` Android bundle (Hermes bytecode v96) — verified it contains the lost features
  - Recipe: fetch `https://u.expo.dev/update/<update-id>` with headers `expo-platform: android`, `expo-protocol-version: 1`, `accept: multipart/mixed`;
    download `launchAsset.url` with the `authorization` header from `extra.assetRequestHeaders[<asset key>]`;
    decompile with P1sec/hermes-dec `hbc-decompiler`
- [ ] Check Sentry release `2026-07-16.2` for uploaded source maps (may contain full source)
- [ ] Re-implement each change, commit + push individually
- [ ] Bump `constants/otaVersion.js` to match live (`2026-07-16.2`) once restored

## Next store build: v1.0.19

- [ ] Restore all missing changes above first
- [ ] Add `expo-blur` (native module — build only, not OTA) — real glass on the floating pill tab bar
- [ ] Bump `app.json` version to 1.0.19 (new runtime; versionCode handled by EAS remote autoIncrement)
- [ ] Test on a development build (not Expo Go)
- [ ] `eas build --platform all --profile production`
- [ ] `eas submit` to App Store / Google Play
