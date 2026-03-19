const { defineConfig } = require('cypress')
const {downloadFile} = require('cypress-downloadfile/lib/addPlugin')

module.exports = defineConfig({
  video: true,
  videoCompression: false,
  // Cypress default is 1000x660 when not set. Override for a larger test viewport:
  viewportWidth: parseInt(process.env.CYPRESS_VIEWPORT_WIDTH, 10) || 1280,
  viewportHeight: parseInt(process.env.CYPRESS_VIEWPORT_HEIGHT, 10) || 720,
  e2e: {
    // Same idea as kni-assisted-installer-auto/ui_tests: keep URL, cookies, and SPA state
    // between `it` blocks instead of resetting the browser each time.
    // Use before() + cy.ensureLoggedIn() once per top-level describe (not beforeEach).
    testIsolation: false,
    setupNodeEvents(on, config) {
      on('task', {downloadFile})
    },
    supportFile: 'support/e2e.js',
    specPattern: 'e2e/*.cy.{js,jsx,ts,tsx}'
  },
  env: {
    host: process.env.OPENSHIFT_HOST || 'https://console-openshift-console.apps.ocp-edge-cluster-0.qe.lab.redhat.com',
    auth: process.env.OPENSHIFT_AUTH || 'https://oauth-openshift.apps.ocp-edge-cluster-0.qe.lab.redhat.com',
    username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
    password: process.env.OPENSHIFT_PASSWORD || 'kubeadmin',
    image: process.env.QUAY_IMAGE || 'quay.io/sdelacru/flightctl-centos:v1',
    fleetname: process.env.FLEETNAME || 'test-fleet',
    newimage: process.env.NEWIMAGE || 'quay.io/sdelacru/flightctl-centos:v2',
    repository: process.env.REPOSITORY || 'https://github.com/flightctl/flightctl-demos',
    revision: process.env.REVISION || 'main',
    yaml: process.env.YAML || '/demos/basic-nginx-demo/deployment/fleet.yaml',
    newyaml: process.env.NEWYAML || '/demos/quadlet-wordpress-demo/deployment/fleet.yaml',
    repositoryname: process.env.REPOSITORYNAME || 'test-repository',
    resourcename: process.env.RESOURCENAME || 'base/fedora-bootc/deploy/fleet.yaml',
    useAcmNavigation: process.env.CYPRESS_USE_ACM_NAVIGATION !== 'false',
  },
})