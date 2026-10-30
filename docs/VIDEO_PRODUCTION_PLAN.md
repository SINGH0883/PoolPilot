# 🎬 PoolPilot Video Production Masterplan
### Powered by Claude Video Editing Skills & Awesome Video Frameworks

This plan synthesizes insights from **Darius Reed's 8 Claude Video Skills** and the **Awesome Claude Video Skills Catalog** (Remotion, HyperFrames, Motion-Video-Kit, and Animation Vocabulary) to create a top-tier video elevator pitch for **PoolPilot** (Team 404) at **Hack in Hills - Round 2** (powered by TinyFish).

---

## 🧠 Part 1: The Synthesized Video Skills Stack

From [Darius Reed's Video Editing Skills](https://www.dariusreed.com/claude-video-editing-skills/) and [Awesome Claude Video Skills](https://github.com/zhuyansen/awesome-claude-video-skills), we extract an **8-stage agentic video pipeline**:

| Step | Technique / Skill | Source & Framework | What It Does for PoolPilot |
| :--- | :--- | :--- | :--- |
| **01. Cut & Flow** | `hyperframes-student-kit` / `cut-silences` | Nate Herk / HeyGen | Removes dead air, trims pauses under 120ms, ensures rapid-fire 60-second hackathon pacing. |
| **02. Dynamic Captions** | `embedded-captions` / Kinetic Typography | HyperFrames / Remotion | Renders bold, word-by-word animated captions with colored emphasis tags (85% of LinkedIn/X users watch on mute). |
| **03. Stat Counters & Overlays** | `motion-graphics` & Counter Climbs | HeyGen / Remotion | Animates dynamic metrics: `$1,828,888 TVL`, `0.30% Fee Tier`, `35/35 Tests Passing`. |
| **04. Easing & Physics** | `animation-vocabulary` & `review-animations` | Emil Kowalski | Enforces non-linear motion: `cubic-bezier(0.16, 1, 0.3, 1)` ease-out-expo for UI slides; stops generic linear AI jitter. |
| **05. Code Motion Design** | `claude-motion-design` / `vibe-motion` | Howseen AI / Remotion | Builds high-energy video directly from our React codebase (`SwapCard`, `ActivityLedger`, `TradingChart`). |
| **06. Math Visualizer** | `manim-skill` / SVG Curve Engine | 3Blue1Brown / Yusuke | Illustrates the AMM invariant formula $x \cdot y = k$ with a sliding tangent dot demonstrating slippage mechanics. |
| **07. Beat Sync & Pacing** | `music-to-video` / Cut-As-Code | HyperFrames / OpenMontage | Locks every scene change and click animation to the rhythm/percussion of an electronic synth track. |
| **08. Sound Design (SFX)** | `media-use` / Motion Sound Design | HyperFrames / Freesound | Adds subtle audio hits: whoosh on tab switch, mechanical click on token selection, confirmation chime on swap success. |

---

## 🎯 Part 2: Two Production Execution Pathways

We provide **two parallel execution options**:

### 🚀 Pathway A: Code-Rendered Remotion Video (Zero Screen-Recording Jitter)
- **Concept:** Render a 60-second video directly inside the repository using **Remotion** (React-based video framework).
- **Why this wins:** Since PoolPilot is a React/Tailwind app, Remotion renders the actual code components (`SwapCard.jsx`, `ActivityLedger.jsx`, `TradingChart.jsx`) at 60 FPS in 1080p/4K with synthetic cursor animations, particle effects, and dynamic number counters.
- **Workflow:**
  1. Initialize Remotion composition in `video/` directory.
  2. Import PoolPilot components and mock state streams.
  3. Orchestrate 5 scenes over 1,800 frames (60 seconds at 30 fps).
  4. Render to `.mp4` using the local FFmpeg 8.1 executable.

### 🎥 Pathway B: Studio Recording with Motion Graphics Overlay (Hybrid)
- **Concept:** Screen-record the live app at `http://localhost:3001/` using OBS Studio or Loom, while Alwin/Yuvraj/Yash deliver the spoken voiceover, overlaid with programmatic motion cards and kinetic captions.
- **Workflow:**
  1. Follow the frame-accurate **Director's Cue Sheet** (below).
  2. Use a smooth mouse dampener / zoom-in on the new Pool Activity Ledger & Swap Card.
  3. Apply CapCut / Premiere / HyperFrames auto-captions with custom brand styling.

---

## ⏱️ Part 3: Frame-by-Frame 60-Second Video Cue Sheet

| Timestamp | Visual Beat | Motion / Transition | Audio & Spoken Script (Mandatory Tags) | SFX Hit |
| :--- | :--- | :--- | :--- | :--- |
| **0:00 - 0:08** | **Hook & TinyFish Intro**<br>Glowing neon Hack in Hills banner + PoolPilot logo | Smooth scale-up from 0.85 to 1.0 with subtle dark purple radial glow | *"Hack in Hills — powered by TinyFish! What if decentralized token swaps were as instantaneous, transparent, and mathematically predictable as high-frequency trading?"* | Heavy sub-bass drop + whoosh |
| **0:08 - 0:18** | **The Problem & Solution**<br>Split screen: High slippage warning vs PoolPilot clean interface | Slide-in from left with ease-out-expo; red flash to teal glow | *"Meet PoolPilot, engineered by Team 404: Alwin Mathew, Yuvraj Kumar, and Yash Singh. We built a high-performance, non-custodial Automated Market Maker protocol."* | Fast whoosh + mechanical click |
| **0:18 - 0:32** | **Live Swap & Dynamic Bonding Curve**<br>Cursor selects 1.5 ETH $\rightarrow$ USDC; bonding curve tangent dot slides | Dynamic zoom (1.3x) onto `SwapCard`; curve shifts in real time | *"Powered by the constant-product invariant $x \cdot y = k$, PoolPilot computes exact output quotes and price impact down to the wei with sub-second WebSocket updates."* | Typing tick + cash-register chime |
| **0:32 - 0:44** | **Pool Activity Ledger Showcase**<br>Pan down to the revamped Activity Ledger with live pulses | Smooth camera pan down to ledger; green badge pulsates | *"Transactions don't hide in black boxes. Our real-time Pool Activity Ledger streams every mint, burn, and swap with 1-click clipboard verification and instant block finality."* | Subtle digital beep + pulse hum |
| **0:44 - 0:52** | **Security & Test Coverage**<br>Hardhat/Foundry badge + smart contract diagram | Modal pop-up: `35/35 Tests Passing` with green checkmarks | *"Security first: strictly adhering to Checks-Effects-Interactions, reentrancy guards, and zero unhandled ether vectors—fully audited and validated across 35 unit tests."* | Stamp sound + success chime |
| **0:52 - 1:00** | **Call to Action & Hackathon Tags**<br>GitHub URL + TinyFish, Nexido, BuilderBase, Web3India tags | Kinetic badge pop-up with social handles; fade to black | *"PoolPilot: Next-gen liquidity, built for web3. Huge thanks to TinyFish, Nexido, BuilderBase, and Web3India. Check out our open-source repo and demo!"* | Upbeat musical crescendo + tape-stop |
