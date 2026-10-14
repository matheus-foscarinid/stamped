<template>
  <div class="passport-cover" aria-hidden="true">
    <div class="passport-cover-front">
      <StampedLogo class="passport-cover-crest" />
      <span class="passport-cover-title">{{ APP_NAME }}</span>
      <span class="passport-cover-subtitle">{{ t('view.passport') }}</span>
    </div>
    <div class="passport-cover-back" />
  </div>
</template>

<script setup vapor lang="ts">
import { APP_NAME } from '@/brand/logo'
import { useI18n } from '@/i18n/useI18n'
import StampedLogo from './StampedLogo.vue'

const { t } = useI18n()
</script>

<style scoped>
/* turns open once on mount. --book-turn and --ease-turn come from the book */
.passport-cover {
  position: absolute;
  inset: 0 0 0 50%;
  transform-origin: left center;
  transform-style: preserve-3d;
  pointer-events: none;
  animation: cover-turn var(--book-turn) var(--ease-turn) forwards;
}

.passport-cover-front,
.passport-cover-back {
  position: absolute;
  inset: 0;
  border-radius: 4px 18px 18px 4px;
  backface-visibility: hidden;
}

.passport-cover-front {
  display: grid;
  grid-template-rows: 1fr auto auto 1fr;
  justify-items: center;
  gap: 10px;
  background:
    linear-gradient(90deg, rgb(0 0 0 / 0.35), transparent 8%),
    radial-gradient(120% 80% at 30% 20%, rgb(255 255 255 / 0.12), transparent 60%),
    var(--passport-cover);
  color: var(--passport-gold);
}

.passport-cover-front::after,
.passport-cover-back::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: #000;
  opacity: 0;
}

.passport-cover-front::after {
  animation: cover-shade-front var(--book-turn) linear forwards;
}

.passport-cover-back {
  border-radius: 18px 4px 4px 18px;
  background: var(--passport-paper);
  transform: rotateY(180deg);
  animation: cover-land var(--book-turn) linear forwards;
}

.passport-cover-back::after {
  background: linear-gradient(270deg, rgb(0 0 0 / 0.35), transparent 70%);
  animation: cover-shade-back var(--book-turn) linear forwards;
}

@keyframes cover-turn {
  to {
    transform: rotateY(-180deg);
  }
}

@keyframes cover-shade-front {
  50%,
  100% {
    opacity: 0.45;
  }
}

@keyframes cover-shade-back {
  0%,
  50% {
    opacity: 0.6;
  }

  100% {
    opacity: 0;
  }
}

@keyframes cover-land {
  0%,
  80% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

.passport-cover-crest {
  --logo-lines: var(--passport-cover);

  grid-row: 1;
  align-self: end;
  width: 30%;
}

.passport-cover-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.passport-cover-subtitle {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.4em;
  text-transform: uppercase;
}

@media (max-width: 600px) {
  .passport-cover {
    inset: 0;
  }
}
</style>
