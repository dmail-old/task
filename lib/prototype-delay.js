import Task from './task.js';

// returns a task not doing anything until a certain amount of ms
function delay(ms){
	var task = this.then();

	var timer = setTimeout(function(){
		task.become = Task.prototype.become;
		task.become(this);
	}.bind(this), ms);

	task.become = function(){

	};

	// clean timer
	task.clean = function(){
		clearTimeout(timer);
		return this.constructor.prototype.clean.call(this);
	};

	return task;
}

export default delay;