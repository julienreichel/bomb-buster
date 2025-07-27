<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="min-width: 350px; max-width: 400px; width: 100%">
      <q-card-section>
        <div class="text-h6">Start New Game</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-input
          v-model.number="numPlayers"
          type="number"
          label="Number of Players"
          :min="3"
          :max="5"
          :rules="[(val) => (val >= 3 && val <= 5) || '3 to 5 players']"
        />
        <q-toggle v-model="hasHuman" label="Include Human Player" class="q-mt-md" />
        <div class="q-mt-md">
          <div class="text-subtitle2">Yellow Wires</div>
          <q-input
            v-model.number="yellowCreated"
            type="number"
            label="Number of Yellow Wires (created)"
            :min="0"
            :max="11"
            @update:model-value="onYellowCreatedChange"
          />
          <q-input
            v-model.number="yellowOnBoard"
            type="number"
            label="Number of Yellow Wires (on board)"
            :min="0"
            :max="yellowCreated"
          />
        </div>
        <div class="q-mt-md">
          <div class="text-subtitle2">Red Wires</div>
          <q-input
            v-model.number="redCreated"
            type="number"
            label="Number of Red Wires (created)"
            :min="0"
            :max="11"
            @update:model-value="onRedCreatedChange"
          />
          <q-input
            v-model.number="redOnBoard"
            type="number"
            label="Number of Red Wires (on board)"
            :min="0"
            :max="redCreated"
          />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="primary" label="Start Game" @click="startGame" :disable="!canStart" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const numPlayers = ref(4)
const hasHuman = ref(true)
const yellowCreated = ref(0)
const yellowOnBoard = ref(0)
const redCreated = ref(0)
const redOnBoard = ref(0)

const router = useRouter()

function onYellowCreatedChange(val) {
  if (yellowOnBoard.value > val) yellowOnBoard.value = val
  if (yellowOnBoard.value === 0 && val > 0) yellowOnBoard.value = val
}
function onRedCreatedChange(val) {
  if (redOnBoard.value > val) redOnBoard.value = val
  if (redOnBoard.value === 0 && val > 0) redOnBoard.value = val
}

const canStart = computed(
  () =>
    numPlayers.value >= 3 &&
    numPlayers.value <= 5 &&
    yellowOnBoard.value <= yellowCreated.value &&
    redOnBoard.value <= redCreated.value,
)

function startGame() {
  // Pass parameters as query string
  router.push({
    path: '/game',
    query: {
      numPlayers: numPlayers.value,
      hasHuman: hasHuman.value ? 1 : 0,
      yellowCreated: yellowCreated.value,
      yellowOnBoard: yellowOnBoard.value,
      redCreated: redCreated.value,
      redOnBoard: redOnBoard.value,
    },
  })
}
</script>
