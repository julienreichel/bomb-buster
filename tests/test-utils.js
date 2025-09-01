import { Quasar, QCard, QCardSection, QBadge, QIcon } from 'quasar'

export const quasarOptions = {
  config: {},
  plugins: {},
  components: {
    QCard,
    QCardSection,
    QBadge,
    QIcon,
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
