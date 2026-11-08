<template>
  <section v-show="isShown" class="guide control-surface" aria-labelledby="guide-title">
    <header class="guide-header">
      <h2 id="guide-title" class="guide-title">{{ t('guide.title') }}</h2>
      <span class="guide-progress-label">
        {{ t('summary.count', { count: doneCount, total: steps.length }) }}
      </span>
      <button
        type="button"
        class="guide-hide press-feedback"
        :aria-label="t('guide.hide')"
        :title="t('guide.hide')"
        @click="hide"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </header>
    <progress class="guide-progress" :value="doneCount" :max="steps.length" aria-hidden="true" />
    <ol class="guide-steps">
      <li
        v-for="step in steps"
        :key="step.key"
        class="guide-step"
        :data-done="step.isDone"
        :data-current="step.key === currentStep"
      >
        <span class="guide-check">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 8.5l2.5 2.5L12 5.5" pathLength="1" />
          </svg>
        </span>
        <span class="guide-step-text">
          <span class="guide-step-label">
            {{ t(`guide.${step.key}`) }}
            <span v-if="step.isDone" class="visually-hidden">({{ t('guide.done') }})</span>
          </span>
          <span class="guide-step-hint">{{ t(`guide.${step.key}Hint`) }}</span>
          <a v-if="step.key === 'account'" class="guide-sign-in press-feedback" :href="SIGN_IN_URL">
            <GoogleMark class="guide-google" />
            {{ t('account.signIn') }}
          </a>
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup vapor lang="ts">
import { computed, toRef } from 'vue'
import { SIGN_IN_URL } from '@/account/account'
import { useI18n } from '@/i18n/useI18n'
import GoogleMark from './GoogleMark.vue'
import { useFirstRunGuide } from './useFirstRunGuide'

const props = defineProps<{
  visitedCount: number
  isPassportOpen: boolean
}>()

const { t } = useI18n()
const { isShown, steps, doneCount, hide } = useFirstRunGuide({
  visitedCount: toRef(props, 'visitedCount'),
  isPassportOpen: toRef(props, 'isPassportOpen'),
})
const currentStep = computed(() => steps.value.find(step => !step.isDone)?.key)
</script>

<style scoped>
.guide {
  display: grid;
  gap: 12px;
  width: 300px;
  padding: 16px 16px 18px;
  border-radius: var(--radius-menu);
  /* waits a beat so the map lands first, then the guide rises into place */
  animation: guide-rise calc(var(--motion-base) * 1.6) var(--ease-out) calc(var(--motion-base) * 2) backwards;
}

@keyframes guide-rise {
  from {
    opacity: 0;
    translate: 0 16px;
  }
}

.guide-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.guide-title {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.guide-progress-label {
  margin-left: auto;
  color: var(--text-muted);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.guide-hide {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -4px -6px -4px 0;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.guide-hide:hover {
  background: var(--control-hover-bg);
  color: var(--text);
}

.guide-hide svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 1.6;
}

.guide-progress {
  width: 100%;
  height: 4px;
  overflow: hidden;
  border: 0;
  border-radius: 2px;
  background: var(--control-hover-bg);
  appearance: none;
}

.guide-progress::-webkit-progress-bar {
  background: transparent;
}

.guide-progress::-webkit-progress-value {
  background: var(--map-visited);
  transition: inline-size calc(var(--motion-base) * 2) var(--ease-out);
}

.guide-progress::-moz-progress-bar {
  background: var(--map-visited);
}

.guide-steps {
  display: grid;
  gap: 14px;
  margin: 2px 0 0;
  padding: 0;
  list-style: none;
}

.guide-step {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 12px;
  align-items: start;
}

.guide-check {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1.5px solid var(--text-muted);
  border-radius: 50%;
  color: var(--surface);
  transition:
    background-color var(--motion-base) var(--ease-out),
    border-color var(--motion-base) var(--ease-out),
    scale var(--motion-base) var(--ease-out);
}

.guide-check svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: stroke-dashoffset calc(var(--motion-base) * 1.5) var(--ease-out) var(--motion-fast);
}

.guide-step[data-current="true"] .guide-check {
  border-color: var(--map-visited);
}

.guide-step[data-done="true"] .guide-check {
  border-color: var(--map-visited);
  background: var(--map-visited);
}

.guide-step[data-done="true"] .guide-check svg {
  stroke-dashoffset: 0;
}

.guide-step-text {
  display: grid;
  gap: 2px;
  padding-top: 1px;
}

.guide-step-label {
  font-size: 14px;
  font-weight: 550;
  transition: color var(--motion-base) var(--ease-out);
}

.guide-step-hint {
  color: var(--text-muted);
  font-size: 13px;
}

.guide-step[data-done="true"] .guide-step-label {
  color: var(--text-muted);
}

.guide-sign-in {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-self: start;
  margin-top: 10px;
  padding: 9px 16px 9px 12px;
  border-radius: var(--radius-control);
  background: var(--control-active-bg);
  color: var(--control-active-text);
  font-size: 14px;
  font-weight: 550;
  text-decoration: none;
}

.guide-google {
  flex: none;
  width: 18px;
  height: 18px;
  padding: 2px;
  border-radius: 50%;
  background: #fff;
}

.guide-step[data-done="true"] .guide-step-hint,
.guide-step[data-done="true"] .guide-sign-in {
  display: none;
}

@media (max-width: 600px) {
  .guide {
    gap: 10px;
    width: auto;
    padding: 14px 14px 16px;
  }

  /* the map is small on a phone, so the card holds only the next step. the bar shows the rest */
  .guide-step:not([data-current="true"]) {
    display: none;
  }

  .guide-step[data-current="true"] {
    animation: guide-rise calc(var(--motion-base) * 1.4) var(--ease-out);
  }
}
</style>
