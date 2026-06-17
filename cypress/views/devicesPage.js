import { common } from './common'

/** Default table row index for flows that assume a single primary device row */
const ROW_0 = 0

/** Alias validation: red error icon color when invalid */
const VALIDATION_ERROR_ICON_COLOR = '#b1380b'

/** Event message substrings for deviceEvents(): Warning filter vs All types */
const DEVICE_EVENTS_WARNING_ONLY = ['Device update failed']
const DEVICE_EVENTS_NORMAL = [
  'Device returned to being up-to-date',
  'Device is updating',
  'Device was created successfully',
]

/** Events list body on device details — Events tab */
const EVENTS_CONTAINER = '[data-testid="device-events-list"]'

/** RichValidationTextField validation button for approve modal alias */
const DEVICE_ALIAS_VALIDATION_BTN = '[data-testid="rich-validation-field-deviceAlias-validation-button"]'

/** Devices scale demo: label applied by devicesimulator (`--label fleet=scale-fleet-00`) */
export const SCALE_FLEET_LABEL_TEXT = 'fleet=scale-fleet-00'

/** Fleet resource name matched by the scale-demo label selector */
export const SCALE_FLEET_NAME = 'scale-fleet-00'

/** First simulator device when `--initial-device-index=0` (second device: device-00001) */
export const SCALE_DEMO_DEVICE_NAME = 'device-00001'

/**
 * Fleet device-selector labels (Fleet details → Device selector). Removing this label on a device
 * disconnects it from that fleet; re-adding re-attaches.
 */
export const SIMULATOR_DISK_MONITORING_SELECTOR_LABEL = 'created_by=device-simulator'

const FLEET_DEVICE_SELECTOR_LABELS = {
  [SCALE_FLEET_NAME]: SCALE_FLEET_LABEL_TEXT,
  'simulator-disk-monitoring': SIMULATOR_DISK_MONITORING_SELECTOR_LABEL,
}

/** Real `<input>` inside PatternFly TextInputGroup (`#typeahead-select-input` is the wrapper div). */
const FLEET_LABEL_TYPEAHEAD_INPUT = '#typeahead-select-input input'

/**
 * Syslog priority levels mapped to their UI dropdown labels.
 * Ordered by severity (highest first) — used for priority inclusivity tests:
 * filtering at index N should show markers for all priorities 0..N.
 */
export const LOG_PRIORITIES = [
  { key: 'emerg',   level: 'Only emergency' },
  { key: 'alert',   level: 'Alert and above' },
  { key: 'crit',    level: 'Critical and above' },
  { key: 'err',     level: 'Error and above' },
  { key: 'warning', level: 'Warning and above' },
  { key: 'notice',  level: 'Notice and above' },
  { key: 'info',    level: 'Info and above' },
  { key: 'debug',   level: 'Debug and above' },
]

const LOGS_TAB = '[data-testid="device-details-tab-logs"]'
const LOG_VIEWER = '.pf-v6-c-log-viewer'
const LOG_VIEWER_LINE = '.pf-v6-c-log-viewer__list-item'
const LOG_SEARCH_INPUT = 'input[placeholder="Search logs"]'
const LOG_FILE_PATH_INPUT = 'input[name="logFilePath"]'
const LOG_CATEGORY_TOGGLE = /^(Agent|System|File path)$/
const LOG_TIME_RANGE_TOGGLE = /^(All time|Last 1 hour|Last 24 hours|Last 7 days|Current boot|Previous boot|Custom range)$/
const LOG_LEVEL_TOGGLE = /All levels|and above|Only emergency/
const LOG_RETRIEVE_TIMEOUT = 60000

const enrolledDeviceRows = () =>
  cy.get('[data-testid="enrolled-devices-table"] tbody tr[data-testid^="enrolled-device-row-"]')

/**
 * Closest ancestor of the enrolled table that also contains this list’s pagination (sibling of the
 * table in the DOM). Safer than `#devices-toolbar`.parent() when the console wraps the toolbar.
 */
const enrolledDevicesListSection = () =>
  cy.get('[data-testid="enrolled-devices-table"]', { timeout: 60000 }).parents().filter((_, el) => {
    return Cypress.$(el).find('button[aria-label="Go to next page"]').length > 0
  }).first()

