import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  theme: {
    colors: {
      primary: '#5d9dfe',
      darkBlue: '#243658',
      garyWhite: '#f5f5f5',
    },
    breakpoints: {
      'sm': '576px',
      'md': '768px',
      'lg': '992px',
      'xl': '1200px',
      '2xl': '1600px',
    },
  },
  rules: [
    // 动态规则，生成 enter-x 和 enter-y 的样式
    [/^enter-(x|y)-(\d+)$/, ([, axis, index]) => {
      const i = Number.parseInt(index, 10)
      const translateValue = axis === 'x' ? 'translateX' : 'translateY'
      // const sign = i % 2 === 0 ? '-' : ''
      return {
        'z-index': `${10 - i}`,
        'opacity': '0',
        'animation': `enter-${axis}-animation 0.4s ease-in-out forwards`,
        'animation-delay': `${(i * 1) / 10}s`,
        // 'transform': `${translateValue}(${sign}50px)`,
        'transform': `${translateValue}(-50px)`,
      }
    }],

  ],

})

// Define your keyframes in your global CSS or wherever you include your global styles
