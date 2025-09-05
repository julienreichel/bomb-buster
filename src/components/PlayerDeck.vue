<template>
  <q-card>
    <q-card-section>
      <div class="text-h6 row items-center q-gutter-sm">
        <span>{{ player && player.name ? player.name : 'Player' }}'s Hand</span>
        <q-chip
          v-if="player.isAI && player.hasDoubleDetector"
          icon="search"
          color="primary"
          text-color="white"
          size="sm"
          dense
        >
          Double Detector
        </q-chip>
        <q-chip
          v-if="player.isAI && !player.hasDoubleDetector"
          icon="search_off"
          color="grey"
          text-color="white"
          size="sm"
          dense
        >
          No Double Detector
        </q-chip>
      </div>
      <div class="row q-gutter-sm">
        <wire-card
          v-for="(card, idx) in player.hand"
          :key="card.id"
          :card="card"
          :visible="visible"
          :size="size"
          :selectable="selectable"
          :candidates="candidates ? candidates[idx] : undefined"
          @pick="$emit('pick', card)"
        />
      </div>
      <div v-if="knownWiresToShow.length" class="q-mt-sm text-caption text-grey-7">
        Known wires:
        <span v-for="(wire, i) in knownWiresToShow" :key="wire.id || wire">
          <span>{{ formatWire(wire) }}</span
          ><span v-if="i < knownWiresToShow.length - 1">, </span>
        </span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import WireCard from './WireCard.vue'

const props = defineProps({
  player: { type: Object, required: true },
  visible: { type: Boolean, default: false },
  size: { type: String, default: 'normal' },
  selectable: { type: Boolean, default: false },
  candidates: { type: Array, default: undefined },
})

const knownWiresToShow = computed(() => {
  if (!props.player.knownWires) return []
  // Show all known wires, regardless of revealed status
  return props.player.knownWires
})

function formatWire(wire) {
  if (wire?.color && wire?.number !== undefined) {
    if (wire.color === 'blue') {
      return String(wire.number)
    }
    // Capitalize first letter
    return wire.color.charAt(0).toUpperCase() + wire.color.slice(1)
  }
  return '?'
}
</script>
