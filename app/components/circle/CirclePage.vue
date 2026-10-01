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

onMounted(() => {
  document.documentElement.classList.add('is-circle-screen')
  addEventListener('keydown', onGlobalKey)
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('is-circle-screen')
  removeEventListener('keydown', onGlobalKey)
})

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
          :active-id="selected?.userId ?? null"
          @select="openPerson"
        />

        <div class="circle-notes">
          <CircleCopySlots />

          <CircleAccessibleList
            :people="listed"
            @select="openPerson"
          />
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
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 72px 0 0;
}

.circle-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
}

.circle-notes {
  flex: none;
  width: min(calc(100% - 2 * var(--pad)), 760px);
  margin-inline: auto;
  padding-bottom: 12px;
}

:global(html.is-circle-screen),
:global(html.is-circle-screen body) {
  height: 100%;
  overflow: hidden;
}

:global(html.is-circle-screen .l-site) {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  overflow: hidden;
}

:global(html.is-circle-screen #main) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

:global(html.is-circle-screen .l-sheet) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
