<template>
  <div class="q-mt-xl">
    <div class="row items-center q-gutter-sm q-mb-sm">
      <div class="text-h6">Move History</div>
      <q-toggle v-model="showFullHistory" label="Show Full History" color="primary" dense />
    </div>
    <q-list bordered separator class="bg-grey-1 rounded-borders">
      <q-item v-for="(move, idx) in movesToShow" :key="idx">
        <q-item-section>
          <span class="text-body2">{{ moveSummary(move) }}</span>
        </q-item-section>
      </q-item>
      <q-item v-if="moveHistory.length === 0">
        <q-item-section>
          <span class="text-grey">No moves yet.</span>
        </q-item-section>
      </q-item>
    </q-list>
    <div
      v-if="!showFullHistory && moveHistory.length > movesToShow.length"
      class="q-mt-xs text-caption text-grey"
    >
      Showing last {{ movesToShow.length }} of {{ moveHistory.length }} moves
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  moveHistory: {
    type: Array,
    default: () => [],
  },
  players: {
    type: Array,
    default: () => [],
  },
})

const showFullHistory = ref(false)

const movesToShow = computed(() => {
  if (showFullHistory.value) return props.moveHistory
  const n = props.players.length || 4
  return props.moveHistory.slice(-n)
})

function moveSummary(move) {
  if (!move) return ''
  const {
    type,
    sourcePlayerIdx,
    sourceCardId,
    targetPlayerIdx,
    targetCardId,
    secondTargetCardId,
    doubleDetector,
    result,
  } = move
  const src = props.players[sourcePlayerIdx]?.name ?? `P${sourcePlayerIdx}`
  const tgt =
    targetPlayerIdx != null && props.players[targetPlayerIdx]
      ? props.players[targetPlayerIdx].name
      : null
  let desc = ''
  if (type === 'play') {
    desc = `${src} played ${sourceCardId}`
    if (doubleDetector) {
      desc += ' [DOUBLE DETECTOR]'
      if (tgt && targetCardId && secondTargetCardId) {
        desc += ` vs ${tgt}'s ${targetCardId} & ${secondTargetCardId}`
      }
    } else {
      if (tgt && targetCardId) desc += ` vs ${tgt}'s ${targetCardId}`
    }
    if (result?.outcome) desc += ` → ${result.outcome.replace(/-/g, ' ')}`
    if (result?.infoToken) desc += ' [info token]'
    if (typeof result?.detonatorDial === 'number') desc += ` [dial: ${result.detonatorDial}]`
  } else {
    desc = `${src} action`
  }
  return desc
}
</script>
