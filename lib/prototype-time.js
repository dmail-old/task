// measure task duration

import Task from './task.js';

function time(ms){
	if( !this.startDate ){
		this.startDate = new Date();
	}

	var clean = this.clean;
	this.clean = function(){
		this.endDate  = new Date();
		return clean.call(this);
	};

	Object.defineProperty(this, 'duration', {
		get: function(){
			return this.endDate ? this.endDate - this.startDate : undefined;
		}
	});

	return this;
}

export default time;