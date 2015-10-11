/*

bon, la progression maintenant!
faut ptet ajouter un event du genre 'start' lancé à la création d'une tâche

*/

import proto from './utils/proto.js';
import isThenable from './utils/thenable-is.js';
import callThenable from './utils/thenable-call.js';
import './utils/array-replace.js';

var Task = proto.extend({
	useDebug: false,
	state: 'pending', // 'pending', 'completed', 'failed'
	isPaused: false,
	isCancelled: false,
	isTransformed: false,
	isBlocked: false,

	previous: null,
	nextList: null,
	propagationDirection: 'both', // 'left', 'right', 'both', 'none'

	completionTransformer: null,
	failureTransformer: null,
	abort: null,
	bind: null, // context of listeners
	listeners: null,
	listenerBind: null,

	constructor(name){
		this.state = 'pending';
		this.name = name;
		this.listeners = {};
	},

	toString(){
		return '[Task ' + this.name + ']';
	},

	debug(){
		if( this.useDebug ){
			console.log.apply(console, Array.prototype.map.call(arguments, String));
		}
	},

	listen(name, listener, bind){
		this.listeners[name] = listener;
		this.listenerBind = bind;
	},

	// called on completion/failure/cancellation
	clean(){
		// this.debug('cleaning', this);
		// not needed anymore
		//this.previous = null;

		/*
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
		*/
	},

	afterFailure(){
		// this.notify('fail');
		this.propagate('transformFailure', 'right', this.value);
		this.clean();
	},

	afterCompletion(){
		//this.notify('complete');
		this.propagate('transformCompletion', 'right', this.value);
		this.progress(this);
		this.clean();
	},

	resolveCompletion(value){
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
			this.debug(this, 'blocked waiting for a thenable');
			callThenable(value, this.resolveCompletion.bind(this), this.fail.bind(this));
		}
		else{
			this.isBlocked = false;
			this.state = 'completed';
			this.value = value;

			if( false === this.isPaused ){
				this.debug(this, 'completed with', value);
				this.afterCompletion();
			}
			else{
				this.debug('completion of', this, 'stored by pause');
			}
		}
	},

	resolveFailure(value){
		this.state = 'failed';
		this.value = value;

		if( false === this.isPaused ){
			this.debug(this, 'failed with', value);
			this.afterFailure();
		}
		else{
			this.debug('failure of', this, 'stored by pause');
		}
	},

	complete(value){
		if( this.state === 'pending' && false === this.isCancelled && false === this.isBlocked ){
			this.isBlocked = true;
			this.resolveCompletion(value);
		}

		return this;
	},

	fail(value){
		if( this.state === 'pending' && false === this.isCancelled ){
			this.resolveFailure(value);
		}

		return this;
	},

	progress(ancestorTask){
		// we could keep an array of completed ancestor tasks
		// and when a 'progress' listener is added we could fire the progress
		// but when would we clean this array?

		// this.propagate('progress', 'right', ancestorTask);
	},

	notify(name, arg){
		if( name in this.listeners ){
			this.listeners[name].call(this.listenerBind, this, arg);
		}
	},

	propagate(method, direction, value){
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

	pause(){
		if( this.state === 'pending' && this.isPaused === false ){
			this.debug(this, 'paused');
			this.isPaused = true;
			this.propagate('pause');
		}

		return this;
	},

	resume(){
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

	cancel(){
		// if task is not yet completed/failed and not cancelled
		if( this.state === 'pending' && this.isCancelled === false ){
			this.debug(this.name, 'cancelled');
			this.isCancelled = true;
			this.propagate('cancel');
			this.clean();
		}

		return this;
	},

	transformValue(value, state){
		this.isBlocked = false;

		// if the transformer was already called it means the value
		// and the state associed to it cannot be transformed anymore
		// so just call this.complete or this.fail
		if( this.isTransformed ){
			this[state](value);
		}
		else{
			this.isTransformed = true;	
			var error, transformer = this[state === 'complete' ?'completionTransformer' : 'failureTransformer'];
			if( transformer ){
				var oldValue = value;

				try{				
					value = transformer.call(this.bind, oldValue);
				}
				catch(e){
					error = e;
				}

				this.debug(this, 'transform value', oldValue, 'into', value);
			}

			if( error ){
				this.fail(error);
			}
			else{
				this.complete(value);
			}
		}		
	},

	transformCompletion(value){
		this.transformValue(value, 'complete');
	},

	transformFailure(value){
		this.transformValue(value, 'fail');
	},

	adoptState(task){
		// the task state is currently unkown, when it will be known propagate will take care
		// of making this adopt the state of task
		if( task.state === 'pending' ){
			this.debug(this, 'state depends on', task);
		}
		// else the task state is already set, make it the state of this task
		else if( task.isCancelled ){
			this.debug(this, 'cancelled by', task);
			this.cancel();
		}
		else if( task.isPaused ){
			// a task can be paused & completed at the same time (that's why resume call aftercompletion)
			this.debug(this, 'paused by', task);
			this.pause();
		}
		else if( task.state === 'completed' ){
			this.debug(this, 'completed by', task);
			this.transformCompletion(task.value);
		}
		else if( task.state === 'failed' ){
			this.debug(this, 'failed by', task);
			this.transformFailure(task.value);
		}
	},

	become(task){
		task.nextList = task.nextList || [];
		task.nextList.push(this);

		this.debug(this, 'become', task);

		// set task state asap
		setImmediate(function(){
			this.adoptState(task);
		}.bind(this));
	},

	isAfter(task){
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

	isBefore(task){
		var previous = task.previous;

		while(previous){
			if( previous === this ) return true;
			previous = this.previous;
		}

		return false;
	},

	chain(task, detach){
		if( task.previous ){
			throw new Error('cannot chain task on ' + this + ' : multiple dependency not supported and ' + task + ' already depends on ' + task.previous);
		}
		// task cannot be added to next tasks because this is after task
		if( this.isAfter(task) ){
			throw new Error('cannot chain task : it would create a circular dependency because ' + this + ' depends on ' + task);
		}

		task.previous = this;
		task.become(this);

		return task;
	},

	insert(otherTask){
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

		//this.debug('chaining', otherTask);

		return otherTask.chain(this);
	},

	createTask(){
		return new this.constructor();
	},

	createNextTask(completionTransformer, failureTransformer, bind){
		if( completionTransformer && typeof completionTransformer != 'function' ){
			throw new TypeError('completionTransformer must be a function ' + completionTransformer + ' given');
		}
		if( failureTransformer && typeof failureTransformer != 'function' ){
			throw new TypeError('failureTransformer must be a function ' + failureTransformer + ' given');
		}

		var task = this.createTask();

		task.name = completionTransformer ? completionTransformer.name : '';
		if( !task.name ) task.name = 'Anonymous then';

		task.completionTransformer = completionTransformer;
		task.failureTransformer = failureTransformer;
		task.bind = bind;

		return task;
	},

	then(completionTransformer, failureTransformer, bind){
		var task = this.createNextTask(completionTransformer, failureTransformer, bind);
		this.chain(task);
		return task;
	},

	fork(completionTransformer, failureTransformer, bind){
		var task = this.createNextTask(completionTransformer, failureTransformer, bind);
		task.propagation = 'right';
		this.chain(task);
		return task;
	},

	catch(failureTransformer, bind){
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