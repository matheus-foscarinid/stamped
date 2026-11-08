<template>
  <AppDialog
    name="delete-account"
    :is-open="isOpen"
    :title="t('account.deleteTitle')"
    :actions="deleteActions"
    @close="deleteIfConfirmed"
  >
    <p>{{ t('account.deleteText') }}</p>
  </AppDialog>
</template>

<script setup vapor lang="ts">
import { computed } from 'vue'
import { useAccount } from '@/account/account'
import { useI18n } from '@/i18n/useI18n'
import AppDialog from './AppDialog.vue'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const CONFIRM_VALUE = 'delete'

const { removeAccount } = useAccount()
const { t } = useI18n()

const deleteActions = computed(() => [
  { value: 'cancel', label: t('account.deleteCancel') },
  { value: CONFIRM_VALUE, label: t('account.deleteConfirm'), isPrimary: true },
])

const deleteIfConfirmed = async (value: string) => {
  emit('close')
  if (value === CONFIRM_VALUE) await removeAccount()
}
</script>
