const assert = require('assert');
const git = require('../index');

let result;

result = git.shortHash();
assert.equal(result.length > 3, true, 'short() returns string of length 4+');

result = git.shortHash(null, 8);
assert.equal(result.length === 8, true, 'short() returns string of length 4+');

result = git.fullHash();
assert.equal(result.length > 38, true, 'long() returns string of length 39+');

result = git.currentBranch();
assert.equal(!!result.length, true, 'currentBranch() returns a string with non-zero length');

result = git.countOfAllCommits();
assert.notEqual(result, 0, 'countOfAllCommits() returns a non-zero number');
assert.equal(Math.abs(result), result, 'countOfAllCommits() returns a positive number');

result = git.dateOfLastCommit();
assert.equal(result instanceof Date, true, 'dateOfLastCommit() returns a date');

result = git.isDirty();
assert.equal(typeof result, 'boolean', 'isDirty() returns a boolean');

result = git.isTagDirty();
assert.equal(typeof result, 'boolean', 'isTagDirty() returns a boolean');

result = git.lastGitMsg();
assert.equal(!!result.length, true, 'lastGitMsg() returns a string with non-zero length');

result = git.commitIdDescAndTags();
assert.equal(!!result.length, true, 'commitIdDescAndTags() returns a string with non-zero length');

result = git.tagFirstParent();
assert.equal(result.length !== 0, true, 'tagFirstParent() returns a string with non-zero length');

result = git.remoteUrl();
assert.equal(result.indexOf("https://github.com") === 0 || result.indexOf("git@github.com") === 0, true, "remoteUrl() returns unexpected value: '" + result + "'");

console.log('All test cases passed');