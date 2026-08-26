const { execFileSync, execSync } = require('child_process')
const path = require('path')
const os = require('os')

function getFlightctlDir() {
  return process.env.CYPRESS_FLIGHTCTL_DIR || path.join(os.homedir(), 'flightctl')
}

function getFlightctlBin() {
  return process.env.CYPRESS_FLIGHTCTL_BIN || path.join(getFlightctlDir(), 'bin', 'flightctl')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function registerAgentVmTasks(on) {
  on('task', {
    agentVmCreate({
      vmName = 'device6',
      mem = '2048',
      sshPort = '2222',
    } = {}) {
      const flightctlDir = getFlightctlDir()
      const devVmBin = path.join(flightctlDir, 'bin', 'flightctl-dev-vm')
      const args = ['start', '--name', vmName, '--mem', mem, '--ssh-port', sshPort]
      try {
        const out = execFileSync(devVmBin, args, {
          cwd: flightctlDir,
          encoding: 'utf8',
          timeout: 300000,
        })
        return { vmName, output: out }
      } catch (e) {
        throw new Error(`flightctl-dev-vm start failed for ${vmName}: ${e.stderr || e.message}`)
      }
    },

    async agentVmWaitForEnrollment({
      timeoutMs = 300000,
      pollMs = 10000,
    } = {}) {
      const bin = getFlightctlBin()
      const deadline = Date.now() + timeoutMs
      let lastCount = 0
      while (Date.now() < deadline) {
        try {
          const out = execFileSync(bin, ['get', 'enrollmentrequests', '-o', 'json'], {
            encoding: 'utf8',
            maxBuffer: 32 * 1024 * 1024,
          })
          const items = (JSON.parse(out).items || []).filter((er) => {
            const approval = er.status && er.status.approval
            return !approval || !approval.approved
          })
          lastCount = items.length
          if (lastCount > 0) {
            return { found: true, pendingCount: lastCount }
          }
        } catch (_) { /* retry */ }
        await sleep(pollMs)
      }
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for a pending enrollment request (last count: ${lastCount})`,
      )
    },

    agentVmDestroy({ vmName = 'device6' } = {}) {
      const flightctlDir = getFlightctlDir()
      const devVmBin = path.join(flightctlDir, 'bin', 'flightctl-dev-vm')
      try {
        execFileSync(devVmBin, ['delete', '--name', vmName], {
          cwd: flightctlDir,
          encoding: 'utf8',
          timeout: 60000,
        })
      } catch (_) { /* best-effort */ }
      return null
    },
  })
}

module.exports = { registerAgentVmTasks }
