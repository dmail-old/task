import Task from './task.js';

function spread(onCompletion, onFailure, bind){
	var speadCompletion, spreadFailure;

	if( onCompletion ){
		speadCompletion = function(value){
			onCompletion.apply(this, value);
		};
	}
	if( onFailure ){
		spreadFailure = function(value){
			onFailure.apply(this, value);
		};
	}

	return this.then(speadCompletion, spreadFailure, bind);
}

export default spread;