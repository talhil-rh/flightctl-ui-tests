import { downloadsPage } from '../views/downloadsPage'
import { common } from '../views/common'


describe('Downloads Management', () => {
  before(() => {
    cy.ensureLoggedIn()
    common.selectOrganizationIfNeeded('Default')
  })

  it('Should show flightctl CLI and restore links for each platform and CPU architecture', () => {
    downloadsPage.openCommandLineTools()
    downloadsPage.expectArtifactLinksPresent('Windows', 'ARM 64')
    downloadsPage.expectArtifactLinksPresent('Windows', 'x86_64')
    downloadsPage.expectArtifactLinksPresent('Linux', 'ARM 64')
    downloadsPage.expectArtifactLinksPresent('Linux', 'x86_64')
    downloadsPage.expectArtifactLinksPresent('Mac', 'ARM 64')
    downloadsPage.expectArtifactLinksPresent('Mac', 'x86_64')
    downloadsPage.expectAllArtifactLinksDownloadable()
  })
})
