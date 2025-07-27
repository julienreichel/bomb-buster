<template>
  <div class="q-mb-lg row items-center justify-center">
    <q-badge
      :color="value === 0 ? 'red' : value === 1 ? 'deep-orange-5' : 'grey-6'"
      :text-color="value === 0 ? 'white' : value === 1 ? 'white' : 'white'"
      rounded
    >
      <q-icon name="whatshot" left />
      {{ value }}
    </q-badge>
  </div>
</template>

<script setup>
defineProps({
  value: { type: Number, required: true },
})
</script>
