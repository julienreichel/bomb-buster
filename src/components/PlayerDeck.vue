<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ player && player.name ? player.name : 'Player' }}'s Hand</div>
      <div class="row q-gutter-sm">
        <wire-card
          v-for="card in player && player.hand ? player.hand : []"
          :key="card.id"
          :card="card"
          :revealed="revealed ? true : card.revealed"
          :size="size"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import WireCard from './WireCard.vue'
defineProps({
  player: { type: Object, required: true },
  revealed: { type: Boolean, default: false },
  size: { type: String, default: 'normal' },
})
</script>
