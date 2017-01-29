// https://github.com/rpominov/fun-task
// pl bah j'ai l'idée mais aussi la flemme d'aller plus loin

var Task = null;

function isOverflowError(error) {
    return error.code === 'EMFILE';
}

function writeFile(path, content) {
	return Task.create(function(complete) {
		complete(callback(fs.write, path, content));
	}).mapRejected(function(error) {
		if (isOverflowError(error)) {

		}
	});
}

// writeFile.run();
