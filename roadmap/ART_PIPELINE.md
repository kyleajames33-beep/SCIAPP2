# Art Pipeline Decision

Date: 2026-03-12

## Chosen approach: FRAMER_MOTION_PNG

---

### No new packages needed
- Framer Motion is already installed
- Rive was evaluated: rigging complexity produced poor visual results, discarded
- Sprite sheets were evaluated: AI tools produce inconsistent frames across states, discarded

### Workflow
1. Generate 3 PNG images per character in Leonardo.ai (idle pose, attack pose, hurt pose)
2. Remove background (Leonardo built-in, or Adobe Express)
3. Place in `/public/images/characters/`
4. `BattleCharacter.tsx` component swaps `<img src>` based on state, Framer Motion
   drives the movement (lunge = translateX, shake = keyframes, float = looping animate)
5. Phaser canvas stays as an overlay for particles and damage numbers only

### Minimum images per character
Each character needs exactly 3 PNGs per form:
- `idle` — neutral power stance
- `attack` — lunging forward, power extended
- `hurt` — flinching backward, defensive expression

### Player characters — 3 particle types × 3 evolution forms × 3 poses = 27 images total
Forms unlock by module milestone: baby (M1–M3), mid (M4–M5), titan (M6–M8).
Phase 2 only needs the baby forms (9 images). Mid and titan forms added in Phase 7.

```
/public/images/characters/electron-baby-idle.png
/public/images/characters/electron-baby-attack.png
/public/images/characters/electron-baby-hurt.png
/public/images/characters/electron-mid-idle.png      ← Phase 7
/public/images/characters/electron-mid-attack.png    ← Phase 7
/public/images/characters/electron-mid-hurt.png      ← Phase 7
/public/images/characters/electron-titan-idle.png    ← Phase 7
/public/images/characters/electron-titan-attack.png  ← Phase 7
/public/images/characters/electron-titan-hurt.png    ← Phase 7
... (same pattern for proton-*, neutron-*)
```

### Boss characters — 8 bosses × 3 poses = 24 images total
Phase 2 only needs acid-baron (3 images). Others added in Phase 7.

```
/public/images/characters/boss-acid-baron-idle.png
/public/images/characters/boss-acid-baron-attack.png
/public/images/characters/boss-acid-baron-hurt.png
... (same pattern for each boss)
```

### Character form derivation (code rule)
```typescript
// Which form to show based on highest completed module
const getCharacterForm = (highestModule: number): "baby" | "mid" | "titan" => {
  if (highestModule >= 6) return "titan";
  if (highestModule >= 4) return "mid";
  return "baby";
};
// Image path: `/images/characters/${characterChoice}-${form}-${state}.png`
```

### Data model in bosses.json
Each boss entry has an `images` object:
```json
"images": {
  "idle":   "/images/characters/boss-acid-baron-idle.png",
  "attack": "/images/characters/boss-acid-baron-attack.png",
  "hurt":   "/images/characters/boss-acid-baron-hurt.png"
}
```

### Phase 2 integration plan
- Create `app/campaign/boss/_components/BattleCharacter.tsx`
- `PhaserBattleScene` drops: all sprite loading and character rendering
- `PhaserBattleScene` keeps: particle emitter, damage number text
- `PhaserBattleSceneHandle` reduced to just `triggerBossHurt`
- `page.tsx` adds `heroState` and `bossState` string state variables
- Character movement driven entirely by Framer Motion

### Why not Rive
- Rigging images in Rive requires significant manual bone placement
- Without a proper rig, Rive animations look no better than CSS transitions
- Getting 3 great single images is far more achievable from AI tools than
  consistent multi-frame sprite sheets or well-rigged Rive files

### Why not sprite sheets
- AI tools (Ludo.ai, Leonardo.ai) produce frames that look like different
  characters — the art style drifts between frame 1 and frame 4
- Frame measurement and Phaser FRAME_W/FRAME_H precision is a known pain point
- 3 PNGs per character requires less art production work for equivalent visual quality
