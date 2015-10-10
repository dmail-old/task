import Task from './task.js';
import pipe from './reduce;js';
import call from './call.js';
import mapIterable from './utils/iterable-map.js';

function mapReduce(iterable, fn, bind, initialValue){

	// a refaire en regardant bien le fonctionnement de reduce
	iterable = mapIterable(iterable, function(value, index, iterable){
		return call(fn, bind, value);
	}, bind);

	return pipe(iterable, initialValue);
}

export default mapReduce;