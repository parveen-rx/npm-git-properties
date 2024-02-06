'use strict';

const childProcessLib = require('child_process');
const gracefulFsLib = require('graceful-fs');
const pathLib = require('path');
const shellLib = require('shelljs');
const os = require('os');

const hasNativeExecSync = childProcessLib.hasOwnProperty('spawnSync');
const pathSeparator = pathLib.sep;
const refBranch = /^ref: refs\/heads\/(.*)\n/;
const currentRepoName = 'NPM-GIT-PROPERTIES';
const detachedAtHeadPrefix = 'Detached At Head: ';

const KEY_GIT_BRANCH = "git.branch";
const KEY_GIT_BUILD_HOST = "git.build.host";
const KEY_GIT_BUILD_VERSION = "git.build.version";
const KEY_GIT_BUILD_USER_NAME = "git.build.user.name";
const KEY_GIT_BUILD_USER_EMAIL = "git.build.user.email";
const KEY_GIT_COMMIT_ID_ABBREVIATED = "git.commit.id.abbrev";
const KEY_GIT_COMMIT_ID_DESCRIBE = "git.commit.id.describe";
const KEY_GIT_COMMIT_ID = "git.commit.id.full";
const KEY_GIT_COMMIT_SHORT_MESSAGE = "git.commit.message.short";
const KEY_GIT_COMMIT_FULL_MESSAGE = "git.commit.message.full";
const KEY_GIT_COMMIT_USER_NAME = "git.commit.user.name";
const KEY_GIT_COMMIT_USER_EMAIL = "git.commit.user.email";
const KEY_GIT_COMMIT_TIME = "git.commit.time";
const KEY_GIT_DIRTY = "git.dirty";
const KEY_GIT_REMOTE_ORIGIN_URL = "git.remote.origin.url";
const KEY_GIT_TAGS = "git.tags";
const KEY_GIT_CLOSEST_TAG_NAME = "git.closest.tag.name";
const KEY_GIT_CLOSEST_TAG_COMMIT_COUNT = "git.closest.tag.commit.count";
const KEY_GIT_TOTAL_COMMIT_COUNT = "git.total.commit.count";

const fileName = 'gitDetails.json';

