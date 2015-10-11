import Task from '../index.js';

export function suite(add){
	add('task chaining complete propagation', function(test){
		var taskA = new Task(), taskB = new Task();

		taskA.chain(taskB);
		taskA.complete('foo');

		return test.resolveWith(taskB, 'foo');
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

	add('task chaining pause/resume propagation', function(test){
		var taskA = new Task('A'), taskB = new Task('B');

		taskA.chain(taskB);
		taskA.pause();

		test.equal(taskB.isPaused, true);
		taskA.resume();
		test.equal(taskB.isPaused, false);
	});
	
	add('lazy insertion', function(test){
		var firstTask = new Task('first').complete('foo');
		var secondTask = new Task('second').complete(firstTask);

		test.equal(firstTask.isBefore(secondTask), true);
		test.equal(secondTask.isAfter(firstTask), true);

		return test.resolveWith(secondTask, 'foo');
	});	

	add('fail by consumer', function(test){
		var fooTask = new Task('foo').complete('foo');
		var barTask = new Task('bar').fail('bar');
		var task = fooTask.then(function(){
			return barTask;
		});

		return test.rejectWith(task, 'bar');
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
		var task = new Task();

		task.pause();
		task.complete();

		setTimeout(function(){
			task.resume();
		}, 100);

		return test.resolveIn(task, 100);
	});
}

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