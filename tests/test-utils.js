import {
  Quasar,
  QCard,
  QCardSection,
  QBadge,
  QIcon,
  QBtn,
  QSpinner,
  QToggle,
  QList,
  QItem,
  QItemSection,
  QChip,
  QTooltip,
  QLinearProgress,
  QTable,
} from 'quasar'

export const quasarOptions = {
  config: {},
  plugins: {},
  components: {
    QCard,
    QCardSection,
    QBadge,
    QIcon,
    QBtn,
    QSpinner,
    QToggle,
    QList,
    QItem,
    QItemSection,
    QChip,
    QTooltip,
    QLinearProgress,
    QTable,
  },
}

export function withQuasar(component) {
  const baseConfig = {
    global: {
      plugins: [[Quasar, quasarOptions]],
    },
  }

  if (!component) {
    return baseConfig
  }

  // If component has global config, we need to merge carefully
  if (component.global) {
    return {
      ...component,
      global: {
        ...baseConfig.global,
        ...component.global,
        plugins: [...baseConfig.global.plugins, ...(component.global.plugins || [])],
      },
    }
  }

  // If no global config, use the simple spread
  return {
    ...baseConfig,
    ...component,
  }
}
