# Tuble Game Modes

Tuble is a daily guessing game for the London Underground. You have 8 tries to guess the mystery station. After each guess, you get feedback to help narrow it down — but the feedback depends on which mode you're playing.

There are two modes: **Map** and **Attributes**. You can switch between them using the toggle at the top of the screen. Each mode has its own saved progress, so you can play both every day.

---

## Map Mode

**In a sentence:** You're tracing a route across the tube map.

**What it tests:** Spatial awareness — knowing where stations are, which lines connect them, and how the network fits together geographically.

### How feedback works

After each guess, you see three things:

1. **Compass arrow** — A directional arrow (↗️, ⬇️, ⬅️, etc.) showing the real-world direction from your guess to the target. If you guessed Waterloo and the target is north-west, you'll see ↖️.

2. **Stop count** — "N stops away" tells you the total number of stops on the shortest route from your guess to the target (with a penalty for line changes, so direct routes score lower).

3. **Route visualizer** — A mini diagram showing the shortest path:
   ```
   [Your guess] ──(4)── ◎ ──(3)── [Target]
   ```
   - Solid dots = your guess (black) and the target (red)
   - Hollow rings = interchanges where you change lines
   - The colored bar between nodes = a segment of the route
   - Numbers above each bar = how many stops that segment covers

### The line reveal rule

This is the key strategic mechanic. Line colors on the route visualizer are **hidden by default** (shown as grey). A line segment is only revealed in color if your guessed station **shares that line with the target**.

For example, if you guess Waterloo (Bakerloo, Jubilee, Northern, Waterloo & City) and the target is on the Jubilee line, any Jubilee segment in the route will light up in silver — but segments on other lines stay grey.

Below the route, any shared lines are shown as colored "bubbles" so you know exactly which lines to explore.

**Strategy tip:** If you see a colored line revealed, your next guess should be on that same line.

### Example turn

- **Target:** Baker Street
- **Guess:** Waterloo
- **Feedback:** ↖️ 4 stops away, route shows `[Waterloo] ──(2)── ◎ ──(2, Bakerloo shown in brown)── [Target]`
- **Shared lines bubble:** "Bakerloo" appears — both stations are on the Bakerloo line

---

## Attributes Mode

**In a sentence:** You're matching the station's "DNA" against the target.

**What it tests:** Trivia knowledge — knowing which borough a station is in, what zone, which lines serve it, how busy it is, and whether it's Underground or Elizabeth line.

### How feedback works

After each guess, you see a row of **5 colored tiles**, one per category. The color tells you how close your guess is:

| Color | Meaning |
|-------|---------|
| 🟩 Green | Exact match |
| 🟨 Yellow | Partial match (some overlap) |
| ⬛ Grey | No match |

### The 5 categories

1. **Zone** — The TfL fare zone (1–9). Green if your guess is in the same zone as the target. If wrong, an arrow shows whether the target is in a higher (⬆) or lower (⬇) zone.

2. **Borough** — The London borough the station is in (e.g., Westminster, Camden, Tower Hamlets). Green if it matches, grey if not. Stations outside London show their district (e.g., Buckinghamshire, Slough).

3. **Network** — Whether the station is on the Underground, the Elizabeth line, or both. Green if the exact same set, yellow if partially overlapping, grey if completely different.

4. **Lines** — Which tube lines serve the station (Jubilee, Northern, Central, etc.). Green if the exact same set of lines, yellow if at least one line is shared, grey if no lines in common. **Important:** the identity of the shared line is NOT revealed — you just know there's overlap.

5. **Usage** — Average daily passenger volume. Stations are grouped into brackets (under 5k, 5–10k, 10–20k, 20–40k, 40–80k, 80k+). Green if the same bracket. If wrong, an arrow shows whether the target is busier (⬆) or quieter (⬇).

### Example turn

- **Target:** Canada Water (Zone 2, Southwark, Underground/Overground, Jubilee, ~28k/day)
- **Guess:** Waterloo (Zone 1, Lambeth, Underground, Jubilee/Northern/Bakerloo/W&C, ~172k/day)
- **Feedback:** `[Zone: ⬆] [Borough: ⬛] [Network: 🟩] [Lines: 🟨] [Usage: ⬇]`
  - Zone is wrong — target is higher (zone 2 vs zone 1)
  - Borough doesn't match (Lambeth ≠ Southwark)
  - Both are Underground — exact match
  - They share at least one line (Jubilee) — partial match
  - Target is quieter — arrow points down

---

## Inspiration

### Metazoa (for Attributes mode)

[Metazoa](https://metazooa.com/) is a daily animal-guessing game where each guess reveals how far through the taxonomic hierarchy (Kingdom → Phylum → Class → Order → Family → Genus) your guess matches the target. The satisfying part is the visual row of green tiles showing exactly where your guess diverges.

Attributes mode adapts this pattern: instead of taxonomy ranks, it uses station categories (zone, borough, network, lines, usage). The instant color feedback lets you systematically narrow down the target without needing to interpret text.

### Wordle / GeoGuessr (for Map mode)

Map mode draws on the spatial deduction of GeoGuessr combined with the "getting warmer" feedback of Wordle. The compass arrow and stop count give you a sense of direction and distance, while the line reveal mechanic rewards knowledge of where specific tube lines run through the network.

### Why two modes?

The London Underground has two very different kinds of knowledge:

- **Spatial knowledge** — knowing the physical layout, where stations are relative to each other, how lines weave through London
- **Trivia knowledge** — knowing administrative details like boroughs, zones, passenger volumes, and which lines serve which stations

These are largely independent skills. Some people navigate by the map every day but couldn't tell you what borough Angel is in. Others know every station's zone but couldn't trace the District line on a blank map. The two modes let each type of player shine.

---

## Data

The game includes 299 stations across all London Underground lines plus the Elizabeth line (no Overground, DLR, or Tram). Station data includes:

- **Coordinates** — latitude/longitude for compass calculations
- **Borough** — London borough (or district for stations outside London)
- **Zone** — TfL fare zone
- **Lines** — All tube/Elizabeth lines serving the station
- **Ridership** — Average daily entry + exit passengers
- **Graph** — Full adjacency graph for shortest-path routing

Data sources: TfL Open Data APIs, TfL annual ridership reports.

---

## Ideas for iteration

Some directions you might explore:

- **Difficulty levels** — Hide/reveal more information (e.g., hide compass in hard mode, hide zone arrows in hard attributes mode)
- **Line color bubbles in Attributes mode** — Optionally show line color circles alongside the Lines tile
- **Streak tracking** — Count consecutive days solved
- **Map overlay** — Show guessed stations on an actual tube map diagram
- **Sound effects** — Play the "mind the gap" chime on correct guess
- **Two-player mode** — Race to solve the same puzzle
- **Historical mode** — Guess stations from a particular era (pre-Elizabeth line, pre-Jubilee extension, etc.)
- **Interchange bonus** — Bonus feedback when your guess is an interchange station
- **Hybrid mode** — Combine elements of both modes (route + some attribute tiles)
