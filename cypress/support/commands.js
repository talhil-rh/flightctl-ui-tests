require('cypress-downloadfile/lib/downloadFileCommand')

/**
 * OpenShift console "Welcome to the new OpenShift experience" / guided tour intro — no stable
 * data-ouia id in all versions. Find a visible dialog whose text matches, then prefer Skip tour,
 * else the modal header Close button. Short retries so runs stay fast when the modal does not show.
 *
 * To harden: open DevTools on the modal → copy data-ouia-component-id or data-test from Skip/Close
 * and prefer that selector here.
 */
const tryCloseConsoleWelcomeTourModal = (attempt = 1, maxRetries = 10, retryDelay = 600) => {
  cy.get('body').then(($body) => {
    const $jq = Cypress.$
    const $dialogs = $body.find('[role="dialog"]:visible').filter((_, el) => {
      const text = el.textContent || ''
      return (
        /welcome to the new openshift experience/i.test(text) ||
        (/launch tour/i.test(text) && /skip tour/i.test(text))
      )
    })
    if ($dialogs.length > 0) {
      const $d = $jq($dialogs[0])
      const $skip = $d.find('button, a').filter((_, el) => /skip tour/i.test($jq(el).text().trim()))
      const $close = $d.find('button[aria-label="Close"]')
      if ($skip.length > 0) {
        cy.wrap($skip.first()).click()
      } else if ($close.length > 0) {
        cy.wrap($close.first()).click()
      }
    } else if (attempt < maxRetries) {
      cy.wait(retryDelay)
      tryCloseConsoleWelcomeTourModal(attempt + 1, maxRetries, retryDelay)
    }
  })
}

/**
 * Dismiss clusters onboarding modal if it appears (used after login and after session restore).
 */
const tryCloseOnboardingModal = (attempt = 1, maxRetries = 15, retryDelay = 2000) => {
  cy.get('body').then(($body) => {
    const $btn = $body.find('[data-ouia-component-id="clustersOnboardingModal-ModalBoxCloseButton"]')
    if ($btn.length > 0) {
      cy.get('[data-ouia-component-id="clustersOnboardingModal-ModalBoxCloseButton"]').click()
    } else if (attempt < maxRetries) {
      cy.log(
        `Clusters onboarding modal not found yet (attempt ${attempt}/${maxRetries}); waiting ${retryDelay}ms before retry`,
      )
      cy.wait(retryDelay)
      tryCloseOnboardingModal(attempt + 1, maxRetries, retryDelay)
    }
  })
}

/**
 * Open the top perspective menu and choose Fleet management (Flight / edge console).
 */
Cypress.Commands.add('selectFleetManagementPerspective', () => {
  cy.get('[data-test-id="perspective-switcher-toggle"]', { timeout: 30000 })
    .should('be.visible')
    .click()
  cy.get('[data-test-id="perspective-switcher-menu-option"]')
    .contains('Fleet management')
    .should('be.visible')
    .click()
})

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
    tryCloseConsoleWelcomeTourModal()
    tryCloseOnboardingModal()
    if (Cypress.env('useAcmNavigation')) {
      cy.selectFleetManagementPerspective()
    }
    cy.url().should('include', `${Cypress.env('host')}`)    
})

/**
 * Restores a cached browser session after the first successful login.
 * Use once per spec in before() with testIsolation: false so later `it` blocks reuse the same tab.
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
  tryCloseConsoleWelcomeTourModal()
  tryCloseOnboardingModal()
  if (Cypress.env('useAcmNavigation')) {
    cy.selectFleetManagementPerspective()
  }
  cy.url().should('include', host)
})

Cypress.Commands.add('downloadClifile', (platform = `${Cypress.env('platform')}`, arch = `${Cypress.env('arch')}`) => {
  let filename
  if (platform === 'Windows') {
    if (arch === 'ARM 64') {
      filename = `${platform}-flightctl-arm64.zip`
    } else {
      filename = `${platform}-flightctl-x86_64.zip`
    }
  } else {
    filename = `${platform}-${arch}-flightctl.tar.gz`
  }
  cy.get('button[aria-label="Help menu"]').click().should('be.visible')
  cy.contains('Command Line Tools').click()
  cy.log(`Download flightctl for ${platform} for ${arch}`)
  cy.get('.co-external-link')
    .contains(`Download flightctl for ${platform} for ${arch}`)
    .should('have.attr', 'href')
    .then((href) => {
      cy.downloadFile(`${href}`, 'downloads', filename)
    })
  const fullpath = `downloads/${filename}`
  cy.log(`Downloaded file: ${fullpath}`)
  cy.readFile(fullpath).should('exist')
})