/** PatternFly disables pagination while `isUpdating`; wait for spinner to leave the devices paginator. */
const waitEnrolledPaginationIdle = () => {
  enrolledDevicesListSection()
    .find('.pf-v6-c-pagination')
    .first()
    .should(($p) => {
      expect($p.find('.pf-v6-c-spinner').length).to.eq(0)
    }, { timeout: 120000 })
}

const enrolledDeviceNameLinkSelector = (deviceRef) =>
  `[data-testid="device-name-link-${deviceRef}"], [data-testid="device-internal-name-link-${deviceRef}"]`

/**
 * Open device details from the enrolled table; paginate when sort order leaves the device off page 1.
 */
const clickEnrolledDeviceNameLinkAcrossPages = (deviceRef, pagesLeft = 8) => {
  const linkSel = enrolledDeviceNameLinkSelector(deviceRef)
  cy.get('[data-testid="enrolled-devices-table"]', { timeout: 120000 }).should('exist')
  cy.get('[data-testid="enrolled-devices-table"]').then(($table) => {
    const $link = $table.find(linkSel).filter(':visible').first()
    if ($link.length) {
      cy.wrap($link).scrollIntoView().click({ force: true })
      return
    }
    if (pagesLeft <= 0) {
      throw new Error(
        `Device "${deviceRef}" not found in enrolled devices table (checked all pages).`,
      )
    }
    enrolledDevicesListSection().within(() => {
      cy.get('button[aria-label="Go to next page"]')
        .first()
        .then(($next) => {
          if ($next.is(':disabled')) {
            throw new Error(
              `Device "${deviceRef}" not found in enrolled devices table (no more pages).`,
            )
          }
          cy.wrap($next).scrollIntoView().click({ force: true })
        })
    })
    waitEnrolledPaginationIdle()
    clickEnrolledDeviceNameLinkAcrossPages(deviceRef, pagesLeft - 1)
  })
}

/**
 * DevicesPage object for device management operations.
 * Prefer data-testid selectors from flightctl-ui for stability.
 */
