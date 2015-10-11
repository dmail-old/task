// The `all` function accepts an array of tasks, or values that can be coerced
// into tasks, and produces a task that when completed will produce an array of
// the individual completion values.

import proto from './util/proto.js';
import Task from './task.js';
import TaskList from './task-list.js';

var AllTask = proto.extend.call(TaskList, {
	name: 'all',

	onEmpty: function(){
		this.complete(this.tasks); // completes to an empty array
	},

	onTaskCancellation: function(task){
		this.debug('all cancelled by individual cancellation');

		this.cancelOtherTasks(task);
		this.cancel();
	},

	onTaskCompletion: function(task){
		//this.debug('all progression');

		this.progress(task);
		this.pendingCount--;

		if( this.pendingCount === 0 ){
			this.complete(this.tasks.map(function(task){
				return task.value;
			}));
		}
	},

	onTaskFailure: function(task){
		this.debug('all failed by individual failure');

		this.failOtherTasks(task);
		this.fail(task.value);
	}
});

function all(iterable){
	return AllTask.create(iterable);
}

export default all;