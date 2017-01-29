var callback;
var fs;
var when;
var parallel;

function isOverflowError(error) {
    return error.code === 'EMFILE';
}
function isBusyError(error) {
    return error.code === 'EBUSY';
}
function isPermissionError(error) {
    return error.code === 'EPERM' && process.platform === 'win32';
}
function isMissingError(error) {
    return error.code === 'ENOENT';
}
function isFolderError(error) {
    return error.code === 'EISDIR';
}
function isNotFolderError(error) {
    return error.code === 'ENOTDIR';
}
function hasRessourceError(error) {
    return error.code === 'ENOTEMPTY' || error.code === 'EEXIST' || error.code === 'EPERM';
}
function isConflictError(error) {
    return error.code === 'EEXIST';
}

function failsByOverflow(job) {
    return job.hasFailedWith(isOverflowError);
}
function failsByBusy(job) {
    return job.hasFailedWith(isBusyError);
}
function failsByPermission(job) {
    return job.hasFailedWith(isPermissionError);
}
function failsByFolder(job) {
    return job.hasFailedWith(isFolderError);
}
function failsByFile(job) {
    return job.hasFailedWith(isNotFolderError);
}
function failsByContent(job) {
    return job.hasFailedWith(hasRessourceError);
}
function failsByMissing(job) {
    return job.hasFailedWith(isMissingError);
}
function failsByConflict(job) {
    return job.hasFailedWith(isConflictError);
}

function wait(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

function writeFile(path, content) {
    return callback(fs.write, path, content);
}
when(writeFile, failsByOverflow, {max: 3}).retryAfter(wait(100));
when(writeFile, failsByBusy, {max: 1000}).retryAfter(1);
when(writeFile, failsByPermission).retryAfter(giveAllPermission);
when(writeFile, failsByFolder).retryAfter(removeFolderForFile);

function giveAllPermission(path) {
    // idéalement faudrais que giveAllPermission ce soit temporaire
    // autrement dit qu'on remette aux permission avant le writeFile mais bon
    // ça je vois pas comment faire ou alors si il suffirais qu'il ait une méthode cancel
    // et que ce soit un retryAfterOnce qui a pour effet d'apeller cancel après que retry échoue/réussisse
    return chmod(path, 666);
}

function chmod(path, mode) {
    return callback(fs.chmod, path, mode);
}

function removeFolderForFile(path) {
    return removeFolder(path);
}
when(removeFolderForFile, failsByFile).recover();

function removeFolder(path) {
    return callback(fs.rmdir, fs, path);
}
when(removeFolder, failsByOverflow, {max: 3}).retry();
when(removeFolder, failsByBusy, {max: 1000}).retry();
when(removeFolder, failsByMissing).recover();
when(removeFolder, failsByContent).retryAfter(drainFolder);

function drainFolder(path) {
    return parallel(listFolderRessources(path), function(name) {
        // idélement il faudrais pas faire removeRessource()
        // parce que ça retourne le résultat direct
        // ou alors que l'ap soit capable de détecter ça et de récup la task correspondante et pas le résultat
        return removeRessource(path + '/' + name);
    });
}

function listFolderRessources(path) {
    return callback(fs.readdir, path);
}

function removeRessource(path) {
    return removeFile(path);
}
when(removeRessource, failsByContent).retryAfter(removeFolder);

function removeFile(path) {
    return callback(fs.unlink, fs, path);
}
when(removeFile, failsByOverflow, {max: 3}).retry();
when(removeFile, failsByBusy, {max: 1000}).retry();
when(removeFile, failsByMissing).recover();

function createFolder(path) {
    return callback(fs.mkdir, fs, path);
}
when(createFolder, failsByOverflow, {max: 3}).retryAfter(100);
when(createFolder, failsByBusy, {max: 1000}).retryAfter(1);
when(createFolder, failsByPermission).retryAfter(giveAllPermission);
when(createFolder, failsByConflict).retryAfter(removeFileForFolder);

function removeFileForFolder(path) {
    return removeFile(path);
}
when(removeFileForFolder, failsByFolder).recover();