const _exeCmd = (cmd, args) => {
    let result;
    if (hasNativeExecSync) {
        result = childProcessLib.spawnSync(cmd, args);
    } else {
        result = shellLib.exec(`${cmd} ${args.join(' ')}`, { silent: true });
    }
    if (result.status !== 0) {
        const errorDetails = result.stderr || result.stdout;
        return `${currentRepoName} has failed to execute command: ${errorDetails.toString("utf8").trim()}`;
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

const buildHost = () => {
    return os.hostname();
};

const buildVersion = () => {
    const packageJsonPath = pathLib.join(__dirname, 'package.json');
    try {
        const data = gracefulFsLib.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(data);
        return packageJson.version;
    } catch (error) {
        return currentRepoName + ' could not read or parse package.json and error is: ' + error;
    }
};

const buildUserName = () => {
    return currentRepoName + ' could not determine this property, please pass this info via custom property map with key ' + KEY_GIT_BUILD_USER_NAME;
};

const buildUserEmail = () => {
    return currentRepoName + ' could not determine this property, please pass this info via custom property map with key ' + KEY_GIT_BUILD_USER_EMAIL;
};

const commitIdAbbrev = () => {
    return _exeCmd('git', ['rev-parse', '--short', 'HEAD']);
};

const commitIdFull = () => {
    return _exeCmd('git', ['rev-parse', 'HEAD']);
};

const lastCommitMsg = (short) => {
    const prettyArg = short ? '--pretty=%s' : '--pretty=%B'
    return _exeCmd('git', ['log', '-1', prettyArg]);
};

const commitUserInfo = (email) => {
    const prettyArg = email ? '--pretty=format:%ae' : '--pretty=format:%an'
    return _exeCmd('git', ['log', '-1', prettyArg]);
};

const dateOfLastCommit = () => {
    return new Date(_exeCmd('git', ['log', '--no-color', '-n', '1', '--pretty=format:"%ad"'])).toString();
};

const isDirty = () => {
    return _exeCmd('git', ['diff-index', 'HEAD', '--']).length > 0;
};

const remoteUrl = () => {
    return _exeCmd('git', ['ls-remote', '--get-url']);
};

const commitIdDescAndTags = (flagDirty) => {
    const cmdArgs = flagDirty ? ['describe', '--tags'] : ['describe', '--tag', '--abbrev=0'];
    const cmdResult = _exeCmd('git', cmdArgs);
    return (!cmdResult.startsWith(currentRepoName) && flagDirty) ? cmdResult + "-dirty" : cmdResult;
};

const closestTagCommitCount = () => {
    const tagName = commitIdDescAndTags();
    if(tagName.startsWith(currentRepoName)){
        return tagName;
    }
    return _exeCmd('git', ['rev-list', '--count', tagName]);
};

const countOfAllCommits = () => {
    return parseInt(_exeCmd('git', ['rev-list', '--all', '--count']), 10);
};

const deepMerge = (target, ...sources) => {
    for (const source of sources) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] instanceof Object && target.hasOwnProperty(key) && target[key] instanceof Object) {
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
};

const prepareObject = (key, value) => {
    let jsonObject = {};
    const firstDotIndex = key.indexOf('.');
    if(firstDotIndex > -1){
        const firstKey = key.substr(0, firstDotIndex);
        const nestedKey = key.substr(firstDotIndex+1, key.length);
        jsonObject[firstKey] = prepareObject(nestedKey, value);
    } else {
        jsonObject[key] = value;
    }
    return jsonObject;
};

const castMapToNestedObject = (map) => {
    let jsonObject = {};
    map.forEach((value, key) => {
            const result = prepareObject(key, value);
            jsonObject = deepMerge({}, jsonObject, result);
        }
    );
    return jsonObject;
};

const getGitProp = (customGitProp) => {
    const gitPropMap = new Map();
    gitPropMap.set(KEY_GIT_BRANCH, currentBranch());
    gitPropMap.set(KEY_GIT_BUILD_HOST, buildHost());
    gitPropMap.set(KEY_GIT_BUILD_VERSION, buildVersion());
    gitPropMap.set(KEY_GIT_BUILD_USER_NAME, buildUserName());
    gitPropMap.set(KEY_GIT_BUILD_USER_EMAIL, buildUserEmail());
    gitPropMap.set(KEY_GIT_COMMIT_ID_ABBREVIATED, commitIdAbbrev());
    gitPropMap.set(KEY_GIT_COMMIT_ID_DESCRIBE, commitIdDescAndTags(true));
    gitPropMap.set(KEY_GIT_COMMIT_ID, commitIdFull());
    gitPropMap.set(KEY_GIT_COMMIT_SHORT_MESSAGE, lastCommitMsg(true));
    gitPropMap.set(KEY_GIT_COMMIT_FULL_MESSAGE, lastCommitMsg());
    gitPropMap.set(KEY_GIT_COMMIT_USER_NAME, commitUserInfo());
    gitPropMap.set(KEY_GIT_COMMIT_USER_EMAIL, commitUserInfo(true));
    gitPropMap.set(KEY_GIT_COMMIT_TIME, dateOfLastCommit());
    gitPropMap.set(KEY_GIT_DIRTY, isDirty());
    gitPropMap.set(KEY_GIT_REMOTE_ORIGIN_URL, remoteUrl());
    gitPropMap.set(KEY_GIT_TAGS, commitIdDescAndTags());
    gitPropMap.set(KEY_GIT_CLOSEST_TAG_NAME, commitIdDescAndTags());
    gitPropMap.set(KEY_GIT_CLOSEST_TAG_COMMIT_COUNT, closestTagCommitCount());
    gitPropMap.set(KEY_GIT_TOTAL_COMMIT_COUNT, countOfAllCommits());
    return customGitProp ? new Map([...gitPropMap, ...customGitProp]) : gitPropMap;
};

const gitInfoAsJson = (customGitPropMap, requireObject) => {
    const finalGitPropMap = getGitProp(customGitPropMap);
    const gitInfoObject = castMapToNestedObject(finalGitPropMap);
    return requireObject ? gitInfoObject : JSON.stringify(gitInfoObject, null, 2);
};

const createGitInfoFile = (customGitPropMap) => {
    const gitInfoJson = gitInfoAsJson(customGitPropMap);
    try {
        if(gracefulFsLib.existsSync(fileName)){
            gracefulFsLib.unlinkSync(fileName);
        }
        gracefulFsLib.writeFileSync(fileName, gitInfoJson);
        return true;
    } catch (error) {
        throw new Error(currentRepoName + " has failed to create "+ fileName + " due to " + error);
    }
}

module.exports = {
    currentBranch : currentBranch,
    buildHost: buildHost,
    buildVersion: buildVersion,
    commitIdAbbrev: commitIdAbbrev,
    commitIdFull: commitIdFull,
    lastCommitMsg: lastCommitMsg,
    commitUserInfo: commitUserInfo,
    dateOfLastCommit: dateOfLastCommit,
    isDirty: isDirty,
    remoteUrl: remoteUrl,
    commitIdDescAndTags: commitIdDescAndTags,
    closestTagCommitCount: closestTagCommitCount,
    countOfAllCommits: countOfAllCommits,
    gitInfoAsJson: gitInfoAsJson,
    createGitInfoFile: createGitInfoFile
};