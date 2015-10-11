// The `race` method accepts an array of tasks, or value coercable to tasks, and
// returns a task that will receive the value of the first task that
// either completes or fails.
// Afterward, all remaining tasks will be cancelled.

import proto from './util/proto.js';
import Task from './task.js';
import TaskList from './task-list.js';

var RaceTask = proto.extend.call(TaskList, {
	onEmpty: function(){
		// nothing, task remains pending
	},

	onTaskCancellation: function(task){
		this.pendingCount--;
		if( this.pendingCount === 0 ){
			this.cancel(); // no task completed or failed
		}
	},

	onTaskCompletion: function(task){
		this.complete(task.value);
		this.cancelOtherTasks(task);
	},

	onTaskFailure: function(task){
		this.fail(task.value);
		this.cancelOtherTasks(task);
	}
});

function race(iterable){
	return RaceTask.create(iterable);
}

export default race;