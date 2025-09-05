<template>
  <q-page class="q-pa-md">
    <div class="q-gutter-md">
      <div class="text-h5">Simulate Bomb Buster Games</div>
      <!-- No form: parameters are taken from querystring -->
      <div v-if="loading" class="q-mt-md">
        <q-linear-progress :value="progress" color="primary" rounded size="20px" class="q-mb-sm" />
        <div class="text-caption">Simulating... ({{ progressPercent }}%)</div>
      </div>
      <div v-if="stats && !loading" class="q-mt-md">
        <div class="text-h6">Statistics</div>
        <div>
          Players: {{ stats.numPlayers }}, Yellow: {{ stats.yellowOnBoard }} /
          {{ stats.yellowCreated }}, Red: {{ stats.redOnBoard }} / {{ stats.redCreated }}, Double
          Detector: {{ stats.doubleDetectorEnabled ? 'Enabled' : 'Disabled' }}, Runs:
          {{ stats.totalRuns }}
        </div>
        <q-table :rows="tableRows" :columns="tableColumns" row-key="players" flat dense />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStateManager } from '../composables/managers/GameStateManager.js'

const route = useRoute()
const numPlayers = computed(() => parseInt(route.query.numPlayers, 10) || 4)
const doubleDetectorEnabled = computed(() =>
  route.query.doubleDetectorEnabled === undefined
    ? true
    : route.query.doubleDetectorEnabled === '1' || route.query.doubleDetectorEnabled === true,
)
const yellowCreated = computed(() => parseInt(route.query.yellowCreated, 10) || 0)
const yellowOnBoard = computed(() => parseInt(route.query.yellowOnBoard, 10) || 0)
const redCreated = computed(() => parseInt(route.query.redCreated, 10) || 0)
const redOnBoard = computed(() => parseInt(route.query.redOnBoard, 10) || 0)
const numRuns = computed(() => parseInt(route.query.numRuns, 10) || 10)
const loading = ref(false)
const stats = ref(null)
const progress = ref(0)
const progressPercent = computed(() => Math.round(progress.value * 100))

const tableColumns = [
  { name: 'players', label: 'Players', field: 'players', align: 'left' },
  { name: 'yellows', label: 'Yellows', field: 'yellows', align: 'left' },
  { name: 'reds', label: 'Reds', field: 'reds', align: 'left' },
  { name: 'doubleDetector', label: 'Double Detector', field: 'doubleDetector', align: 'left' },
  { name: 'dial5', label: '5', field: 'dial5', align: 'right' },
  { name: 'dial4', label: '4', field: 'dial4', align: 'right' },
  { name: 'dial3', label: '3', field: 'dial3', align: 'right' },
  { name: 'dial2', label: '2', field: 'dial2', align: 'right' },
  { name: 'dial1', label: '1', field: 'dial1', align: 'right' },
  { name: 'dial0', label: '0', field: 'dial0', align: 'right' },
  { name: 'successRate', label: 'Success Rate (%)', field: 'successRate', align: 'right' },
  { name: 'totalRuns', label: 'Total Runs', field: 'totalRuns', align: 'right' },
]

function getStoredStats(playerCount) {
  const key = getStatsKey({
    players: playerCount,
    yellowCreated: yellowCreated.value,
    yellowOnBoard: yellowOnBoard.value,
    redCreated: redCreated.value,
    redOnBoard: redOnBoard.value,
    doubleDetectorEnabled: doubleDetectorEnabled.value,
  })
  const stored = localStorage.getItem(key)
  return stored ? JSON.parse(stored) : null
}

function calculateSuccessCount(stat) {
  return (
    (stat?.dialCounts?.[5] || 0) +
    (stat?.dialCounts?.[4] || 0) +
    (stat?.dialCounts?.[3] || 0) +
    (stat?.dialCounts?.[2] || 0) +
    (stat?.dialCounts?.[1] || 0)
  )
}

function calculateSuccessRate(stat) {
  const totalRuns = stat?.totalRuns || 0
  if (totalRuns === 0) return '0.0'

  const success = calculateSuccessCount(stat)
  return ((success / totalRuns) * 100).toFixed(1)
}

