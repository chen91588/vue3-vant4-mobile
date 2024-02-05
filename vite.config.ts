import { resolve } from 'node:path'
import type { ConfigEnv, UserConfig } from 'vite'
import { loadEnv } from 'vite'
import { format } from 'date-fns'
import viewport from 'postcss-mobile-forever'
import autoprefixer from 'autoprefixer'
import { wrapperEnv } from './build/utils'
import { createVitePlugins } from './build/vite/plugin'
import { OUTPUT_DIR } from './build/constant'
import { createProxy } from './build/vite/proxy'
import pkg from './package.json'

const { dependencies, devDependencies, name, version } = pkg

// 当使用文件系统路径的别名时，请始终使用绝对路径。相对路径的别名值会原封不动地被使用，因此无法被正常解析。
// path.resolve () 方法用于将一系列路径段解析为绝对路径。它通过处理从右到左的路径序列来工作，在每个路径之前添加，直到创建绝对路径。
function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

const __APP_INFO__ = {
  // APP 后台管理信息
  pkg: { dependencies, devDependencies, name, version },
  // 最后编译时间
  lastBuildTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
}

/** @type {import('vite').UserConfig} */
export default ({ command, mode }: ConfigEnv): UserConfig => {
  // process.cwd() 方法返回 Node.js 进程的当前工作目录
  // mode 返回应用的环境模式 development（开发环境） 或者 production（生产环境）
  // command 返回（dev/serve 或 build）命令模式，yarn dev 返回 dev/serve yarn build 返回 build
  const root = process.cwd()
  // loadEnv() 根据 mode 检查 root(项目根路径) 路径下 .env、.env.development 环境文件，输出 NODE_ENV 和 VITE_ 开头的键值队
  const env = loadEnv(mode, root)
  // 读取并处理所有环境变量配置文件 .env
  const viteEnv = wrapperEnv(env)

  const { VITE_PUBLIC_PATH, VITE_DROP_CONSOLE, VITE_PORT, VITE_PROXY, VITE_GLOB_PROD_MOCK }
    = viteEnv

  const prodMock = VITE_GLOB_PROD_MOCK

  const baseViewportOpts = {
    appSelector: '#app', // 根元素选择器，用于设置桌面端和横屏时的居中样式
    viewportWidth: 750, // 设计稿的视口宽度，可传递函数动态生成视图宽度
    unitPrecision: 3, // 单位转换后保留的精度（很多时候无法整除）
    // maxDisplayWidth: 600, // 桌面端最大展示宽度
    propList: [
      '*',
      // '!font-size'
    ],
    // 能转化为vw的属性列表，!font-size表示font-size后面的单位不会被转换
    // 指定不转换为视口单位的类，可以自定义，可以无限添加，建议定义一至两个通用的类名
    // 需要忽略的CSS选择器，不会转为视口单位，使用原有的px等单位。
    // 下面配置表示类名中含有'keep-px'以及'.ignore'类都不会被转换
    selectorBlackList: ['.ignore', 'keep-px'],
    // 下面配置表示属性值包含 '1px solid' 的内容不会转换
    valueBlackList: ['1px solid'],
    // exclude: [/node_modules/], // 忽略某些文件夹下的文件或特定文件
    // include: [/src/], // 如果设置了include，那将只有匹配到的文件才会被转换
    mobileUnit: 'vw', // 指定需要转换成的视口单位，建议使用 vw
    rootContainingBlockSelectorList: ['van-popup--bottom'], // 指定包含块是根包含块的选择器，这种选择器的定位通常是 `fixed`，但是选择器内没有 `position: fixed`
  }

  const isBuild = command === 'build'
  // command === 'build'
  return {
    base: VITE_PUBLIC_PATH,
    root,

    // 别名
    resolve: {
      alias: [
        // @/xxxx => src/xxxx
        {
          find: /\@\//,
          replacement: `${pathResolve('src')}/`,
        },
        // #/xxxx => types/xxxx
        {
          find: /\#\//,
          replacement: `${pathResolve('types')}/`,
        },
      ],
      dedupe: ['vue'],
    },

    // 定义全局常量替换方式
    define: {
      // 在生产中 启用/禁用 intlify-devtools 和 vue-devtools 支持，默认值 false
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__),
    },

    esbuild: {
      // 使用 esbuild 压缩 剔除 console.log
      drop: VITE_DROP_CONSOLE ? ['debugger', 'console'] : [],
      // minify: true, // minify: true, 等于 minify: 'esbuild',
    },

    build: {
      // 设置最终构建的浏览器兼容目标
      target: 'es2015',
      minify: 'esbuild',
      // 构建后是否生成 source map 文件(用于线上报错代码报错映射对应代码)
      sourcemap: false,
      cssTarget: 'chrome80',
      // 指定输出路径（相对于 项目根目录)
      outDir: OUTPUT_DIR,
      // 只有 minify 为 terser 的时候, 本配置项才能起作用
      // terserOptions: {
      //   compress: {
      //     // 防止 Infinity 被压缩成 1/0，这可能会导致 Chrome 上的性能问题
      //     keep_infinity: true,
      //     // 打包是否自动删除 console
      //     drop_console: VITE_DROP_CONSOLE,
      //   },
      // },
      // 启用/禁用 gzip 压缩大小报告
      // 压缩大型输出文件可能会很慢，因此禁用该功能可能会提高大型项目的构建性能
      reportCompressedSize: true,
      // chunk 大小警告的限制（以 kbs 为单位）
      chunkSizeWarningLimit: 2000,
    },

    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          viewport({ // <---- 这里
            ...baseViewportOpts,
            // 只将 vant 转为 350 设计稿的 viewport，其它样式的视图宽度为 750
            viewportWidth: file => (file.includes('node_modules/vant/') ? 375 : 750),
          }),
        ],
      },
      preprocessorOptions: {
        less: {
          modifyVars: {},
          javascriptEnabled: true,
          // 注入全局 less 变量
          additionalData: `@import "src/styles/var.less";`,
        },
      },
    },

    server: {
      host: true,
      // 服务启动时是否自动打开浏览器
      open: true,
      // 服务端口号
      port: Number(VITE_PORT),
      proxy: createProxy(VITE_PROXY),
      // 预热文件以降低启动期间的初始页面加载时长
      warmup: {
        // 预热的客户端文件：首页、views、 components
        clientFiles: ['./index.html', './src/{views,components}/*'],
      },
      // proxy: {
      //     '/api': {
      //         target: '',
      //         changeOrigin: true,
      //         rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      //     }
      // }
    },

    // 有需要再打开，否则 既不优化 也不排除
    // optimizeDeps: {
    //   include: [],
    //   // 打包时强制排除的依赖项
    //   exclude: [],
    // },

    // 加载插件
    plugins: createVitePlugins(viteEnv, isBuild, prodMock),
  }
}
