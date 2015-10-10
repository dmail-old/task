import Task from '../index.js';

export function suite(add){
	add('all', function(test){
		var task = Task.all([new Task(), 1, 2]);

		task.tasks[0].complete(0);

		return test.resolveWith(task.then(String), '0,1,2');
	});

	add('all cancellation', function(test){
		return test.willTimeout(Task.all([1, 2, 3]).cancel());
	});

	add('all pausing / resuming', function(test){
		var task = Task.all([new Task(), 1, 2]);

		task.pause();
		setTimeout(function(){
			task.resume();
		}, 100);
		task.tasks[0].complete('ok');

		return test.resolveIn(task, 100);
	});

	add('all fail by consumer', function(test){
		var all = Task.all([new Task(), 2, 3]);
		var tasks = all.tasks;

		tasks[0].fail('foo');

		return test.rejectWith(all, 'foo');
	});

	add('all cancel by consumer', function(test){
		var all = Task.all([new Task(), 2, 3]);
		var tasks = all.tasks;

		tasks[0].cancel();
		all.complete('foo');

		return test.willTimeout(all);
	});
}