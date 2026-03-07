# Sound Effects

This directory contains sound effects for the game. All sounds should be in MP3 format.

## Required Sound Files

### 1. `correct.mp3`
- **Description**: High-pitched, positive sound when the player answers correctly
- **Suggested sources**:
  - Pixabay: https://pixabay.com/sound-effects/search/correct/
  - Mixkit: https://mixkit.co/free-sound-effects/correct/
  - Freesound: https://freesound.org/search/?q=correct+answer
- **Characteristics**: Short (0.5-1s), bright, uplifting tone (like a bell or chime)

### 2. `wrong.mp3`
- **Description**: Low-pitched, negative sound when the player answers incorrectly
- **Suggested sources**:
  - Pixabay: https://pixabay.com/sound-effects/search/wrong/
  - Mixkit: https://mixkit.co/free-sound-effects/wrong/
  - Freesound: https://freesound.org/search/?q=wrong+answer
- **Characteristics**: Short (0.5-1s), dull, low tone (like a buzz or thud)

### 3. `coin.mp3`
- **Description**: Classic arcade-style coin collection sound
- **Suggested sources**:
  - Pixabay: https://pixabay.com/sound-effects/search/coin/
  - Mixkit: https://mixkit.co/free-sound-effects/coin/
  - Freesound: https://freesound.org/search/?q=coin+collect
- **Characteristics**: Short (0.3-0.5s), bright metallic chime

### 4. `boss_hit.mp3`
- **Description**: Impact sound when hitting the boss
- **Suggested sources**:
  - Pixabay: https://pixabay.com/sound-effects/search/punch/
  - Mixkit: https://mixkit.co/free-sound-effects/punch/
  - Freesound: https://freesound.org/search/?q=impact+hit
- **Characteristics**: Short (0.5-1s), punchy impact sound (explosion or punch)

### 5. `powerup.mp3`
- **Description**: Magical/tech sound when activating a power-up
- **Suggested sources**:
  - Pixabay: https://pixabay.com/sound-effects/search/powerup/
  - Mixkit: https://mixkit.co/free-sound-effects/game/
  - Freesound: https://freesound.org/search/?q=powerup
- **Characteristics**: Short (0.5-1s), futuristic or magical whoosh/sparkle

### 6. `level_up.mp3`
- **Description**: Achievement sound when collecting gems or reaching milestones
- **Suggested sources**:
  - Pixabay: https://pixabay.com/sound-effects/search/level+up/
  - Mixkit: https://mixkit.co/free-sound-effects/achievement/
  - Freesound: https://freesound.org/search/?q=level+up
- **Characteristics**: Short (1-2s), triumphant ascending melody

## Download Instructions

1. Visit the suggested sources above
2. Search for the appropriate sound type
3. Download royalty-free sounds (Creative Commons CC0 or similar)
4. Convert to MP3 format if needed (using tools like Audacity or online converters)
5. Rename files to match the exact names above
6. Place in this directory (`public/sounds/`)

## Testing

After adding the sound files, test them by:
1. Starting the game
2. Clicking the speaker icon to ensure sounds are unmuted
3. Playing a round and listening for:
   - Correct answer sound + coin sound
   - Wrong answer sound
   - Boss hit sound (in Boss Battle mode)
   - Gem collection sound (in Tower Climb mode, every 5 floors)
   - Power-up activation sound

## Volume Levels

The sound manager automatically sets volume levels:
- Correct: 50%
- Wrong: 50%
- Coin: 40%
- Boss Hit: 70%
- Power-up: 50%
- Level Up: 60%

These can be adjusted in `lib/sounds.ts` if needed.
