<script setup lang="ts">
import type { Person } from '#shared/circle/types'

const { t } = useI18n()
const { people, listed } = useCircleData()

const selected = ref<Person | null>(null)
const cardOpen = computed(() => selected.value !== null)

function openPerson(person: Person): void {
  selected.value = person
}

function closeCard(): void {
  selected.value = null
}

function onGlobalKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && cardOpen.value)
    closeCard()
}

onMounted(() => addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => removeEventListener('keydown', onGlobalKey))

useHead({
  title: t('circle.title'),
})
useSeoMeta({ description: () => t('circle.copyLead') })
</script>

<template>
  <Sheet :line="false">
    <div class="board-page">
      <CircleBoard
        :people="people"
        @select="openPerson"
      />

      <CircleCopySlots />

      <CircleAccessibleList :people="listed" />

      <CirclePersonCard
        :open="cardOpen"
        :person="selected"
        @close="closeCard"
      />
    </div>
  </Sheet>
</template>

<style scoped>
.board-page {
  padding: clamp(12px, 3vw, 36px) var(--pad) calc(var(--pad) + 32px);
  max-width: 1100px;
  margin: 0 auto;
}
</style>
