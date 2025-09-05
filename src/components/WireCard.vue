<template>
  <q-card
    :class="cardClass"
    :style="cardStyle"
    @click="onClick"
    :clickable="selectable"
    :bordered="!!card.selected"
  >
    <q-card-section class="text-center">
      <template v-if="card.infoToken">
        <q-badge color="info">
          <template v-if="card.color === 'blue'">{{ card.number }}</template>
          <template v-else>{{ card.color }}</template>
        </q-badge>
      </template>
      <template v-else-if="visible || card.revealed">
        <div class="text-subtitle2">{{ card.number }}</div>
      </template>
      <template v-else>
        <q-icon name="help_outline" color="grey" />
      </template>
      <template v-if="candidates && !card.revealed && !card.infoToken">
        <div class="q-mt-xs text-caption">
          <span>
            <template v-for="(val, idx) in Array.from(candidates)" :key="val">
              <span>{{ val }}<span v-if="idx < candidates.size - 1">, </span></span>
            </template>
          </span>
        </div>
        <div class="text-caption">
          <span v-if="candidates.probability?.slots[0]">
            ({{ (candidates.probability.slots[0].probability * 100).toFixed(1) }}%)
            {{ candidates.probability.slots[0].value }}
          </span>
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  card: { type: Object, required: true },
  visible: { type: Boolean, default: false },
  size: { type: String, default: 'normal' }, // 'normal' or 'small'
  selectable: { type: Boolean, default: false },
  candidates: { type: Object, default: undefined },
})

const emit = defineEmits(['pick'])

function onClick() {
  if (props.selectable) {
    emit('pick', props.card)
  }
}

const cardClass = computed(() => {
  let base = []
  if (props.visible || props.card.revealed) {
    let colorClass
    if (props.card.color === 'blue') {
      colorClass = 'bg-blue'
    } else if (props.card.color === 'yellow') {
      colorClass = 'bg-yellow-7'
    } else if (props.card.color === 'red') {
      colorClass = 'bg-red'
    } else {
      colorClass = 'bg-grey-2'
    }

    base = ['text-white', colorClass]
    if (!props.card.revealed) {
      base.push('light-dimmed')
    }
  } else {
    base = ['bg-grey-2', 'text-black']
  }
  if (props.card.selected) {
    base.push('shadow-12')
  }
  return base
})

const cardStyle = computed(() => {
  return props.size === 'small'
    ? 'min-width: 60px; max-width: 80px'
    : 'min-width: 80px; max-width: 100px'
})
</script>
