import Task from './task.js';

// The `timeout` method will automatically fails a task if it takes longer than a given delay in miliseconds.
function timeout(ms){
	var timer = setTimeout(function(){
		var error = new Error('task too slow (more than '+ ms +' ms');
		error.code = 'TASK_TIMEOUT';

		this.fail(error);
	}.bind(this));

	// clean timer (wrap function in case task is a delayed task, see delay.js)
	var clean = this.clean;
	this.clean = function(){
		clearTimeout(timer);
		return clean.call(this);
	};

	return this;
}

export default timeout;