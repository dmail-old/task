import Task from '../index.js';

/*
export function suite(add){
	add('delay', function(test){
		return test.resolveIn(Task.complete().delay(100), 100);
	});

	add('delay return value', function(test){
		return test.resolveWith(Task.complete('foo').delay(100), 'foo');
	});

	add('delay cancellation', function(test){
		return test.willTimeout(Task.complete().delay(10).cancel());
	});
}
*/