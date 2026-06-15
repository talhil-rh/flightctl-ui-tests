const { spawn, execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

let simulatorProcess = null

/**
 * Turns a path that starts with `~/` into an absolute path using the current user’s home directory.
 * Other paths are returned unchanged; falsy values are returned as-is.
 */
function expandPath(p) {
  if (!p) return p
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
  return p
}

/**
 * Resolves the `flightctl` CLI binary used to list devices during polls.
 * Uses `CYPRESS_FLIGHTCTL_BIN` when set, otherwise defaults to `~/flightctl/bin/flightctl`.
 */
function getFlightctlBin() {
  const fromEnv = process.env.CYPRESS_FLIGHTCTL_BIN
  if (fromEnv) return expandPath(fromEnv)
  return path.join(os.homedir(), 'flightctl/bin/flightctl')
}

/**
 * Resolves the device simulator executable spawned for the scale demo.
 * Uses `CYPRESS_DEVICE_SIMULATOR_BIN` when set, otherwise defaults to `~/flightctl/bin/devicesimulator`.
 */
function getSimulatorBin() {
  const fromEnv = process.env.CYPRESS_DEVICE_SIMULATOR_BIN
  if (fromEnv) return expandPath(fromEnv)
  return path.join(os.homedir(), 'flightctl/bin/devicesimulator')
}

/**
 * Async delay helper used between polls so the wait loop does not hammer the API or CLI.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Runs `flightctl get devices` with a label selector and returns how many devices appear in JSON `items`.
 * Tries several flag combinations (`-l` / `--selector`) so minor CLI differences still parse correctly.
 */
function countDevices(flightctlBin, labelSelector) {
  const attempts = [
    ['get', 'devices', '-l', labelSelector, '-o', 'json'],
    ['get', 'devices', '--selector', labelSelector, '-o', 'json'],
    ['get', 'devices', '--selector', labelSelector, '--output', 'json'],
  ]
  let lastErr
  for (const args of attempts) {
    try {
      const out = execFileSync(flightctlBin, args, {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      })
      const data = JSON.parse(out)
      if (Array.isArray(data.items)) {
        return data.items.length
      }
    } catch (e) {
      lastErr = e
    }
  }
  throw new Error(
    `Unable to list devices with ${flightctlBin} (selector ${labelSelector}): ${lastErr && lastErr.message}`,
  )
}

/**
 * Registers Cypress `task` handlers that start/stop the simulator and wait until enough devices exist.
 * Call this from `setupNodeEvents` so specs can drive the background process from `cy.task(...)`.
 */
function registerScaleFleetSimulatorTasks(on) {
  on('task', {
    /**
     * Spawns the device simulator with fixed scale-demo arguments (50 devices, fleet label, concurrency 1).
     * If a simulator child is already running, returns `{ alreadyRunning: true }` instead of starting another.
     */
    scaleFleetSimulatorStart({ count = 50, label = 'fleet=scale-fleet-00', initialDeviceIndex = 0 } = {}) {
      if (simulatorProcess && !simulatorProcess.killed) {
        return { alreadyRunning: true, pid: simulatorProcess.pid }
      }
      // Remove stale device data so the simulator re-submits enrollment requests
      // after a backend cleanup (deleted devices leave orphaned dirs that fool the simulator).
      const dataDir = path.join(os.homedir(), '.flightctl', 'data')
      if (fs.existsSync(dataDir)) {
        for (const entry of fs.readdirSync(dataDir)) {
          if (/^device-/.test(entry)) {
            try { fs.rmSync(path.join(dataDir, entry), { recursive: true, force: true }) } catch (_) {}
          }
        }
      }
      const bin = getSimulatorBin()
      const args = [
        `--count=${count}`,
        '--label',
        label,
        '--log-level',
        'error',
        `--initial-device-index=${initialDeviceIndex}`,
        '--max-concurrency',
        '10',
      ]
      simulatorProcess = spawn(bin, args, { stdio: 'ignore' })
      return { pid: simulatorProcess.pid }
    },

    /**
     * Sends SIGTERM to the spawned simulator process and clears the module-level handle.
     * Safe to call when nothing is running; subsequent starts create a fresh child process.
     */
    scaleFleetSimulatorStop() {
      if (simulatorProcess && !simulatorProcess.killed) {
        try {
          simulatorProcess.kill('SIGTERM')
        } catch (_) {
          /* ignore */
        }
      }
      simulatorProcess = null
      return null
    },

    /**
     * Polls `flightctl get devices` until at least `expected` devices match `labelSelector`, or `timeoutMs` elapses.
     * Transient CLI or parse failures are retried on each interval instead of failing the whole wait immediately.
     */
    /**
     * Creates the scale-fleet if it does not already exist, so enrolled devices get fleet ownership.
     * Safe to call repeatedly — no-ops when the fleet is already present.
     */
    scaleFleetEnsureExists({ fleetName = 'scale-fleet-00', selectorKey = 'fleet', selectorValue = 'scale-fleet-00' } = {}) {
      const bin = getFlightctlBin()
      try {
        execFileSync(bin, ['get', 'fleet', fleetName, '-o', 'name'], { encoding: 'utf8' })
        return { existed: true }
      } catch (_) {
        // Fleet does not exist — create it via apply
      }
      const yaml = [
        'apiVersion: v1beta1',
        'kind: Fleet',
        'metadata:',
        `  name: ${fleetName}`,
        'spec:',
        '  selector:',
        '    matchLabels:',
        `      ${selectorKey}: ${selectorValue}`,
        '  template:',
        '    spec: {}',
      ].join('\n') + '\n'
      const tmpPath = path.join(os.tmpdir(), `fleet-${fleetName}.yaml`)
      fs.writeFileSync(tmpPath, yaml)
      try {
        execFileSync(bin, ['apply', '-f', tmpPath], { encoding: 'utf8' })
      } finally {
        try { fs.unlinkSync(tmpPath) } catch (_) {}
      }
      return { existed: false, created: true }
    },

    /**
     * Removes the scale-fleet and all devices bearing its label so subsequent specs start clean.
     * Failures are swallowed — cleanup is best-effort.
     */
    scaleFleetCleanup({ fleetName = 'scale-fleet-00', labelSelector = 'fleet=scale-fleet-00' } = {}) {
      const bin = getFlightctlBin()
      // delete the fleet
      try { execFileSync(bin, ['delete', 'fleet', fleetName], { encoding: 'utf8' }) } catch (_) {}
      // delete all matching devices via enrollment requests
      try {
        const out = execFileSync(bin, ['get', 'enrollmentrequests', '-o', 'json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
        const names = (JSON.parse(out).items || []).map((i) => i.metadata && i.metadata.name).filter(Boolean)
        const CHUNK = 50
        for (let i = 0; i < names.length; i += CHUNK) {
          const chunk = names.slice(i, i + CHUNK)
          try { execFileSync(bin, ['delete', 'devices', ...chunk], { encoding: 'utf8' }) } catch (_) {}
        }
      } catch (_) {}
      return null
    },

    async scaleFleetSimulatorWaitForDevices({
      expected = 50,
      labelSelector = 'fleet=scale-fleet-00',
      timeoutMs = 600000,
      pollMs = 5000,
      settleMs = 0,
    }) {
      const flightctlBin = getFlightctlBin()
      const deadline = Date.now() + timeoutMs
      let last = 0
      let lastErr
      while (Date.now() < deadline) {
        try {
          const c = countDevices(flightctlBin, labelSelector)
          last = c
          if (c >= expected) {
            // The CLI confirmed enough devices, but the UI enrollment pipeline may still
            // be processing the last batch. Wait an extra settle period so all devices
            // are fully visible in the browser before any test navigates to page 4.
            if (settleMs > 0) {
              await sleep(settleMs)
            }
            return { count: c }
          }
        } catch (e) {
          lastErr = e
        }
        await sleep(pollMs)
      }
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for ${expected} devices (last count: ${last}). ${lastErr ? lastErr.message : ''}`,
      )
    },
  })
}

module.exports = { registerScaleFleetSimulatorTasks }
