import proto from './utils/proto.js';

import Task from './task.js';
import complete from './complete.js';

var TaskList = proto.extend.call(Task, {
	name: 'task-list',

	constructor: function(iterable){
		TaskList.super.constructor.call(this, this.name);

		if( iterable ){
			this.pendingCount = 0;
			this.tasks = [];

			for(var task of iterable ){
				this.add(task);
			}

			if( this.tasks.length === 0 ){
				this.onEmpty();
			}
		}
		else{
			console.warn('TaskList called without argument, strange');
		}
	},

	createTask: function(){
		return new Task(); // else Task.all().then create a TaskList
	},

	onEmpty: function(){
		throw new Error('unimplemented empty task hook');
	},

	onTaskCancellation: function(task){
		throw new Error('unimplemented task cancellation hook');
	},

	onTaskCompletion: function(task){
		throw new Error('unimplemented task completion hook');
	},

	onTaskFailure: function(task){
		throw new Error('unimplemented task failure hook');
	},

	onTaskProgression: function(task, ancestorTask){
		this.progress(ancestorTask);
	},

	cancelOtherTasks: function(task){
		this.tasks.forEach(function(otherTask){
			if( otherTask != task ) otherTask.cancel();
		});
	},

	failOtherTasks: function(task){
		this.tasks.forEach(function(otherTask){
			if( otherTask != task ) otherTask.fail(task.value);
		});
	},

	add: function(task){
		task = Task.complete(task); // cast value to a task
		this.pendingCount++;
		this.tasks.push(task);

		task.listen('cancel', this.onTaskCancellation, this);
		task.listen('complete', this.onTaskCompletion, this);
		task.listen('failure', this.onTaskFailure, this);
		task.listen('progress', this.onTaskProgression, this);

		return this;
	}
});

export default TaskList;