<template>
  <div class="row q-gutter-md items-start">
    <!-- Selected Player Section -->
    <div>
      <player-deck :player="selectedPlayerWithSelection" visible :selectable="isHumanTurn"
        @pick="handlePlayerDeckPick" />

      <div v-if="isHumanTurn && playMessage" class="q-mb-md text-primary text-h6">
        {{ playMessage }}
      </div>

      <!-- Special Card Section -->
      <!-- Double Detector Section -->
      <div v-if="isHumanTurn && isPlayPhase && selectedPlayer.hasDoubleDetector" class="q-mb-md">
        <q-btn @click="toggleDoubleDetector" :color="doubleDetector ? 'orange' : 'grey'" :outline="!doubleDetector"
          icon="leak_add" :label="doubleDetectorButtonLabel" size="sm">
          <q-tooltip class="text-body2" max-width="300px">
            Use your double detector to select two target cards instead of one. Works with blue
            cards (matching numbers) or yellow cards (any yellow). You can only use this once per
            game!
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Other Players Section -->
    <div class="q-mt-lg">
      <div class="row items-center q-gutter-sm q-mb-sm">
        <div class="text-h6">Other Players</div>
        <q-toggle v-model="showCandidates" label="Show Candidates" color="primary" dense />
      </div>
      <div class="row q-gutter-md">
        <player-deck v-for="(player, idx) in otherPlayersWithSelection" :key="player.id" :player="player"
          :size="'small'" :visible="false" :selectable="isPlayPhase && isHumanTurn && hasSourceCard"
          :candidates="showCandidates ? allCandidates[idx] : undefined"
          @pick="(card) => handleOtherPlayerPick(card, player.id)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
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
const playSelection = ref({ sourceCard: null, targetCard: null, secondTargetCard: null })

const showCandidates = ref(false)
const doubleDetector = ref(false)

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

const doubleDetectorButtonLabel = computed(() => {
  if (!doubleDetector.value) return 'Double Detector'
  if (!hasSourceCard.value) return 'Double Detector Active'
  if (!playSelection.value.targetCard) return 'Pick 2 targets'
  if (!playSelection.value.secondTargetCard) return 'Pick 1 more'
  return 'Ready to execute!'
})

// Compute selected cards information for visual feedback
const selectedCards = computed(() => {
  const selection = playSelection.value
  return {
    sourceCardId: selection.sourceCard?.id || null,
    targetCardId: selection.targetCard?.id || null,
    secondTargetCardId: selection.secondTargetCard?.id || null,
  }
})

// Add selection info to other players' cards for visual feedback
const otherPlayersWithSelection = computed(() => {
  return otherPlayers.value.map((player) => {
    const playerWithSelection = { ...player }
    if (player.hand) {
      playerWithSelection.hand = player.hand.map((card) => ({
        ...card,
        selected:
          selectedCards.value.targetCardId === card.id ||
          selectedCards.value.secondTargetCardId === card.id,
      }))
    }
    return playerWithSelection
  })
})

// Add selection info to selected player's cards for visual feedback
const selectedPlayerWithSelection = computed(() => {
  const player = selectedPlayer.value
  if (!player.hand) return player

  const playerWithSelection = { ...player }
  playerWithSelection.hand = player.hand.map((card) => ({
    ...card,
    selected: selectedCards.value.sourceCardId === card.id,
  }))
  return playerWithSelection
})

const playMessage = computed(() => {
  if (!isHumanTurn.value) return ''
  if (isPickPhase.value) return 'Your turn: pick a blue card'
  if (isPlayPhase.value) {
    if (!playSelection.value.sourceCard) return 'Your turn: pick a card from your hand'
    if (doubleDetector.value) {
      if (!playSelection.value.secondTargetCard) {
        return "Double Detector Active: Pick TWO cards from another player's hand"
      }
      return 'Double Detector: Ready to play! Click to execute your move.'
    }
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

  // Step 1: pick own card as source
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
    playSelection.value = { sourceCard: card, targetCard: null, secondTargetCard: null }
    return
  }

  // Step 2: pick target card(s)
  const targetIdx = players.value.findIndex((p) => p.id === playerId)
  if (targetIdx === -1) return

  if (doubleDetector.value) {
    // Double detector logic: need two target cards
    if (!playSelection.value.targetCard) {
      // First target card
      playSelection.value.targetCard = card
      return
    } else if (
      !playSelection.value.secondTargetCard &&
      card.id !== playSelection.value.targetCard.id
    ) {
      // Second target card (different from first)
      playSelection.value.secondTargetCard = card

      // Execute double detector play
      const result = playRound({
        sourcePlayerIdx: props.selectedPlayerIdx,
        sourceCardId: playSelection.value.sourceCard.id,
        targetPlayerIdx: targetIdx,
        targetCardId: playSelection.value.targetCard.id,
        secondTargetCardId: playSelection.value.secondTargetCard.id,
      })

      if (result.outcome.includes('invalid')) {
        // Error: reset selection
        resetPlaySelection()
        return
      }

      // Valid double detector play, execute and advance
      advancePlayRound()
      resetPlaySelection()
      return
    }
    // If trying to select same card twice, ignore
    return
  }

  // Regular single card logic
  const result = playRound({
    sourcePlayerIdx: props.selectedPlayerIdx,
    sourceCardId: playSelection.value.sourceCard.id,
    targetPlayerIdx: targetIdx,
    targetCardId: card.id,
  })

  if (result.outcome === 'invalid-pick') {
    // Error: invalid pick, reset
    resetPlaySelection()
    return
  }

  // Valid play, execute and advance
  advancePlayRound()
  resetPlaySelection()
}

function toggleDoubleDetector() {
  if (!selectedPlayer.value.hasDoubleDetector) return

  doubleDetector.value = !doubleDetector.value

  // Reset target selections when toggling double detector
  if (playSelection.value.sourceCard) {
    playSelection.value = {
      sourceCard: playSelection.value.sourceCard,
      targetCard: null,
      secondTargetCard: null,
    }
  }
}

function resetPlaySelection() {
  playSelection.value = { sourceCard: null, targetCard: null, secondTargetCard: null }
  doubleDetector.value = false
}

function handleOtherPlayerPick(card, playerId) {
  handleHumanPlayPick(card, playerId)
}
</script>
