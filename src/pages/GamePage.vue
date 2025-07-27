<template>
  <q-page class="q-pa-md">
    <div v-if="!initialized" class="q-pa-xl flex flex-center">
      <q-spinner color="primary" size="3em" />
      <div class="q-ml-md">Initializing game state...</div>
    </div>
    <div v-else>
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
        <q-card>
          <q-card-section>
            <div class="text-h6">Player {{ selectedPlayer + 1 }}'s Hand</div>
            <div class="row q-gutter-sm">
              <q-card
                v-for="card in players[selectedPlayer] ? players[selectedPlayer].hand : []"
                :key="card.id"
                :class="[
                  'text-white',
                  card.color === 'blue' ? 'bg-blue' : card.color === 'yellow' ? 'bg-yellow-7' : card.color === 'red' ? 'bg-red' : 'bg-grey-2'
                ]"
                style="min-width: 80px; max-width: 100px"
              >
                <q-card-section class="text-center">
                  <div class="text-subtitle2">{{ card.number }}</div>
                  <q-badge v-if="card.infoToken" color="info" class="q-mt-sm">
                    <template v-if="card.color === 'blue'">{{ card.number }}</template>
                    <template v-else>{{ card.color }}</template>
                  </q-badge>
                  <div class="q-mt-xs text-caption text-grey">
                    revealed: {{ card.revealed ? 'true' : 'false' }}, infoToken:
                    {{ card.infoToken ? 'true' : 'false' }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-card-section>
        </q-card>
        <div class="q-mt-lg">
          <div class="text-h6">Other Players</div>
          <div class="row q-gutter-md">
            <div v-for="player in otherPlayers" :key="player.id">
              <q-card>
                <q-card-section>
                  <div class="text-subtitle2">{{ player.name }}</div>
                  <div class="row q-gutter-xs">
                    <q-card
                      v-for="card in player.hand"
                      :key="card.id"
                      :class="[
                        card.revealed
                          ? 'text-white ' + (card.color === 'blue' ? 'bg-blue' : card.color === 'yellow' ? 'bg-yellow-7' : card.color === 'red' ? 'bg-red' : 'bg-grey-2')
                          : 'bg-grey-2 text-black'
                      ]"
                      style="min-width: 60px; max-width: 80px"
                    >
                      <q-card-section class="text-center">
                        <template v-if="card.revealed">
                          <div class="text-subtitle2">{{ card.number }}</div>
                        </template>
                        <template v-else-if="card.infoToken">
                          <q-badge color="info">
                            <template v-if="card.color === 'blue'">{{ card.number }}</template>
                            <template v-else>{{ card.color }}</template>
                          </q-badge>
                        </template>
                        <template v-else>
                          <q-icon name="help_outline" color="grey" />
                        </template>
                        <div class="q-mt-xs text-caption text-grey">
                          revealed: {{ card.revealed ? 'true' : 'false' }}, infoToken:
                          {{ card.infoToken ? 'true' : 'false' }}
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </q-card-section>
              </q-card>
            </div>
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

const { state, createNewGame } = useGameStateManager()

const players = computed(() => state.players)
const selectedPlayer = ref(0)
const otherPlayers = computed(() => players.value.filter((_, idx) => idx !== selectedPlayer.value))
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
  })
  console.log('state:', state)
})
</script>
