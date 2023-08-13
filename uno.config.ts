import { defineConfig } from 'unocss'
import { presetUno } from 'unocss'
import presetIcons from '@unocss/preset-icons'
import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'

export default defineConfig({
  theme: {
    colors: {
      primary: {
        DEFAULT: "#00a3ff",
        light: "#d6f5ff",
        dark: "#0072b1"
      },
    }
  },
  presets: [
    presetUno(),
    presetIcons(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
})