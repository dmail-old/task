/*

bon, la progression maintenant!
faut ptet ajouter un event du genre 'start' lancé à la création d'une tâche

*/

import proto from './utils/proto.js';
import isThenable from './utils/thenable-is.js';
import callThenable from './utils/thenable-call.js';

// require('array/prototype/replace');

var Task = proto.extend({
	useDebug: false,
	state: 'pending', // 'pending', 'completed', 'failed'
	isPaused: false,
	isCancelled: false,
	isTransformed: false,

	previous: null,
	nextList: null,
	propagationDirection: 'both', // 'left', 'right', 'both', 'none'

	completionTransformer: null,
	failureTransformer: null,
	bind: null, // context of listeners
	listeners: null,
	listenerBind: null,

	constructor: function(name){
		this.state = 'pending';
		this.name = name;
		this.listeners = {};
	},

	toString: function(){
		return '[Task ' + this.name + ']';
	},

	debug: function(){
		if( this.useDebug ){
			console.log.apply(console, Array.prototype.map.call(arguments, String));
		}
	},

	listen: function(name, listener, bind){
		this.listeners[name] = listener;
		this.listenerBind = bind;
	},

	// called on completion/failure/cancellation
	clean: function(){
		this.debug('cleaning', this);

		// not needed anymore
		//this.previous = null;

		if( this.nextList ){
			this.nextList.forEach(function(next){
				next.become(this);
			}, this);
			//this.nextList = null;
		}

		// release pointers for garbage collect
		if( this.weak ){
			//this.completionTransformer = null;
			//this.failureTransformer = null;
			//this.bind = null;
		}
	},

	afterFailure: function(){
		this.notify('fail');
		this.clean();
	},

	afterCompletion: function(){
		this.notify('complete');
		this.progress(this);
		this.clean();
	},

	resolveCompletion: function(value){
		var isTask = Task.isPrototypeOf(value);

		if( isTask ){
			if( value === this ){
				this.fail(new TypeError('A task cannot be completed with itself'));
			}
			else{
				this.insert(value);
			}
		}
		else if( isThenable(value) ){
			callThenable(value, this.resolveCompletion.bind(this), this.fail.bind(this));
		}
		else{
			this.isBlocked = false;
			this.state = 'completed';
			this.value = value;

			if( this.isPaused === false ){
				this.afterCompletion();
			}
			else{
				this.debug('completion of', this, 'prevented by pause');
			}
		}
	},

	complete: function(value){
		if( this.state === 'pending' && !this.isCancelled && !this.isBlocked ){
			this.isBlocked = true;
			this.resolveCompletion(value);
		}

		return this;
	},

	fail: function(value){
		if( this.state === 'pending' && !this.isCancelled ){
			this.debug(this.name, 'failed');
			this.state = 'failed';
			this.value = value;

			if( this.isPaused === false ){
				this.afterFailure();
			}
		}

		return this;
	},

	progress: function(ancestorTask){
		// we could keep an array of completed ancestor tasks
		// and when a 'progress' listener is added we could fire the progress
		// but when would we clean this array?

		this.propagate('progress', 'right', ancestorTask);
	},

	notify: function(name, arg){
		if( name in this.listeners ){
			this.listeners[name].call(this.listenerBind, this, arg);
		}
	},

	propagate: function(method, direction, value){
		this.notify(method, value);

		direction = direction || this.propagationDirection;

		var left = false, right = false;
		if( direction === 'both' ) left = right = true;
		else if( direction === 'left' ) left = true;
		else if( direction === 'right' ) right = true;

		if( left && this.previous ){
			this.debug('propaging left', method, 'from', this, 'to', this.previous);
			this.previous[method](value);
		}
		if( right && this.nextList ){
			this.nextList.forEach(function(next){
				this.debug('propaging right', method, 'from', this, 'to', next);
				next[method](value);
			}, this);
		}
	},

	pause: function(){
		if( this.state === 'pending' && this.isPaused === false ){
			this.debug(this, 'paused');
			this.isPaused = true;
			this.propagate('pause');
		}

		return this;
	},

	resume: function(){
		if( this.isPaused === true ){
			this.debug(this, 'resumed');
			this.isPaused = false;
			this.propagate('resume');
			if( this.state === 'completed' ){
				this.debug(this, 'completed during pause');
				this.afterCompletion();
			}
			else if( this.state === 'failed' ){
				this.debug(this, 'failed during pause');
				this.afterFailure();
			}
		}

		return this;
	},

	cancel: function(){
		if( this.state === 'pending' && this.isCancelled === false ){
			this.debug(this.name, 'cancelled');
			this.isCancelled = true;
			this.propagate('cancel');
			this.clean();
		}

		return this;
	},

	adoptState: function(task){
		var value = task.value;
		var isCompleted = task.state === 'completed';

		// call the transformer once
		if( !this.isTransformed ){
			var transformerName = isCompleted ? 'completionTransformer' : 'failureTransformer';
			var transformer = this[transformerName];
			var ret, error;

			if( transformer ){
				this.isTransformed = true;

				try{
					this.debug(this, 'called with', value);
					ret = transformer.call(this.bind, value);
				}
				catch(e){
					error = e;
				}

				if( error ){
					isCompleted = false;
					value = error;
				}
				else{
					isCompleted = true;
					value = ret;
				}
			}
		}

		if( isCompleted ){
			this.debug(this, 'completed with', value);
			this.isBlocked = false;
			this.complete(value);
		}
		else{
			//unhandled à réfléchir
			//if( fn === null ){
			//	console.warn('unhandled task failure', value, Boolean(this.next));
			//}
			this.fail(value);
		}
	},

	become: function(task, immediatly){
		if( task.isCancelled ){
			this.debug(this, 'cancelled by', task);
			this.cancel();
		}
		// a task can be paused & completed at the same time (that's why resume call aftercompletion)
		else if( task.isPaused ){
			this.pause();

			this.debug(this, 'paused by', task);
			task.nextList = task.nextList || [];
			task.nextList.push(this);
		}
		else if( task.state === 'pending' ){
			this.debug(this, 'depends on', task);
			task.nextList = task.nextList || [];
			task.nextList.push(this);
		}
		else if( immediatly ){
			this.debug(this, 'adopt the state of', task);
			this.adoptState(task);
		}
		// set the task state asap, not immediatly
		else{
			setImmediate(function(){
				this.become(task, true);
			}.bind(this));
		}
	},

	isAfter: function(task){
		var nextList = task.nextList, i, j, next;

		if( nextList ){
			i = 0;
			j = nextList.length;
			for(;i<j;i++){
				next = nextList[i];
				if( next === this ) return true;
				if( this.isAfter(next) ) return true;
			}
		}
		return false;
	},

	isBefore: function(task){
		var previous = task.previous;

		while(previous){
			if( previous === this ) return true;
			previous = this.previous;
		}

		return false;
	},

	chain: function(task, detach){
		if( task.previous ){
			throw new Error('cannot chain task on '+ this +' : multiple dependency not supported and ' + task + ' already depends on ' + task.previous);
		}
		// task cannot be added to next tasks because this is after task
		if( this.isAfter(task) ){
			throw new Error('cannot chain task : it would create a circular dependency because ' + this + ' depends on ' + task);
		}

		task.previous = this;
		task.become(this);
		return task;
	},

	insert: function(otherTask){
		if( this.previous ){
			if( this.previous.nextList ){
				this.previous.nextList.replace(this, otherTask);
			}
			else{
				this.previous.nextList = [otherTask];
			}

			otherTask.previous = this.previous;
			this.previous = null;
		}

		return otherTask.chain(this);
	},

	createTask: function(){
		return new this.constructor();
	},

	createNextTask: function(completionTransformer, failureTransformer, bind){
		if( completionTransformer && typeof completionTransformer != 'function' ){
			throw new TypeError('completionTransformer must be a function ' + completionTransformer + ' given');
		}
		if( failureTransformer && typeof failureTransformer != 'function' ){
			throw new TypeError('failureTransformer must be a function ' + failureTransformer + ' given');
		}

		var task = this.createTask();

		task.name = completionTransformer ? completionTransformer.name : '';
		task.completionTransformer = completionTransformer;
		task.failureTransformer = failureTransformer;
		task.bind = bind;

		return task;
	},

	then: function(completionTransformer, failureTransformer, bind){
		var task = this.createNextTask(completionTransformer, failureTransformer, bind);
		this.chain(task);
		return task;
	},

	fork: function(completionTransformer, failureTransformer, bind){
		var task = this.createNextTask(completionTransformer, failureTransformer, bind);
		task.propagation = 'right';
		this.chain(task);
		return task;
	},

	catch: function(failureTransformer, bind){
		return this.then(null, failureTransformer, bind);
	}
});

Task = Task.constructor;


Task.complete = function complete(value){
	var task;

	if( value instanceof Task ){
		task = value;
	}
	else{
		task = new Task();
		task.complete(value);
	}

	return task;
};

Task.fail = function fail(value){
	var task = new Task();

	task.fail(value);
	
	return task;
};

export default Task;