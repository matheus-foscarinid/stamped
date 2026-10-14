<template>
  <a
    class="github-link control-surface press-feedback"
    :href="REPO_URL"
    target="_blank"
    rel="noopener"
  >
    <span class="visually-hidden">{{ t('github.label') }}</span>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path :d="GITHUB_MARK_PATH" />
    </svg>
    <span class="github-tooltip control-surface" aria-hidden="true">{{ t('github.star') }}</span>
  </a>
</template>

<script setup vapor lang="ts">
import { useI18n } from '@/i18n/useI18n'

const REPO_URL = 'https://github.com/matheus-foscarinid/stamped'
const GITHUB_MARK_PATH =
  'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'

const { t } = useI18n()
</script>

<style scoped>
.github-link {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--control-height);
  height: var(--control-height);
  border-radius: var(--radius-control);
  color: inherit;
}

.github-link:hover {
  background: var(--glass-hover);
}

.github-link svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.github-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  padding: 7px 12px;
  border-radius: var(--radius-control);
  font-size: 13px;
  font-weight: 550;
  white-space: nowrap;
  opacity: 0;
  translate: 0 -4px;
  pointer-events: none;
  transition:
    opacity var(--motion-fast) var(--ease-out),
    translate var(--motion-fast) var(--ease-out);
}

.github-link:hover .github-tooltip,
.github-link:focus-visible .github-tooltip {
  opacity: 1;
  translate: 0 0;
}
</style>
