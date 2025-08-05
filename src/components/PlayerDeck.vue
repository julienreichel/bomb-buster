<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ player && player.name ? player.name : 'Player' }}'s Hand</div>
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
import WireCard from './WireCard.vue'
import { computed } from 'vue'

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
    } else {
      // Capitalize first letter
      return wire.color.charAt(0).toUpperCase() + wire.color.slice(1)
    }
  }
}
</script>
