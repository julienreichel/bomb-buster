<template>
  <q-page class="q-pa-md">
    <div v-if="!initialized" class="q-pa-xl flex flex-center">
      <q-spinner color="primary" size="3em" />
      <div class="q-ml-md">Initializing game state...</div>
    </div>
    <div v-else>
      <div class="row items-center q-gutter-lg q-mb-md justify-center">
        <wire-tracker
          :wires="state.wires"
          :yellow-wires="state.yellowWires"
          :red-wires="state.redWires"
        />
        <detonator-dial :value="state.detonatorDial" />
      </div>
      <div class="q-mb-md row items-center q-gutter-md">
        <div class="text-h6 q-mr-md">Players:</div>
        <div class="row q-gutter-sm">
          <q-btn
            v-for="(player, idx) in players"
            :key="player.id"
            :label="player.name"
            :color="selectedPlayerIdx === idx ? 'primary' : 'grey-4'"
            :text-color="selectedPlayerIdx === idx ? 'white' : 'black'"
            unelevated
            dense
            @click="selectedPlayerIdx = idx"
            class="q-mr-sm"
          />
        </div>
      </div>
      <div class="row q-gutter-md items-start">
        <div>
          <player-deck
            :player="players[selectedPlayerIdx]"
            visible
            :selectable="isHumanTurn"
            @pick="handlePlayerDeckPick"
          />

          <div v-if="isHumanTurn && playMessage" class="q-mb-md text-primary text-h6">
            {{ playMessage }}
          </div>
        </div>
        <div class="q-mt-lg">
          <div class="row items-center q-gutter-sm q-mb-sm">
            <div class="text-h6">Other Players</div>
            <q-toggle v-model="showCandidates" label="Show Candidates" color="primary" dense />
          </div>
          <div class="row q-gutter-md">
            <player-deck
              v-for="(player, idx) in otherPlayers"
              :key="player.id"
              :player="player"
              :size="'small'"
              :visible="false"
              :selectable="isPlayPhase && isHumanTurn && !!playSelection.sourceCard"
              :candidates="showCandidates ? allCandidates[idx] : undefined"
              @pick="(card) => onHumanPlayPick(card, player.id)"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- Move History Section -->
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
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStateManager } from '../composables/managers/GameStateManager.js'

import PlayerDeck from '../components/PlayerDeck.vue'
import WireTracker from '../components/WireTracker.vue'
import DetonatorDial from '../components/DetonatorDial.vue'

const { state, createNewGame, advancePickRound, advancePlayRound, playRound } =
  useGameStateManager()
const isPickPhase = computed(() => state.phase === 'pick-card')
const isPlayPhase = computed(() => state.phase === 'play-phase')
const isHumanTurn = computed(
  () =>
    (isPickPhase.value || isPlayPhase.value) &&
    state.currentPicker === selectedPlayerIdx.value &&
    players.value[selectedPlayerIdx.value] &&
    !players.value[selectedPlayerIdx.value].isAI,
)

const playSelection = ref({ sourceCard: null, targetCard: null })

const playMessage = computed(() => {
  if (!isHumanTurn.value) return ''
  if (isPickPhase.value) return 'Your turn: pick a blue card'
  if (isPlayPhase.value) {
    if (!playSelection.value.sourceCard) return 'Your turn: pick a card from your hand'
    return "Now pick a card from another player's hand or from your own hand"
  }
  return ''
})

// --- Move History UI ---
const showFullHistory = ref(false)
const moveHistory = computed(() => state.history || [])
const movesToShow = computed(() => {
  if (showFullHistory.value) return moveHistory.value
  const n = players.value.length || 4
  return moveHistory.value.slice(-n)
})

