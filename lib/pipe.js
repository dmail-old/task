import Task from './task.js';

function pipe(iterable, bind, initialValue){
	var task = Task.complete(initialValue);
	task.name = 'initial';

	for(var fn of iterable){
		task = task.then(fn, null, bind);
	}

	return task;
}

export default pipe;