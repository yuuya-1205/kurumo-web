// Node のバージョンが package.json の engines を満たすか確認する。
//
// 満たさない場合、vite は `node:util` の styleText が無いという
// 分かりにくい SyntaxError で落ちる。原因と対処が伝わるよう、
// dev / build / preview の前にここで止める。

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const required = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
).engines?.node

// 想定しているのは ">=20.19" 形式のみ。それ以外に書き換えられた場合は
// 誤判定するより素通りさせる。
const range = required?.match(/^>=\s*(\d+)\.(\d+)(?:\.(\d+))?$/)
if (!range) {
  process.exit(0)
}

const min = range.slice(1).map((n) => Number(n ?? 0))
const current = process.versions.node.split('.').map(Number)

const satisfied =
  current[0] > min[0] ||
  (current[0] === min[0] &&
    (current[1] > min[1] || (current[1] === min[1] && current[2] >= min[2])))

if (!satisfied) {
  const pinned = readNvmrc()
  process.exitCode = 1
  console.error(
    [
      '',
      `Node ${required} が必要ですが、現在は v${process.versions.node} です。`,
      '',
      pinned
        ? `  nvm use          # .nvmrc の Node ${pinned} に切り替える`
        : `  nvm install ${min[0]}`,
      '',
    ].join('\n'),
  )
}

function readNvmrc() {
  try {
    return readFileSync(join(root, '.nvmrc'), 'utf8').trim()
  } catch {
    return null
  }
}
