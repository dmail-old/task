function replace(search, replacement){
	if( this == null ){
		throw new TypeError('Array.prototype.replace a été appelé sur null ou undefined');
	}

	var list = Object(this);
	var i = list.length >>> 0;

	while(i--){
		if( list[i] === search ){
			list[i] = replacement;
		}
	}

	return list;
}

Object.defineProperty(Array.prototype, 'replace', {
	value: replace,
	configurable: true,
	enumerable: false
});