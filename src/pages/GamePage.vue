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
            :color="selectedPlayer === idx ? 'primary' : 'grey-4'"
            :text-color="selectedPlayer === idx ? 'white' : 'black'"
            unelevated
            dense
            @click="selectedPlayer = idx"
            class="q-mr-sm"
          />
        </div>
      </div>
      <div class="row q-gutter-md items-start">
        <div>
          <player-deck
            :player="players[selectedPlayer]"
            visible
            :selectable="isHumanTurn"
            @pick="handlePlayerDeckPick"
          />

          <div v-if="isHumanTurn && playMessage" class="q-mb-md text-primary text-h6">
            {{ playMessage }}
          </div>
        </div>
        <div class="q-mt-lg">
          <div class="text-h6">Other Players</div>
          <div class="row q-gutter-md">
            <player-deck
              v-for="player in otherPlayers"
              :key="player.id"
              :player="player"
              :size="'small'"
              :visible="false"
              :selectable="isPlayPhase && isHumanTurn && !!playSelection.sourceCard"
              @pick="(card) => onHumanPlayPick(card, player.id)"
            />
          </div>
        </div>
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
    state.currentPicker === selectedPlayer.value &&
    players.value[selectedPlayer.value] &&
    !players.value[selectedPlayer.value].isAI,
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

function handlePlayerDeckPick(card) {
  if (!isHumanTurn.value) return
  if (isPickPhase.value) {
    onHumanPick(card)
  } else if (isPlayPhase.value) {
    onHumanPlayPick(card, selectedPlayer.value)
  }
}
function onHumanPick(card) {
  const player = players.value[selectedPlayer.value]
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
    if (playerId !== players.value[selectedPlayer.value].id) {
      // Error: must pick from own hand
      return
    }
    // Try as source
    const result = playRound({
      sourcePlayerIdx: selectedPlayer.value,
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
    sourcePlayerIdx: selectedPlayer.value,
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
const selectedPlayer = ref(0)
const otherPlayers = computed(() => {
  const arr = players.value
  const n = arr.length
  if (n <= 1) return []
  // Start after selectedPlayer, wrap around, skip selectedPlayer
  const result = []
  for (let i = 1; i < n; i++) {
    result.push(arr[(selectedPlayer.value + i) % n])
  }
  return result
})
const initialized = computed(
  () =>
    players.value.length > 0 &&
    players.value[selectedPlayer.value] &&
    Array.isArray(players.value[selectedPlayer.value].hand),
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