function moveSummary(move) {
  if (!move) return ''
  const { type, sourcePlayerIdx, sourceCardId, targetPlayerIdx, targetCardId, result } = move
  const src = players.value[sourcePlayerIdx]?.name ?? `P${sourcePlayerIdx}`
  const tgt =
    targetPlayerIdx != null && players.value[targetPlayerIdx]
      ? players.value[targetPlayerIdx].name
      : null
  let desc = ''
  if (type === 'play') {
    desc = `${src} played ${sourceCardId}`
    if (tgt && targetCardId) desc += ` vs ${tgt}'s ${targetCardId}`
    if (result?.outcome) desc += ` → ${result.outcome.replace(/-/g, ' ')}`
    if (result?.infoToken) desc += ' [info token]'
    if (typeof result?.detonatorDial === 'number') desc += ` [dial: ${result.detonatorDial}]`
  } else {
    desc = `${src} action`
  }
  return desc
}

function handlePlayerDeckPick(card) {
  if (!isHumanTurn.value) return
  if (isPickPhase.value) {
    onHumanPick(card)
  } else if (isPlayPhase.value) {
    onHumanPlayPick(card, selectedPlayerIdx.value)
  }
}
function onHumanPick(card) {
  const player = players.value[selectedPlayerIdx.value]
  if (player && player.pickCard) {
    if (player.pickCard(card) !== null) {
      advancePickRound()
    }
  }
}

function onHumanPlayPick(card, playerId) {
  if (!isHumanTurn.value) return
  // Step 1: pick own card
  if (!playSelection.value.sourceCard) {
    if (playerId !== players.value[selectedPlayerIdx.value].id) {
      // Error: must pick from own hand
      return
    }
    // Try as source
    const result = playRound({
      sourcePlayerIdx: selectedPlayerIdx.value,
      sourceCardId: card.id,
      targetPlayerIdx: null,
      targetCardId: null,
    })
    if (result.outcome === 'invalid-pick') {
      // Error: invalid pick
      return
    }
    playSelection.value.sourceCard = card
    card.selected = true
    return
  }
  // Step 2: pick other player's card

  // Find the index of the player with this id
  const targetIdx = players.value.findIndex((p) => p.id === playerId)
  if (targetIdx === -1) return
  // Try as target
  const result = playRound({
    sourcePlayerIdx: selectedPlayerIdx.value,
    sourceCardId: playSelection.value.sourceCard.id,
    targetPlayerIdx: targetIdx,
    targetCardId: card.id,
  })
  if (result.outcome === 'invalid-pick') {
    // Error: invalid pick, reset
    playSelection.value.sourceCard.selected = false
    playSelection.value.sourceCard = null
    playSelection.value.targetCard = null
    return
  }
  // Valid play, execute and advance
  playSelection.value.targetCard = card
  advancePlayRound()
  playSelection.value.sourceCard.selected = false
  playSelection.value.sourceCard = null
  playSelection.value.targetCard = null
}

const players = computed(() => state.players)
const selectedPlayerIdx = ref(0)
const selectedPlayer = computed(() => players.value[selectedPlayerIdx.value])
const otherPlayers = computed(() => {
  const arr = players.value
  const n = arr.length
  if (n <= 1) return []
  // Start after selectedPlayerIdx, wrap around, skip selectedPlayerIdx
  const result = []
  for (let i = 1; i < n; i++) {
    result.push(arr[(selectedPlayerIdx.value + i) % n])
  }
  return result
})
const initialized = computed(
  () =>
    players.value.length > 0 &&
    players.value[selectedPlayerIdx.value] &&
    Array.isArray(selectedPlayer.value.hand),
)

const showCandidates = ref(true)

// Compute candidates for each card in a player's hand
function getPlayerCandidates(player) {
  if (!state || !state.players) return []
  return player.hand.map((card, idx) => state.candidatesForSlot(player, idx, selectedPlayer.value))
}

const allCandidates = computed(() => {
  if (!state || !state.players) return []
  const allCandidates = otherPlayers.value.map((player) => getPlayerCandidates(player))
  const slotSets = allCandidates.flatMap((candidates, idx) =>
    candidates.map((candidates) => ({ candidates, player: otherPlayers.value[idx] })),
  )
  const probabilities = state.monteCarloSlotProbabilities(slotSets, selectedPlayer.value, 1000)
  let idx = 0
  allCandidates.forEach((candidates) => {
    candidates.forEach((candidate) => {
      candidate.probability = probabilities[idx++]
    })
  })
  return allCandidates
})

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
