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
    <section class="l-section circle-sheet">
      <p class="l-label">
        {{ t('circle.title') }}
      </p>
      <div class="circle-main">
        <CircleBoard
          :people="people"
          @select="openPerson"
        />

        <CircleCopySlots />

        <CircleAccessibleList :people="listed" />
      </div>
    </section>

    <CirclePersonCard
      :open="cardOpen"
      :person="selected"
      @close="closeCard"
    />
  </Sheet>
</template>

<style scoped>
.circle-sheet {
  padding-top: 96px;
  padding-bottom: calc(var(--pad) + 32px);
}

.circle-main {
  grid-column: 1 / -1;
  width: min(100%, 760px);
  justify-self: center;
}
</style>
