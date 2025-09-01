<template>
  <div class="q-pa-xl flex flex-center">
    <q-spinner color="primary" size="3em" />
    <div class="q-ml-md">{{ message }}</div>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: 'Loading...',
  },
})
</script>
