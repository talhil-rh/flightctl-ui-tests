import {
  softwareCatalogPage,
  getCatalogItemName,
} from '../views/softwareCatalogPage'
import { devicesPage } from '../views/devicesPage'

/**
 * Deploy a catalog item to a single device (not a fleet) and verify
 * that delete protection blocks removal of in-use catalog items.
 *
 * Pre-requisites:
 *   - The catalog item from the build-image test exists in the catalog.
 *
 * The test creates its own device via the device simulator (1 device),
 * approves it through the UI, deploys the catalog item, and verifies
 * delete protection.
 *
 * Set CYPRESS_DEVICE_ALIAS to override the alias (default: "device6").
 */
const DEVICE_ALIAS = Cypress.env('deviceAlias') || 'device6'
const SIM_LABEL = 'env=catalog-deploy-test'

describe('Software Catalog – Deploy to device & Delete protection', () => {
  before(() => {
    Cypress.on('uncaught:exception', () => false)
    cy.ensureLoggedIn()
  })

  after(() => {
    cy.task('scaleFleetSimulatorStop')
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed') {
      Cypress.runner.stop()
    }
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Step 0: Create a simulated device and approve it
  // ══════════════════════════════════════════════════════════════════════════
  describe('Create simulated device and approve enrollment', () => {
    it('Should start the device simulator with 1 device', () => {
      cy.task('scaleFleetSimulatorStart', {
        count: 1,
        label: SIM_LABEL,
        initialDeviceIndex: 100,
      })
    })

    it('Should wait for enrollment request to appear', () => {
      cy.task(
        'agentVmWaitForEnrollment',
        { timeoutMs: 300000, pollMs: 10000 },
        { timeout: 330000 },
      )
    })

    it('Should approve the pending device and assign alias', () => {
      devicesPage.approveDevice(DEVICE_ALIAS)
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Step 1: Deploy catalog item to the device
  // ══════════════════════════════════════════════════════════════════════════
  describe('Deploy catalog item to an existing device', () => {
    it('Should navigate to Software Catalog', () => {
      softwareCatalogPage.navigateTo()
    })

    it('Should select the catalog item', () => {
      softwareCatalogPage.selectCatalogItem(getCatalogItemName())
    })

    it('Should click Deploy in the details drawer', () => {
      softwareCatalogPage.clickDeploy()
    })

    it('Should select "Existing Device" as the target type', () => {
      softwareCatalogPage.selectExistingDeviceTarget()
    })

    it('Should click Next to proceed to device selection', () => {
      softwareCatalogPage.clickWizardNext()
    })

    it('Should select the target device', () => {
      softwareCatalogPage.selectDeviceByAlias(DEVICE_ALIAS)
    })

    it('Should click Next to proceed to review', () => {
      softwareCatalogPage.clickWizardNext()
    })

    it('Should click Deploy to apply the catalog item to the device', () => {
      softwareCatalogPage.clickWizardDeploy()
    })

    it('Should show "Update configuration successful"', () => {
      softwareCatalogPage.verifyUpdateSuccessful()
    })

    it('Should navigate to device details via "View device"', () => {
      softwareCatalogPage.clickViewDevice()
    })

    it('Should open the Catalog tab on the device details', () => {
      softwareCatalogPage.clickDeviceCatalogTab()
    })

    it('Should show the deployed catalog item under "Deployed Software"', () => {
      softwareCatalogPage.verifyDeployedSoftware(getCatalogItemName())
    })
  })

  // ══════════════════════════════════════════════════════════════════════════
  // Step 2: Delete protection – in-use catalog item cannot be deleted
  // ══════════════════════════════════════════════════════════════════════════
  describe('Delete protection for in-use catalog item', () => {
    it('Should navigate to Software Catalog', () => {
      softwareCatalogPage.navigateTo()
    })

    it('Should select the in-use catalog item to open the drawer', () => {
      softwareCatalogPage.selectCatalogItem(getCatalogItemName())
    })

    it('Should open the kebab menu in the details drawer', () => {
      softwareCatalogPage.openDrawerKebab()
    })

    it('Should show Delete as disabled (in-use protection)', () => {
      softwareCatalogPage.verifyDeleteDisabled()
    })

    it('Should close the kebab and verify item is still available', () => {
      softwareCatalogPage.closeKebabDropdown()
      cy.contains('Deploy').should('be.visible')
    })
  })
})
