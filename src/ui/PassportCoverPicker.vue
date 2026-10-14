<template>
  <fieldset class="cover-picker">
    <legend class="visually-hidden">{{ t('passport.cover') }}</legend>
    <label v-for="id in COVER_IDS" :key="id" class="cover-option" :title="t(`cover.${id}`)">
      <input
        class="visually-hidden"
        type="radio"
        name="passport-cover"
        :value="id"
        :checked="id === cover"
        @change="setCover(id)"
      />
      <span class="cover-swatch" :data-cover="id" aria-hidden="true" />
      <span class="visually-hidden">{{ t(`cover.${id}`) }}</span>
    </label>
  </fieldset>
</template>

<script setup vapor lang="ts">
import { useI18n } from '@/i18n/useI18n'
import { COVER_IDS } from '@/passport/covers'
import { usePassportCover } from './usePassportCover'

const { t } = useI18n()
const { cover, setCover } = usePassportCover()
</script>

<style scoped>
.cover-picker {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 5px;
  border: 1px solid var(--glass-line);
  border-radius: var(--radius-control);
  background: var(--glass-bg);
}

.cover-option {
  display: grid;
  cursor: pointer;
}

/* the swatch carries data-cover, so it wears that cover's own tokens */
.cover-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, var(--passport-foil) 0 3px, transparent 3.5px),
    var(--passport-cover);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  transition: scale var(--motion-fast) var(--ease-out);
}

.cover-option:hover .cover-swatch {
  scale: 1.08;
}

.cover-option input:checked + .cover-swatch {
  box-shadow:
    0 0 0 2px var(--surface),
    0 0 0 4px var(--text);
}

@media (max-width: 600px) {
  .cover-picker {
    gap: 4px;
  }

  .cover-swatch {
    width: 26px;
    height: 26px;
  }
}

.cover-option input:focus-visible + .cover-swatch {
  outline: 2px solid var(--accent);
  outline-offset: 4px;
}
</style>
