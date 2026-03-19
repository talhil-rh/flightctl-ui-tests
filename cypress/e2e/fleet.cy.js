import { fleetsPage } from '../views/fleetsPage'
import { repositoriesPage } from '../views/repositoriesPage'

describe('Fleet Management', () => {
  before(() => {
    cy.ensureLoggedIn()
  })

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
