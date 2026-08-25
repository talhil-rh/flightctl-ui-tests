import { devicesPage } from '../views/devicesPage'

const DEVICE_APPS = 'test-apps'

describe('Device applications (KVM)', () => {
  before(() => {
    // ACM console fires background uncaught exceptions during form navigation
    // (e.g. findSectionHeaders in embedded console plugins). Same as buildImagePage.cy.js.
    Cypress.on('uncaught:exception', () => false)
    cy.ensureLoggedIn()
  })

  it('Should approve the apps device enrollment request', () => {
    devicesPage.approveDevice(DEVICE_APPS)
  })

  it('Should add Form and YAML KVM apps via edit-device wizard and reach Running', { timeout: 720000 }, () => {
    devicesPage.addApplications(DEVICE_APPS, [
      { mode: 'form', name: 'test-vm', hostPort: '2222', guestPort: '22' },
      { mode: 'yaml', name: 'test-vm-yaml', yaml: 'apps/kvm.yaml', hostPort: '2223', guestPort: '22' },
    ])
    devicesPage.waitForVmAppRunning(DEVICE_APPS, 'test-vm')
    devicesPage.waitForVmAppRunning(DEVICE_APPS, 'test-vm-yaml')
  })

  it('Should open test-vm serial console and login as fedora', { timeout: 360000 }, () => {
    devicesPage.openVmAppConsole(DEVICE_APPS, 'test-vm')
    devicesPage.loginVmSerialConsole('fedora', 'fedora')
    devicesPage.selectVmConsole('test-vm-yaml')
    devicesPage.loginVmSerialConsole('fedora', 'fedora')
  })

  it('Should decommission the apps device', () => {
    devicesPage.decommissionDevice(DEVICE_APPS)
  })
})
