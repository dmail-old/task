import Task from './lib/task.js';

export function suite(add){
	add('task chaining complete propagation', function(test){
		var taskA = new Task(), taskB = new Task();

		taskA.chain(taskB);
		taskA.complete('foo');

		return test.resolveWith(taskB, 'foo');
	});

	add('task chaining pause/resume propagation', function(test){
		var taskA = new Task(), taskB = new Task();

		taskA.chain(taskB);
		taskA.pause();

		test.equal(taskB.isPaused, true);
		taskA.resume();
		test.equal(taskB.isPaused, false);
	});

	add('task insertion allow to return task to chain them', function(test){
		var task = Task.complete(Task.complete('foo'));

		test.equal(task.next != null, true);

		return test.resolveWith(task, 'foo');
	});

	add('basic task dependency', function(test){
		return test.resolveWith(Task.complete(10).then(function(a){
			return a + 20;
		}), 30);
	});

	add('complete to a thenable', function(test){
		return test.resolveWith(Task.complete(Promise.resolve('foo')), 'foo');
	});

	add('recover failed task',  function(test){
		return test.resolveWith(Task.fail('foo').catch(function(error){
			return error;
		}), 'foo');
	});

	add('fail by consumer', function(test){
		return test.resolveWith(Task.complete('foo').then(function(){
			return Task.fail('bar');
		}).catch(function(error){
			return error;
		}), 'bar');
	});

	add('cancel prevent completion', function(test){
		return test.willTimeout(new Task().cancel().complete('foo'));
	});

	add('pause prevent completion & resume restore state', function(test){
		var task = new Task();

		task.pause();
		task.complete('foo');
		setTimeout(function(){ task.resume(); }, 100);

		return test.resolveIn(task, 100);
	});

	add('consumer cancellation', function(test){
		return test.willTimeout(Task.complete('foo').then(function(){
			return new Task().cancel();
		}));
	});

	add('cancel propagate cancellation to consumer for then & join', function(test){
		var task = new Task().cancel();

		return Promise.all([
			test.willTimeout(task.then()),
			test.willTimeout(task.fork())
		]);
	});

	add('pause/resume works', function(test){
		var task = Task.complete().pause();

		setTimeout(function(){
			task.resume();
		}, 100);

		return test.resolveIn(task.then(), 100);
	});

	add('delay', function(test){
		return test.resolveIn(Task.complete().delay(100), 100);
	});

	add('delay return value', function(test){
		return test.resolveWith(Task.complete('foo').delay(100), 'foo');
	});

	add('delay cancellation', function(test){
		return test.willTimeout(Task.complete().delay(10).cancel());
	});

	add('timeout', function(test){
		return test.rejectWith(Task.complete().delay(100).timeout(10), {code: 'TASK_TIMEOUT'});
	});
}

/*
exports['all'] = function(test, Task){
	var task = Task.all([new Task(), 1, 2]);

	task.tasks[0].complete(0);

	test.resolveTo(task.then(String), '0,1,2');
};

exports['all cancellation'] = function(test, Task){
	test.remainPending(Task.all([1, 2, 3]).cancel());
};

exports['all pausing / resuming'] = function(test, Task){
	var task = Task.all([new Task(), 1, 2]);

	task.pause();
	setTimeout(function(){
		task.resume();
	}, 100);
	task.tasks[0].complete('ok');

	test.resolveIn(task, 100);
};

exports['all fail by consumer'] = function(test, Task){
	var all = Task.all([new Task(), 2, 3]);
	var tasks = all.tasks;

	tasks[0].fail('foo');

	test.resolveTo(all.catch(function(value){ return value; }), 'foo');
};

exports['all cancel by consumer'] = function(test, Task){
	var all = Task.all([new Task(), 2, 3]);
	var tasks = all.tasks;

	tasks[0].cancel();
	all.complete('foo');

	test.remainPending(all);
};
*/

/*
Task.complete(10).then(function(){
	return Task.map([0,1], function(value){
		return Task.complete(value);
	});
}).then(console.log);
*/

/*
Task.complete(['foo', 'bar', 'bat', 'man']).then(function(values){
	return Task.map(values, function(value, index){
		return value;
	}).then(function(values){
		console.log('alltask task is over', values);
		return values;
	});
});
*/

/*
var piped = Task.pipe([
	function secondA(value){
		return value + 'a';
	},
	function secondB(value){
		return value + 'b';
	}
], null, 'foo');

console.log(piped);

piped.then(function third(value){
	console.log('done with', value);
});
*/

/*
var task = new Task('paused');

task.pause();
task.complete('foo');
setTimeout(function(){ task.resume(); }, 1000);
task.then(console.log);

node C:\Node\nodesite\node_modules\task
*/