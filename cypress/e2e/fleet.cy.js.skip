import { fleetsPage } from '../views/fleetsPage'
import { repositoriesPage } from '../views/repositoriesPage'

// Skipped temporarily to shorten CI runs — remove .skip to re-enable.
describe('Fleet Management', () => {
  before(() => {
    cy.ensureLoggedIn()
  })

  describe('Create fleet – Fleet name validation (negative)', () => {
    it('Should show validation error when fleet name starts with a dash', () => {
      fleetsPage.openCreateFleetWizard()
      fleetsPage.fillFleetNameInCreateWizard('-test')
      fleetsPage.expectInvalidFleetNameBlocksWizard()
      fleetsPage.closeCreateFleetWizard()
    })

    it('Should show validation error when fleet name ends with a dash', () => {
      fleetsPage.openCreateFleetWizard()
      fleetsPage.fillFleetNameInCreateWizard('test-')
      fleetsPage.expectInvalidFleetNameBlocksWizard()
      fleetsPage.closeCreateFleetWizard()
    })

    it('Should show validation error when fleet name contains uppercase letters', () => {
      fleetsPage.openCreateFleetWizard()
      fleetsPage.fillFleetNameInCreateWizard('InvalidFleet')
      fleetsPage.expectInvalidFleetNameBlocksWizard()
      fleetsPage.closeCreateFleetWizard()
    })

    it('Should show validation error when fleet name contains spaces', () => {
      fleetsPage.openCreateFleetWizard()
      fleetsPage.fillFleetNameInCreateWizard('invalid fleet name')
      fleetsPage.expectInvalidFleetNameBlocksWizard()
      fleetsPage.closeCreateFleetWizard()
    })

    it('Should show validation error when fleet name exceeds 253 characters', () => {
      const longName = 'a'.repeat(254)
      fleetsPage.openCreateFleetWizard()
      fleetsPage.fillFleetNameInCreateWizard(longName)
      fleetsPage.expectInvalidFleetNameBlocksWizard()
      fleetsPage.closeCreateFleetWizard()
    })
  })

  describe('Create fleet, delete fleet, import fleet', () => {
    it('Should create a fleet', () => {
      fleetsPage.createFleet(`${Cypress.env('image')}`)
    })

    /* it('Should edit a fleet', () => {
      fleetsPage.editFleet(`${Cypress.env('image')}`)
    }) */

    it('Should delete a fleet', () => {
      fleetsPage.deleteFleet('test-fleet')
    })

    it('Should import a fleet', () => {
      fleetsPage.importFleet()
    })

    /* it('Should delete an imported fleet', () => {
      repositoriesPage.deleteRepository('test-fleet')
      cy.wait(5000)
      fleetsPage.deleteFleet('basic-nginx-fleet')
    }) */
  })
})
