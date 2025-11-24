<script lang="ts">
  type Bubble = {
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
    blur?: number;
  };

  const bubbles: Bubble[] = [
    { x: 8, y: 12, size: 220, delay: 0, duration: 22, blur: 14 },
    { x: 22, y: 45, size: 140, delay: 4, duration: 18, blur: 18 },
    { x: 38, y: 18, size: 300, delay: 2, duration: 26, blur: 16 },
    { x: 60, y: 30, size: 200, delay: 1, duration: 21, blur: 15 },
    { x: 78, y: 15, size: 160, delay: 5, duration: 24, blur: 17 },
    { x: 15, y: 70, size: 180, delay: 3, duration: 20, blur: 14 },
    { x: 42, y: 70, size: 240, delay: 6, duration: 25, blur: 16 },
    { x: 68, y: 68, size: 210, delay: 0, duration: 19, blur: 15 },
    { x: 90, y: 45, size: 140, delay: 2, duration: 17, blur: 18 },
    { x: 32, y: 6, size: 130, delay: 7, duration: 22, blur: 16 },
    { x: 55, y: 55, size: 170, delay: 3, duration: 20, blur: 14 },
    { x: 88, y: 80, size: 210, delay: 5, duration: 24, blur: 17 }
  ];
</script>

<div class="bubble-background" aria-hidden="true">
  {#each bubbles as bubble, index}
    <span
      class="bubble"
      style={`--x:${bubble.x}%;--y:${bubble.y}%;--size:${bubble.size}px;--delay:${bubble.delay}s;--duration:${bubble.duration}s;--blur:${bubble.blur ?? 12}px;`}
      data-index={index}
    ></span>
  {/each}
</div>

<style>
  .bubble-background {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
  }

  .bubble {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--size);
    height: var(--size);
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 70%, transparent 100%);
    box-shadow: 0 0 50px rgba(255, 255, 255, 0.15);
    opacity: 0.35;
    filter: blur(var(--blur));
    transform: translate(-50%, -50%) scale(1);
    animation: float var(--duration) ease-in-out infinite, drift calc(var(--duration) * 1.3) linear infinite;
    animation-delay: var(--delay);
    mix-blend-mode: screen;
  }

  @keyframes float {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0.25;
    }
    50% {
      transform: translate(-48%, -58%) scale(1.15);
      opacity: 0.45;
    }
  }

  @keyframes drift {
    0% {
      filter: blur(calc(var(--blur) * 0.95));
    }
    50% {
      filter: blur(calc(var(--blur) * 1.1));
    }
    100% {
      filter: blur(calc(var(--blur) * 0.95));
    }
  }
</style>
