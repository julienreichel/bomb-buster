<template>
  <div class="row q-gutter-md items-start">
    <!-- Selected Player Section -->
    <div>
      <player-deck
        :player="selectedPlayer"
        visible
        :selectable="isHumanTurn"
        @pick="handlePlayerDeckPick"
      />

      <div v-if="isHumanTurn && playMessage" class="q-mb-md text-primary text-h6">
        {{ playMessage }}
      </div>
    </div>

    <!-- Other Players Section -->
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
          :selectable="isPlayPhase && isHumanTurn && hasSourceCard"
          :candidates="showCandidates ? allCandidates[idx] : undefined"
          @pick="(card) => handleOtherPlayerPick(card, player.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStateManager } from '../composables/managers/GameStateManager.js'
import PlayerDeck from './PlayerDeck.vue'

const props = defineProps({
  state: {
    type: Object,
    default: () => ({}),
  },
  selectedPlayerIdx: {
    type: Number,
    default: 0,
  },
})

// Use GameStateManager directly instead of receiving functions as props
const { advancePickRound, advancePlayRound, playRound } = useGameStateManager()

// Internal state for play selection - no longer a prop
const playSelection = ref({ sourceCard: null, targetCard: null })

const showCandidates = ref(false)

// Computed properties moved from GamePage
const players = computed(() => props.state.players || [])
const selectedPlayer = computed(() => players.value[props.selectedPlayerIdx] || {})

const otherPlayers = computed(() => {
  const arr = players.value
  const n = arr.length
  if (n <= 1) return []
  // Start after selectedPlayerIdx, wrap around, skip selectedPlayerIdx
  const result = []
  for (let i = 1; i < n; i++) {
    result.push(arr[(props.selectedPlayerIdx + i) % n])
  }
  return result
})

const isPickPhase = computed(() => props.state.phase === 'pick-card')
const isPlayPhase = computed(() => props.state.phase === 'play-phase')

const isHumanTurn = computed(
  () =>
    (isPickPhase.value || isPlayPhase.value) &&
    props.state.currentPicker === props.selectedPlayerIdx &&
    players.value[props.selectedPlayerIdx] &&
    !players.value[props.selectedPlayerIdx].isAI,
)

const hasSourceCard = computed(() => !!playSelection.value.sourceCard)

const playMessage = computed(() => {
  if (!isHumanTurn.value) return ''
  if (isPickPhase.value) return 'Your turn: pick a blue card'
  if (isPlayPhase.value) {
    if (!playSelection.value.sourceCard) return 'Your turn: pick a card from your hand'
    return "Now pick a card from another player's hand or from your own hand"
  }
  return ''
})

// Compute candidates for each card in a player's hand
function getPlayerCandidates(player) {
  if (!props.state || !props.state.players) return []
  return player.hand.map((card, idx) =>
    props.state.candidatesForSlot(player, idx, selectedPlayer.value),
  )
}

const allCandidates = computed(() => {
  if (!props.state || !props.state.players) return []
  const allCandidates = otherPlayers.value.map((player) => getPlayerCandidates(player))
  const slotSets = allCandidates.flatMap((candidates, idx) =>
    candidates.map((candidates) => ({ candidates, player: otherPlayers.value[idx] })),
  )
  const probabilities = props.state.monteCarloSlotProbabilities(
    slotSets,
    selectedPlayer.value,
    1000,
  )
  let idx = 0
  allCandidates.forEach((candidates) => {
    candidates.forEach((candidate) => {
      candidate.probability = probabilities[idx++]
    })
  })
  return allCandidates
})

function handlePlayerDeckPick(card) {
  if (!isHumanTurn.value) return
  if (isPickPhase.value) {
    handleHumanPick(card)
  } else if (isPlayPhase.value) {
    handleHumanPlayPick(card, selectedPlayer.value.id)
  }
}

function handleHumanPick(card) {
  const player = players.value[props.selectedPlayerIdx]
  if (player && player.pickCard) {
    if (player.pickCard(card) !== null) {
      advancePickRound()
    }
  }
}

function handleHumanPlayPick(card, playerId) {
  if (!isHumanTurn.value) return

  // Step 1: pick own card
  if (!hasSourceCard.value) {
    if (playerId !== players.value[props.selectedPlayerIdx].id) {
      // Error: must pick from own hand
      return
    }
    // Try as source
    const result = playRound({
      sourcePlayerIdx: props.selectedPlayerIdx,
      sourceCardId: card.id,
      targetPlayerIdx: null,
      targetCardId: null,
    })
    if (result.outcome === 'invalid-pick') {
      // Error: invalid pick
      return
    }
    // Update playSelection
    playSelection.value = { ...playSelection.value, sourceCard: card }
    return
  }

  // Step 2: pick other player's card
  // Find the index of the player with this id
  const targetIdx = players.value.findIndex((p) => p.id === playerId)
  if (targetIdx === -1) return

  const sourceCard = playSelection.value.sourceCard

  // Try as target
  const result = playRound({
    sourcePlayerIdx: props.selectedPlayerIdx,
    sourceCardId: sourceCard.id,
    targetPlayerIdx: targetIdx,
    targetCardId: card.id,
  })
  if (result.outcome === 'invalid-pick') {
    // Error: invalid pick, reset
    playSelection.value = { sourceCard: null, targetCard: null }
    return
  }

  // Valid play, execute and advance
  advancePlayRound()
  playSelection.value = { sourceCard: null, targetCard: null }
}

function handleOtherPlayerPick(card, playerId) {
  handleHumanPlayPick(card, playerId)
}
</script>
