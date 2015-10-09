function finallyMethod(handler, bind){
	return this.then(handler, handler, bind);
}

export default finallyMethod;