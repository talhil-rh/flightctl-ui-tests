require('cypress-downloadfile/lib/downloadFileCommand')

/**
 * Dismiss clusters onboarding modal if it appears (used after login and after session restore).
 */
const tryCloseOnboardingModal = (attempt = 1, maxRetries = 25, retryDelay = 2000) => {
  cy.get('body').then(($body) => {
    const $btn = $body.find('[data-ouia-component-id="clustersOnboardingModal-ModalBoxCloseButton"]')
    if ($btn.length > 0) {
      cy.get('[data-ouia-component-id="clustersOnboardingModal-ModalBoxCloseButton"]').click()
    } else if (attempt < maxRetries) {
      cy.wait(retryDelay)
      tryCloseOnboardingModal(attempt + 1, maxRetries, retryDelay)
    }
  })
}

Cypress.Commands.add('login', (url=`${Cypress.env('host')}`, auth=`${Cypress.env('auth')}`, user=`${Cypress.env('username')}`, password=`${Cypress.env('password')}`) => {
    cy.visit(url, { timeout: 60000, retryOnStatusCodeFailure: true })
    cy.origin(auth, { args: { username: user, password: password } }, ({ username, password }) => {
        //cy.get('.pf-c-button', { timeout: 60000 })
        cy.get('.pf-v6-c-button').contains('kube:admin').click()
        cy.get('#inputUsername').should('exist')
        cy.get('#inputUsername').should('be.visible')
        cy.get('#inputPassword').should('exist')
        cy.get('#inputPassword').should('be.visible')
        cy.get('#inputUsername').type(username)
        cy.get('#inputPassword').type(password)
        cy.get('#inputUsername').should('have.value', username)
        cy.get('#inputPassword').should('have.value', password)
        cy.get('#co-login-button').click()
      })
    tryCloseOnboardingModal()
    cy.url().should('include', `${Cypress.env('host')}`)    
})

/**
 * Restores a cached browser session after the first successful login.
 * Use in beforeEach instead of cy.login() to avoid logging in before every test.
 * Session key includes host/auth/user so changing env invalidates the cache.
 */
Cypress.Commands.add('ensureLoggedIn', () => {
  const host = Cypress.env('host')
  const auth = Cypress.env('auth')
  const user = Cypress.env('username')
  const password = Cypress.env('password')
  cy.session(
    ['openshift-console', host, auth, user],
    () => {
      cy.login(host, auth, user, password)
    }
  )
  cy.visit(host, { timeout: 60000, retryOnStatusCodeFailure: true })
  tryCloseOnboardingModal()
  cy.url().should('include', host)
})

Cypress.Commands.add('downloadClifile', (platform = `${Cypress.env('platform')}`, arch = `${Cypress.env('arch')}`) => {
    let filename
    if (platform === 'Windows') {
        if (arch === 'ARM 64') {
            filename = `${platform}-flightctl-arm64.zip`;
        } else {
            filename = `${platform}-flightctl-x86_64.zip`;
        }
    } else {
        filename = `${platform}-${arch}-flightctl.tar.gz`;
    }
    cy.get('[data-test="help-dropdown-toggle"]').click().should('be.visible')
    cy.contains('Command Line Tools').click()
    cy.log(`Download flightctl for ${platform} for ${arch}`)
    cy.get('.co-external-link').contains(`Download flightctl for ${platform} for ${arch}`)
            .should('have.attr', 'href').then((href) => {
                cy.downloadFile(`${href}`, 'downloads', filename);
            })
    let fullpath = `downloads/${filename}`
    cy.log(`Downloaded file: ${fullpath}`)
    cy.readFile(fullpath).should('exist')
})