export const devicesPage = {
  openApproveDeviceModal: () => {
    common.navigateTo('Devices')
    cy.get('[data-testid="list-page-title"]').contains('Devices pending approval')
    cy.get(`[data-testid="enrollment-request-approve-button-${ROW_0}"]`).should('exist')
    cy.get(`[data-testid="enrollment-request-approve-button-${ROW_0}"]`).should('be.visible')
    cy.get(`[data-testid="enrollment-request-approve-button-${ROW_0}"]`).click()
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('be.visible')
  },

  fillAliasInApproveModal: (alias) => {
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').clear()
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').type(alias)
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('have.value', alias)
  },

  expectValidationIconError: () => {
    cy.get(DEVICE_ALIAS_VALIDATION_BTN).should('be.visible')
    cy.get(DEVICE_ALIAS_VALIDATION_BTN).find('svg').should('have.attr', 'color', VALIDATION_ERROR_ICON_COLOR)
  },

  closeApproveDeviceModal: () => {
    cy.get('[data-testid="approve-device-form-cancel"]').click()
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('not.exist')
  },

  approveDevice: (deviceName = 'test-device') => {
    common.navigateTo('Devices')

    cy.get('[data-testid="list-page-title"]').contains('Devices pending approval')
    cy.get(`[data-testid="enrollment-request-approve-button-${ROW_0}"]`).should('exist')
    cy.get(`[data-testid="enrollment-request-approve-button-${ROW_0}"]`).should('be.visible')
    cy.get(`[data-testid="enrollment-request-approve-button-${ROW_0}"]`).click()
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('be.visible')
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').clear()
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').type(deviceName)
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('have.value', deviceName)
    cy.get('[data-testid="approve-device-form-submit"]').should('be.visible')
    cy.get('[data-testid="approve-device-form-submit"]').click()
    cy.get(`[data-testid="enrolled-device-row-${ROW_0}"]`, { timeout: 500000 }).should('contain', 'Online')
  },

  deviceEvents: (deviceName = 'test-device') => {
    common.navigateTo('Devices')
    cy.wait(1000)
    cy.contains(`[data-testid^="device-name-link-"]`, deviceName).should('be.visible').click()
    cy.wait(1000)
    cy.get('[data-testid="device-details-tab-events"]').should('be.visible').click()
    cy.wait(1000)
    cy.get('[data-testid="events-type-filter-toggle"]').contains('Warning')
    DEVICE_EVENTS_NORMAL.forEach((msg) => {
      cy.get(EVENTS_CONTAINER).should('not.contain', msg)
    })
    DEVICE_EVENTS_WARNING_ONLY.forEach((msg) => {
      cy.get(EVENTS_CONTAINER).should('contain', msg)
    })
    cy.get('[data-testid="events-type-filter-toggle"]').click()
    cy.wait(500)
    cy.get('[data-testid="events-filter-option-normal"]').click()
    DEVICE_EVENTS_NORMAL.forEach((msg) => {
      cy.get(EVENTS_CONTAINER).should('contain', msg)
    })
    DEVICE_EVENTS_WARNING_ONLY.forEach((msg) => {
      cy.get(EVENTS_CONTAINER).should('not.contain', msg)
    })
    cy.get('[data-testid="events-type-filter-toggle"]').click()
    cy.wait(500)
    cy.get('[data-testid="events-filter-option-all-types"]').click()
    const allTypesExpected = [...DEVICE_EVENTS_NORMAL, ...DEVICE_EVENTS_WARNING_ONLY]
    allTypesExpected.forEach((msg) => {
      cy.get(EVENTS_CONTAINER).should('contain', msg)
    })
  },

  editDevice: (image, currentName = 'test-device', newName = 'test-device-edited') => {
    common.navigateTo('Devices')

    cy.contains(`[data-testid^="device-name-link-"]`, currentName).should('be.visible')
    cy.contains(`[data-testid^="device-name-link-"]`, currentName)
      .closest('tr')
      .find(`[data-testid^="device-row-actions-"] .pf-v6-c-menu-toggle`)
      .click()
    cy.wait(1000)
    cy.contains('Edit device configurations').click()
    cy.wait(1000)
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('be.visible')
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').should('have.value', currentName)
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').clear()
    cy.get('[data-testid="rich-validation-field-deviceAlias"]').type(newName)
    cy.get('[data-testid="wizard-next-button"]').click()
    cy.get('[data-testid="textfield-osImage"]').should('be.visible')
    cy.get('[data-testid="textfield-osImage"]').clear()
    cy.get('[data-testid="textfield-osImage"]').type(image)
    cy.get('[data-testid="textfield-osImage"]').should('have.value', image)
    cy.get('[data-testid="wizard-next-button"]').click()
    cy.get('[data-testid="wizard-next-button"]').click()
    cy.get('[data-testid="wizard-save-button"]').click()
    cy.get('[data-testid="device-details-title"]', { timeout: 50000 }).should('contain', newName)
  },

  checkDeviceOutOfDate: (deviceName = 'test-device-edited2') => {
    common.navigateTo('Devices')
    cy.contains(`[data-testid^="device-name-link-"]`, deviceName).should('be.visible')

    const intervalMs = 5000
    const totalMs = 120000
    const maxAttempts = Math.floor(totalMs / intervalMs) + 1

    const pollForOutOfDate = (attempt) => {
      if (attempt > 0) {
        cy.wait(intervalMs)
      }
      cy.get('[data-testid="enrolled-devices-table"]').then(($table) => {
        const found = Cypress.$.makeArray($table.find('[data-testid^="device-update-status-"]')).some((el) =>
          el.textContent.includes('Out-of-date'),
        )
        if (found) {
          cy.get('[data-testid="enrolled-devices-table"]')
            .find('[data-testid^="device-update-status-"]')
            .contains('Out-of-date')
            .should('be.visible')
        } else if (attempt + 1 < maxAttempts) {
          pollForOutOfDate(attempt + 1)
        } else {
          throw new Error(
            `Update status did not contain "Out-of-date" within ${totalMs / 1000}s (checked every ${intervalMs / 1000}s)`,
          )
        }
      })
    }
    pollForOutOfDate(0)
  },

  decommissionDevice: () => {
    common.navigateTo('Devices')

    cy.get(`[data-testid="enrolled-device-row-${ROW_0}"]`).find('input[type="checkbox"]').should('be.visible')
    cy.get(`[data-testid="enrolled-device-row-${ROW_0}"]`).find('input[type="checkbox"]').click()
    cy.get('[data-testid="toolbar-decommission-devices"]').should('be.visible')
    cy.get('[data-testid="toolbar-decommission-devices"]').click()
    cy.get('[data-testid="modal-decommission-confirm"]').should('be.visible')
    cy.get('[data-testid="modal-decommission-confirm"]').click()
    cy.get('[data-testid="toolbar-delete-forever"]').should('be.visible')
    cy.get('table thead input[type="checkbox"]').should('be.visible')
    cy.get('table thead input[type="checkbox"]').click()
    cy.get('[data-testid="toolbar-delete-forever"]').should('be.visible')
    cy.get('[data-testid="toolbar-delete-forever"]').click()
    cy.get('[data-testid="modal-delete-devices-confirm"]').should('be.visible')
    cy.get('[data-testid="modal-delete-devices-confirm"]').click()
    cy.get('[data-testid="show-decommissioned-devices-switch"]').closest('label').should('be.visible')
    cy.get('[data-testid="show-decommissioned-devices-switch"]').closest('label').click()
  },

  openTerminal: (deviceName = 'test-device') => {
    common.navigateTo('Devices')

    cy.contains(`[data-testid^="device-name-link-"]`, deviceName).should('be.visible')
    cy.contains(`[data-testid^="device-name-link-"]`, deviceName).click()
    cy.get('[data-testid="device-details-tab-terminal"]', { timeout: 30000 }).should('be.visible').click()
    cy.get('[data-testid="device-terminal-panel"]', { timeout: 50000 }).should('be.visible')
    cy.get('[data-testid="device-terminal-panel"]').click()
  },

  openDeviceLogs: (deviceName) => {
    common.navigateTo('Devices')
    if (deviceName) {
      cy.contains(`[data-testid^="device-name-link-"]`, deviceName, { timeout: 15000 })
        .should('be.visible').click()
    } else {
      cy.get(`[data-testid^="device-name-link-"]`, { timeout: 15000 })
        .first().should('be.visible').click()
    }
    cy.get(LOGS_TAB, { timeout: 15000 }).should('be.visible').click()
    cy.contains('button', 'Retrieve logs', { timeout: 15000 }).should('be.visible')
  },

  retrieveLogsAndVerify: () => {
    cy.contains('button', 'Retrieve logs', { timeout: 15000 })
      .should('be.visible')
      .should('not.be.disabled')
      .click()
    cy.get(LOG_VIEWER, { timeout: LOG_RETRIEVE_TIMEOUT }).should('be.visible')
    cy.get(LOG_VIEWER_LINE, { timeout: LOG_RETRIEVE_TIMEOUT })
      .should('have.length.greaterThan', 0)
  },

  selectLogCategory: (category) => {
    cy.contains('button', LOG_CATEGORY_TOGGLE, { timeout: 15000 })
      .should('be.visible').click()
    cy.get('[role="option"]').contains(category).click()
  },

  selectLogTimeRange: (label) => {
    cy.contains('button', LOG_TIME_RANGE_TOGGLE, { timeout: 15000 })
      .should('be.visible').click()
    cy.get('[role="option"]').contains(label).click()
  },

  selectLogLevel: (label) => {
    cy.contains('button', LOG_LEVEL_TOGGLE, { timeout: 15000 })
      .should('be.visible').click()
    cy.get('[role="option"]').contains(label).click()
  },

  searchLogsFor: (text) => {
    cy.get(LOG_SEARCH_INPUT, { timeout: 10000 }).clear().type(text)
    cy.contains(/[1-9]\d*\s*\/\s*[1-9]\d*/, { timeout: 10000 }).should('be.visible')
  },

  /** Leave decommissioned list and show enrolled devices (same switch data-testid on both tables). */
  ensureEnrolledDevicesView: () => {
    cy.get('body').then(($body) => {
      const onDecommissioned = $body.find('[data-testid="show-decommissioned-devices-switch"][aria-checked="true"]')
        .length
      if (onDecommissioned) {
        cy.get('[data-testid="show-decommissioned-devices-switch"]')
          .filter('[aria-checked="true"]')
          .closest('label')
          .click()
      }
    })
    cy.get('[data-testid="enrolled-devices-table"]', { timeout: 60000 }).should('exist')
  },

  /**
   * Filter enrolled devices by label using the “Labels and fleets” typeahead (must match CLI selector).
   */
  filterByFleetScaleLabel: () => {
    common.navigateTo('Devices')
    devicesPage.ensureEnrolledDevicesView()
    // Toolbar can sit in overflow:auto regions in ACM/console — avoid visibility flake; interact with force after scroll.
    cy.get('#devices-toolbar', { timeout: 30000 }).scrollIntoView()
    cy.get(FLEET_LABEL_TYPEAHEAD_INPUT, { timeout: 30000 }).should('exist').scrollIntoView({ block: 'center' })
    cy.get(FLEET_LABEL_TYPEAHEAD_INPUT).clear({ force: true })
    cy.get(FLEET_LABEL_TYPEAHEAD_INPUT).type(SCALE_FLEET_LABEL_TEXT, { force: true })
    // Label options use `hasCheckbox` in the UI → PatternFly uses role="menuitem", not role="option".
    cy.wait(1200)
    // Match can resolve to more than one node (e.g. hidden + visible popper, or label + row). Click one.
    cy.contains('[role="menuitem"], [role="option"]', SCALE_FLEET_LABEL_TEXT, { timeout: 120000 })
      .filter(':visible')
      .first()
      .click({ force: true })
    // Close the typeahead panel with Escape — more reliable than clicking the page title which can
    // be clipped by an overflow:hidden ancestor in PF6 layouts.
    cy.get(FLEET_LABEL_TYPEAHEAD_INPUT).type('{esc}', { force: true })
    cy.get('[data-testid="enrolled-devices-table"]', { timeout: 120000 }).should('exist')
    enrolledDeviceRows().should('have.length.at.least', 1)
  },

  expectEnrolledDeviceRowsCount: (expected) => {
    enrolledDeviceRows().should('have.length', expected)
  },

  /** “Devices” table pagination only (scoped to enrolled list; waits out API refresh disabling controls). */
  clickEnrolledDevicesNextPage: () => {
    cy.get('[data-testid="enrolled-devices-table"]', { timeout: 60000 }).should('exist')
    cy.get('[data-testid="enrolled-devices-table"]').scrollIntoView({ block: 'start' })
    enrolledDeviceRows().should('have.length.at.least', 1)
    enrolledDeviceRows().last().scrollIntoView({ block: 'end' })
    waitEnrolledPaginationIdle()
    enrolledDevicesListSection().within(() => {
      cy.get('button[aria-label="Go to next page"]', { timeout: 120000 })
        .first()
        .scrollIntoView({ block: 'center', inline: 'center' })
        .should('not.be.disabled')
        .click({ force: true })
    })
  },

  /**
   * Return to page 1 of the enrolled-devices paginator. Compact PatternFly often omits “Go to first page”,
   * so we click “Go to previous page” until it is disabled (same device-table paginator index as next/previous).
   */
  goToFirstEnrolledDevicesPage: () => {
    cy.get('[data-testid="enrolled-devices-table"]', { timeout: 60000 }).should('exist')
    cy.get('[data-testid="enrolled-devices-table"]').scrollIntoView({ block: 'start' })
    enrolledDeviceRows().last().scrollIntoView({ block: 'end' })
    waitEnrolledPaginationIdle()
    cy.wrap(Array.from({ length: 12 })).each(() => {
      waitEnrolledPaginationIdle()
      enrolledDevicesListSection().within(() => {
        cy.get('button[aria-label="Go to previous page"]', { timeout: 120000 })
          .first()
          .then(($prev) => {
            if (!$prev.is(':disabled')) {
              cy.wrap($prev).scrollIntoView({ block: 'center' }).click({ force: true })
            }
          })
      })
    })
    waitEnrolledPaginationIdle()
    enrolledDevicesListSection().within(() => {
      cy.get('button[aria-label="Go to previous page"]', { timeout: 120000 })
        .first()
        .should('be.disabled')
    })
  },

  goToEnrolledDevicesPageFromFirst: (pageNum) => {
    devicesPage.goToFirstEnrolledDevicesPage()
    for (let p = 1; p < pageNum; p++) {
      devicesPage.clickEnrolledDevicesNextPage()
    }
  },

  decommissionDeviceAtEnrolledRow: (rowIndex = 0) => {
    cy.get(`[data-testid="enrolled-device-row-${rowIndex}"]`)
      .find(`[data-testid^="device-row-actions-"] .pf-v6-c-menu-toggle`)
      .click()
    cy.contains('[role="menuitem"]', 'Decommission device').click()
    cy.get('.pf-v6-c-modal-box').within(() => {
      cy.contains('button.pf-m-danger', 'Decommission device').click()
    })
    cy.get('[data-testid="decommissioned-devices-table"]', { timeout: 120000 }).should('exist')
  },

  /**
   * Open scale-demo device details from the enrolled list (Devices page only).
   * Filters by scale fleet label, resets to page 1, then paginates until the Name link is found.
   */
  openDeviceDetailsFromList: (deviceRef = SCALE_DEMO_DEVICE_NAME) => {
    common.navigateTo('Devices')
    devicesPage.ensureEnrolledDevicesView()
    devicesPage.filterByFleetScaleLabel()
    devicesPage.goToFirstEnrolledDevicesPage()
    clickEnrolledDeviceNameLinkAcrossPages(deviceRef)
    cy.get('[data-testid="device-details-title"]', { timeout: 120000 }).should('be.visible')
    cy.get('[data-testid="device-details-tab-details"]').should('be.visible')
  },

  /**
   * Remove the fleet’s device-selector label (see FLEET_DEVICE_SELECTOR_LABELS), verify disconnect,
   * re-add the same label, verify the device is on the same fleet again.
   * Opens the first enrolled device on page 1 of the scale-fleet filtered list rather than a
   * hardcoded alias — avoids failures when the target device was decommissioned by a prior test.
   */
  runFleetLabelDetachReattachTest: () => {
    common.navigateTo('Devices')
    devicesPage.ensureEnrolledDevicesView()
    devicesPage.filterByFleetScaleLabel()
    devicesPage.goToFirstEnrolledDevicesPage()
    cy.get('[data-testid="enrolled-devices-table"] [data-testid^="device-name-link-"]', {
      timeout: 30000,
    })
      .first()
      .scrollIntoView()
      .click({ force: true })
    cy.get('[data-testid="device-details-title"]', { timeout: 120000 }).should('be.visible')
    cy.get('[data-testid="device-details-tab-details"]').should('be.visible')
    cy.contains('.fctl-device-details-tab__label', 'Fleet name', { timeout: 60000 })
      .closest('.pf-v6-l-stack')
      .find('.fctl-resource-link__text', { timeout: 60000 })
      .invoke('text')
      .as('expectedFleetName')
    cy.contains('.fctl-device-details-tab__label', 'Fleet name')
      .closest('.pf-v6-l-stack')
      .should('not.contain', 'None')

    cy.get('@expectedFleetName').then((fleetName) => {
      const fleet = String(fleetName).trim()
      const bindingLabel =
        FLEET_DEVICE_SELECTOR_LABELS[fleet] || `fleet=${fleet}`
      cy.get('body').then(($body) => {
        const hasBindingLabel = [...$body.find('.pf-v6-c-label')].some((el) => {
          const text = (el.textContent || '').trim().replace(/:/g, '=')
          return text.includes(bindingLabel)
        })
        if (!hasBindingLabel) {
          throw new Error(
            `Device selector label "${bindingLabel}" not found on device (fleet: ${fleet}). ` +
              'Check Fleet details → Device selector matches a label on this device.',
          )
        }
        cy.wrap({ bindingLabel, fleet }).as('fleetLabelTest')
      })
    })

    cy.get('@fleetLabelTest').then(({ bindingLabel, fleet }) => {
      cy.contains('.pf-v6-c-label', bindingLabel).should('exist')
      devicesPage.removeFleetLabelOnDeviceDetails(bindingLabel)
      devicesPage.expectDeviceDetailsFleetDisconnected()
      devicesPage.addFleetLabelOnDeviceDetails(bindingLabel)
      devicesPage.expectDeviceDetailsFleetConnected(fleet)
    })
  },

  expectDeviceDetailsFleetConnected: (fleetName = SCALE_FLEET_NAME) => {
    cy.contains('.fctl-device-details-tab__label', 'Fleet name', { timeout: 120000 })
      .closest('.pf-v6-l-stack')
      .should('contain', fleetName)
  },

  expectDeviceDetailsFleetDisconnected: () => {
    cy.contains('.fctl-device-details-tab__label', 'Fleet name', { timeout: 120000 })
      .closest('.pf-v6-l-stack')
      .should('contain', 'None')
  },

  removeFleetLabelOnDeviceDetails: (labelText = SCALE_FLEET_LABEL_TEXT) => {
    cy.contains('.pf-v6-c-label', labelText)
      .find(`button[aria-label="Close ${labelText}"]`)
      .click()
  },

  addFleetLabelOnDeviceDetails: (labelText = SCALE_FLEET_LABEL_TEXT) => {
    cy.contains('button', 'Add label').click()
    cy.get('input[aria-label="New label"]').clear().type(`${labelText}{enter}`)
  },
}
