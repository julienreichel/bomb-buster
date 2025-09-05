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
    <div v-if="!showFullHistory && moveHistory.length > movesToShow.length" class="q-mt-xs text-caption text-grey">
      Showing last {{ movesToShow.length }} of {{ moveHistory.length }} moves
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

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

function getPlayerName(playerIdx) {
  return props.players[playerIdx]?.name ?? `P${playerIdx}`
}

function formatDoubleDetectorTargets(targetPlayerName, targetCardId, secondTargetCardId) {
  if (!targetPlayerName || !targetCardId || !secondTargetCardId) return ''
  return ` vs ${targetPlayerName}'s ${targetCardId} & ${secondTargetCardId}`
}

function formatSingleTarget(targetPlayerName, targetCardId) {
  if (!targetPlayerName || !targetCardId) return ''
  return ` vs ${targetPlayerName}'s ${targetCardId}`
}

function formatPlayResult(result) {
  let resultText = ''
  if (result?.outcome) {
    resultText += ` → ${result.outcome.replace(/-/g, ' ')}`
  }
  if (result?.infoToken) {
    resultText += ' [info token]'
  }
  if (typeof result?.detonatorDial === 'number') {
    resultText += ` [dial: ${result.detonatorDial}]`
  }
  return resultText
}

function formatPlayAction(move, sourcePlayerName, targetPlayerName) {
  const { sourceCardId, doubleDetector, targetCardId, secondTargetCardId, result } = move

  let desc = `${sourcePlayerName} played ${sourceCardId}`
  
  if (doubleDetector) {
    desc += ' [DOUBLE DETECTOR]'
    desc += formatDoubleDetectorTargets(targetPlayerName, targetCardId, secondTargetCardId)
  } else {
    desc += formatSingleTarget(targetPlayerName, targetCardId)
  }
  
  desc += formatPlayResult(result)
  return desc
}

function moveSummary(move) {
  if (!move) return ''
  
  const { type, sourcePlayerIdx, targetPlayerIdx } = move
  const sourcePlayerName = getPlayerName(sourcePlayerIdx)
  const targetPlayerName = targetPlayerIdx !== null && props.players[targetPlayerIdx]
    ? props.players[targetPlayerIdx].name
    : null
  
  if (type === 'play') {
    return formatPlayAction(move, sourcePlayerName, targetPlayerName)
  }
  
  return `${sourcePlayerName} action`
}
</script>
