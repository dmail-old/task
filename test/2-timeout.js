import Task from '../index.js';

export function suite(add){
	add('timeout', function(test){
		var task = Task.complete();
		var delayedTask = task.delay(100);
		delayedTask.timeout(10);

		return test.rejectWith(delayedTask, {code: 'TASK_TIMEOUT'});
	});
}