import Task from './task.js';
import any from './any.js';
import call from './call.js';
import mapIterable from './utils/iterable-map.js';

function mapAny(iterable, fn, bind){
	iterable = mapIterable(iterable, function(value, index, iterable){
		return call(fn, bind, value);
	}, bind);

	return any(iterable);
}

export default mapAny;