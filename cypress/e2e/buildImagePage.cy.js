import { buildImagePage } from '../views/buildImagePage'

const BUILD_NAME        = Cypress.env('buildName') || 'new-build-flightctl'
const SOURCE_IMAGE_NAME = 'centos-bootc/centos-bootc'
const SOURCE_IMAGE_TAG  = 'stream10'
const OUTPUT_IMAGE_TAG  = '1.0.0'
const README_TEXT       = 'TestTest'

describe('Build Image Page', () => {
  before(() => {
    // The OpenShift/ACM console fires background unhandled promise rejections during
    // navigation (e.g. multicloud cluster API calls). Letting Cypress surface those as
    // test failures would abort the before-all hook and skip the entire suite.
    // Returning false tells Cypress not to fail on uncaught app-level exceptions.
    Cypress.on('uncaught:exception', () => false)
    cy.ensureLoggedIn()
  })

  afterEach(function () {
    if (this.currentTest.state === 'failed') {
      Cypress.runner.stop()
    }
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Pre-requisite: Create OCI repository used across all wizard steps
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Create OCI Repository (pre-requisite)', () => {
    it('Should navigate to Repositories', () => {
      buildImagePage.navigateToRepositories()
    })

    it('Should open the Create Repository form', () => {
      buildImagePage.openCreateRepositoryForm()
    })

    it('Should type the repository name', () => {
      buildImagePage.typeRepositoryName(Cypress.env('flightctlRepoWithWriteName'))
    })

    it('Should switch to "Use OCI registry" (resets the hostname field)', () => {
      buildImagePage.selectOciRegistryType()
    })

    it('Should select "Read and write" access mode', () => {
      buildImagePage.selectReadAndWriteAccessMode()
    })

    it('Should type the registry hostname', () => {
      buildImagePage.typeRegistryHostname(Cypress.env('flightctlRepoWithWriteHostName'))
    })

    it('Should enable "Use advanced configurations"', () => {
      buildImagePage.enableAdvancedConfigurations()
    })

    it('Should check "Basic authentication"', () => {
      buildImagePage.enableBasicAuthentication()
    })

    it('Should fill in username', () => {
      buildImagePage.typeUsername(Cypress.env('flightctlRepoWithWriteUsername'))
    })

    it('Should fill in password', () => {
      buildImagePage.typePassword(Cypress.env('flightctlRepoWithWritePassword'))
    })

    it('Should submit the repository and wait for Accessible status', () => {
      buildImagePage.submitRepositoryAndWaitForAccessible()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Wizard Step 1 — Base image
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Build New Image — Step 1: Base image', () => {
    it('Should navigate to Image builds', () => {
      buildImagePage.navigateToImageBuilds()
    })

    it('Should click "Build new image"', () => {
      buildImagePage.clickBuildNewImage()
    })

    it('Should type the build name', () => {
      buildImagePage.typeBuildName(BUILD_NAME)
    })

    it('Should select the source repository created in the pre-requisite step', () => {
      buildImagePage.selectSourceRepository(Cypress.env('flightctlRepoWithWriteName'))
    })

    it('Should type the image name', () => {
      buildImagePage.typeSourceImageName(SOURCE_IMAGE_NAME)
    })

    it('Should type the image tag', () => {
      buildImagePage.typeSourceImageTag(SOURCE_IMAGE_TAG)
    })

    it('Should wait for "Accessible" status on the Image reference URL', () => {
      buildImagePage.waitForImageAccessible()
    })

    it('Should click Next to proceed to Image output', () => {
      buildImagePage.clickNext()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Wizard Step 2 — Image output
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Build New Image — Step 2: Image output', () => {
    it('Should select the target repository (same as the one created in pre-requisite)', () => {
      buildImagePage.selectTargetRepository(Cypress.env('flightctlRepoWithWriteName'))
    })

    it('Should clear and type the image name from env', () => {
      buildImagePage.typeOutputImageName(Cypress.env('flightctlRepoWithWritePath'))
    })

    it('Should clear and type the image tag', () => {
      buildImagePage.typeOutputImageTag(OUTPUT_IMAGE_TAG)
    })

    it('Should click Next to proceed to Registration', () => {
      buildImagePage.clickNext()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Wizard Step 3 — Registration
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Build New Image — Step 3: Registration', () => {
    it('Should leave all registration defaults and click Next', () => {
      buildImagePage.clickNext()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Wizard Step 4 — Software Catalog
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Build New Image — Step 4: Software Catalog', () => {
    it('Should verify "Add to the software catalog testing channel upon successful build" is checked by default', () => {
      buildImagePage.verifySoftwareCatalogCheckboxChecked()
    })

    it('Should type the image promotion name (build name + "-build" suffix)', () => {
      buildImagePage.typeImagePromotionName(`${BUILD_NAME}-build`)
    })

    it('Should open the Catalog dropdown and select "Default"', () => {
      buildImagePage.selectDefaultCatalog()
    })

    it('Should select "New catalog item"', () => {
      buildImagePage.selectNewCatalogItem()
    })

    it('Should type the catalog item name (build name + "-cin" suffix)', () => {
      buildImagePage.typeCatalogItemName(`${BUILD_NAME}-cin`)
    })

    it('Should type the version', () => {
      buildImagePage.typeVersion(OUTPUT_IMAGE_TAG)
    })

    it('Should type the readme text', () => {
      buildImagePage.typeReadme(README_TEXT)
    })

    it('Should click Next to proceed to Review', () => {
      buildImagePage.clickNext()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Wizard Step 5 — Review
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Build New Image — Step 5: Review', () => {
    it('Should click "Build image" to submit', () => {
      buildImagePage.clickBuildImage()
    })
  })

  // ══════════════════════════════════════════════════════════════════════════════
  // Post-build: wait for the build to complete and be published to Software Catalog
  // ══════════════════════════════════════════════════════════════════════════════
  describe('Image build completion', () => {
    it('Should wait for Build status to be "Complete"', () => {
      buildImagePage.waitForBuildStatusComplete(BUILD_NAME)
    })

    it('Should wait for Promotion status to be "Completed"', () => {
      buildImagePage.waitForPromotionStatusCompleted(BUILD_NAME)
    })
  })
})
