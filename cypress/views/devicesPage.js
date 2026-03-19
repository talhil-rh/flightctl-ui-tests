import { common } from './common'

/** Alias validation: red error icon color when invalid */
const VALIDATION_ERROR_ICON_COLOR = '#b1380b'

/**
 * DevicesPage object for device management operations
 */
export const devicesPage = {
  /**
   * Open the "Approve pending device" modal without approving.
   * Use for validation checks only. Call fillAliasInApproveModal and
   * expectValidationIconError as needed, then closeApproveDeviceModal.
   */
  openApproveDeviceModal: () => {
    common.navigateTo('Devices')
    cy.get('h2.pf-v6-c-title.pf-m-3xl').contains('Devices pending approval')
    cy.get('[data-label="Approve"] > .pf-v6-c-button').should('exist')
    cy.get('[data-label="Approve"] > .pf-v6-c-button').should('be.visible')
    cy.get('[data-label="Approve"] > .pf-v6-c-button').click()
    cy.get('#rich-validation-field-deviceAlias').should('be.visible')
  },

  /**
   * Fill the Alias field in the open Approve device modal.
   */
  fillAliasInApproveModal: (alias) => {
    cy.get('#rich-validation-field-deviceAlias').clear()
    cy.get('#rich-validation-field-deviceAlias').type(alias)
    cy.get('#rich-validation-field-deviceAlias').should('have.value', alias)
  },

  /**
   * Assert the validation icon shows error state (red #b1380b).
   * Uses button[aria-label="Validation"] and its SVG color.
   */
  expectValidationIconError: () => {
    cy.get('button[aria-label="Validation"]').should('be.visible')
    cy.get('button[aria-label="Validation"]').find('svg').should('have.attr', 'color', VALIDATION_ERROR_ICON_COLOR)
  },

  /**
   * Close the Approve device modal without approving (Cancel).
   */
  closeApproveDeviceModal: () => {
    cy.contains('Cancel').click()
    cy.get('#rich-validation-field-deviceAlias').should('not.exist')
  },

  /**
   * Approve a device enrollment request
   */
  approveDevice: (deviceName = 'test-device') => {
    common.navigateTo('Devices')

    cy.get('h2.pf-v6-c-title.pf-m-3xl').contains('Devices pending approval')
    cy.get('[data-label="Approve"] > .pf-v6-c-button').should('exist')
    cy.get('[data-label="Approve"] > .pf-v6-c-button').should('be.visible')
    cy.get('[data-label="Approve"] > .pf-v6-c-button').click()
    cy.get('#rich-validation-field-deviceAlias').should('be.visible')
    cy.get('#rich-validation-field-deviceAlias').type(deviceName)
    cy.get('#rich-validation-field-deviceAlias').should('have.value', deviceName)
    cy.get('.pf-v6-c-form__actions > .pf-m-primary').should('be.visible')
    cy.get('.pf-v6-c-form__actions > .pf-m-primary').click()
    cy.get('[data-label="Device status"]', { timeout: 500000 }).should('contain', 'Online')
  },


  deviceEvents: (deviceName = 'test-device' ) => {
    common.navigateTo('Devices')
    cy.wait(1000)
    cy.get('a > .fctl-resource-link__text').contains(deviceName).should('be.visible').click()
    cy.wait(1000)
    cy.get('[id^="pf-tab-events-pf"]').contains('Events').should('be.visible').click()
    cy.wait(1000)
    cy.get('.pf-v6-c-menu-toggle.pf-m-expanded').click()
    cy.wait(1000)
    cy.get('.pf-v6-c-menu__item-text').contains('All types').click()
    cy.get('.pf-v6-c-card__body.fctl-events-container')
      .should('contain', 'Device returned to being up-to-date')
      .and('contain', 'Device is updating')
      .and('contain', 'Device was created successfully')
  },

  /**
   * Edit a device configuration
   */
  editDevice: (image, currentName = 'test-device', newName = 'test-device-edited') => {
    common.navigateTo('Devices')
    
    cy.get('a > .fctl-resource-link__text').contains(currentName)
    cy.get('.pf-v6-c-table__action > .pf-v6-c-menu-toggle').click()
    cy.wait(1000)
    cy.contains('Edit device configurations').click()
    cy.wait(1000)
    cy.get('#rich-validation-field-deviceAlias').should('be.visible')
    cy.get('#rich-validation-field-deviceAlias').should('have.value', currentName)
    cy.get('#rich-validation-field-deviceAlias').clear()
    cy.get('#rich-validation-field-deviceAlias').type(newName)
    cy.get('span.pf-v6-c-button__text').contains('Next').click()
    cy.get('#textfield-osImage').should('be.visible')
    cy.get('#textfield-osImage').clear()
    cy.get('#textfield-osImage').type(image)
    cy.get('#textfield-osImage').should('have.value', image)
    cy.get('span.pf-v6-c-button__text').contains('Next').click()
    cy.get('span.pf-v6-c-button__text').contains('Next').click()
    cy.get('span.pf-v6-c-button__text').contains('Save').click()
    cy.get('.pf-v6-c-title > .pf-v6-l-grid > .pf-m-6-col-on-md', { timeout: 50000 }).should('contain', newName)
  },

  /**
   * Decommission a device
   */
  decommissionDevice: () => {
    common.navigateTo('Devices')
    
    cy.get('.pf-v6-c-table__tbody > .pf-v6-c-table__tr > .pf-v6-c-table__check > label > input').should('be.visible')
    cy.get('.pf-v6-c-table__tbody > .pf-v6-c-table__tr > .pf-v6-c-table__check > label > input').click()
    cy.get('#devices-toolbar > :nth-child(1) > .pf-v6-c-toolbar__content-section > :nth-child(3) > .pf-v6-c-button').should('be.visible')
    cy.get('#devices-toolbar > :nth-child(1) > .pf-v6-c-toolbar__content-section > :nth-child(3) > .pf-v6-c-button').click()
    cy.get('.pf-m-danger').should('be.visible')
    cy.get('.pf-m-danger').click()
    cy.get('.pf-v6-c-table__thead > .pf-v6-c-table__tr > .pf-v6-c-table__check > label > input').should('be.visible')
    cy.get('.pf-v6-c-table__thead > .pf-v6-c-table__tr > .pf-v6-c-table__check > label > input').click()
    cy.get('.pf-v6-c-toolbar__group > :nth-child(3) > .pf-v6-c-button').should('be.visible')
    cy.get('.pf-v6-c-toolbar__group > :nth-child(3) > .pf-v6-c-button').click()
    cy.get('.pf-m-danger').should('be.visible')
    cy.get('.pf-m-danger').click()
    cy.get('.pf-v6-c-switch__toggle').should('be.visible')
    cy.get('.pf-v6-c-switch__toggle').click()
  },

  /**
   * Open terminal on a device
   */
  openTerminal: (deviceName = 'test-device') => {
    common.navigateTo('Devices')
    
    cy.get('a > .fctl-resource-link__text').contains(deviceName).should('be.visible')
    cy.get('a > .fctl-resource-link__text').click()
    cy.contains('Terminal').should('be.visible')
    cy.contains('Terminal').click()
    cy.get('.pf-v6-l-bullseye', { timeout: 50000 }).should('be.visible')
    cy.get('.pf-v6-l-bullseye').click()
  },
}
