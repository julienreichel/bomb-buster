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
  return {
    global: {
      plugins: [[Quasar, quasarOptions]],
    },
    ...component,
  }
}
