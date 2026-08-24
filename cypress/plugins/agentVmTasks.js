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
      excludeVariants = 'v2 v3 v4 v5 v6 v7 v8 v9 v10 v11 v12',
    } = {}) {
      const flightctlDir = getFlightctlDir()
      const goPath = path.join(os.homedir(), 'go')
      const kubeconfig = process.env.KUBECONFIG || path.join(os.homedir(), 'clusterconfigs', 'auth', 'kubeconfig')
      const cmd = [
        `export PATH=/usr/local/go/bin:${goPath}/bin:/usr/local/bin:$PATH`,
        `export GOPATH=${goPath}`,
        `export KUBECONFIG=${kubeconfig}`,
        `cd ${flightctlDir}`,
        `make agent-vm VMNAME=${vmName} EXCLUDE_VARIANTS="${excludeVariants}"`,
      ].join(' && ')
      try {
        const out = execSync(cmd, {
          encoding: 'utf8',
          timeout: 300000,
          shell: '/bin/bash',
        })
        return { vmName, output: out }
      } catch (e) {
        throw new Error(`make agent-vm failed for ${vmName}: ${e.stderr || e.message}`)
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
      try {
        execFileSync('make', ['clean-agent-vm', `VMNAME=${vmName}`], {
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
