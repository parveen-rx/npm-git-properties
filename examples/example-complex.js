'use strict';

const gitUtil = require('../index');
const otherDir = '';

console.log('gitUtil.shortHash() => ' + gitUtil.shortHash());
console.log('gitUtil.fullHash() => ' + gitUtil.fullHash());
console.log('gitUtil.currentBranch() => ' + gitUtil.currentBranch());
console.log('gitUtil.lastGitMsg() => ' + gitUtil.lastGitMsg());
console.log('gitUtil.gitTag() => ' + gitUtil.gitTag());
console.log('gitUtil.gitTag(true) => ' + gitUtil.gitTag(true));
console.log('gitUtil.countOfAllCommits() => ' + gitUtil.countOfAllCommits());

if (otherDir) {
    console.log('gitUtil.shortHash(' + otherDir + ') => ' + gitUtil.shortHash(otherDir));
    console.log('gitUtil.fullHash(' + otherDir + ') => ' + gitUtil.fullHash(otherDir));
    console.log('gitUtil.currentBranch(' + otherDir + ') => ' + gitUtil.currentBranch(otherDir));
}