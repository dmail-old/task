import Task from './task.js';
import all from './all.js';
import call from './call.js';
import mapIterable from './utils/iterable-map.js';

function map(iterable, fn, bind){
	iterable = mapIterable(iterable, function(value, index, iterable){
		return Task.call(fn, bind, value);
	}, bind);

	return Task.all(iterable);
}

Task.prototype.map = function(fn, bind){
	return this.then(function(value){
		return map(value, fn, bind);
	});
};

export default map;