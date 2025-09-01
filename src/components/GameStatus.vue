<template>
  <div class="row items-center q-gutter-lg q-mb-md justify-center">
    <wire-tracker
      :wires="state?.wires || []"
      :yellow-wires="state?.yellowWires || []"
      :red-wires="state?.redWires || []"
    />
    <detonator-dial :value="state?.detonatorDial || 0" />
  </div>
</template>

<script setup>
import WireTracker from './WireTracker.vue'
import DetonatorDial from './DetonatorDial.vue'

defineProps({
  state: {
    type: Object,
    default: () => ({}),
  },
})
</script>
