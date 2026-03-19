import { repositoriesPage } from '../views/repositoriesPage'

describe('Repository Management', () => {
  before(() => {
    cy.ensureLoggedIn()
  })

  /* it('Should create a repository', () => {
    repositoriesPage.createRepository(`${Cypress.env('repository')}`, `${Cypress.env('revision')}`, `${Cypress.env('resource')}`)
  }) */

  it('Should edit a repository', () => {
    repositoriesPage.editRepository(`${Cypress.env('repository')}`)
  })

  /* it('Should delete a repository', () => {
    repositoriesPage.deleteRepository(`${Cypress.env('repository')}`)
  }) */
})
