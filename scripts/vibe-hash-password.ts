/**
 * Produces the scrypt hash for VIBE_ADMIN_PASSWORD_HASH.
 *
 *   npm run vibe:hash              # prompts, with echo off
 *   npm run vibe:hash -- --generate  # invents a strong password for you
 *
 * The plaintext is never printed to stdout and never echoed, because terminal
 * output is routinely captured in scrollback, CI logs and session transcripts.
 * With --generate it is written to a local gitignored file that you are told to
 * delete once it is in your password manager.
 */
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { hashPassword } from '../src/lib/vibe/adminAuth'

const OUT_FILE = '.vibe-admin-password.txt'

/** Unambiguous alphabet: no O/0, l/1/I. These get read aloud and retyped. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function generatePassword(groups = 5, size = 5): string {
  const bytes = randomBytes(groups * size)
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length])
  // ~28 chars from a 57-symbol alphabet is roughly 145 bits: far beyond what
  // scrypt at N=16384 needs to hold up, which is the point of a machine-chosen one.
  return Array.from({ length: groups }, (_, i) => chars.slice(i * size, (i + 1) * size).join('')).join('-')
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const out = process.stdout as NodeJS.WriteStream & { muted?: boolean }
    out.write(question)
    out.muted = true
    const write = out.write.bind(out)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(out as any).write = (chunk: string, ...rest: unknown[]) =>
      out.muted && chunk !== '\n' ? true : write(chunk, ...(rest as []))
    rl.question('', (answer) => {
      out.muted = false
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(out as any).write = write
      out.write('\n')
      rl.close()
      resolve(answer)
    })
  })
}

async function main() {
  const generate = process.argv.includes('--generate')
  let password: string

  if (generate) {
    password = generatePassword()
    const target = path.resolve(process.cwd(), OUT_FILE)
    fs.writeFileSync(target, `${password}\n`, { mode: 0o600 })
    console.log(`A password was generated and written to ${OUT_FILE} (mode 600).`)
    console.log('Put it in your password manager, then delete that file:')
    console.log(`  rm ${OUT_FILE}\n`)
  } else {
    password = await promptHidden('New admin password (input hidden): ')
    if (password.length < 12) {
      console.error('Too short — use at least 12 characters.')
      process.exit(1)
    }
  }

  const hash = await hashPassword(password)
  console.log('Set this in Doppler (hazl-general / prd):\n')
  console.log(`  VIBE_ADMIN_PASSWORD_HASH=${hash}\n`)
  console.log('Or pipe it straight in:')
  console.log(`  echo -n '${hash}' | doppler secrets set VIBE_ADMIN_PASSWORD_HASH -p hazl-general -c prd`)
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
