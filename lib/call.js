import Task from './task.js';

function createTaskFromFunctionCall(fn, bind){
	var ret, error;

	if( typeof fn != 'function' ){
		throw new TypeError('function expected ' + fn + ' given');
	}

	try{
		ret = fn.apply(bind, Array.prototype.slice.call(arguments, 2));
	}
	catch(e){
		error = e;
	}

	var task = new Task(fn.name);

	if( error ){
		task.fail(error);
	}
	else{
		task.complete(ret);
	}

	return task;
}

export default createTaskFromFunctionCall;