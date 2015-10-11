import Task from '../index.js';

export function suite(add){
	add('delay', function(test){
		var task = new Task('initial').complete();
		var delayedTask = task.delay(100);

		return test.resolveIn(delayedTask, 100);
	});

	add('delay return value', function(test){
		return test.resolveWith(Task.complete('foo').delay(100), 'foo');
	});

	add('delay cancellation', function(test){
		return test.willTimeout(Task.complete().delay(10).cancel());
	});
}