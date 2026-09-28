<script setup lang="ts">
import type { DisplayRing, PlacedPerson } from '#shared/circle/types'
import { layoutStarMap } from '#shared/circle/layout'

const { t } = useI18n()
const { center, allPlaced, filterPlaced, groupByRing } = useCircleData()

const showUnfollowed = ref(false)
const ringFilter = ref<DisplayRing | null>(null)

const displayed = computed(() => filterPlaced(showUnfollowed.value, ringFilter.value))
const mapLayout = computed(() => layoutStarMap(displayed.value))

const selected = ref<PlacedPerson | null>(null)
const cardOpen = computed(() => selected.value !== null)

function openPerson(person: PlacedPerson): void {
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
useSeoMeta({ description: () => t('circle.lede') })
</script>

<template>
  <Sheet :line="false">
    <div class="circle-page">
      <header class="circle-head">
        <h1 class="circle-title">
          {{ t('circle.title') }}
        </h1>
        <p class="circle-lede">
          {{ t('circle.lede') }}
        </p>
        <CircleToolbar
          v-model:show-unfollowed="showUnfollowed"
          v-model:ring-filter="ringFilter"
        />
      </header>

      <CircleStarMap
        :center="center"
        :layout="mapLayout"
        @select="openPerson"
      />

      <CircleCopySlots />

      <CircleAccessibleList
        :groups="groupByRing(allPlaced)"
        :show-unfollowed="showUnfollowed"
      />

      <CirclePersonCard
        :open="cardOpen"
        :person="selected"
        @close="closeCard"
      />
    </div>
  </Sheet>
</template>

<style scoped>
.circle-page {
  padding: var(--pad);
  padding-bottom: calc(var(--pad) + 48px);
  max-width: 1200px;
  margin: 0 auto;
}

.circle-head {
  margin-bottom: clamp(24px, 4vw, 40px);
}

.circle-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 400;
  margin: 0 0 0.35em;
  letter-spacing: -0.02em;
}

.circle-lede {
  margin: 0 0 1.25rem;
  color: var(--muted);
  max-width: 42em;
}
</style>
