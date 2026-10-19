#!/usr/bin/env node
/**
 * AuraTrack — Admin Provisioning & Credential Reset CLI Utility
 */
module.exports = require('../create_admin');
if (require.main === module) {
  require('../create_admin');
}
