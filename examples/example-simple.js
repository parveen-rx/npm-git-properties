'use strict';

const gitUtil = require('../index');

console.log('gitUtil.shortHash() => ' + gitUtil.shortHash());
// e.g. 75bf4ee

console.log('gitUtil.fullHash() => ' + gitUtil.fullHash());
// e.g. 75bf4eea9aa1a7fd6505d0d0aa43105feafa92ef

console.log('gitUtil.currentBranch() => ' + gitUtil.currentBranch());
// e.g. master