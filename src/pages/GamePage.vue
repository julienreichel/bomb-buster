<template>
  <q-page class="q-pa-md">
    <loading-state v-if="!initialized" message="Initializing game state..." />
    <div v-else>
      <game-status :state="state" />

      <player-selector :players="players" v-model:selected-player-idx="selectedPlayerIdx" />

      <play-area :state="state" :selected-player-idx="selectedPlayerIdx" />
    </div>

    <!-- Game History Component -->
    <game-history :move-history="moveHistory" :players="players" />
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStateManager } from '../composables/managers/GameStateManager.js'

import LoadingState from '../components/LoadingState.vue'
import GameStatus from '../components/GameStatus.vue'
import PlayerSelector from '../components/PlayerSelector.vue'
import PlayArea from '../components/PlayArea.vue'
import GameHistory from '../components/GameHistory.vue'

const { state, createNewGame } = useGameStateManager()

// --- Move History UI ---
const moveHistory = computed(() => state.history || [])

const players = computed(() => state.players)
const selectedPlayerIdx = ref(0)
const selectedPlayer = computed(() => players.value[selectedPlayerIdx.value])
const initialized = computed(
  () =>
    players.value.length > 0 &&
    players.value[selectedPlayerIdx.value] &&
    Array.isArray(selectedPlayer.value.hand),
)

const route = useRoute()
const numPlayers = computed(() => parseInt(route.query.numPlayers) || 4)
const hasHuman = computed(() =>
  route.query.hasHuman === undefined
    ? true
    : route.query.hasHuman === '1' || route.query.hasHuman === true,
)
const yellowCreated = computed(() => parseInt(route.query.yellowCreated) || 0)
const yellowOnBoard = computed(() => parseInt(route.query.yellowOnBoard) || 0)
const redCreated = computed(() => parseInt(route.query.redCreated) || 0)
const redOnBoard = computed(() => parseInt(route.query.redOnBoard) || 0)

onMounted(() => {
  createNewGame({
    numPlayers: numPlayers.value,
    hasHuman: hasHuman.value,
    yellow: { created: yellowCreated.value, onBoard: yellowOnBoard.value },
    red: { created: redCreated.value, onBoard: redOnBoard.value },
    autoStart: true, // Automatically start the game after setup
  })
})
</script>
