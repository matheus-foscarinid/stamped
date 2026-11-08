<template>
  <div ref="menuRoot" class="menu-button">
    <button
      ref="menuTrigger"
      type="button"
      class="account-trigger menu-trigger menu-trigger-icon control-surface press-feedback"
      :aria-label="user ? `${t('account.label')}: ${user.email}` : t('account.label')"
      :aria-expanded="isOpen"
      :data-problem="problem !== null"
      aria-controls="account-menu"
      @click="toggle"
    >
      <img
        v-if="user?.avatarUrl"
        class="account-avatar"
        :src="user.avatarUrl"
        alt=""
        referrerpolicy="no-referrer"
      />
      <span v-else-if="user" class="account-initial" aria-hidden="true">{{ initial }}</span>
      <svg v-else class="account-icon" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="5.5" r="2.75" />
        <path d="M2.75 14c.6-2.7 2.7-4.25 5.25-4.25s4.65 1.55 5.25 4.25" />
      </svg>
    </button>
    <div
      v-show="isOpen"
      id="account-menu"
      class="menu-panel account-panel control-surface"
      data-placement="below"
      data-align="end"
    >
      <p v-if="problem" class="account-note" data-tone="problem" role="status">
        {{ t(PROBLEM_MESSAGES[problem]) }}
      </p>
      <template v-if="user">
        <p class="account-note">{{ user.email }}</p>
        <button type="button" class="menu-item" @click="leave(signOut)">
          {{ t('account.signOut') }}
        </button>
        <button type="button" class="menu-item" @click="openDeleteDialog">
          {{ t('account.delete') }}
        </button>
      </template>
      <template v-else>
        <p class="account-note">{{ t('account.hint') }}</p>
        <a class="menu-item account-google" :href="SIGN_IN_URL">
          <GoogleMark />
          <span>{{ t('account.signIn') }}</span>
        </a>
      </template>
    </div>
    <DeleteAccountDialog :is-open="isDeleteDialogOpen" @close="isDeleteDialogOpen = false" />
  </div>
</template>

<script setup vapor lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { type AccountProblem, SIGN_IN_URL, useAccount } from '@/account/account'
import type { MessageKey } from '@/i18n/messages'
import { useI18n } from '@/i18n/useI18n'
import DeleteAccountDialog from './DeleteAccountDialog.vue'
import GoogleMark from './GoogleMark.vue'
import { useDismissibleMenu } from './useDismissibleMenu'

const PROBLEM_MESSAGES: Record<AccountProblem, MessageKey> = {
  signInFailed: 'account.signInFailed',
  syncFailed: 'account.syncFailed',
}

const { user, problem, signOut } = useAccount()
const { t } = useI18n()

// whole characters, so a name starting with an emoji or accent isn't cut in half
const initial = computed(() => Array.from(user.value?.name ?? user.value?.email ?? '?')[0])

const menuRoot = useTemplateRef<HTMLElement>('menuRoot')
const menuTrigger = useTemplateRef<HTMLButtonElement>('menuTrigger')
const { isOpen, toggle, close } = useDismissibleMenu({ root: menuRoot, trigger: menuTrigger })

const leave = async (action: () => Promise<void>) => {
  close()
  await action()
}

const isDeleteDialogOpen = ref(false)

const openDeleteDialog = () => {
  close()
  isDeleteDialogOpen.value = true
}
</script>

<style scoped>
.account-trigger {
  position: relative;
  overflow: visible;
}

.account-trigger[data-problem="true"]::before {
  content: "";
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text);
}

.account-avatar,
.account-initial {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

.account-initial {
  display: grid;
  place-items: center;
  background: var(--map-visited);
  color: var(--page-bg);
  font-weight: 600;
  text-transform: uppercase;
}

.account-icon {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
}

.account-panel {
  width: min(280px, calc(100vw - 32px));
}

.account-note {
  margin: 0;
  padding: 8px 12px;
  color: var(--text-muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.account-note[data-tone="problem"] {
  color: var(--text);
}

.account-google {
  justify-content: flex-start;
  gap: 10px;
  color: inherit;
  text-decoration: none;
}

.account-google svg {
  flex: none;
  width: 18px;
  height: 18px;
}
</style>
