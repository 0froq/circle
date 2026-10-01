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
      <div class="circle-main">
        <CircleBoard
          :people="people"
          @select="openPerson"
        />

        <div class="circle-notes">
          <CircleCopySlots />

          <CircleAccessibleList :people="listed" />
        </div>
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
  padding-right: 0;
  padding-bottom: calc(var(--pad) + 32px);
  padding-left: 0;
}

.circle-main {
  grid-column: 1 / -1;
  width: 100%;
}

.circle-notes {
  width: min(calc(100% - 2 * var(--pad)), 760px);
  margin-inline: auto;
}
</style>
