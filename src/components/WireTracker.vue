<template>
  <div class="row items-center q-mb-lg justify-center">
    <template v-for="n in 12" :key="n">
      <q-badge
        :class="['q-mx-xs', allBlueRevealed[n] ? 'bg-blue text-white' : 'bg-grey-2 text-black']"
        rounded
      >
        {{ n }}
      </q-badge>
      <q-badge v-if="yellowNumbers.includes(n)" color="yellow-7" text-color="black" rounded>
        {{ showYellowQuestion ? '?' : '|' }}
      </q-badge>
      <q-badge v-if="redNumbers.includes(n)" color="red" text-color="white" rounded>
        {{ showRedQuestion ? '?' : '|' }}
      </q-badge>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  wires: { type: Array, required: true },
  yellowWires: { type: Array, required: false, default: () => [] },
  redWires: { type: Array, required: false, default: () => [] },
})

const allBlue = computed(() => (props.wires || []).filter((w) => w.color === 'blue'))

const allBlueRevealed = computed(() => {
  const result = {}
  for (let n = 1; n <= 12; n++) {
    const blue = allBlue.value.filter((w) => w.number === n)
    result[n] = blue.length === 4 && blue.every((w) => w.revealed)
  }
  return result
})
const yellowNumbers = computed(() => props.yellowWires.map((w) => Math.floor(w.number)))
const redNumbers = computed(() => props.redWires.map((w) => Math.floor(w.number)))

const showYellowQuestion = computed(
  () => props.yellowWires.length > (props.wires || []).filter((w) => w.color === 'yellow').length,
)
const showRedQuestion = computed(
  () => props.redWires.length > (props.wires || []).filter((w) => w.color === 'red').length,
)
</script>