function getDialCount(stat, dialValue) {
  return stat?.dialCounts?.[dialValue] || 0
}

function createTableRow(playerCount, stat) {
  return {
    players: playerCount,
    yellows: `${yellowOnBoard.value} / ${yellowCreated.value}`,
    reds: `${redOnBoard.value} / ${redCreated.value}`,
    doubleDetector: doubleDetectorEnabled.value ? 'Yes' : 'No',
    dial5: getDialCount(stat, 5),
    dial4: getDialCount(stat, 4),
    dial3: getDialCount(stat, 3),
    dial2: getDialCount(stat, 2),
    dial1: getDialCount(stat, 1),
    dial0: getDialCount(stat, 0),
    successRate: calculateSuccessRate(stat),
    totalRuns: stat?.totalRuns || 0,
  }
}

const tableRows = computed(() => {
  const rows = []
  for (let p = 3; p <= 5; ++p) {
    const stat = getStoredStats(p)
    rows.push(createTableRow(p, stat))
  }
  return rows
})

function getStatsKey({
  players,
  yellowCreated,
  yellowOnBoard,
  redCreated,
  redOnBoard,
  doubleDetectorEnabled,
}) {
  return `sim-stats-p${players}-yc${yellowCreated}-yob${yellowOnBoard}-rc${redCreated}-rob${redOnBoard}-dd${doubleDetectorEnabled ? 1 : 0}`
}

function runSimulations() {
  // Validation
  if (yellowOnBoard.value % 2 !== 0) {
    alert('Yellow On Board must be an even number.')
    return
  }
  if (yellowOnBoard.value > yellowCreated.value) {
    alert('Yellow On Board must be less than Yellow Created.')
    return
  }
  if (redOnBoard.value > redCreated.value) {
    alert('Red On Board must be less than Red Created.')
    return
  }
  loading.value = true
  progress.value = 0
  setTimeout(async () => {
    const key = getStatsKey({
      players: numPlayers.value,
      yellowCreated: yellowCreated.value,
      yellowOnBoard: yellowOnBoard.value,
      redCreated: redCreated.value,
      redOnBoard: redOnBoard.value,
      doubleDetectorEnabled: doubleDetectorEnabled.value,
    })
    const stored = localStorage.getItem(key)
    const stat = stored
      ? JSON.parse(stored)
      : {
          numPlayers: numPlayers.value,
          yellowCreated: yellowCreated.value,
          yellowOnBoard: yellowOnBoard.value,
          redCreated: redCreated.value,
          redOnBoard: redOnBoard.value,
          doubleDetectorEnabled: doubleDetectorEnabled.value,
          totalRuns: 0,
          dialCounts: {},
        }
    for (let i = 0; i < numRuns.value; ++i) {
      const manager = useGameStateManager()
      manager.createNewGame({
        numPlayers: numPlayers.value,
        hasHuman: false,
        doubleDetectorEnabled: doubleDetectorEnabled.value,
        yellow: { created: yellowCreated.value, onBoard: yellowOnBoard.value },
        red: { created: redCreated.value, onBoard: redOnBoard.value },
        autoStart: true,
        isSimulation: true, // This is a simulation, no AI pauses needed
      })

      const dial = manager.state.detonatorDial
      stat.dialCounts[dial] = (stat.dialCounts[dial] || 0) + 1
      stat.totalRuns++
      progress.value = (i + 1) / numRuns.value
      if ((i + 1) % 10 === 0) await new Promise((resolve) => setTimeout(resolve, 0))
    }
    localStorage.setItem(key, JSON.stringify(stat))
    // Prepare stats for table
    stats.value = {
      numPlayers: stat.numPlayers,
      yellowCreated: stat.yellowCreated,
      yellowOnBoard: stat.yellowOnBoard,
      redCreated: stat.redCreated,
      redOnBoard: stat.redOnBoard,
      doubleDetectorEnabled: doubleDetectorEnabled.value,
      totalRuns: stat.totalRuns,
      results: Object.entries(stat.dialCounts)
        .map(([dial, count]) => ({ dial, count }))
        .sort((a, b) => b.dial - a.dial),
    }
    loading.value = false
  }, 100)
}
onMounted(() => {
  runSimulations()
})
</script>
