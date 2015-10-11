import proto from './util/proto.js';

import Task from './task.js';

function createDelayedClone(ms){
	var task = this;
	var adoptStateOfTask = false;
	var delayedTask = new Task({
		delay: ms,
		name: task.name + ':delay(' + ms + ')',
		// the state of a delayed task isn't set until ms are ellapsed
		adoptState: function(task){			
			adoptStateOfTask = task;
		}
	});

	setTimeout(function(){
		delayedTask.adoptState = delayedTask.constructor.prototype.adoptState;
		if( adoptStateOfTask ){
			delayedTask.adoptState(adoptStateOfTask);
		}
	}, ms);

	task.chain(delayedTask);

	return delayedTask;
}

export default createDelayedClone;