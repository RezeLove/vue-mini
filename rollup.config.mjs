import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-typescript'
import typescript from '@rollup/plugin-typescript'

export default [
    {
        // 入口文件
        input:'packages/vue/src/index.ts',
        // 打包出口
        output:[
            {
            // 到处iife模式的包
            sourcemap:true,
            // 到处文件地址
            file:'./packages/vue/dist/vue.js',
            format:'iife',
            name:'Vue'
            }
        ],
        plugins:[
            // ts
            typescript({
                sourceMap:true
            }),
            // 模块导入路径补全
            resolve(), 
            // 转commonjs为ESM
            commonjs()
        ]
    }
]