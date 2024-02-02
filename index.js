'use strict';

const childProcessLib = require('child_process');
const escapeStringRegexpLib = import('escape-string-regexp');
const gracefulFsLib = require('graceful-fs');
const pathLib = require('path'); /*useful to detect path separator for a platform*/
const shellLib = require('shelljs');

const hasNativeExecSync = childProcessLib.hasOwnProperty('spawnSync');
const pathSeparator = pathLib.sep;
const refBranch = /^ref: refs\/heads\/(.*)\n/;
const currentRepoName = 'NPM-GIT-PROPERTIES';
const detachedAtHeadPrefix = 'Detached At Head: ';

const _exeCmd = (cmd, args) => {
    let result;
    if (hasNativeExecSync) {
        result = childProcessLib.spawnSync(cmd, args);
    } else {
        result = shellLib.exec(`${cmd} ${args.join(' ')}`, { silent: true });
    }
    if (result.status !== 0) {
        const errorDetails = result.stderr || result.stdout;
        const errorMessage = `${currentRepoName} has failed to execute command: ${errorDetails}`;
        throw new Error(errorMessage);
    }
    return result.stdout.toString('utf8').trim();
};

const _getGitDir = (dirPath) => {
    if (dirPath === undefined || dirPath === null) {
        dirPath = module.parent.filename;
    }
    if (typeof dirPath === 'string') {
        dirPath = dirPath.split(pathSeparator);
    }
    const gitRepoPath = dirPath.join(pathSeparator);
    let testPath = gitRepoPath;
    if (!testPath.length) {
        //if current repo is not a git directory, then throw error
        throw new Error('Current directory is not a git repository');
    }
    testPath = pathLib.resolve(testPath, '.git');
    if (gracefulFsLib.existsSync(testPath)) {
        if (!gracefulFsLib.statSync(testPath).isDirectory()) {
            let parentRepoPath = gracefulFsLib.readFileSync(testPath, 'utf8').trim().split(' ').pop();
            if (!pathLib.isAbsolute(parentRepoPath)) {
                parentRepoPath = pathLib.resolve(gitRepoPath, parentRepoPath);
            }
            if (gracefulFsLib.existsSync(parentRepoPath)) {
                return pathLib.resolve(parentRepoPath);
            }
            throw new Error(currentRepoName + ' could not find repository from path ' + parentRepoPath);
        }
        return testPath;
    }
    //try with parent path unless found or throw an error
    dirPath.pop();
    return _getGitDir(dirPath);
};

const currentBranch = (dir) => {
    const gitDir = _getGitDir(dir);
    const head = gracefulFsLib.readFileSync(pathLib.resolve(gitDir, 'HEAD'), 'utf8');
    const b = head.match(refBranch);
    if (b) {
        return b[1];
    } else {
        return detachedAtHeadPrefix + head.trim();
    }
};

const shortHash = (dir, size) => {
    return fullHash(dir).substr(0, size || 7);
};

const fullHash = (dir) => {
    const currBranch = currentBranch(dir);
    if (currBranch.startsWith(detachedAtHeadPrefix)) {
        return currBranch.substr(detachedAtHeadPrefix.length);
    }
    const gitDir = _getGitDir(dir);
    const gitRootDir = gitDir.indexOf('.git/worktrees/') > 0 ?
        gitDir.replace(/\.git\/worktrees\/.+$/, '.git') :
        gitDir;
    const refsFilePath = pathLib.resolve(gitRootDir, 'refs', 'heads', currBranch);
    let ref;
    if (gracefulFsLib.existsSync(refsFilePath)) {
        ref = gracefulFsLib.readFileSync(refsFilePath, 'utf8');
    } else {
        const refToCheck = ['refs', 'heads', currBranch].join('/');
        const pkgFileContents = gracefulFsLib.readFileSync(pathLib.resolve(gitDir, 'packed-refs'), 'utf8');
        const pkgFileRegex = new RegExp('(.*) ' + escapeStringRegexpLib(refToCheck));
        ref = pkgFileRegex.exec(pkgFileContents)[1];
    }
    return ref.trim();
};

