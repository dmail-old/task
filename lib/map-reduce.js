import Task from './task.js';
import reduce from './reduce;js';
import call from './call.js';
import mapIterable from './utils/iterable-map.js';

function mapReduce(iterable, fn, bind, initialValue){

	// a refaire en regardant bien le fonctionnement de reduce
	iterable = mapIterable(iterable, function(value, index, iterable){
		return Task.call(fn, bind, value);
	}, bind);

	return Task.reduce(iterable, initialValue);
}

export default mapReduce;