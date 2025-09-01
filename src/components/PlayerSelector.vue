<template>
  <div class="q-mb-md row items-center q-gutter-md">
    <div class="text-h6 q-mr-md">Players:</div>
    <div class="row q-gutter-sm">
      <q-btn
        v-for="(player, idx) in players"
        :key="player.id"
        :label="player.name"
        :color="selectedPlayerIdx === idx ? 'primary' : 'grey-4'"
        :text-color="selectedPlayerIdx === idx ? 'white' : 'black'"
        unelevated
        dense
        @click="$emit('update:selectedPlayerIdx', idx)"
        class="q-mr-sm"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  players: {
    type: Array,
    default: () => [],
  },
  selectedPlayerIdx: {
    type: Number,
    default: 0,
  },
})

defineEmits(['update:selectedPlayerIdx'])
</script>
