/**
 * Cypress tasks for running commands on enrolled devices via `flightctl console`.
 * Requires `flightctl` CLI installed and logged in on the machine running Cypress.
 *
 * Usage in tests:
 *   cy.task('flightctlConsoleCommand', {
 *     commands: ['logger -p user.info "test message"', 'whoami']
 *   })
 */
const { execSync } = require('child_process')
const path = require('path')
const os = require('os')
const fs = require('fs')

function getFlightctlBin() {
  const fromEnv = process.env.CYPRESS_FLIGHTCTL_BIN
  if (fromEnv) return fromEnv

  const fromBuild = path.join(os.homedir(), 'flightctl', 'bin', 'flightctl')
  if (fs.existsSync(fromBuild)) return fromBuild

  return 'flightctl'
}

function getDeviceName(bin) {
  try {
    const output = execSync(`${bin} get devices -o json`, { encoding: 'utf-8', timeout: 15000 })
    const devices = JSON.parse(output)
    if (devices.items && devices.items.length > 0) {
      return devices.items[0].metadata.name
    }
  } catch (e) { /* fall through */ }
  return null
}

function registerFlightctlConsoleTasks(on) {
  on('task', {
    flightctlConsoleCommand({ commands }) {
      const bin = getFlightctlBin()
      const deviceName = getDeviceName(bin)
      if (!deviceName) {
        return [{ cmd: 'get devices', stdout: '', error: `No enrolled device found (using ${bin})` }]
      }

      const results = []
      for (const cmd of commands) {
        try {
          const stdout = execSync(
            `${bin} console dev/${deviceName} --notty -- ${cmd}`,
            { encoding: 'utf-8', timeout: 15000 }
          )
          results.push({ cmd, stdout: stdout.trim(), error: null })
        } catch (err) {
          results.push({ cmd, stdout: err.stdout || '', error: err.message })
        }
      }
      return results
    },
  })
}

module.exports = { registerFlightctlConsoleTasks }
