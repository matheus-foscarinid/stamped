<template>
  <section class="passport" :aria-label="t('view.passport')">
    <p v-if="pages.length === 0" class="passport-empty">
      <span class="stamp stamp-ghost" aria-hidden="true" />
      {{ t('passport.empty') }}
    </p>
    <section v-for="page in pages" :key="page.continent" class="passport-page">
      <h2 class="passport-heading">
        {{ t(`continent.${page.continent}`) }}
        <span class="passport-count">
          {{ t('summary.count', { count: page.stamps.length, total: page.total }) }}
        </span>
      </h2>
      <ul class="passport-stamps">
        <li
          v-for="stamp in page.stamps"
          :key="stamp.code"
          class="stamp"
          :data-shape="stamp.shape"
          :data-ink="stamp.ink"
          :style="{ '--stamp-tilt': `${stamp.tiltDeg}deg` }"
        >
          <span class="stamp-flag" aria-hidden="true">{{ stamp.flag }}</span>
          <span class="stamp-code" aria-hidden="true">{{ stamp.code }}</span>
          <span class="stamp-name">{{ stamp.name }}</span>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup vapor lang="ts">
import { computed } from 'vue'
import { type CountryCode, getCountryName, getFlagEmoji, groupByContinent } from '@/countries'
import { useI18n } from '@/i18n/useI18n'
import { getStampStyle } from '@/passport/stamp-style'

const props = defineProps<{ visited: readonly CountryCode[] }>()

const { language, t } = useI18n()
const pages = computed(() =>
  groupByContinent(props.visited, language.value).map(({ continent, codes, total }) => ({
    continent,
    total,
    stamps: codes.map(code => ({
      code,
      name: getCountryName(code, language.value),
      flag: getFlagEmoji(code),
      ...getStampStyle(code),
    })),
  }))
)
</script>

<style scoped>
.passport {
  height: 100%;
  overflow-y: auto;
  padding: var(--map-padding-y) var(--map-padding-x);
  overscroll-behavior: contain;
}

.passport-page {
  max-width: 960px;
  margin: 0 auto 28px;
}

.passport-heading {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin: 0 0 14px;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.passport-count {
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.passport-stamps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 18px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.passport-empty {
  display: grid;
  gap: 18px;
  justify-items: center;
  max-width: 300px;
  margin: 12vh auto 0;
  color: var(--text-muted);
  text-align: center;
}

/* inks lean towards the text colour, so they stay readable in light and dark themes */
.stamp {
  --stamp-ink: var(--text);

  display: grid;
  place-content: center;
  justify-items: center;
  gap: 2px;
  aspect-ratio: 1;
  padding: 10px;
  border: 3px double var(--stamp-ink);
  color: var(--stamp-ink);
  text-align: center;
  opacity: 0.88;
  rotate: var(--stamp-tilt, 0deg);
  transition:
    scale var(--motion-base) var(--ease-out),
    opacity var(--motion-base) var(--ease-out);
}

@starting-style {
  .stamp {
    opacity: 0;
    scale: 1.3;
  }
}

.stamp[data-ink="0"] {
  --stamp-ink: color-mix(in srgb, #2b4c9b 70%, var(--text));
}

.stamp[data-ink="1"] {
  --stamp-ink: color-mix(in srgb, #a3263a 70%, var(--text));
}

.stamp[data-ink="2"] {
  --stamp-ink: color-mix(in srgb, #2f7a4f 70%, var(--text));
}

.stamp[data-ink="3"] {
  --stamp-ink: color-mix(in srgb, #6a3d9a 70%, var(--text));
}

.stamp[data-shape="round"] {
  border-radius: 50%;
}

.stamp[data-shape="square"] {
  border-radius: 14px;
}

.stamp[data-shape="perforated"] {
  border: 2px dashed var(--stamp-ink);
  border-radius: 6px;
  outline: 1.5px solid var(--stamp-ink);
  outline-offset: -8px;
}

@media (max-width: 600px) {
  .passport-stamps {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .stamp-code {
    font-size: 15px;
  }
}

.stamp-ghost {
  width: 108px;
  border: 2px dashed var(--text-muted);
  border-radius: 50%;
  opacity: 0.5;
}

.stamp-flag {
  font-size: 22px;
  line-height: 1;
}

.stamp-code {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stamp-name {
  display: -webkit-box;
  overflow: hidden;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
