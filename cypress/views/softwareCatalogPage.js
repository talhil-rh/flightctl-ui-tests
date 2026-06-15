import { common } from './common'

/** Fleet used by the software-catalog simulator run */
export const CATALOG_FLEET_NAME = 'simulator-disk-monitoring'
export const CATALOG_FLEET_LABEL_TEXT = `fleet=${CATALOG_FLEET_NAME}`

/**
 * Resolves the catalog item name created by the build-image test.
 * Matches the convention in buildImagePage.cy.js: `${BUILD_NAME}-cin`.
 */
export const getCatalogItemName = () => {
  const buildName = Cypress.env('buildName') || 'new-build-flightctl'
  return `${buildName}-cin`
}

export const softwareCatalogPage = {
  navigateTo: () => {
    common.navigateTo('Software Catalog')
  },

  /**
   * Click the catalog item card in the gallery to open the details drawer.
   * The card uses `aria-label="Select <displayName>"` on its selectable action.
   */
  selectCatalogItem: (catalogItemName) => {
    cy.get(`[aria-label="Select ${catalogItemName}"]`, { timeout: 30000 })
      .should('be.visible')
      .click()
  },

  /** Click the Deploy button in the catalog item details drawer. */
  clickDeploy: () => {
    cy.contains('button', 'Deploy').should('be.visible').click()
  },

  /**
   * Select the "Existing Fleet" radio in the Specifications step.
   * RadioField prefixes the id prop with "radiofield-", so id="fleet-radio"
   * becomes id="radiofield-fleet-radio" in the DOM.
   */
  selectExistingFleetTarget: () => {
    cy.get('#radiofield-fleet-radio', { timeout: 30000 }).should('exist')
    cy.get('#radiofield-fleet-radio').click({ force: true })
  },

  /** Click the wizard Next button. */
  clickWizardNext: () => {
    cy.get('[data-testid="wizard-next-button"]').should('be.visible').click()
  },

  /**
   * In the "Select fleet" table (wizard step 2), click the radio for the given fleet.
   * PatternFly single-select tables render a radio <input> in the first column of each row.
   */
  selectFleetByName: (fleetName) => {
    cy.contains('tr', fleetName, { timeout: 30000 })
      .find('input[type="radio"]')
      .click({ force: true })
  },

  /** Click the Deploy (save) button on the Review-and-deploy wizard step. */
  clickWizardDeploy: () => {
    cy.get('[data-testid="wizard-save-button"]').should('be.visible').click()
  },

  /** Verify the "Update configuration successful" success state. */
  verifyUpdateSuccessful: () => {
    cy.contains('Update configuration successful', { timeout: 30000 }).should('be.visible')
  },

  /** Click the "View fleet" link on the success page. */
  clickViewFleet: () => {
    cy.contains('button', 'View fleet').should('be.visible').click()
  },

  /**
   * Click the "Catalog" tab on the fleet details page.
   * PatternFly Tab renders as a <button role="tab">.
   */
  clickFleetCatalogTab: () => {
    cy.contains('button[role="tab"]', 'Catalog', { timeout: 30000 })
      .should('be.visible')
      .click()
  },

  /**
   * In the fleet details Catalog tab, verify the "Deployed Software" card shows
   * the given catalog item name (displayName or metadata.name).
   */
  verifyDeployedSoftware: (catalogItemName) => {
    cy.contains('Deployed Software', { timeout: 60000 }).should('be.visible')
    cy.contains('Deployed Software')
      .closest('.pf-v6-c-card')
      .should('contain', catalogItemName)
  },
}
