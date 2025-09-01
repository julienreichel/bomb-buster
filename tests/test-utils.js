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
