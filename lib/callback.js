import Task from './task.js';

function callback(fn, bind){
	var task = new Task(fn.name);

	fn.call(bind, function(error, result){
		if( error ) task.fail(error);
		else task.complete(result);
	});

	return task;
}

export default callback;