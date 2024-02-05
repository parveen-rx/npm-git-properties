const assert = require('assert');
const git = require('../index');

const customPropMap = new Map();
const userName = "App User";
const userEmail = "appuser@app.com";

customPropMap.set("git.build.user.name", userName);
customPropMap.set("git.build.user.email", userEmail);

let result;

// Test currentBranch
result = git.currentBranch();
assert.equal(!!result.length, true, 'currentBranch() returns a string with non-zero length');

// Test buildHost
result = git.buildHost();
assert.equal(!!result.length, true, 'buildHost() returns a string with non-zero length');

// Test buildVersion
result = git.buildVersion();
assert.equal(!!result.length, true, 'buildVersion() returns a string with non-zero length');

// Test commitIdAbbrev
result = git.commitIdAbbrev();
assert.equal(result.length >= 7, true, 'commitIdAbbrev() returns string of length 7 chars');

// Test commitIdFull
result = git.commitIdFull();
assert.equal(result.length === 40, true, 'commitIdFull() returns string of length 40 chars');

// Test lastCommitMsg
result = git.lastCommitMsg();
assert.equal(!!result.length, true, 'lastCommitMsg() returns a string with non-zero length');

// Test commitUserInfo
result = git.commitUserInfo();
assert.equal(!!result.length, true, 'commitUserInfo() returns a string with non-zero length');

// Test dateOfLastCommit
result = git.dateOfLastCommit();
assert.equal(result.constructor === String && !!result.length, true, 'dateOfLastCommit() returns a date');

// Test isDirty
result = git.isDirty();
assert.equal(result.constructor === Boolean, true, 'isDirty() returns a boolean value');

// Test remoteUrl
result = git.remoteUrl();
assert.equal(result.indexOf("https://github.com") > -1 || result.indexOf("git@github.com") > -1, true, "remoteUrl() returns expected remote URL value");

// Test commitIdDescAndTags
result = git.commitIdDescAndTags();
assert.equal(!!result.length, true, 'commitIdDescAndTags(flagDirty: true) returns a string with non-zero length');

// Test closestTagCommitCount
result = git.closestTagCommitCount();
assert.equal(result.constructor === String && !!result.length, true, 'closestTagCommitCount() returns an error description');

// Test countOfAllCommits
result = git.countOfAllCommits();
assert.notEqual(result, 0, 'countOfAllCommits() returns a non-zero number');
assert.equal(Math.abs(result), result, 'countOfAllCommits() returns a positive number');

// Test gitInfoAsJson
result = git.gitInfoAsJson(new Map(), true);
assert.equal(result.constructor === Object, true, 'gitInfoAsJson returns an object');

result = git.gitInfoAsJson();
assert.equal(result.constructor === String && JSON.parse(result).constructor === Object, true, 'gitInfoAsJson returns a stringify JSON Object');

result = git.gitInfoAsJson(customPropMap, true);
assert.equal(result["git"]["build"]["user"]["name"] === userName && result["git"]["build"]["user"]["email"] === userEmail, true, 'gitInfoAsJson overrides result with custom property map');

console.log('All test cases passed...');
