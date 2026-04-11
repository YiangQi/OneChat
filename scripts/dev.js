// 清除 ELECTRON_RUN_AS_NODE 环境变量后启动开发服务器
// 这个变量会导致 Electron 以 Node.js 模式运行，导致 electron.app 为 undefined

delete process.env.ELECTRON_RUN_AS_NODE

const { spawn } = require('child_process')

// 直接启动 electron-vite dev，避免循环调用
const child = spawn('npx', ['electron-vite', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
})

child.on('exit', (code) => {
  process.exit(code)
})