const lastGitMsg = () => {
  return _exeCmd('git', ['log', '-1', '--pretty=%B']);
};

const gitTag = (flagDirty) => {
    if (flagDirty) {
        return _exeCmd('git', ['describe', '--always', '--tag', '--dirty', '--abbrev=0']);
    }
    return _exeCmd('git', ['describe', '--always', '--tag', '--abbrev=0']);
};

const countOfAllCommits = () => {
    return parseInt(_exeCmd('git', ['rev-list', '--all', '--count']), 10);
};

const dateOfLastCommit = () => {
    return new Date(_exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:"%ad"']));
};

const hasUnStagedChanges = () => {
    const writeTree = _exeCmd('git', ['write-tree']);
    return _exeCmd('git', ['diff-index', writeTree, '--']).length > 0;
};

const isDirty = () => {
    return _exeCmd('git', ['diff-index', 'HEAD', '--']).length > 0;
};

const isTagDirty = () => {
    try {
        _exeCmd('git', ['describe', '--exact-match', '--tags']);
    } catch (e) {
        if (e.message.indexOf('no tag exactly matches')) {
            return true;
        }
        throw e;
    }
    return false;
};

const remoteUrl = () => {
    return _exeCmd('git', ['ls-remote', '--get-url']);
};

const tagFirstParent = (flagDirty) => {
    if (flagDirty) {
        return _exeCmd('git', ['describe', '--always', '--tag', '--dirty', '--abbrev=0', '--first-parent']);
    }
    return _exeCmd('git', ['describe', '--always', '--tag', '--abbrev=0', '--first-parent']);
};

const fullGitInfoAsJson = (appParams) => {
    const buildDetails = {
        "build" : {
            "host": "host-name",/*update this dynamically*/
            "version": "app-version",/*update this dynamically from main app*/
            "user" :{
                "name": "ps",/*update this dynamically*/
                "email": "ps@gmail.com"/*update this dynamically*/
            }
        },
        "branch": currentBranch()
    };
    const commitDetails = {
        "commit" : {
            "message": {
                "short": "short commit message",
                "full": "full commit message"
            },
            "id": "commit-id",
            "id.abbrev": "commit-id-abbrev",
            "id.describe": "commit-id-describe",
            "time": "commit time",
            "user": {
                "name": "ps",
                "email": "ps@gmail.com"
            }
        }
    };
    const closestDetails = {
        "closest": {
            "tag": {
                "name": "closest name",
                "commit": {
                    "count": "integer count"
                }
            }
        }
    };
    const miscDetails = {
        "dirty": "isDirtyCheckFn",
        "remote": {
            "origin": {
                "url": "main app git repo link"
            }
        },
        "tags": "",
        "total": {
            "commit": {
                "count": "integer count"
            }
        }
    };
    let fullGitInfo = Object.assign(buildDetails, commitDetails); //merge git build and commit details
    fullGitInfo = Object.assign(fullGitInfo, closestDetails);   //append git closest details
    fullGitInfo = Object.assign(fullGitInfo, miscDetails);      //append git misc. details
    if(appParams){
        return Object.assign(appParams, fullGitInfo);
    } else {
        return {"git": fullGitInfo};
    }
};

module.exports = {
    currentBranch : currentBranch,
    shortHash: shortHash,
    fullHash: fullHash,
    lastGitMsg: lastGitMsg,
    gitTag: gitTag,
    countOfAllCommits: countOfAllCommits,
    dateOfLastCommit: dateOfLastCommit,
    hasUnStagedChanges: hasUnStagedChanges,
    isDirty: isDirty,
    isTagDirty: isTagDirty,
    remoteUrl: remoteUrl,
    tagFirstParent: tagFirstParent,
    fullGitInfoAsJson: fullGitInfoAsJson
};