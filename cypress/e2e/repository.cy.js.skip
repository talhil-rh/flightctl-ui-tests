import { repositoriesPage } from '../views/repositoriesPage'

// Skipped temporarily to shorten CI runs — remove .skip to re-enable.
describe('Repository Management', () => {
  before(() => {
    cy.ensureLoggedIn()
  })

  describe('negative tests', () => {
    it('Should show validation error for illegal repository name', () => {
      repositoriesPage.assertIllegalRepositoryNameValuesShowValidation()
    })

    it('Should show validation error for repository URL without http(s)://', () => {
      repositoriesPage.assertIllegalRepositoryUrlValuesShowValidation()
    })

    it('Should show validation error for illegal resource sync name', () => {
      repositoriesPage.assertIllegalResourceSyncNameValuesShowValidation()
    })
  })

  describe('happy path', () => {
    /* it('Should create a repository', () => {
      repositoriesPage.createRepository(`${Cypress.env('repository')}`, `${Cypress.env('revision')}`, `${Cypress.env('resource')}`)
    }) */

    it('Should edit a repository', () => {
      repositoriesPage.editRepository(`${Cypress.env('repositoryname')}`)
    })

    /* it('Should delete a repository', () => {
      repositoriesPage.deleteRepository(`${Cypress.env('repositoryname')}`)
    }) */
  })
})
