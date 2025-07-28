<template>
  <q-card :class="cardClass" :style="cardStyle" @click="onClick" :clickable="selectable">
    <q-card-section class="text-center">
      <template v-if="revealed">
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
        revealed: {{ revealed ? 'true' : 'false' }}, infoToken:
        {{ card.infoToken ? 'true' : 'false' }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  card: { type: Object, required: true },
  revealed: { type: Boolean, default: false },
  size: { type: String, default: 'normal' }, // 'normal' or 'small'
  selectable: { type: Boolean, default: false },
})

const emit = defineEmits(['pick'])

function onClick() {
  if (props.selectable) {
    emit('pick', props.card)
  }
}

const cardClass = computed(() => {
  if (props.revealed) {
    return [
      'text-white',
      props.card.color === 'blue'
        ? 'bg-blue'
        : props.card.color === 'yellow'
          ? 'bg-yellow-7'
          : props.card.color === 'red'
            ? 'bg-red'
            : 'bg-grey-2',
    ]
  } else {
    return ['bg-grey-2', 'text-black']
  }
})

const cardStyle = computed(() => {
  return props.size === 'small'
    ? 'min-width: 60px; max-width: 80px'
    : 'min-width: 80px; max-width: 100px'
})
</script>
