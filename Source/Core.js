/*
---

name: "Core"

description: "The core of AtomJS."

license: "[GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)"

copyright: "Copyright (c) 2010-2011 [Ponomarenko Pavel](shocksilien@gmail.com)."

authors: "The AtomJS production team"

inspiration:
  - "[JQuery](http://jquery.com)"
  - "[MooTools](http://mootools.net)"

provides: atom

...
*/

(function (Object, Array) {
	var prototype = 'prototype',
	    apply     = 'apply',
		toString  = Object[prototype].toString,
		global    = (this.window || GLOBAL),
		slice     = [].slice;

	var atom = global.atom = function () {
		return atom.initialize[apply](this, arguments);
	};

	var innerExtend = function (proto) {
		return function () {
			var args = arguments, L = args.length, elem, safe, from;
			if (L == 3) {
				elem = args[0];
				safe = args[1];
				from = args[2];
			} else if (L == 2) {
				elem = args[0];
				safe = false;
				from = args[1];
			} else if (L == 1) {
				elem = atom;
				safe = false;
				from = args[0];
			} else throw new TypeError();

			var ext = proto ? elem[prototype] : elem;
			for (var i in from) if (i != 'constructor') {
				if (safe && i in ext) continue;

				if ( !implementAccessors(from, ext, i) ) {
					ext[i] = clone(from[i]);
				}
			}
			return elem;
		};
	};

	var typeOf = function (item) {
		if (item == null) return 'null';

		var string = toString.call(item);
		for (var i in typeOf.types) if (i == string) return typeOf.types[i];

		if (item.nodeName){
			if (item.nodeType == 1) return 'element';
			if (item.nodeType == 3) return /\S/.test(item.nodeValue) ? 'textnode' : 'whitespace';
		} else if (item && item.callee && typeof item.length == 'number'){
			return 'arguments';
		}
		
		var type = typeof item;
		
		return (type == 'object' && atom.Class && item instanceof atom.Class) ? 'class' : type;
	};
	typeOf.types = {};
	['Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Class'].forEach(function(name) {
		typeOf.types['[object ' + name + ']'] = name.toLowerCase();
	});

	var implementAccessors = function (from, to, key) {
		if (arguments.length == 2) {
			// only for check if is accessor
			key = to;
			to  = null;
		}
		// #todo: implement with getOwnPropertyDescriptor && defineProperty
		
		var g = from.__lookupGetter__(key), s = from.__lookupSetter__(key);

		if ( g || s ) {
			if (to != null) {
				if (g) to.__defineGetter__(key, g);
				if (s) to.__defineSetter__(key, s);
			}
			return true;
		}
		return false;
	};
	var clone = function (object) {
		var type = typeOf(object);
		return type in clone.types ? clone.types[type](object) : object;
	};
	clone.types = {
		array: function (array) {
			var i = array.length, c = new Array(i);
			while (i--) c[i] = clone(array[i]);
			return c;
		},
		object: function (object) {
			if (typeof object.clone == 'function') return object.clone();

			var c = {};
			for (var key in object) if (!implementAccessors(object, c, key)) {
				c[key] = clone(object[key]);
			}
			return c;
		}
	};
	
	var extend = atom.extend = innerExtend(false);

	extend({
		initialize: function () {},
		implement: innerExtend(true),
		toArray: function (elem) {
			return slice.call(elem);
		},
		log: function () {
			if (global.console) console.log[apply](console, arguments);
		},
		implementAccessors: implementAccessors, // getter+setter
		typeOf: typeOf,
		clone: clone
	});

	// JavaScript 1.8.5 Compatiblity

	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
	if (!Function[prototype].bind) {
		Function[prototype].bind = function(context /*, arg1, arg2... */) {
			var args  = slice.call(arguments, 1),
				self  = this,
				nop   = function () {},
				bound = function () {
					return self[apply](
						this instanceof nop ? this : ( context || {} ),
						args.concat( slice.call(arguments) )
					);
				};
			nop[prototype]   = self[prototype];
			bound[prototype] = new nop();
			return bound;
		};
	}

	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
	if (!Object.keys) {
		Object.keys = function(obj) {
			if (obj !== Object(obj)) throw new TypeError('Object.keys called on non-object');

			var keys = [], i, has = Object[prototype].hasOwnProperty;
			for (i in obj) if (has.call(obj, i)) keys.push(i);
			return keys;
		};
	}

	// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
	if (!Array.isArray) {
		Array.isArray = function(o) {
			return toString.call(o) === '[object Array]';
		};
	}
})(Object, Array);