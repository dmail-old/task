
// The `any` method accepts an array of tasks, or value coercable to tasks, and
// returns a task that will receive the value from the first task that
// completes with a value.
// After one succeeds, all remaining tasks will be cancelled.
// If one of the tasks fails, it will be ignored.
// If all tasks fail, this task will fail with the last error.

import proto from './util/proto.js';
import Task from './task.js';
import TaskList from './task-list.js';

var AnyTask = proto.extend.call(TaskList, {
	onEmpty: function(){
		// nothing, task remains pending
	},

	onTaskCancellation: function(task){
		this.pendingCount--;
		if( this.pendingCount === 0 ){
			this.complete(); // no task completed or failed
		}
	},

	onTaskCompletion: function(task){
		this.complete(task.value);
		this.cancelOtherTasks(task);
	},

	onTaskFailure: function(task){
		this.pendingCount--;
		if( this.pendingCount === 0 ){
			this.fail(task.value);
		}
	}
});

function any(iterable){
	return AnyTask.create(iterable);
}

export default any;