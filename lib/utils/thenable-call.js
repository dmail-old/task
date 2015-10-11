function callThenable(thenable, resolve, reject){
	var then;

	try{
		then = thenable.then;
		then.call(thenable, resolve, reject);
	}
	catch(e){
		reject(e);
	}
}

export default callThenable;