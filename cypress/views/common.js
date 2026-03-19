/**
 * Common utilities for test operations
 */

/** True after org selection was handled or confirmed absent — only run once per spec (first navigateTo). */
let organizationSelectionHandled = false

export const common = {
  /**
   * Navigate to a page (supports both ACM multi-level nav and flat nav).
   * @param {string} page - The page to navigate to (e.g., 'Devices', 'Fleets', 'Repositories')
   */
  navigateTo: (page) => {
    if (Cypress.env('useAcmNavigation')) {
      cy.get('#nav-toggle', { timeout: 30000 }).should('exist')
      // Only open the sidebar if it's collapsed (clicking when open would close it)
      cy.get('body').then(($body) => {
        const sidebarExpanded =
          $body.find('.pf-v6-c-page__sidebar.pf-m-expanded').length > 0 ||
          $body.find('#nav-toggle').attr('aria-expanded') === 'true'
        if (!sidebarExpanded) {
          cy.get('#nav-toggle').click()
        }
      })
      cy.contains('Edge Management').click()
      cy.contains(page).click()
      common.selectOrganizationIfNeeded('Default')
    } else {
      const sidebar = '.pf-v6-c-page__sidebar'
      common.selectOrganizationIfNeeded('Default')
      cy.get('#page-toggle-button', { timeout: 30000 }).should('exist')
      cy.get('body').then(($body) => {
        const sidebarExpanded = $body.find('#page-toggle-button').attr('aria-expanded') === 'true' 
        if (!sidebarExpanded) {
          cy.get('#page-toggle-button').click()
        }
      })
      cy.get(sidebar).contains(page).click()
    }
    
  },

  /**
   * Select organization if the selection page appears.
   * Runs only the first time in a spec (first `navigateTo`); later calls are no-ops.
   */
  selectOrganizationIfNeeded: (orgName = 'Default', maxRetries = 10, retryDelay = 1000) => {
    if (organizationSelectionHandled) {
      cy.log('Organization selection already handled this run, skipping')
      return
    }

    const markHandled = () => {
      organizationSelectionHandled = true
    }

    const checkForOrgSelection = (attempt = 1) => {
      cy.log(`Checking for organization selection page (attempt ${attempt}/${maxRetries})`)

      cy.wait(retryDelay)

      cy.get('body').then(($body) => {
        if ($body.text().includes('Select Organization')) {
          cy.log(`Organization selection page detected, selecting ${orgName}`)
          cy.contains(orgName).click()
          cy.contains('button', 'Continue').click()
          cy.get('.pf-v6-c-page', { timeout: 30000 }).should('exist')
          cy.then(markHandled)
        } else if (attempt < maxRetries) {
          cy.log(`Organization selection not found yet, retrying...`)
          checkForOrgSelection(attempt + 1)
        } else {
          cy.log('No organization selection page detected after all retries, continuing...')
          markHandled()
        }
      })
    }

    checkForOrgSelection()
  },
}
