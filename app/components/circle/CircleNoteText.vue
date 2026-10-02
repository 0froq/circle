<script setup lang="ts">
import { notePieces } from '#shared/circle/note'

const props = defineProps<{
  text: string
}>()

const pieces = computed(() => notePieces(props.text))
</script>

<template>
  <template
    v-for="(piece, index) in pieces"
    :key="index"
  >
    <code v-if="piece.type === 'code'">{{ piece.text }}</code>
    <a
      v-else-if="piece.type === 'link'"
      :href="piece.url"
      target="_blank"
      rel="noopener noreferrer"
    >{{ piece.text }}</a>
    <template v-else>
      {{ piece.text }}
    </template>
  </template>
</template>
