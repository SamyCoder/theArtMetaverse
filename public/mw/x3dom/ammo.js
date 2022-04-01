// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (ENVIRONMENT_IS_WEB) {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
    this['Module'] = Module;
  } else if (ENVIRONMENT_IS_WORKER) {
    // We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          alignSize = type.alignSize || QUANTUM_SIZE;
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
function jsCall() {
  var args = Array.prototype.slice.call(arguments);
  return Runtime.functionPointers[args[0]].apply(null, args.slice(1));
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math.abs(tempDouble))) >= (+(1)) ? (tempDouble > (+(0)) ? ((Math.min((+(Math.floor((tempDouble)/(+(4294967296))))), (+(4294967295))))|0)>>>0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+(4294967296)))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 67108864;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addOnPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 44152;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,104,135,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,120,135,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([92,0,0,0,158,6,0,0,42,0,0,0,84,1,0,0,28,4,0,0,84,0,0,0,56,1,0,0,134,1,0,0,108,0,0,0,120,1,0,0,68,0,0,0,206,1,0,0,70,0,0,0,82,4,0,0,54,0,0,0,14,2,0,0,64,0,0,0,10,4,0,0,88,0,0,0,98,6,0,0,16,1,0,0,192,0,0,0,236,1,0,0,54,0,0,0,176,6,0,0,50,0,0,0,174,3,0,0,18,1,0,0,48,0,0,0,42,0,0,0,42,0,0,0,86,2,0,0,42,0,0,0,250,2,0,0,144,8,0,0,128,1,0,0,206,1,0,0,224,0,0,0,54,0,0,0,62,0,0,0,196,4,0,0,128,2,0,0,40,2,0,0,144,1,0,0,164,4,0,0,90,4,0,0,108,1,0,0,142,6,0,0,0,6,0,0,238,4,0,0,0,1,0,0,88,1,0,0,254,8,0,0,82,2,0,0,200,0,0,0,216,1,0,0,66,0,0,0,114,0,0,0,252,3,0,0,206,0,0,0,112,0,0,0,230,1,0,0,178,6,0,0,204,1,0,0,240,2,0,0,74,0,0,0,146,2,0,0,48,0,0,0,84,4,0,0,50,0,0,0,68,0,0,0,168,0,0,0,122,6,0,0,58,2,0,0,106,0,0,0,42,0,0,0,204,1,0,0,198,3,0,0,202,2,0,0,36,2,0,0,204,2,0,0,136,0,0,0,172,1,0,0,86,1,0,0,72,0,0,0,188,2,0,0,70,1,0,0,98,0,0,0,104,5,0,0,64,1,0,0,182,3,0,0,66,2,0,0,118,2,0,0,142,0,0,0,132,0,0,0,230,5,0,0,184,0,0,0,36,6,0,0,46,0,0,0,52,1,0,0,74,0,0,0,172,5,0,0,110,0,0,0,162,0,0,0,136,4,0,0,178,0,0,0,66,0,0,0,96,10,0,0,214,4,0,0,68,0,0,0,98,3,0,0,44,0,0,0,130,1,0,0,124,0,0,0,138,5,0,0,196,1,0,0,70,0,0,0,46,5,0,0,238,5,0,0,68,10,0,0,72,1,0,0,222,0,0,0,76,0,0,0,94,4,0,0,196,0,0,0,234,3,0,0,46,9,0,0,52,0,0,0,32,3,0,0,166,0,0,0,108,0,0,0,92,7,0,0,68,0,0,0,126,5,0,0,10,2,0,0,200,0,0,0,36,3,0,0,204,9,0,0,144,0,0,0,86,0,0,0,112,0,0,0,98,0,0,0,190,0,0,0,42,5,0,0,18,1,0,0,204,1,0,0,10,3,0,0,38,1,0,0,58,0,0,0,146,1,0,0,70,0,0,0,52,1,0,0,216,1,0,0,56,0,0,0,252,2,0,0,36,2,0,0,224,5,0,0,24,5,0,0,88,0,0,0,46,0,0,0,64,5,0,0,142,0,0,0,80,1,0,0,2,3,0,0,220,9,0,0,98,0,0,0,242,3,0,0,236,4,0,0,170,1,0,0,232,0,0,0,28,8,0,0,48,8,0,0,122,5,0,0,68,4,0,0,18,5,0,0,18,9,0,0,216,5,0,0,100,4,0,0,60,1,0,0,84,6,0,0,0,3,0,0,120,4,0,0,84,1,0,0,56,10,0,0,98,0,0,0,120,0,0,0,50,0,0,0,218,7,0,0,112,6,0,0,158,1,0,0,210,4,0,0,144,6,0,0,154,2,0,0,192,0,0,0,150,2,0,0,186,1,0,0,132,5,0,0,196,0,0,0,38,2,0,0,132,4,0,0,192,1,0,0,42,3,0,0,122,0,0,0,106,0,0,0,230,3,0,0,58,0,0,0,194,3,0,0,116,0,0,0,138,2,0,0,234,5,0,0,48,1,0,0,148,5,0,0,140,0,0,0,44,5,0,0,196,4,0,0,12,5,0,0,68,1,0,0,138,0,0,0,120,5,0,0,214,1,0,0,90,2,0,0,176,0,0,0,132,10,0,0,24,3,0,0,96,2,0,0,210,1,0,0,140,0,0,0,50,0,0,0,178,1,0,0,40,1,0,0,8,5,0,0,106,0,0,0,34,4,0,0,40,5,0,0,172,0,0,0,230,0,0,0,220,10,0,0,172,9,0,0,220,1,0,0,246,3,0,0,36,4,0,0,56,1,0,0,64,1,0,0,60,0,0,0,228,0,0,0,170,7,0,0,108,4,0,0,254,3,0,0,208,0,0,0,222,7,0,0,232,0,0,0,82,7,0,0,44,0,0,0,172,3,0,0,72,0,0,0,152,5,0,0,44,0,0,0,174,1,0,0,86,0,0,0,192,3,0,0,224,0,0,0,244,0,0,0,12,8,0,0,120,1,0,0,60,0,0,0,82,1,0,0,222,3,0,0,40,7,0,0,168,4,0,0,186,0,0,0,174,7,0,0,238,0,0,0,238,0,0,0,28,2,0,0,114,0,0,0,110,2,0,0,242,7,0,0,42,0,0,0,126,7,0,0,166,7,0,0,6,1,0,0,230,8,0,0,112,6,0,0,2,3,0,0,222,1,0,0,92,1,0,0,4,2,0,0,44,0,0,0,126,0,0,0,122,1,0,0,90,1,0,0,250,3,0,0,88,0,0,0,86,10,0,0,118,0,0,0,188,0,0,0,198,6,0,0,198,0,0,0,16,1,0,0,56,4,0,0,74,7,0,0,88,0,0,0,64,0,0,0,122,10,0,0,50,3,0,0,130,10,0,0,108,3,0,0,50,1,0,0,94,0,0,0,46,0,0,0,114,0,0,0,136,3,0,0,48,1,0,0,196,1,0,0,224,0,0,0,196,0,0,0,62,0,0,0,42,0,0,0,98,1,0,0,222,0,0,0,174,2,0,0,144,0,0,0,154,0,0,0,170,0,0,0,64,3,0,0,44,4,0,0,80,0,0,0,56,3,0,0,44,0,0,0,52,0,0,0,44,0,0,0,42,0,0,0,8,3,0,0,82,2,0,0,164,1,0,0,42,1,0,0,0,2,0,0,62,3,0,0,20,1,0,0,106,9,0,0,132,0,0,0,116,3,0,0,0,9,0,0,164,0,0,0,66,3,0,0,64,2,0,0,152,0,0,0,140,4,0,0,218,0,0,0,34,3,0,0,148,1,0,0,42,0,0,0,14,10,0,0,130,3,0,0,232,1,0,0,228,3,0,0,134,0,0,0,78,0,0,0,48,0,0,0,120,0,0,0,54,1,0,0,224,1,0,0,90,0,0,0,206,4,0,0,236,0,0,0,132,0,0,0,154,5,0,0,130,0,0,0,74,0,0,0,50,0,0,0,62,0,0,0,64,0,0,0,144,1,0,0,76,1,0,0,48,0,0,0,34,2,0,0,66,0,0,0,226,0,0,0,48,0,0,0,80,7,0,0,166,9,0,0,126,3,0,0,122,0,0,0,124,9,0,0,246,2,0,0,156,2,0,0,94,1,0,0,30,5,0,0,242,0,0,0,194,5,0,0,90,4,0,0,68,0,0,0,42,0,0,0,50,1,0,0,62,0,0,0,174,6,0,0,170,1,0,0,194,0,0,0,134,1,0,0,98,2,0,0,92,0,0,0,198,3,0,0,226,3,0,0,66,0,0,0,114,1,0,0,250,9,0,0,120,2,0,0,172,0,0,0,42,5,0,0,18,1,0,0,6,1,0,0,104,0,0,0,132,5,0,0,22,9,0,0,96,5,0,0,120,0,0,0,92,0,0,0,120,2,0,0,80,0,0,0,6,5,0,0,54,9,0,0,208,3,0,0,22,3,0,0,220,0,0,0,124,8,0,0,232,5,0,0,42,1,0,0,96,0,0,0,164,1,0,0,50,1,0,0,222,9,0,0,74,1,0,0,34,6,0,0,76,0,0,0,150,1,0,0,218,1,0,0,80,0,0,0,68,1,0,0,234,2,0,0,156,2,0,0,24,4,0,0,242,1,0,0,192,0,0,0,0,1,0,0,98,0,0,0,198,0,0,0,80,2,0,0,56,0,0,0,150,1,0,0,200,4,0,0,208,0,0,0,10,1,0,0,208,10,0,0,84,0,0,0,94,6,0,0,2,1,0,0,110,0,0,0,38,3,0,0,56,1,0,0,110,3,0,0,210,4,0,0,156,10,0,0,134,6,0,0,38,1,0,0,240,1,0,0,90,0,0,0,194,6,0,0,18,6,0,0,56,0,0,0,62,7,0,0,226,7,0,0,140,2,0,0,240,0,0,0,68,3,0,0,216,6,0,0,152,3,0,0,80,0,0,0,2,2,0,0,70,1,0,0,94,3,0,0,76,0,0,0,220,7,0,0,206,4,0,0,112,1,0,0,76,8,0,0,130,4,0,0,80,0,0,0,110,2,0,0,26,2,0,0,28,1,0,0,86,0,0,0,38,2,0,0,44,4,0,0,86,0,0,0,206,9,0,0,236,0,0,0,192,5,0,0,112,0,0,0,196,0,0,0,102,4,0,0,32,1,0,0,124,1,0,0,36,2,0,0,100,1,0,0,82,5,0,0,112,1,0,0,216,1,0,0,12,4,0,0,86,1,0,0,216,3,0,0,238,2,0,0,136,0,0,0,54,0,0,0,88,4,0,0,102,2,0,0,166,1,0,0,122,0,0,0,54,1,0,0,28,1,0,0,16,1,0,0,20,6,0,0,76,0,0,0,60,3,0,0,234,3,0,0,36,5,0,0,68,6,0,0,168,0,0,0,242,2,0,0,44,0,0,0,42,0,0,0,42,0,0,0,40,3,0,0,250,8,0,0,174,2,0,0,174,3,0,0,128,0,0,0,168,10,0,0,66,1,0,0,24,1,0,0,50,0,0,0,22,6,0,0,110,2,0,0,80,0,0,0,58,0,0,0,174,2,0,0,42,0,0,0,180,0,0,0,182,1,0,0,80,2,0,0,128,0,0,0,142,1,0,0,32,2,0,0,190,1,0,0,140,6,0,0,186,4,0,0,202,0,0,0,192,0,0,0,128,3,0,0,4,9,0,0,182,5,0,0,94,0,0,0,52,0,0,0,50,4,0,0,164,3,0,0,136,0,0,0,68,0,0,0,100,1,0,0,82,3,0,0,218,1,0,0,52,1,0,0,98,0,0,0,74,1,0,0,46,0,0,0,50,7,0,0,50,9,0,0,126,9,0,0,94,1,0,0,32,3,0,0,88,0,0,0,88,0,0,0,42,0,0,0,174,6,0,0,114,5,0,0,60,1,0,0,62,6,0,0,180,4,0,0,72,1,0,0,148,2,0,0,92,6,0,0,152,0,0,0,174,5,0,0,6,6,0,0,22,3,0,0,140,7,0,0,64,6,0,0,6,1,0,0,22,2,0,0,216,0,0,0,174,1,0,0,96,6,0,0,132,0,0,0,150,4,0,0,126,6,0,0,246,0,0,0,2,5,0,0,128,1,0,0,72,0,0,0,226,0,0,0,54,5,0,0,162,7,0,0,152,0,0,0,90,0,0,0,210,0,0,0,160,1,0,0,42,0,0,0,46,0,0,0,170,5,0,0,192,1,0,0,44,0,0,0,56,0,0,0,228,2,0,0,46,0,0,0,60,0,0,0,246,1,0,0,52,0,0,0,56,5,0,0,94,1,0,0,156,2,0,0,110,5,0,0,98,9,0,0,48,4,0,0,78,0,0,0,222,1,0,0,138,1,0,0,88,2,0,0,186,1,0,0,176,2,0,0,188,6,0,0,84,0,0,0,240,0,0,0,170,0,0,0,78,0,0,0,210,1,0,0,58,0,0,0,18,2,0,0,84,0,0,0,106,10,0,0,122,4,0,0,100,0,0,0,180,6,0,0,46,2,0,0,206,0,0,0,44,0,0,0,26,5,0,0,172,10,0,0,168,7,0,0,102,2,0,0,208,0,0,0,82,1,0,0,170,2,0,0,252,0,0,0,44,0,0,0,160,1,0,0,60,0,0,0,106,3,0,0,142,2,0,0,62,4,0,0,80,0,0,0,118,9,0,0,120,0,0,0,108,6,0,0,122,3,0,0,58,7,0,0,124,0,0,0,132,2,0,0,244,0,0,0,92,2,0,0,208,1,0,0,114,2,0,0,160,0,0,0,122,2,0,0,108,1,0,0,160,6,0,0,134,0,0,0,148,2,0,0,236,7,0,0,148,5,0,0,160,1,0,0,150,2,0,0,138,3,0,0,140,4,0,0,12,5,0,0,52,5,0,0,174,8,0,0,54,2,0,0,186,5,0,0,52,0,0,0,26,4,0,0,42,0,0,0,42,0,0,0,148,1,0,0,34,4,0,0,56,0,0,0,132,1,0,0,10,7,0,0,158,0,0,0,42,1,0,0,104,1,0,0,54,6,0,0,236,0,0,0,82,1,0,0,14,1,0,0,156,3,0,0,52,0,0,0,148,8,0,0,110,3,0,0,242,8,0,0,218,1,0,0,104,0,0,0,150,4,0,0,122,8,0,0,180,1,0,0,200,6,0,0,104,2,0,0,98,0,0,0,158,7,0,0,92,2,0,0,84,0,0,0,142,1,0,0,200,3,0,0,138,2,0,0,140,3,0,0,2,5,0,0,182,1,0,0,148,6,0,0,202,0,0,0,74,0,0,0,62,0,0,0,106,5,0,0,208,2,0,0,222,0,0,0,86,0,0,0,102,0,0,0,128,3,0,0,52,3,0,0,216,7,0,0,130,1,0,0,42,0,0,0,126,1,0,0,172,0,0,0,222,0,0,0,44,8,0,0,144,10,0,0,184,1,0,0,202,0,0,0,148,0,0,0,50,3,0,0,88,4,0,0,46,3,0,0,176,2,0,0,180,2,0,0,254,2,0,0,50,8,0,0,72,5,0,0,100,7,0,0,28,6,0,0,188,9,0,0,30,1,0,0,132,3,0,0,52,5,0,0,238,2,0,0,88,0,0,0,160,0,0,0,186,0,0,0,112,0,0,0,192,9,0,0,156,5,0,0,62,3,0,0,190,5,0,0,232,1,0,0,194,6,0,0,80,5,0,0,174,1,0,0,176,1,0,0,236,0,0,0,52,0,0,0,228,6,0,0,238,1,0,0,206,3,0,0,88,0,0,0,164,2,0,0,98,1,0,0,200,6,0,0,42,4,0,0,180,1,0,0,40,1,0,0,100,1,0,0,170,1,0,0,148,10,0,0,96,5,0,0,50,0,0,0,92,5,0,0,50,0,0,0,170,0,0,0,64,4,0,0,224,0,0,0,60,2,0,0,66,6,0,0,86,5,0,0,206,0,0,0,96,1,0,0,172,2,0,0,140,0,0,0,60,0,0,0,50,0,0,0,98,1,0,0,200,1,0,0,96,0,0,0,160,1,0,0,104,4,0,0,46,0,0,0,82,0,0,0,194,0,0,0,138,10,0,0,136,0,0,0,50,2,0,0,58,0,0,0,226,1,0,0,106,0,0,0,230,1,0,0,94,0,0,0,44,2,0,0,0,1,0,0,178,2,0,0,16,5,0,0,62,0,0,0,188,10,0,0,158,0,0,0,58,0,0,0,128,0,0,0,90,3,0,0,22,3,0,0,96,0,0,0,252,2,0,0,80,0,0,0,252,1,0,0,42,8,0,0,164,7,0,0,90,0,0,0,58,0,0,0,50,0,0,0,46,0,0,0,202,2,0,0,240,3,0,0,50,1,0,0,124,1,0,0,70,5,0,0,168,1,0,0,216,8,0,0,138,0,0,0,14,2,0,0,190,3,0,0,62,6,0,0,132,7,0,0,6,5,0,0,142,5,0,0,76,0,0,0,4,1,0,0,226,1,0,0,162,0,0,0,46,0,0,0,120,0,0,0,104,0,0,0,76,0,0,0,200,1,0,0,100,3,0,0,128,0,0,0,114,10,0,0,28,1,0,0,168,4,0,0,50,0,0,0,12,10,0,0,4,3,0,0,62,2,0,0,28,3,0,0,106,0,0,0,38,1,0,0,214,1,0,0,168,9,0,0,144,0,0,0,224,8,0,0,128,0,0,0,218,3,0,0,246,0,0,0,242,0,0,0,168,3,0,0,204,0,0,0,174,0,0,0,192,1,0,0,70,0,0,0,204,5,0,0,180,10,0,0,154,0,0,0,108,7,0,0,182,2,0,0,102,2,0,0,140,0,0,0,230,1,0,0,10,4,0,0,58,6,0,0,50,1,0,0,2,2,0,0,90,1,0,0,156,4,0,0,146,0,0,0,26,3,0,0,188,2,0,0,96,0,0,0,244,1,0,0,160,9,0,0,242,0,0,0,82,0,0,0,234,8,0,0,68,2,0,0,158,1,0,0,48,0,0,0,42,0,0,0,44,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,44,0,0,0,42,0,0,0,178,0,0,0,210,8,0,0,46,0,0,0,126,0,0,0,104,0,0,0,44,0,0,0,42,0,0,0,28,1,0,0,78,0,0,0,60,6,0,0,42,0,0,0,42,0,0,0,42,0,0,0,232,2,0,0,48,0,0,0,24,2,0,0,82,2,0,0,200,0,0,0,186,0,0,0,124,0,0,0,8,5,0,0,144,6,0,0,66,3,0,0,84,2,0,0,106,3,0,0,134,5,0,0,146,1,0,0,98,0,0,0,86,0,0,0,138,3,0,0,86,0,0,0,186,0,0,0,110,1,0,0,116,1,0,0,148,0,0,0,252,8,0,0,202,1,0,0,116,0,0,0,152,2,0,0,178,3,0,0,124,4,0,0,32,3,0,0,154,6,0,0,78,0,0,0,102,1,0,0,18,1,0,0,28,1,0,0,40,10,0,0,216,0,0,0,52,0,0,0,152,5,0,0,50,3,0,0,98,5,0,0,176,0,0,0,126,2,0,0,148,0,0,0,158,2,0,0,232,2,0,0,142,0,0,0,224,2,0,0,46,0,0,0,182,0,0,0,170,1,0,0,208,1,0,0,32,4,0,0,126,5,0,0,172,4,0,0,112,4,0,0,52,0,0,0,158,0,0,0,116,0,0,0,44,0,0,0,140,1,0,0,132,6,0,0,96,0,0,0,50,6,0,0,200,5,0,0,144,1,0,0,120,1,0,0,16,9,0,0,158,4,0,0,252,2,0,0,108,3,0,0,72,2,0,0,192,5,0,0,102,6,0,0,44,9,0,0,38,4,0,0,188,1,0,0,146,3,0,0,102,3,0,0,0,5,0,0,100,0,0,0,154,1,0,0,220,2,0,0,102,6,0,0,196,5,0,0,20,3,0,0,26,1,0,0,104,2,0,0,204,6,0,0,216,1,0,0,192,4,0,0,128,1,0,0,94,0,0,0,60,0,0,0,12,1,0,0,20,4,0,0,210,0,0,0,34,1,0,0,80,1,0,0,110,0,0,0,68,0,0,0,56,2,0,0,106,1,0,0,234,4,0,0,114,0,0,0,90,0,0,0,100,1,0,0,90,0,0,0,152,4,0,0,36,10,0,0,100,0,0,0,92,3,0,0,80,0,0,0,52,0,0,0,44,0,0,0,44,0,0,0,60,7,0,0,44,0,0,0,154,1,0,0,134,0,0,0,86,1,0,0,156,0,0,0,108,1,0,0,106,0,0,0,72,0,0,0,108,0,0,0,220,2,0,0,162,0,0,0,4,1,0,0,48,0,0,0,212,1,0,0,50,0,0,0,198,2,0,0,162,1,0,0,94,5,0,0,80,1,0,0,48,0,0,0,146,0,0,0,82,1,0,0,138,0,0,0,100,0,0,0,10,3,0,0,106,2,0,0,84,0,0,0,156,0,0,0,22,4,0,0,12,3,0,0,226,9,0,0,72,2,0,0,218,3,0,0,170,9,0,0,122,7,0,0,162,2,0,0,202,3,0,0,16,4,0,0,208,2,0,0,60,5,0,0,206,1,0,0,0,1,0,0,148,2,0,0,86,0,0,0,162,4,0,0,10,3,0,0,192,3,0,0,224,4,0,0,252,6,0,0,86,0,0,0,74,4,0,0,114,1,0,0,168,1,0,0,240,5,0,0,116,1,0,0,22,2,0,0,170,4,0,0,44,0,0,0,36,1,0,0,0,1,0,0,88,0,0,0,108,0,0,0,178,4,0,0,202,0,0,0,156,4,0,0,50,4,0,0,108,0,0,0,50,0,0,0,42,0,0,0,158,0,0,0,212,1,0,0,244,0,0,0,166,0,0,0,68,9,0,0,214,0,0,0,140,5,0,0,86,4,0,0,68,0,0,0,216,2,0,0,186,4,0,0,150,0,0,0,4,5,0,0,196,0,0,0,102,8,0,0,52,0,0,0,46,0,0,0,50,0,0,0,240,4,0,0,108,5,0,0,208,6,0,0,204,1,0,0,232,1,0,0,68,5,0,0,94,5,0,0,124,1,0,0,214,10,0,0,206,0,0,0,178,3,0,0,42,0,0,0,146,1,0,0,58,2,0,0,64,3,0,0,154,0,0,0,48,6,0,0,184,1,0,0,236,5,0,0,92,5,0,0,38,8,0,0,166,3,0,0,246,0,0,0,252,0,0,0,102,0,0,0,40,5,0,0,108,0,0,0,72,0,0,0,106,0,0,0,78,0,0,0,48,0,0,0,126,4,0,0,76,4,0,0,54,0,0,0,178,0,0,0,66,0,0,0,142,1,0,0,4,6,0,0,26,5,0,0,112,1,0,0,100,6,0,0,148,1,0,0,178,2,0,0,166,0,0,0,166,0,0,0,58,1,0,0,32,1,0,0,242,1,0,0,84,0,0,0,160,3,0,0,220,1,0,0,146,5,0,0,156,1,0,0,100,0,0,0,188,4,0,0,144,0,0,0,88,0,0,0,222,0,0,0,230,0,0,0,210,1,0,0,56,0,0,0,238,0,0,0,174,0,0,0,174,0,0,0,62,0,0,0,56,0,0,0,46,0,0,0,44,0,0,0,42,0,0,0,148,0,0,0,154,1,0,0,252,1,0,0,58,0,0,0,40,4,0,0,68,0,0,0,44,0,0,0,218,1,0,0,154,0,0,0,156,0,0,0,234,6,0,0,44,0,0,0,42,0,0,0,160,3,0,0,202,0,0,0,214,3,0,0,82,10,0,0,66,0,0,0,42,10,0,0,78,5,0,0,146,0,0,0,246,4,0,0,188,2,0,0,56,0,0,0,102,0,0,0,208,8,0,0,90,2,0,0,82,0,0,0,12,1,0,0,26,1,0,0,88,0,0,0,118,1,0,0,254,1,0,0,46,0,0,0,186,0,0,0,180,0,0,0,52,0,0,0,42,0,0,0,42,0,0,0,140,6,0,0,128,5,0,0,58,0,0,0,18,1,0,0,46,7,0,0,20,3,0,0,124,1,0,0,2,1,0,0,112,0,0,0,48,0,0,0,48,0,0,0,126,6,0,0,22,1,0,0,126,0,0,0,56,3,0,0,28,7,0,0,118,5,0,0,74,0,0,0,54,0,0,0,42,0,0,0,212,9,0,0,78,1,0,0,82,0,0,0,8,2,0,0,50,10,0,0,14,3,0,0,224,1,0,0,150,0,0,0,236,6,0,0,100,1,0,0,64,3,0,0,62,0,0,0,54,0,0,0,48,0,0,0,60,0,0,0,48,0,0,0,46,0,0,0,194,10,0,0,176,3,0,0,50,0,0,0,186,2,0,0,246,1,0,0,128,0,0,0,230,2,0,0,230,2,0,0,164,6,0,0,184,1,0,0,12,1,0,0,78,2,0,0,78,2,0,0,82,0,0,0,114,0,0,0,42,0,0,0,250,1,0,0,254,1,0,0,42,0,0,0,152,1,0,0,144,0,0,0,124,0,0,0,106,1,0,0,10,1,0,0,56,0,0,0,142,3,0,0,156,8,0,0,94,4,0,0,64,0,0,0,116,1,0,0,216,0,0,0,12,2,0,0,14,6,0,0,138,1,0,0,14,1,0,0,70,0,0,0,58,1,0,0,140,1,0,0,198,1,0,0,88,0,0,0,74,1,0,0,180,0,0,0,254,0,0,0,72,1,0,0,112,1,0,0,104,0,0,0,238,1,0,0,146,9,0,0,248,0,0,0,56,1,0,0,52,1,0,0,238,1,0,0,112,0,0,0,64,0,0,0,172,4,0,0,90,0,0,0,128,0,0,0,166,1,0,0,254,0,0,0,126,4,0,0,44,3,0,0,76,10,0,0,84,0,0,0,64,1,0,0,214,1,0,0,54,0,0,0,106,4,0,0,242,1,0,0,154,0,0,0,106,1,0,0,204,0,0,0,158,0,0,0,178,4,0,0,210,0,0,0,234,1,0,0,76,0,0,0,242,4,0,0,30,2,0,0,250,5,0,0,222,2,0,0,42,2,0,0,10,1,0,0,104,1,0,0,174,0,0,0,216,4,0,0,54,7,0,0,86,1,0,0,144,1,0,0,182,1,0,0,100,9,0,0,50,0,0,0,98,0,0,0,158,1,0,0,58,0,0,0,172,0,0,0,62,0,0,0,118,1,0,0,218,9,0,0,70,0,0,0,244,7,0,0,226,0,0,0,250,5,0,0,64,0,0,0,164,0,0,0,112,4,0,0,208,1,0,0,110,5,0,0,20,1,0,0,140,1,0,0,212,0,0,0,46,0,0,0,44,3,0,0,224,9,0,0,244,0,0,0,0,1,0,0,42,0,0,0,16,4,0,0,212,0,0,0,158,1,0,0,82,0,0,0,52,2,0,0,238,0,0,0,134,4,0,0,230,1,0,0,174,5,0,0,66,2,0,0,64,0,0,0,192,1,0,0,220,4,0,0,56,6,0,0,32,10,0,0,218,2,0,0,242,2,0,0,202,0,0,0,202,5,0,0,54,0,0,0,42,3,0,0,132,1,0,0,214,2,0,0,38,2,0,0,86,0,0,0,24,9,0,0,78,5,0,0,152,2,0,0,82,0,0,0,184,1,0,0,162,1,0,0,200,0,0,0,164,5,0,0,128,1,0,0,224,0,0,0,170,8,0,0,20,9,0,0,110,0,0,0,80,4,0,0,222,0,0,0,8,10,0,0,114,0,0,0,68,1,0,0,0,5,0,0,48,5,0,0,34,1,0,0,42,0,0,0,42,0,0,0,188,3,0,0,136,0,0,0,160,4,0,0,164,6,0,0,128,2,0,0,80,10,0,0,200,2,0,0,14,7,0,0,44,0,0,0,44,0,0,0,6,2,0,0,62,1,0,0,92,0,0,0,214,1,0,0,254,0,0,0,224,0,0,0,158,8,0,0,124,5,0,0,120,6,0,0,150,6,0,0,104,0,0,0,172,8,0,0,92,1,0,0,136,7,0,0,226,8,0,0,176,8,0,0,180,4,0,0,102,2,0,0,128,0,0,0,54,5,0,0,74,3,0,0,74,0,0,0,188,1,0,0,52,1,0,0,18,2,0,0,182,0,0,0,122,1,0,0,80,5,0,0,216,3,0,0,246,0,0,0,124,10,0,0,76,0,0,0,100,0,0,0,142,10,0,0,178,8,0,0,126,2,0,0,24,2,0,0,66,5,0,0,130,1,0,0,162,2,0,0,226,4,0,0,70,0,0,0,98,4,0,0,230,0,0,0,124,6,0,0,98,3,0,0,48,4,0,0,104,4,0,0,120,0,0,0,30,4,0,0,58,1,0,0,202,6,0,0,82,8,0,0,54,10,0,0,236,2,0,0,10,1,0,0,68,2,0,0,94,1,0,0,158,0,0,0,142,4,0,0,236,3,0,0,60,1,0,0,184,3,0,0,16,2,0,0,174,1,0,0,72,3,0,0,24,2,0,0,208,5,0,0,34,5,0,0,104,1,0,0,208,1,0,0,80,3,0,0,250,0,0,0,236,0,0,0,160,2,0,0,172,0,0,0,240,0,0,0,88,1,0,0,218,0,0,0,204,4,0,0,196,3,0,0,218,2,0,0,66,0,0,0,50,0,0,0,56,0,0,0,238,8,0,0,48,6,0,0,118,4,0,0,54,1,0,0,48,5,0,0,116,0,0,0,54,6,0,0,14,5,0,0,74,0,0,0,248,5,0,0,226,5,0,0,42,0,0,0,218,2,0,0,220,0,0,0,234,0,0,0,50,0,0,0,44,0,0,0,46,0,0,0,44,1,0,0,30,7,0,0,110,4,0,0,166,1,0,0,180,3,0,0,0,10,0,0,214,0,0,0,16,2,0,0,122,1,0,0,224,1,0,0,60,2,0,0,74,1,0,0,46,0,0,0,222,10,0,0,134,0,0,0,192,4,0,0,106,0,0,0,178,1,0,0,98,1,0,0,46,0,0,0,42,6,0,0,162,0,0,0,12,1,0,0,108,0,0,0,52,0,0,0,72,0,0,0,174,4,0,0,66,1,0,0,154,7,0,0,78,0,0,0,116,0,0,0,144,0,0,0,186,2,0,0,252,0,0,0,68,1,0,0,64,0,0,0,212,5,0,0,110,6,0,0,170,0,0,0,184,6,0,0,102,0,0,0,70,2,0,0,50,0,0,0,52,2,0,0,132,3,0,0,96,1,0,0,46,1,0,0,8,1,0,0,118,3,0,0,102,1,0,0,114,7,0,0,84,0,0,0,206,1,0,0,196,6,0,0,112,2,0,0,46,0,0,0,76,0,0,0,46,6,0,0,100,2,0,0,6,6,0,0,112,1,0,0,216,0,0,0,44,1,0,0,226,0,0,0,106,0,0,0,114,2,0,0,120,0,0,0,158,1,0,0,40,1,0,0,210,2,0,0,244,0,0,0,252,1,0,0,70,0,0,0,162,2,0,0,48,2,0,0,14,2,0,0,192,2,0,0,104,1,0,0,202,1,0,0,218,0,0,0,132,0,0,0,40,1,0,0,140,0,0,0,196,0,0,0,186,7,0,0,118,0,0,0,10,2,0,0,226,2,0,0,196,1,0,0,36,1,0,0,32,1,0,0,20,1,0,0,196,2,0,0,206,8,0,0,216,1,0,0,46,1,0,0,190,0,0,0,174,0,0,0,186,1,0,0,166,0,0,0,136,0,0,0,20,2,0,0,216,4,0,0,98,2,0,0,224,0,0,0,176,0,0,0,84,5,0,0,250,0,0,0,120,1,0,0,164,2,0,0,116,0,0,0,92,0,0,0,126,2,0,0,202,1,0,0,158,3,0,0,66,0,0,0,188,8,0,0,32,1,0,0,166,2,0,0,172,6,0,0,172,1,0,0,80,1,0,0,200,1,0,0,104,1,0,0,140,0,0,0,238,3,0,0,114,4,0,0,240,9,0,0,180,0,0,0,234,1,0,0,82,1,0,0,236,3,0,0,242,1,0,0,8,1,0,0,252,2,0,0,24,8,0,0,94,0,0,0,206,7,0,0,234,5,0,0,204,0,0,0,104,6,0,0,58,3,0,0,126,0,0,0,208,9,0,0,178,1,0,0,236,0,0,0,108,0,0,0,108,2,0,0,138,3,0,0,136,0,0,0,68,2,0,0,192,0,0,0,150,0,0,0,146,10,0,0,232,2,0,0,54,2,0,0,194,0,0,0,86,1,0,0,208,6,0,0,100,0,0,0,66,0,0,0,118,3,0,0,44,1,0,0,52,0,0,0,116,0,0,0,138,6,0,0,74,0,0,0,246,8,0,0,72,10,0,0,56,0,0,0,114,6,0,0,232,0,0,0,12,1,0,0,116,3,0,0,136,2,0,0,120,10,0,0,150,2,0,0,72,0,0,0,80,0,0,0,212,8,0,0,242,9,0,0,104,0,0,0,8,4,0,0,54,0,0,0,78,3,0,0,250,0,0,0,50,5,0,0,70,9,0,0,44,2,0,0,44,0,0,0,42,4,0,0,50,0,0,0,62,0,0,0,124,3,0,0,78,0,0,0,248,5,0,0,142,0,0,0,46,0,0,0,60,4,0,0,60,8,0,0,90,7,0,0,204,5,0,0,232,0,0,0,242,0,0,0,238,0,0,0,188,5,0,0,46,1,0,0,60,0,0,0,58,1,0,0,194,1,0,0,134,2,0,0,76,0,0,0,252,0,0,0,60,3,0,0,162,0,0,0,228,0,0,0,50,1,0,0,170,0,0,0,136,1,0,0,128,1,0,0,58,0,0,0,116,0,0,0,222,2,0,0,32,6,0,0,58,1,0,0,128,4,0,0,6,1,0,0,172,1,0,0,230,1,0,0,30,2,0,0,70,0,0,0,74,0,0,0,198,1,0,0,112,5,0,0,222,5,0,0,82,0,0,0,52,0,0,0,164,0,0,0,216,1,0,0,48,1,0,0,44,1,0,0,96,1,0,0,60,0,0,0,82,6,0,0,184,8,0,0,98,0,0,0,60,0,0,0,238,1,0,0,58,0,0,0,2,6,0,0,94,2,0,0,58,0,0,0,180,7,0,0,54,4,0,0,240,8,0,0,72,0,0,0,44,0,0,0,42,6,0,0,44,2,0,0,254,0,0,0,144,1,0,0,66,0,0,0,70,0,0,0,38,9,0,0,234,0,0,0,218,0,0,0,40,2,0,0,162,1,0,0,86,0,0,0,108,0,0,0,214,1,0,0,52,0,0,0,62,0,0,0,232,0,0,0,46,4,0,0,60,4,0,0,160,1,0,0,32,1,0,0,30,6,0,0,70,0,0,0,90,1,0,0,74,3,0,0,128,8,0,0,126,0,0,0,24,4,0,0,174,0,0,0,144,0,0,0,248,0,0,0,28,2,0,0,74,2,0,0,74,2,0,0,4,2,0,0,30,1,0,0,168,0,0,0,210,1,0,0,226,1,0,0,8,9,0,0,64,0,0,0,64,0,0,0,248,1,0,0,126,1,0,0,120,3,0,0,12,6,0,0,156,9,0,0,50,0,0,0,210,2,0,0,238,6,0,0,102,1,0,0,204,7,0,0,168,1,0,0,202,5,0,0,76,5,0,0,164,0,0,0,118,3,0,0,234,0,0,0,38,5,0,0,84,2,0,0,32,9,0,0,248,0,0,0,218,10,0,0,22,6,0,0,234,2,0,0,18,5,0,0,216,0,0,0,54,1,0,0,24,2,0,0,6,2,0,0,44,0,0,0,68,8,0,0,182,0,0,0,24,7,0,0,90,6,0,0,46,0,0,0,68,0,0,0,52,0,0,0,178,0,0,0,8,6,0,0,16,2,0,0,34,1,0,0,90,0,0,0,104,0,0,0,130,9,0,0,176,1,0,0,244,4,0,0,184,0,0,0,64,8,0,0,212,1,0,0,192,0,0,0,46,0,0,0,44,0,0,0,86,0,0,0,140,0,0,0,184,6,0,0,170,0,0,0,128,1,0,0,88,3,0,0,176,1,0,0,180,0,0,0,82,0,0,0,112,0,0,0,34,1,0,0,18,10,0,0,54,2,0,0,230,3,0,0,212,4,0,0,252,0,0,0,166,8,0,0,128,3,0,0,210,0,0,0,250,1,0,0,110,0,0,0,200,2,0,0,144,4,0,0,106,2,0,0,168,2,0,0,114,6,0,0,150,2,0,0,38,3,0,0,58,2,0,0,164,0,0,0,252,4,0,0,46,3,0,0,192,1,0,0,188,1,0,0,4,1,0,0,156,0,0,0,20,1,0,0,122,0,0,0,46,0,0,0,42,0,0,0,130,0,0,0,92,1,0,0,50,0,0,0,116,4,0,0,78,0,0,0,84,1,0,0,62,0,0,0,50,2,0,0,86,0,0,0,250,1,0,0,42,0,0,0,74,2,0,0,194,2,0,0,152,2,0,0,90,2,0,0,62,0,0,0,128,2,0,0,62,1,0,0,206,2,0,0,4,1,0,0,54,0,0,0,38,4,0,0,72,0,0,0,160,0,0,0,58,5,0,0,252,0,0,0,158,1,0,0,100,1,0,0,44,0,0,0,230,0,0,0,152,0,0,0,222,4,0,0,170,10,0,0,146,0,0,0,42,0,0,0,130,0,0,0,128,0,0,0,200,1,0,0,46,10,0,0,76,0,0,0,56,5,0,0,118,0,0,0,244,6,0,0,156,1,0,0,60,6,0,0,228,2,0,0,198,0,0,0,204,2,0,0,120,0,0,0,134,4,0,0,80,0,0,0,92,0,0,0,168,1,0,0,84,0,0,0,152,10,0,0,42,0,0,0,46,2,0,0,134,9,0,0,210,1,0,0,26,1,0,0,48,0,0,0,80,0,0,0,178,0,0,0,112,0,0,0,76,3,0,0,214,5,0,0,206,0,0,0,58,0,0,0,172,2,0,0,160,2,0,0,70,0,0,0,110,0,0,0,40,2,0,0,226,6,0,0,52,8,0,0,202,6,0,0,186,9,0,0,202,1,0,0,48,0,0,0,48,0,0,0,210,0,0,0,152,1,0,0,40,2,0,0,58,0,0,0,76,4,0,0,132,1,0,0,122,1,0,0,36,2,0,0,130,0,0,0,90,9,0,0,78,1,0,0,10,5,0,0,116,9,0,0,16,1,0,0,190,0,0,0,8,1,0,0,236,8,0,0,152,9,0,0,130,1,0,0,126,1,0,0,138,1,0,0,154,0,0,0,76,1,0,0,228,0,0,0,54,0,0,0,190,6,0,0,128,9,0,0,36,8,0,0,30,10,0,0,242,2,0,0,104,0,0,0,44,10,0,0,182,5,0,0,230,0,0,0,62,9,0,0,144,1,0,0,146,2,0,0,104,1,0,0,80,8,0,0,72,0,0,0,38,3,0,0,60,3,0,0,194,0,0,0,2,2,0,0,70,0,0,0,112,9,0,0,118,7,0,0,194,2,0,0,54,1,0,0,246,5,0,0,38,1,0,0,198,0,0,0,8,3,0,0,250,1,0,0,12,3,0,0,116,1,0,0,188,0,0,0,94,0,0,0,38,2,0,0,64,1,0,0,222,8,0,0,88,0,0,0,114,1,0,0,64,0,0,0,102,0,0,0,198,7,0,0,154,1,0,0,26,8,0,0,60,1,0,0,144,0,0,0,162,2,0,0,52,7,0,0,94,10,0,0,42,0,0,0,46,6,0,0,236,1,0,0,84,0,0,0,108,8,0,0,214,9,0,0,204,10,0,0,14,2,0,0,56,7,0,0,218,8,0,0,124,1,0,0,94,1,0,0,72,2,0,0,222,1,0,0,132,0,0,0,94,8,0,0,68,2,0,0,104,0,0,0,248,0,0,0,96,0,0,0,46,0,0,0,208,2,0,0,30,5,0,0,158,0,0,0,54,0,0,0,164,5,0,0,228,8,0,0,60,3,0,0,120,0,0,0,92,0,0,0,2,8,0,0,160,1,0,0,210,2,0,0,208,0,0,0,142,5,0,0,136,1,0,0,128,6,0,0,46,0,0,0,42,0,0,0,42,2,0,0,82,0,0,0,102,0,0,0,100,0,0,0,94,0,0,0,134,0,0,0,166,1,0,0,122,0,0,0,132,0,0,0,82,1,0,0,16,2,0,0,2,1,0,0,54,1,0,0,252,0,0,0,82,0,0,0,46,0,0,0,44,0,0,0,86,0,0,0,76,2,0,0,124,1,0,0,106,6,0,0,128,2,0,0,140,0,0,0,132,8,0,0,26,7,0,0,202,4,0,0,126,2,0,0,176,0,0,0,254,2,0,0,78,1,0,0,108,6,0,0,186,0,0,0,122,0,0,0,184,5,0,0,80,2,0,0,236,0,0,0,4,1,0,0,52,0,0,0,238,7,0,0,58,8,0,0,90,1,0,0,82,0,0,0,16,3,0,0,82,0,0,0,4,7,0,0,74,8,0,0,212,0,0,0,52,10,0,0,20,3,0,0,10,2,0,0,50,0,0,0,106,5,0,0,124,0,0,0,138,1,0,0,92,3,0,0,56,0,0,0,34,2,0,0,44,0,0,0,94,7,0,0,158,3,0,0,78,8,0,0,210,9,0,0,206,1,0,0,176,0,0,0,94,0,0,0,244,3,0,0,126,1,0,0,176,1,0,0,106,1,0,0,200,4,0,0,102,1,0,0,112,3,0,0,42,0,0,0,158,4,0,0,208,2,0,0,42,3,0,0,22,5,0,0,254,7,0,0,226,4,0,0,146,4,0,0,244,1,0,0,18,8,0,0,0,7,0,0,232,3,0,0,48,7,0,0,186,1,0,0,188,5,0,0,152,6,0,0,62,0,0,0,72,1,0,0,14,5,0,0,112,1,0,0,166,1,0,0,162,5,0,0,244,1,0,0,36,3,0,0,64,7,0,0,82,5,0,0,100,8,0,0,134,8,0,0,124,0,0,0,244,3,0,0,104,6,0,0,250,4,0,0,46,0,0,0,110,10,0,0,86,8,0,0,138,1,0,0,234,1,0,0,214,1,0,0,76,0,0,0,188,0,0,0,34,10,0,0,236,5,0,0,20,2,0,0,74,2,0,0,42,0,0,0,218,0,0,0,70,2,0,0,104,0,0,0,160,2,0,0,218,4,0,0,118,2,0,0,38,6,0,0,64,0,0,0,108,3,0,0,78,6,0,0,82,9,0,0,210,3,0,0,46,3,0,0,28,5,0,0,212,1,0,0,202,4,0,0,82,0,0,0,28,2,0,0,250,0,0,0,86,0,0,0,102,0,0,0,126,0,0,0,180,1,0,0,214,3,0,0,234,0,0,0,48,1,0,0,200,10,0,0,82,1,0,0,126,1,0,0,208,3,0,0,44,0,0,0,56,0,0,0,252,7,0,0,124,6,0,0,50,1,0,0,76,1,0,0,84,4,0,0,78,0,0,0,232,1,0,0,104,0,0,0,0,8,0,0,82,0,0,0,168,5,0,0,228,0,0,0,192,2,0,0,142,0,0,0,94,0,0,0,24,6,0,0,48,0,0,0,48,0,0,0,44,0,0,0,40,6,0,0,176,5,0,0,118,0,0,0,44,6,0,0,18,3,0,0,90,3,0,0,218,5,0,0,14,1,0,0,48,0,0,0,110,8,0,0,88,2,0,0,194,5,0,0,240,7,0,0,54,0,0,0,120,9,0,0,138,0,0,0,206,1,0,0,166,1,0,0,74,1,0,0,50,2,0,0,60,0,0,0,116,0,0,0,250,0,0,0,138,0,0,0,206,5,0,0,134,1,0,0,170,0,0,0,70,0,0,0,34,7,0,0,128,4,0,0,96,0,0,0,110,1,0,0,40,1,0,0,30,3,0,0,26,10,0,0,208,7,0,0,230,4,0,0,98,1,0,0,138,4,0,0,100,5,0,0,184,0,0,0,62,1,0,0,100,0,0,0,154,9,0,0,236,1,0,0,184,4,0,0,162,3,0,0,104,1,0,0,254,3,0,0,62,1,0,0,36,1,0,0,50,5,0,0,236,9,0,0,208,0,0,0,206,5,0,0,194,1,0,0,86,3,0,0,134,0,0,0,224,4,0,0,130,0,0,0,50,3,0,0,122,2,0,0,132,0,0,0,46,0,0,0,198,2,0,0,182,4,0,0,96,0,0,0,72,5,0,0,112,0,0,0,50,0,0,0,42,0,0,0,42,0,0,0,220,0,0,0,240,2,0,0,144,2,0,0,64,9,0,0,190,1,0,0,76,3,0,0,60,0,0,0,156,1,0,0,16,6,0,0,74,0,0,0,6,9,0,0,182,0,0,0,228,4,0,0,14,4,0,0,186,2,0,0,50,0,0,0,136,1,0,0,142,4,0,0,44,0,0,0,68,0,0,0,150,0,0,0,110,0,0,0,20,5,0,0,66,0,0,0,166,0,0,0,122,0,0,0,40,6,0,0,142,0,0,0,190,0,0,0,76,2,0,0,166,0,0,0,114,5,0,0,132,2,0,0,100,10,0,0,20,1,0,0,38,1,0,0,136,10,0,0,32,2,0,0,8,7,0,0,34,1,0,0,72,6,0,0,118,2,0,0,216,0,0,0,92,0,0,0,102,4,0,0,182,7,0,0,226,5,0,0,58,10,0,0,28,3,0,0,8,4,0,0,168,1,0,0,240,1,0,0,190,7,0,0,130,0,0,0,76,3,0,0,138,2,0,0,136,3,0,0,222,0,0,0,20,8,0,0,56,0,0,0,30,1,0,0,18,6,0,0,254,1,0,0,52,0,0,0,110,0,0,0,76,1,0,0,130,0,0,0,220,1,0,0,212,2,0,0,8,1,0,0,162,10,0,0,66,8,0,0,142,7,0,0,58,0,0,0,68,2,0,0,218,4,0,0,102,9,0,0,12,6,0,0,76,0,0,0,56,4,0,0,238,0,0,0,48,0,0,0,162,8,0,0,198,5,0,0,150,5,0,0,156,0,0,0,52,3,0,0,102,0,0,0,188,0,0,0,82,3,0,0,54,1,0,0,160,8,0,0,52,2,0,0,96,1,0,0,94,0,0,0,94,0,0,0,204,1,0,0,172,6,0,0,232,1,0,0,176,7,0,0,2,1,0,0,218,1,0,0,122,0,0,0,212,3,0,0,66,0,0,0,154,3,0,0,168,5,0,0,102,1,0,0,20,4,0,0,178,7,0,0,218,0,0,0,22,8,0,0,248,0,0,0,162,4,0,0,182,3,0,0,146,8,0,0,134,5,0,0,70,0,0,0,58,0,0,0,114,0,0,0,226,0,0,0,50,0,0,0,86,0,0,0,198,10,0,0,240,1,0,0,174,1,0,0,22,10,0,0,232,0,0,0,76,0,0,0,150,0,0,0,212,0,0,0,174,0,0,0,50,6,0,0,126,0,0,0,84,5,0,0,8,1,0,0,228,1,0,0,180,3,0,0,108,0,0,0,80,0,0,0,58,0,0,0,42,0,0,0,42,0,0,0,8,6,0,0,30,3,0,0,74,0,0,0,18,2,0,0,58,0,0,0,98,2,0,0,96,1,0,0,42,0,0,0,42,0,0,0,120,2,0,0,176,3,0,0,148,0,0,0,210,3,0,0,170,4,0,0,96,0,0,0,118,0,0,0,174,1,0,0,68,1,0,0,246,1,0,0,70,7,0,0,148,0,0,0,34,9,0,0,156,1,0,0,188,6,0,0].concat([200,2,0,0,98,0,0,0,26,2,0,0,98,0,0,0,222,0,0,0,172,3,0,0,196,7,0,0,104,9,0,0,240,4,0,0,152,1,0,0,70,2,0,0,156,1,0,0,242,0,0,0,14,6,0,0,178,0,0,0,30,2,0,0,160,0,0,0,86,1,0,0,104,3,0,0,214,0,0,0,74,6,0,0,140,1,0,0,52,0,0,0,44,0,0,0,240,0,0,0,66,1,0,0,232,6,0,0,62,0,0,0,100,2,0,0,238,0,0,0,44,0,0,0,80,4,0,0,168,3,0,0,198,4,0,0,56,2,0,0,114,0,0,0,240,1,0,0,196,10,0,0,2,10,0,0,160,5,0,0,146,0,0,0,22,7,0,0,188,3,0,0,134,3,0,0,64,0,0,0,160,0,0,0,72,1,0,0,150,5,0,0,168,2,0,0,232,0,0,0,164,10,0,0,6,2,0,0,98,5,0,0,226,2,0,0,114,0,0,0,96,4,0,0,156,6,0,0,230,0,0,0,136,1,0,0,150,0,0,0,250,4,0,0,238,4,0,0,96,1,0,0,180,1,0,0,54,4,0,0,48,0,0,0,42,0,0,0,28,2,0,0,108,0,0,0,42,2,0,0,254,0,0,0,58,3,0,0,24,3,0,0,214,0,0,0,90,10,0,0,6,4,0,0,224,6,0,0,78,1,0,0,208,0,0,0,70,1,0,0,68,6,0,0,200,8,0,0,102,0,0,0,86,3,0,0,140,1,0,0,92,0,0,0,66,0,0,0,244,2,0,0,244,5,0,0,36,1,0,0,246,6,0,0,182,2,0,0,90,1,0,0,10,2,0,0,144,4,0,0,194,0,0,0,64,10,0,0,158,2,0,0,126,0,0,0,108,9,0,0,92,0,0,0,164,0,0,0,226,1,0,0,162,1,0,0,50,0,0,0,78,7,0,0,230,6,0,0,64,2,0,0,232,0,0,0,60,2,0,0,196,3,0,0,44,2,0,0,118,0,0,0,138,0,0,0,118,1,0,0,254,5,0,0,236,1,0,0,120,3,0,0,110,6,0,0,102,0,0,0,102,1,0,0,56,1,0,0,48,2,0,0,64,0,0,0,22,2,0,0,110,1,0,0,16,1,0,0,74,5,0,0,100,0,0,0,26,9,0,0,254,9,0,0,208,5,0,0,140,1,0,0,48,3,0,0,64,0,0,0,22,1,0,0,2,9,0,0,88,8,0,0,14,2,0,0,94,3,0,0,154,5,0,0,34,2,0,0,158,1,0,0,204,4,0,0,220,0,0,0,234,0,0,0,134,0,0,0,46,0,0,0,136,9,0,0,200,1,0,0,68,3,0,0,176,6,0,0,178,2,0,0,84,2,0,0,48,1,0,0,54,2,0,0,104,7,0,0,166,2,0,0,136,0,0,0,186,5,0,0,142,0,0,0,144,2,0,0,94,0,0,0,138,0,0,0,86,5,0,0,88,6,0,0,10,3,0,0,176,4,0,0,152,3,0,0,122,6,0,0,62,5,0,0,116,2,0,0,246,5,0,0,160,0,0,0,102,5,0,0,178,1,0,0,186,6,0,0,234,1,0,0,80,2,0,0,220,0,0,0,58,4,0,0,10,6,0,0,200,7,0,0,210,1,0,0,42,0,0,0,150,1,0,0,230,0,0,0,108,10,0,0,158,1,0,0,130,4,0,0,128,6,0,0,174,9,0,0,184,0,0,0,8,8,0,0,166,3,0,0,24,1,0,0,80,0,0,0,54,3,0,0,140,8,0,0,154,10,0,0,16,8,0,0,254,2,0,0,74,1,0,0,204,0,0,0,194,3,0,0,2,4,0,0,24,2,0,0,64,0,0,0,134,0,0,0,22,1,0,0,136,2,0,0,56,0,0,0,76,6,0,0,32,7,0,0,154,3,0,0,30,2,0,0,144,0,0,0,154,1,0,0,66,7,0,0,126,10,0,0,98,0,0,0,148,1,0,0,168,0,0,0,32,8,0,0,82,0,0,0,82,2,0,0,180,0,0,0,70,0,0,0,138,0,0,0,170,2,0,0,194,0,0,0,148,4,0,0,58,6,0,0,116,4,0,0,118,10,0,0,252,5,0,0,198,5,0,0,152,0,0,0,46,0,0,0,74,10,0,0,14,9,0,0,4,8,0,0,178,10,0,0,212,0,0,0,76,1,0,0,44,7,0,0,188,7,0,0,54,0,0,0,138,0,0,0,8,2,0,0,236,1,0,0,106,1,0,0,8,3,0,0,218,5,0,0,130,1,0,0,96,0,0,0,46,0,0,0,254,1,0,0,136,5,0,0,178,5,0,0,146,4,0,0,56,0,0,0,48,9,0,0,44,0,0,0,184,3,0,0,178,5,0,0,42,0,0,0,42,0,0,0,148,7,0,0,244,1,0,0,94,0,0,0,100,0,0,0,244,2,0,0,232,4,0,0,110,1,0,0,136,6,0,0,136,5,0,0,180,0,0,0,212,1,0,0,52,0,0,0,10,1,0,0,184,2,0,0,174,2,0,0,22,1,0,0,142,6,0,0,70,3,0,0,146,7,0,0,176,1,0,0,58,4,0,0,134,0,0,0,160,1,0,0,46,1,0,0,114,3,0,0,74,1,0,0,92,0,0,0,200,9,0,0,214,4,0,0,212,2,0,0,104,3,0,0,124,1,0,0,56,2,0,0,48,1,0,0,44,0,0,0,48,0,0,0,76,5,0,0,84,1,0,0,42,0,0,0,52,0,0,0,112,7,0,0,12,3,0,0,64,0,0,0,102,0,0,0,66,2,0,0,166,5,0,0,116,5,0,0,46,1,0,0,248,0,0,0,90,0,0,0,116,6,0,0,108,0,0,0,98,4,0,0,200,2,0,0,132,0,0,0,108,2,0,0,56,0,0,0,26,3,0,0,206,3,0,0,172,2,0,0,150,9,0,0,134,0,0,0,78,10,0,0,122,1,0,0,50,2,0,0,116,5,0,0,120,5,0,0,52,2,0,0,162,6,0,0,168,6,0,0,180,5,0,0,78,0,0,0,36,1,0,0,70,0,0,0,104,3,0,0,56,1,0,0,162,1,0,0,106,0,0,0,62,3,0,0,94,0,0,0,144,1,0,0,224,3,0,0,196,0,0,0,64,1,0,0,154,2,0,0,160,0,0,0,74,0,0,0,220,5,0,0,26,1,0,0,146,2,0,0,232,7,0,0,190,0,0,0,124,2,0,0,248,1,0,0,84,0,0,0,180,1,0,0,162,1,0,0,156,2,0,0,214,0,0,0,96,2,0,0,44,0,0,0,44,0,0,0,44,0,0,0,108,1,0,0,210,0,0,0,226,3,0,0,58,0,0,0,66,3,0,0,0,1,0,0,186,6,0,0,136,1,0,0,198,9,0,0,206,3,0,0,222,2,0,0,18,1,0,0,16,7,0,0,96,6,0,0,62,4,0,0,48,1,0,0,146,1,0,0,26,2,0,0,148,0,0,0,228,1,0,0,132,1,0,0,172,3,0,0,198,1,0,0,246,3,0,0,42,1,0,0,188,2,0,0,10,6,0,0,228,5,0,0,138,9,0,0,82,0,0,0,120,6,0,0,60,2,0,0,86,3,0,0,116,1,0,0,78,4,0,0,118,0,0,0,164,1,0,0,36,1,0,0,64,5,0,0,212,10,0,0,132,3,0,0,198,2,0,0,148,9,0,0,64,2,0,0,60,0,0,0,52,9,0,0,218,1,0,0,2,1,0,0,92,0,0,0,60,0,0,0,142,3,0,0,182,0,0,0,164,0,0,0,184,10,0,0,192,8,0,0,92,9,0,0,14,1,0,0,202,0,0,0,122,0,0,0,4,6,0,0,246,0,0,0,70,5,0,0,42,9,0,0,64,6,0,0,244,3,0,0,4,5,0,0,152,6,0,0,62,1,0,0,222,1,0,0,86,2,0,0,190,10,0,0,78,0,0,0,144,7,0,0,42,7,0,0,234,0,0,0,74,6,0,0,24,10,0,0,254,0,0,0,180,2,0,0,12,1,0,0,244,1,0,0,136,1,0,0,48,0,0,0,188,0,0,0,6,3,0,0,8,3,0,0,84,0,0,0,140,0,0,0,120,2,0,0,242,4,0,0,162,6,0,0,70,3,0,0,16,3,0,0,206,0,0,0,132,0,0,0,66,0,0,0,30,4,0,0,54,0,0,0,116,0,0,0,128,7,0,0,232,4,0,0,234,0,0,0,128,0,0,0,62,1,0,0,34,3,0,0,60,2,0,0,100,0,0,0,92,0,0,0,170,6,0,0,166,4,0,0,194,7,0,0,134,10,0,0,104,5,0,0,94,0,0,0,192,6,0,0,118,5,0,0,222,1,0,0,232,8,0,0,136,2,0,0,18,2,0,0,146,0,0,0,52,0,0,0,40,9,0,0,104,2,0,0,94,9,0,0,134,1,0,0,206,0,0,0,24,3,0,0,242,2,0,0,240,0,0,0,234,2,0,0,72,4,0,0,16,2,0,0,218,2,0,0,28,1,0,0,220,1,0,0,184,0,0,0,16,1,0,0,226,0,0,0,40,3,0,0,12,2,0,0,122,2,0,0,56,3,0,0,170,1,0,0,84,7,0,0,6,1,0,0,246,2,0,0,122,0,0,0,200,0,0,0,238,2,0,0,246,0,0,0,160,4,0,0,42,0,0,0,92,1,0,0,228,9,0,0,12,2,0,0,182,0,0,0,204,0,0,0,240,2,0,0,70,2,0,0,98,1,0,0,22,3,0,0,240,1,0,0,108,4,0,0,64,2,0,0,2,3,0,0,162,3,0,0,164,0,0,0,28,1,0,0,38,2,0,0,216,0,0,0,50,2,0,0,170,1,0,0,68,0,0,0,100,2,0,0,58,0,0,0,44,0,0,0,4,3,0,0,116,1,0,0,248,0,0,0,148,1,0,0,92,0,0,0,50,0,0,0,204,3,0,0,136,0,0,0,154,0,0,0,26,3,0,0,4,1,0,0,62,2,0,0,176,1,0,0,130,0,0,0,2,1,0,0,130,5,0,0,168,0,0,0,190,1,0,0,38,1,0,0,140,0,0,0,234,1,0,0,216,3,0,0,20,2,0,0,130,1,0,0,118,4,0,0,234,1,0,0,130,0,0,0,242,5,0,0,194,2,0,0,168,0,0,0,108,1,0,0,124,3,0,0,60,0,0,0,200,1,0,0,130,1,0,0,132,1,0,0,68,4,0,0,24,1,0,0,46,0,0,0,80,1,0,0,156,1,0,0,122,1,0,0,6,3,0,0,176,2,0,0,92,2,0,0,12,1,0,0,140,0,0,0,62,1,0,0,174,1,0,0,96,0,0,0,78,2,0,0,12,9,0,0,204,3,0,0,114,2,0,0,52,6,0,0,10,1,0,0,222,5,0,0,202,7,0,0,38,5,0,0,240,6,0,0,120,0,0,0,56,0,0,0,64,0,0,0,42,0,0,0,126,3,0,0,84,3,0,0,126,0,0,0,70,4,0,0,40,3,0,0,52,1,0,0,170,5,0,0,150,8,0,0,48,3,0,0,124,1,0,0,14,3,0,0,126,8,0,0,16,3,0,0,220,0,0,0,112,10,0,0,242,1,0,0,32,4,0,0,54,3,0,0,162,1,0,0,54,0,0,0,220,2,0,0,230,7,0,0,46,0,0,0,106,2,0,0,214,1,0,0,124,0,0,0,142,0,0,0,154,1,0,0,26,2,0,0,90,0,0,0,96,0,0,0,42,0,0,0,48,10,0,0,72,8,0,0,52,3,0,0,232,1,0,0,248,3,0,0,246,7,0,0,38,10,0,0,90,1,0,0,30,2,0,0,112,2,0,0,70,6,0,0,128,0,0,0,84,10,0,0,56,6,0,0,78,9,0,0,178,6,0,0,0,2,0,0,118,6,0,0,62,2,0,0,2,4,0,0,120,1,0,0,196,0,0,0,226,2,0,0,88,3,0,0,36,7,0,0,88,2,0,0,72,0,0,0,86,0,0,0,64,4,0,0,92,4,0,0,32,5,0,0,100,1,0,0,94,6,0,0,84,9,0,0,18,7,0,0,154,6,0,0,190,1,0,0,188,1,0,0,108,0,0,0,152,4,0,0,176,4,0,0,64,3,0,0,142,0,0,0,36,2,0,0,180,9,0,0,40,8,0,0,202,0,0,0,236,2,0,0,38,1,0,0,72,4,0,0,46,0,0,0,50,0,0,0,96,4,0,0,212,0,0,0,184,0,0,0,4,2,0,0,76,9,0,0,144,5,0,0,170,6,0,0,94,0,0,0,72,2,0,0,62,0,0,0,160,10,0,0,50,0,0,0,54,0,0,0,182,1,0,0,188,4,0,0,130,2,0,0,70,8,0,0,92,1,0,0,64,0,0,0,50,0,0,0,246,9,0,0,152,1,0,0,134,1,0,0,124,5,0,0,72,0,0,0,90,2,0,0,64,0,0,0,246,2,0,0,46,8,0,0,110,0,0,0,102,0,0,0,114,4,0,0,30,1,0,0,120,0,0,0,60,9,0,0,74,0,0,0,202,3,0,0,160,5,0,0,48,2,0,0,118,8,0,0,182,6,0,0,216,0,0,0,104,10,0,0,252,4,0,0,50,2,0,0,190,2,0,0,224,5,0,0,160,7,0,0,176,5,0,0,22,4,0,0,92,0,0,0,24,2,0,0,52,0,0,0,138,6,0,0,40,2,0,0,6,1,0,0,214,7,0,0,76,1,0,0,48,0,0,0,88,1,0,0,212,2,0,0,210,5,0,0,74,0,0,0,54,2,0,0,254,1,0,0,126,0,0,0,56,9,0,0,150,1,0,0,198,1,0,0,114,3,0,0,0,1,0,0,116,8,0,0,150,10,0,0,70,10,0,0,46,2,0,0,234,1,0,0,66,4,0,0,182,8,0,0,254,5,0,0,194,1,0,0,164,3,0,0,140,5,0,0,6,1,0,0,206,2,0,0,186,1,0,0,68,0,0,0,146,3,0,0,190,4,0,0,156,7,0,0,212,6,0,0,18,1,0,0,78,0,0,0,0,4,0,0,84,8,0,0,174,1,0,0,176,10,0,0,178,0,0,0,18,3,0,0,20,1,0,0,200,3,0,0,102,0,0,0,150,1,0,0,78,0,0,0,56,2,0,0,212,7,0,0,22,2,0,0,92,0,0,0,112,2,0,0,178,9,0,0,194,8,0,0,184,5,0,0,208,4,0,0,130,2,0,0,152,3,0,0,12,4,0,0,86,0,0,0,244,4,0,0,34,6,0,0,230,5,0,0,190,9,0,0,222,0,0,0,142,2,0,0,46,0,0,0,90,1,0,0,68,0,0,0,244,9,0,0,68,0,0,0,246,4,0,0,116,7,0,0,202,10,0,0,220,3,0,0,88,5,0,0,66,6,0,0,222,1,0,0,176,0,0,0,24,6,0,0,218,0,0,0,154,8,0,0,184,4,0,0,136,3,0,0,186,1,0,0,170,2,0,0,44,0,0,0,140,1,0,0,42,0,0,0,124,2,0,0,188,0,0,0,106,0,0,0,70,0,0,0,166,5,0,0,212,4,0,0,6,2,0,0,74,2,0,0,72,0,0,0,184,2,0,0,48,0,0,0,130,7,0,0,78,6,0,0,96,2,0,0,72,9,0,0,248,2,0,0,48,0,0,0,60,0,0,0,74,0,0,0,166,2,0,0,134,2,0,0,4,1,0,0,222,4,0,0,46,0,0,0,164,1,0,0,122,3,0,0,78,0,0,0,108,1,0,0,246,1,0,0,182,9,0,0,134,0,0,0,244,5,0,0,118,6,0,0,190,3,0,0,146,2,0,0,224,7,0,0,156,6,0,0,76,1,0,0,82,4,0,0,76,0,0,0,144,3,0,0,156,1,0,0,194,0,0,0,208,1,0,0,66,1,0,0,144,5,0,0,138,5,0,0,160,1,0,0,8,2,0,0,220,1,0,0,216,0,0,0,194,1,0,0,56,0,0,0,216,5,0,0,48,0,0,0,44,0,0,0,242,5,0,0,184,2,0,0,48,0,0,0,176,3,0,0,130,8,0,0,200,0,0,0,66,0,0,0,74,0,0,0,194,0,0,0,6,3,0,0,122,4,0,0,214,8,0,0,82,0,0,0,52,0,0,0,198,6,0,0,194,0,0,0,180,5,0,0,204,6,0,0,164,1,0,0,196,2,0,0,196,1,0,0,72,6,0,0,124,3,0,0,92,6,0,0,236,4,0,0,60,0,0,0,48,0,0,0,52,0,0,0,88,10,0,0,54,0,0,0,244,8,0,0,46,0,0,0,134,7,0,0,220,8,0,0,10,2,0,0,134,3,0,0,248,8,0,0,180,2,0,0,156,3,0,0,168,2,0,0,208,3,0,0,62,2,0,0,248,1,0,0,20,1,0,0,18,3,0,0,242,6,0,0,198,1,0,0,134,1,0,0,48,0,0,0,56,0,0,0,200,5,0,0,70,1,0,0,214,2,0,0,182,4,0,0,88,0,0,0,14,8,0,0,136,0,0,0,50,0,0,0,130,3,0,0,94,3,0,0,160,6,0,0,0,1,0,0,52,2,0,0,146,0,0,0,114,1,0,0,110,0,0,0,34,8,0,0,52,0,0,0,46,0,0,0,238,9,0,0,62,5,0,0,132,1,0,0,114,0,0,0,44,0,0,0,146,1,0,0,106,4,0,0,42,0,0,0,186,10,0,0,92,1,0,0,56,1,0,0,216,2,0,0,118,1,0,0,190,0,0,0,150,1,0,0,154,0,0,0,150,0,0,0,212,3,0,0,22,2,0,0,214,0,0,0,4,2,0,0,226,2,0,0,118,0,0,0,68,0,0,0,136,4,0,0,222,3,0,0,84,2,0,0,54,0,0,0,72,0,0,0,248,9,0,0,204,0,0,0,176,0,0,0,78,3,0,0,4,2,0,0,92,0,0,0,154,0,0,0,206,1,0,0,120,8,0,0,8,1,0,0,20,5,0,0,124,2,0,0,56,2,0,0,242,1,0,0,222,6,0,0,142,0,0,0,216,2,0,0,76,6,0,0,166,0,0,0,106,1,0,0,214,0,0,0,152,8,0,0,90,0,0,0,168,8,0,0,110,7,0,0,158,9,0,0,224,3,0,0,34,1,0,0,198,1,0,0,84,0,0,0,62,0,0,0,44,1,0,0,212,0,0,0,180,6,0,0,68,0,0,0,138,7,0,0,142,2,0,0,2,7,0,0,188,1,0,0,126,0,0,0,32,1,0,0,188,0,0,0,202,9,0,0,42,1,0,0,30,9,0,0,2,2,0,0,24,1,0,0,84,0,0,0,96,0,0,0,84,6,0,0,6,2,0,0,254,6,0,0,62,0,0,0,100,6,0,0,80,6,0,0,56,0,0,0,98,8,0,0,128,5,0,0,176,1,0,0,92,1,0,0,252,0,0,0,68,1,0,0,236,0,0,0,242,0,0,0,20,6,0,0,96,1,0,0,250,0,0,0,116,1,0,0,194,9,0,0,44,0,0,0,220,1,0,0,168,0,0,0,42,0,0,0,88,2,0,0,122,9,0,0,6,7,0,0,48,0,0,0,28,4,0,0,96,9,0,0,42,0,0,0,168,0,0,0,100,3,0,0,98,0,0,0,232,5,0,0,200,0,0,0,242,0,0,0,62,8,0,0,50,0,0,0,152,0,0,0,166,10,0,0,32,5,0,0,190,2,0,0,60,1,0,0,60,5,0,0,196,5,0,0,248,1,0,0,150,7,0,0,136,1,0,0,24,1,0,0,182,6,0,0,46,2,0,0,172,0,0,0,134,0,0,0,60,0,0,0,34,2,0,0,60,10,0,0,42,0,0,0,74,9,0,0,190,8,0,0,94,1,0,0,210,0,0,0,212,0,0,0,80,3,0,0,122,5,0,0,142,8,0,0,196,2,0,0,10,4,0,0,82,2,0,0,104,8,0,0,104,0,0,0,252,1,0,0,16,1,0,0,32,1,0,0,72,0,0,0,156,5,0,0,92,8,0,0,182,1,0,0,166,6,0,0,192,1,0,0,114,0,0,0,118,0,0,0,164,2,0,0,64,0,0,0,142,1,0,0,60,1,0,0,82,1,0,0,62,0,0,0,128,10,0,0,80,0,0,0,68,7,0,0,122,0,0,0,10,5,0,0,198,0,0,0,42,0,0,0,132,0,0,0,62,0,0,0,44,0,0,0,52,0,0,0,54,0,0,0,46,0,0,0,42,0,0,0,42,0,0,0,62,0,0,0,66,1,0,0,90,0,0,0,80,1,0,0,60,1,0,0,64,1,0,0,210,2,0,0,96,0,0,0,66,3,0,0,202,1,0,0,18,3,0,0,4,1,0,0,244,2,0,0,132,2,0,0,92,0,0,0,110,0,0,0,236,2,0,0,14,1,0,0,196,6,0,0,80,9,0,0,178,0,0,0,82,6,0,0,198,0,0,0,88,0,0,0,94,2,0,0,54,0,0,0,140,10,0,0,248,2,0,0,78,0,0,0,240,5,0,0,228,1,0,0,214,0,0,0,162,0,0,0,172,1,0,0,56,2,0,0,190,0,0,0,88,0,0,0,74,5,0,0,164,1,0,0,48,0,0,0,248,1,0,0,192,7,0,0,28,1,0,0,88,1,0,0,110,1,0,0,36,9,0,0,182,2,0,0,0,2,0,0,24,1,0,0,230,1,0,0,34,1,0,0,196,9,0,0,144,0,0,0,166,0,0,0,0,3,0,0,30,1,0,0,78,0,0,0,66,9,0,0,64,2,0,0,196,1,0,0,118,0,0,0,0,3,0,0,206,6,0,0,110,1,0,0,76,0,0,0,224,2,0,0,146,0,0,0,44,0,0,0,44,1,0,0,150,0,0,0,8,1,0,0,168,6,0,0,124,7,0,0,116,10,0,0,252,3,0,0,42,2,0,0,228,7,0,0,58,5,0,0,228,4,0,0,180,0,0,0,88,1,0,0,226,1,0,0,18,2,0,0,54,1,0,0,198,8,0,0,250,3,0,0,138,1,0,0,24,5,0,0,32,2,0,0,106,1,0,0,22,1,0,0,36,5,0,0,164,1,0,0,58,1,0,0,70,0,0,0,52,0,0,0,250,3,0,0,166,6,0,0,42,1,0,0,138,8,0,0,92,10,0,0,198,2,0,0,130,6,0,0,66,0,0,0,176,9,0,0,46,3,0,0,140,2,0,0,70,4,0,0,32,1,0,0,254,4,0,0,152,1,0,0,96,3,0,0,6,4,0,0,134,2,0,0,46,0,0,0,154,4,0,0,146,0,0,0,126,0,0,0,206,10,0,0,198,1,0,0,196,1,0,0,0,2,0,0,158,10,0,0,204,0,0,0,10,8,0,0,138,0,0,0,96,8,0,0,148,6,0,0,102,7,0,0,132,0,0,0,158,2,0,0,192,0,0,0,28,9,0,0,98,1,0,0,224,2,0,0,10,10,0,0,198,4,0,0,54,8,0,0,144,2,0,0,48,2,0,0,56,0,0,0,140,2,0,0,226,3,0,0,66,5,0,0,116,2,0,0,30,3,0,0,152,1,0,0,206,6,0,0,84,1,0,0,58,0,0,0,70,0,0,0,178,1,0,0,86,4,0,0,26,2,0,0,228,3,0,0,24,3,0,0,58,3,0,0,154,4,0,0,204,2,0,0,6,4,0,0,70,1,0,0,34,2,0,0,44,0,0,0,72,0,0,0,14,1,0,0,234,2,0,0,130,2,0,0,150,1,0,0,74,2,0,0,236,1,0,0,14,3,0,0,150,1,0,0,80,6,0,0,4,10,0,0,16,10,0,0,186,3,0,0,212,1,0,0,42,0,0,0,204,2,0,0,224,1,0,0,8,2,0,0,20,7,0,0,232,9,0,0,210,10,0,0,42,0,0,0,74,1,0,0,68,0,0,0,162,1,0,0,70,1,0,0,2,1,0,0,62,0,0,0,60,0,0,0,54,0,0,0,40,4,0,0,86,0,0,0,176,1,0,0,60,0,0,0,10,1,0,0,172,0,0,0,84,0,0,0,52,0,0,0,98,1,0,0,44,0,0,0,108,2,0,0,194,1,0,0,86,2,0,0,190,0,0,0,12,1,0,0,8,2,0,0,144,1,0,0,178,1,0,0,12,1,0,0,190,4,0,0,42,0,0,0,68,0,0,0,66,0,0,0,186,8,0,0,140,1,0,0,172,5,0,0,152,0,0,0,48,0,0,0,172,7,0,0,16,5,0,0,248,4,0,0,88,2,0,0,46,1,0,0,38,6,0,0,164,8,0,0,74,4,0,0,54,0,0,0,76,2,0,0,4,3,0,0,60,2,0,0,118,1,0,0,190,1,0,0,50,0,0,0,30,1,0,0,182,10,0,0,192,2,0,0,72,3,0,0,228,0,0,0,76,0,0,0,244,0,0,0,148,3,0,0,42,0,0,0,224,1,0,0,234,9,0,0,68,3,0,0,168,2,0,0,70,2,0,0,8,4,0,0,114,0,0,0,228,2,0,0,76,1,0,0,246,1,0,0,42,0,0,0,106,7,0,0,150,3,0,0,192,1,0,0,236,3,0,0,238,0,0,0,110,0,0,0,170,3,0,0,152,1,0,0,88,0,0,0,124,0,0,0,216,9,0,0,130,0,0,0,48,3,0,0,136,0,0,0,192,0,0,0,132,1,0,0,128,0,0,0,224,1,0,0,2,2,0,0,6,1,0,0,228,2,0,0,112,0,0,0,190,6,0,0,18,4,0,0,118,0,0,0,84,0,0,0,90,5,0,0,246,2,0,0,124,4,0,0,80,1,0,0,34,3,0,0,188,1,0,0,100,5,0,0,188,0,0,0,114,1,0,0,54,0,0,0,68,0,0,0,186,1,0,0,100,0,0,0,156,1,0,0,0,0,0,0,10,215,163,60,0,0,0,0,99,111,110,118,101,120,83,119,101,101,112,84,101,115,116,0,67,67,68,32,109,111,116,105,111,110,32,99,108,97,109,112,105,110,103,0,0,0,0,0,82,111,111,116,0,0,0,0,46,46,47,46,46,47,115,114,99,47,66,117,108,108,101,116,67,111,108,108,105,115,105,111,110,47,78,97,114,114,111,119,80,104,97,115,101,67,111,108,108,105,115,105,111,110,47,98,116,80,111,108,121,104,101,100,114,97,108,67,111,110,116,97,99,116,67,108,105,112,112,105,110,103,46,99,112,112,0,0,99,111,110,118,101,120,83,119,101,101,112,67,111,109,112,111,117,110,100,0,0,0,0,0,85,110,105,102,111,114,109,83,99,97,108,105,110,103,83,104,97,112,101,0,0,0,0,0,84,82,73,65,78,71,76,69,77,69,83,72,0,0,0,0,105,110,116,101,103,114,97,116,101,84,114,97,110,115,102,111,114,109,115,0,0,0,0,0,98,116,73,110,116,73,110,100,101,120,68,97,116,97,0,0,98,116,83,116,97,116,105,99,80,108,97,110,101,83,104,97,112,101,68,97,116,97,0,0,100,105,115,112,97,116,99,104,65,108,108,67,111,108,108,105,115,105,111,110,80,97,105,114,115,0,0,0,0,0,0,0,105,115,108,97,110,100,85,110,105,111,110,70,105,110,100,65,110,100,81,117,105,99,107,83,111,114,116,0,0,0,0,0,98,116,83,99,97,108,101,100,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,68,97,116,97,0,0,0,99,97,108,99,117,108,97,116,101,83,105,109,117,108,97,116,105,111,110,73,115,108,97,110,100,115,0,0,0,0,0,0,98,116,83,116,114,105,100,105,110,103,77,101,115,104,73,110,116,101,114,102,97,99,101,68,97,116,97,0,0,0,0,0,98,116,79,112,116,105,109,105,122,101,100,66,118,104,78,111,100,101,68,97,116,97,0,0,99,97,108,99,117,108,97,116,101,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,115,0,0,0,0,0,0,0,98,116,80,111,115,105,116,105,111,110,65,110,100,82,97,100,105,117,115,0,0,0,0,0,115,111,108,118,101,67,111,110,115,116,114,97,105,110,116,115,0,0,0,0,0,0,0,0,72,69,73,71,72,84,70,73,69,76,68,0,0,0,0,0,69,109,112,116,121,0,0,0,98,116,77,101,115,104,80,97,114,116,68,97,116,97,0,0,112,101,114,102,111,114,109,68,105,115,99,114,101,116,101,67,111,108,108,105,115,105,111,110,68,101,116,101,99,116,105,111,110,0,0,0,0,0,0,0,67,121,108,105,110,100,101,114,90,0,0,0,0,0,0,0,117,112,100,97,116,101,65,99,116,105,118,97,116,105,111,110,83,116,97,116,101,0,0,0,98,116,86,101,99,116,111,114,51,68,111,117,98,108,101,68,97,116,97,0,0,0,0,0,98,116,67,111,109,112,111,117,110,100,83,104,97,112,101,67,104,105,108,100,68,97,116,97,0,0,0,0,0,0,0,0,67,121,108,105,110,100,101,114,89,0,0,0,0,0,0,0,117,112,100,97,116,101,65,97,98,98,115,0,0,0,0,0,67,97,112,115,117,108,101,83,104,97,112,101,0,0,0,0,79,118,101,114,102,108,111,119,32,105,110,32,65,65,66,66,44,32,111,98,106,101,99,116,32,114,101,109,111,118,101,100,32,102,114,111,109,32,115,105,109,117,108,97,116,105,111,110,0,0,0,0,0,0,0,0,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,68,97,116,97,0,0,0,0,117,112,100,97,116,101,65,99,116,105,111,110,115,0,0,0,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,70,108,111,97,116,68,97,116,97,0,0,0,0,0,0,98,116,86,101,99,116,111,114,51,70,108,111,97,116,68,97,116,97,0,0,0,0,0,0,98,116,81,117,97,110,116,105,122,101,100,66,118,104,70,108,111,97,116,68,97,116,97,0,67,97,112,115,117,108,101,88,0,0,0,0,0,0,0,0,98,116,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,68,97,116,97,0,98,116,67,111,110,118,101,120,73,110,116,101,114,110,97,108,83,104,97,112,101,68,97,116,97,0,0,0,0,0,0,0,84,104,97,110,107,115,46,10,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,98,116,84,121,112,101,100,67,111,110,115,116,114,97,105,110,116,68,97,116,97,0,0,0,105,110,116,101,114,110,97,108,83,105,110,103,108,101,83,116,101,112,83,105,109,117,108,97,116,105,111,110,0,0,0,0,100,49,62,61,48,46,48,102,0,0,0,0,0,0,0,0,98,116,83,108,105,100,101,114,67,111,110,115,116,114,97,105,110,116,68,97,116,97,0,0,115,111,108,118,101,71,114,111,117,112,67,97,99,104,101,70,114,105,101,110,100,108,121,83,101,116,117,112,0,0,0,0,98,116,67,104,97,114,73,110,100,101,120,84,114,105,112,108,101,116,68,97,116,97,0,0,100,101,98,117,103,68,114,97,119,87,111,114,108,100,0,0,98,116,66,118,104,83,117,98,116,114,101,101,73,110,102,111,68,97,116,97,0,0,0,0,77,117,108,116,105,83,112,104,101,114,101,0,0,0,0,0,98,116,67,121,108,105,110,100,101,114,83,104,97,112,101,68,97,116,97,0,0,0,0,0,67,111,110,118,101,120,0,0,67,111,109,112,111,117,110,100,0,0,0,0,0,0,0,0,80,108,101,97,115,101,32,105,110,99,108,117,100,101,32,97,98,111,118,101,32,105,110,102,111,114,109,97,116,105,111,110,44,32,121,111,117,114,32,80,108,97,116,102,111,114,109,44,32,118,101,114,115,105,111,110,32,111,102,32,79,83,46,10,0,0,0,0,0,0,0,0,116,111,105,32,61,32,37,102,10,0,0,0,0,0,0,0,98,116,82,105,103,105,100,66,111,100,121,70,108,111,97,116,68,97,116,97,0,0,0,0,98,116,67,97,112,115,117,108,101,83,104,97,112,101,68,97,116,97,0,0,0,0,0,0,115,111,108,118,101,71,114,111,117,112,0,0,0,0,0,0,115,116,101,112,83,105,109,117,108,97,116,105,111,110,0,0,98,116,80,111,105,110,116,50,80,111,105,110,116,67,111,110,115,116,114,97,105,110,116,70,108,111,97,116,68,97,116,97,0,0,0,0,0,0,0,0,100,48,62,61,48,46,48,102,0,0,0,0,0,0,0,0,98,116,66,85,95,83,105,109,112,108,101,120,49,116,111,52,0,0,0,0,0,0,0,0,98,116,83,104,111,114,116,73,110,116,73,110,100,101,120,84,114,105,112,108,101,116,68,97,116,97,0,0,0,0,0,0,83,84,65,84,73,67,80,76,65,78,69,0,0,0,0,0,83,80,72,69,82,69,0,0,112,114,111,99,101,115,115,73,115,108,97,110,100,115,0,0,83,67,65,76,69,68,66,86,72,84,82,73,65,78,71,76,69,77,69,83,72,0,0,0,84,114,105,97,110,103,108,101,0,0,0,0,0,0,0,0,98,116,81,117,97,110,116,105,122,101,100,66,118,104,78,111,100,101,68,97,116,97,0,0,98,116,72,105,110,103,101,67,111,110,115,116,114,97,105,110,116,70,108,111,97,116,68,97,116,97,0,0,0,0,0,0,98,116,77,117,108,116,105,83,112,104,101,114,101,83,104,97,112,101,68,97,116,97,0,0,67,121,108,105,110,100,101,114,88,0,0,0,0,0,0,0,67,111,110,118,101,120,84,114,105,109,101,115,104,0,0,0,98,116,67,111,110,118,101,120,72,117,108,108,83,104,97,112,101,68,97,116,97,0,0,0,98,116,71,101,110,101,114,105,99,54,68,111,102,67,111,110,115,116,114,97,105,110,116,68,97,116,97,0,0,0,0,0,67,111,110,101,0,0,0,0,98,116,67,111,109,112,111,117,110,100,83,104,97,112,101,68,97,116,97,0,0,0,0,0,73,102,32,121,111,117,32,99,97,110,32,114,101,112,114,111,100,117,99,101,32,116,104,105,115,44,32,112,108,101,97,115,101,32,101,109,97,105,108,32,98,117,103,115,64,99,111,110,116,105,110,117,111,117,115,112,104,121,115,105,99,115,46,99,111,109,10,0,0,0,0,0,67,97,112,115,117,108,101,90,0,0,0,0,0,0,0,0,66,86,72,84,82,73,65,78,71,76,69,77,69,83,72,0,66,111,120,0,0,0,0,0,115,121,110,99,104,114,111,110,105,122,101,77,111,116,105,111,110,83,116,97,116,101,115,0,115,111,108,118,101,71,114,111,117,112,67,97,99,104,101,70,114,105,101,110,100,108,121,73,116,101,114,97,116,105,111,110,115,0,0,0,0,0,0,0,112,114,101,100,105,99,116,85,110,99,111,110,115,116,114,97,105,110,116,77,111,116,105,111,110,0,0,0,0,0,0,0,115,101,97,114,99,104,32,115,112,101,99,117,108,97,116,105,118,101,32,99,111,110,116,97,99,116,115,0,0,0,0,0,97,100,100,83,112,101,99,117,108,97,116,105,118,101,67,111,110,116,97,99,116,115,0,0,98,116,67,111,110,101,84,119,105,115,116,67,111,110,115,116,114,97,105,110,116,68,97,116,97,0,0,0,0,0,0,0,98,111,111,108,32,84,101,115,116,83,101,112,65,120,105,115,40,99,111,110,115,116,32,98,116,67,111,110,118,101,120,80,111,108,121,104,101,100,114,111,110,32,38,44,32,99,111,110,115,116,32,98,116,67,111,110,118,101,120,80,111,108,121,104,101,100,114,111,110,32,38,44,32,99,111,110,115,116,32,98,116,84,114,97,110,115,102,111,114,109,32,38,44,32,99,111,110,115,116,32,98,116,84,114,97,110,115,102,111,114,109,32,38,44,32,99,111,110,115,116,32,98,116,86,101,99,116,111,114,51,32,38,44,32,102,108,111,97,116,32,38,41,0,0,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,208,132,0,0,120,0,0,0,2,4,0,0,72,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,132,0,0,196,1,0,0,228,3,0,0,184,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,132,0,0,112,0,0,0,186,3,0,0,30,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,133,0,0,144,3,0,0,210,0,0,0,118,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,133,0,0,194,1,0,0,196,2,0,0,176,0,0,0,54,0,0,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,133,0,0,192,3,0,0,34,3,0,0,62,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,133,0,0,86,2,0,0,228,1,0,0,204,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,133,0,0,30,4,0,0,14,4,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,133,0,0,120,1,0,0,212,3,0,0,112,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,133,0,0,132,1,0,0,94,2,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,133,0,0,4,4,0,0,220,0,0,0,120,1,0,0,102,1,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,133,0,0,180,0,0,0,34,1,0,0,78,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,133,0,0,182,2,0,0,228,0,0,0,122,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,133,0,0,18,2,0,0,54,0,0,0,166,1,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,133,0,0,88,3,0,0,58,0,0,0,166,1,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,133,0,0,182,0,0,0,200,3,0,0,230,1,0,0,72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,133,0,0,88,1,0,0,138,0,0,0,238,0,0,0,26,3,0,0,60,0,0,0,88,1,0,0,154,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,133,0,0,116,2,0,0,140,2,0,0,122,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,133,0,0,134,2,0,0,156,0,0,0,122,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,134,0,0,236,2,0,0,160,0,0,0,86,1,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,134,0,0,104,0,0,0,66,0,0,0,220,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,134,0,0,206,2,0,0,126,1,0,0,186,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,134,0,0,164,2,0,0,148,2,0,0,66,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,134,0,0,18,4,0,0,186,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,134,0,0,32,2,0,0,6,1,0,0,106,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,134,0,0,172,0,0,0,166,1,0,0,88,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,134,0,0,76,2,0,0,254,2,0,0,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,134,0,0,0,4,0,0,70,1,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,134,0,0,176,2,0,0,102,3,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,134,0,0,108,1,0,0,4,3,0,0,102,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,134,0,0,224,3,0,0,42,3,0,0,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,134,0,0,248,0,0,0,174,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,134,0,0,22,2,0,0,206,0,0,0,70,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,135,0,0,60,0,0,0,32,3,0,0,180,1,0,0,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,135,0,0,4,2,0,0,202,2,0,0,148,1,0,0,90,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,135,0,0,190,2,0,0,70,3,0,0,148,1,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,135,0,0,172,1,0,0,0,4,0,0,182,1,0,0,96,0,0,0,94,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,135,0,0,0,2,0,0,144,0,0,0,82,0,0,0,232,1,0,0,174,0,0,0,70,0,0,0,112,0,0,0,226,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,135,0,0,238,1,0,0,190,0,0,0,204,0,0,0,46,0,0,0,250,1,0,0,158,2,0,0,52,0,0,0,42,0,0,0,44,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,135,0,0,136,0,0,0,2,1,0,0,90,0,0,0,66,0,0,0,8,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,135,0,0,232,2,0,0,248,3,0,0,52,0,0,0,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,135,0,0,64,0,0,0,116,3,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,135,0,0,106,3,0,0,238,3,0,0,118,0,0,0,50,0,0,0,146,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,0,0,188,3,0,0,72,0,0,0,56,0,0,0,62,0,0,0,132,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,136,0,0,112,2,0,0,44,1,0,0,174,10,0,0,144,3,0,0,86,9,0,0,4,1,0,0,234,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,136,0,0,28,4,0,0,146,3,0,0,128,0,0,0,44,0,0,0,192,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,136,0,0,208,0,0,0,118,1,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,136,0,0,74,3,0,0,126,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,136,0,0,196,0,0,0,166,3,0,0,48,2,0,0,68,0,0,0,28,3,0,0,148,3,0,0,56,0,0,0,62,0,0,0,98,0,0,0,6,10,0,0,242,0,0,0,132,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,136,0,0,154,2,0,0,84,1,0,0,240,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,136,0,0,52,2,0,0,68,3,0,0,20,2,0,0,48,1,0,0,202,2,0,0,58,0,0,0,70,6,0,0,250,7,0,0,106,0,0,0,112,8,0,0,92,1,0,0,72,2,0,0,56,8,0,0,210,0,0,0,154,1,0,0,228,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,136,0,0,124,2,0,0,212,0,0,0,124,0,0,0,94,0,0,0,84,1,0,0,162,5,0,0,32,6,0,0,98,7,0,0,246,0,0,0,86,7,0,0,118,1,0,0,248,2,0,0,208,0,0,0,234,0,0,0,96,7,0,0,112,5,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,136,0,0,92,2,0,0,242,3,0,0,130,0,0,0,60,0,0,0,108,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,136,0,0,96,2,0,0,212,2,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,136,0,0,16,4,0,0,58,2,0,0,106,0,0,0,48,0,0,0,58,0,0,0,92,4,0,0,28,6,0,0,26,6,0,0,204,3,0,0,194,4,0,0,202,8,0,0,98,0,0,0,24,1,0,0,142,9,0,0,206,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,136,0,0,14,3,0,0,170,3,0,0,80,0,0,0,56,0,0,0,154,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,137,0,0])
.concat([184,2,0,0,234,3,0,0,148,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,137,0,0,226,0,0,0,2,2,0,0,114,1,0,0,190,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,137,0,0,198,3,0,0,26,1,0,0,152,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,36,6,0,0,110,9,0,0,82,0,0,0,210,6,0,0,92,1,0,0,72,2,0,0,110,4,0,0,90,0,0,0,154,1,0,0,78,2,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,137,0,0,216,1,0,0,142,3,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,137,0,0,172,1,0,0,244,1,0,0,202,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,52,4,0,0,140,9,0,0,94,0,0,0,30,8,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,46,0,0,0,110,1,0,0,58,0,0,0,120,1,0,0,220,6,0,0,64,1,0,0,90,8,0,0,4,4,0,0,228,1,0,0,228,1,0,0,124,0,0,0,214,5,0,0,70,1,0,0,58,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,137,0,0,142,0,0,0,210,3,0,0,168,1,0,0,44,5,0,0,186,3,0,0,246,1,0,0,42,2,0,0,168,1,0,0,180,1,0,0,236,0,0,0,112,3,0,0,242,3,0,0,52,0,0,0,190,1,0,0,54,3,0,0,90,3,0,0,140,3,0,0,4,4,0,0,130,6,0,0,134,0,0,0,198,0,0,0,66,2,0,0,190,1,0,0,228,5,0,0,214,2,0,0,162,9,0,0,212,1,0,0,222,1,0,0,16,6,0,0,90,1,0,0,164,4,0,0,88,0,0,0,58,2,0,0,116,2,0,0,48,2,0,0,90,0,0,0,228,1,0,0,94,0,0,0,12,2,0,0,114,1,0,0,46,2,0,0,62,2,0,0,238,5,0,0,62,1,0,0,230,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,137,0,0,250,2,0,0,84,2,0,0,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,137,0,0,114,3,0,0,186,2,0,0,36,1,0,0,186,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,137,0,0,46,1,0,0,12,2,0,0,106,1,0,0,220,3,0,0,58,9,0,0,244,0,0,0,232,3,0,0,14,1,0,0,76,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,137,0,0,224,2,0,0,252,3,0,0,136,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,137,0,0,124,0,0,0,80,3,0,0,152,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,137,0,0,54,3,0,0,202,3,0,0,164,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,224,1,0,0,76,7,0,0,94,0,0,0,42,0,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,112,0,0,0,44,1,0,0,188,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,90,8,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,137,0,0,122,2,0,0,144,2,0,0,44,3,0,0,68,0,0,0,254,3,0,0,98,6,0,0,56,0,0,0,66,0,0,0,66,0,0,0,240,3,0,0,158,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,0,0,184,3,0,0,8,2,0,0,48,2,0,0,68,0,0,0,28,3,0,0,148,4,0,0,56,0,0,0,62,0,0,0,98,0,0,0,102,10,0,0,252,0,0,0,132,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,138,0,0,246,3,0,0,118,2,0,0,168,1,0,0,44,5,0,0,186,3,0,0,246,1,0,0,42,2,0,0,168,1,0,0,180,1,0,0,236,0,0,0,112,3,0,0,242,3,0,0,52,0,0,0,190,1,0,0,54,3,0,0,90,3,0,0,140,3,0,0,4,4,0,0,130,6,0,0,134,0,0,0,198,0,0,0,66,2,0,0,190,1,0,0,228,5,0,0,214,2,0,0,162,9,0,0,212,1,0,0,222,1,0,0,138,4,0,0,90,1,0,0,164,4,0,0,88,0,0,0,58,2,0,0,116,2,0,0,48,2,0,0,90,0,0,0,228,1,0,0,94,0,0,0,12,2,0,0,10,1,0,0,46,2,0,0,62,2,0,0,238,5,0,0,62,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,138,0,0,240,3,0,0,78,2,0,0,100,0,0,0,52,0,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,138,0,0,42,2,0,0,196,3,0,0,168,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,138,0,0,20,3,0,0,184,0,0,0,36,1,0,0,186,0,0,0,92,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,138,0,0,102,0,0,0,96,3,0,0,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,138,0,0,214,3,0,0,98,2,0,0,238,0,0,0,158,5,0,0,60,0,0,0,88,1,0,0,154,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,138,0,0,162,3,0,0,72,1,0,0,182,0,0,0,48,1,0,0,202,2,0,0,58,0,0,0,72,1,0,0,166,4,0,0,120,0,0,0,98,10,0,0,92,1,0,0,72,2,0,0,84,3,0,0,148,0,0,0,154,1,0,0,210,1,0,0,66,0,0,0,200,0,0,0,58,1,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,138,0,0,180,3,0,0,148,0,0,0,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,138,0,0,36,3,0,0,204,1,0,0,48,2,0,0,68,0,0,0,28,3,0,0,148,4,0,0,56,0,0,0,62,0,0,0,98,0,0,0,102,10,0,0,252,0,0,0,132,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,138,0,0,24,4,0,0,92,3,0,0,198,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,22,5,0,0,106,6,0,0,102,0,0,0,132,4,0,0,110,0,0,0,214,2,0,0,110,4,0,0,90,0,0,0,154,1,0,0,126,1,0,0,56,1,0,0,122,1,0,0,16,2,0,0,66,1,0,0,150,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,138,0,0,130,3,0,0,190,3,0,0,22,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,138,0,0,182,3,0,0,110,0,0,0,80,2,0,0,44,5,0,0,186,3,0,0,222,2,0,0,42,2,0,0,168,1,0,0,194,1,0,0,66,2,0,0,112,3,0,0,160,3,0,0,48,0,0,0,232,0,0,0,90,6,0,0,28,5,0,0,30,6,0,0,2,6,0,0,192,2,0,0,218,3,0,0,212,5,0,0,14,2,0,0,206,2,0,0,18,4,0,0,20,4,0,0,94,2,0,0,112,1,0,0,120,0,0,0,226,1,0,0,182,1,0,0,248,4,0,0,130,5,0,0,86,6,0,0,178,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,139,0,0,158,0,0,0,110,3,0,0,38,3,0,0,68,0,0,0,88,6,0,0,66,4,0,0,66,0,0,0,60,0,0,0,62,0,0,0,12,7,0,0,74,0,0,0,162,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,139,0,0,222,3,0,0,30,3,0,0,48,0,0,0,220,0,0,0,254,0,0,0,220,4,0,0,62,0,0,0,250,0,0,0,34,2,0,0,192,10,0,0,184,1,0,0,144,9,0,0,164,3,0,0,210,7,0,0,40,1,0,0,36,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,139,0,0,16,3,0,0,252,1,0,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,139,0,0,172,2,0,0,6,2,0,0,210,5,0,0,96,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,139,0,0,146,0,0,0,100,3,0,0,42,0,0,0,42,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,139,0,0,242,0,0,0,250,1,0,0,46,0,0,0,74,0,0,0,88,0,0,0,86,2,0,0,64,0,0,0,234,0,0,0,64,1,0,0,120,7,0,0,180,8,0,0,22,1,0,0,208,4,0,0,230,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,139,0,0,26,2,0,0,236,1,0,0,54,0,0,0,52,1,0,0,72,0,0,0,230,0,0,0,54,0,0,0,192,1,0,0,150,3,0,0,130,2,0,0,248,6,0,0,172,1,0,0,112,3,0,0,24,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,139,0,0,98,3,0,0,180,1,0,0,238,0,0,0,254,4,0,0,60,0,0,0,88,1,0,0,154,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,139,0,0,70,2,0,0,22,1,0,0,182,0,0,0,48,1,0,0,202,2,0,0,58,0,0,0,88,5,0,0,166,4,0,0,120,0,0,0,0,6,0,0,92,1,0,0,72,2,0,0,110,4,0,0,90,0,0,0,154,1,0,0,190,1,0,0,66,0,0,0,200,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,139,0,0,100,1,0,0,142,2,0,0,162,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,139,0,0,176,0,0,0,140,3,0,0,78,0,0,0,74,0,0,0,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,139,0,0,156,3,0,0,100,2,0,0,238,0,0,0,188,0,0,0,60,0,0,0,88,1,0,0,154,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,139,0,0,218,1,0,0,102,1,0,0,156,0,0,0,48,1,0,0,202,2,0,0,58,0,0,0,44,3,0,0,44,6,0,0,112,0,0,0,114,9,0,0,92,1,0,0,72,2,0,0,248,7,0,0,224,0,0,0,154,1,0,0,78,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,139,0,0,132,2,0,0,178,1,0,0,152,2,0,0,68,0,0,0,146,1,0,0,238,3,0,0,56,0,0,0,42,0,0,0,58,0,0,0,250,2,0,0,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,139,0,0,136,2,0,0,12,4,0,0,56,0,0,0,218,0,0,0,64,0,0,0,252,1,0,0,90,0,0,0,94,1,0,0,174,4,0,0,88,7,0,0,218,6,0,0,20,1,0,0,44,0,0,0,22,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,140,0,0,66,1,0,0,254,1,0,0,126,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,158,6,0,0,76,7,0,0,46,0,0,0,100,4,0,0,172,0,0,0,58,2,0,0,88,9,0,0,226,0,0,0,154,1,0,0,112,0,0,0,184,0,0,0,44,2,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,140,0,0,158,3,0,0,50,1,0,0,48,2,0,0,68,0,0,0,28,3,0,0,148,3,0,0,56,0,0,0,62,0,0,0,98,0,0,0,6,10,0,0,242,0,0,0,132,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,140,0,0,44,2,0,0,178,3,0,0,182,0,0,0,172,1,0,0,60,0,0,0,88,1,0,0,154,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,140,0,0,230,3,0,0,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,140,0,0,130,0,0,0,78,3,0,0,152,2,0,0,68,0,0,0,42,0,0,0,42,0,0,0,56,0,0,0,42,0,0,0,42,0,0,0,34,5,0,0,198,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,140,0,0,48,0,0,0,30,1,0,0,40,3,0,0,68,0,0,0,102,5,0,0,230,2,0,0,56,0,0,0,64,0,0,0,50,0,0,0,184,7,0,0,228,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,140,0,0,216,2,0,0,232,3,0,0,76,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,140,0,0,58,3,0,0,154,3,0,0,202,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,116,6,0,0,76,7,0,0,94,0,0,0,152,7,0,0,172,0,0,0,58,2,0,0,230,9,0,0,152,0,0,0,154,1,0,0,248,0,0,0,254,0,0,0,142,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,90,8,0,0,190,5,0,0,170,0,0,0,100,0,0,0,40,1,0,0,132,9,0,0,40,2,0,0,74,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,140,0,0,46,1,0,0,110,2,0,0,0,3,0,0,220,3,0,0,58,9,0,0,244,0,0,0,232,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,140,0,0,240,0,0,0,146,1,0,0,54,0,0,0,52,1,0,0,72,0,0,0,230,0,0,0,54,0,0,0,192,1,0,0,150,3,0,0,130,2,0,0,248,6,0,0,172,1,0,0,112,3,0,0,24,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,140,0,0,6,3,0,0,142,1,0,0,178,1,0,0,218,0,0,0,252,255,255,255,184,140,0,0,118,0,0,0,72,3,0,0,54,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,140,0,0,84,3,0,0,36,2,0,0,42,0,0,0,46,4,0,0,78,1,0,0,86,1,0,0,128,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,140,0,0,14,1,0,0,148,3,0,0,8,1,0,0,142,1,0,0,60,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,140,0,0,10,1,0,0,26,4,0,0,36,1,0,0,186,0,0,0,50,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,141,0,0,106,0,0,0,114,1,0,0,138,0,0,0,46,0,0,0,230,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,141,0,0,78,0,0,0,28,3,0,0,58,0,0,0,46,1,0,0,124,0,0,0,130,1,0,0,78,0,0,0,68,0,0,0,246,0,0,0,252,9,0,0,20,2,0,0,138,1,0,0,146,5,0,0,52,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,141,0,0,80,1,0,0,78,1,0,0,12,2,0,0,48,1,0,0,202,2,0,0,58,0,0,0,106,2,0,0,76,7,0,0,72,0,0,0,216,10,0,0,32,2,0,0,58,2,0,0,224,10,0,0,246,0,0,0,154,1,0,0,80,0,0,0,42,0,0,0,248,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,68,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,141,0,0,76,0,0,0,194,2,0,0,12,2,0,0,48,1,0,0,202,2,0,0,58,0,0,0,106,2,0,0,76,7,0,0,72,0,0,0,184,9,0,0,32,2,0,0,58,2,0,0,224,10,0,0,246,0,0,0,154,1,0,0,80,0,0,0,42,1,0,0,160,0,0,0,120,1,0,0,220,6,0,0,64,1,0,0,12,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,141,0,0,114,0,0,0,250,0,0,0,168,1,0,0,44,5,0,0,186,3,0,0,84,0,0,0,42,2,0,0,168,1,0,0,194,1,0,0,46,5,0,0,112,3,0,0,160,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,141,0,0,150,3,0,0,244,2,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,141,0,0,220,3,0,0,40,1,0,0,70,0,0,0,48,1,0,0,202,2,0,0,58,0,0,0,90,5,0,0,76,7,0,0,94,0,0,0,62,10,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,112,0,0,0,44,1,0,0,188,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,90,8,0,0,20,10,0,0,194,4,0,0,164,0,0,0,96,0,0,0,164,9,0,0,0,2,0,0,56,0,0,0,208,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,141,0,0,116,1,0,0,116,0,0,0,168,0,0,0,48,1,0,0,202,2,0,0,58,0,0,0,224,1,0,0,76,7,0,0,54,0,0,0,108,2,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,112,0,0,0,96,1,0,0,18,1,0,0,120,1,0,0,248,3,0,0,108,1,0,0,90,8,0,0,52,4,0,0,106,8,0,0,98,0,0,0,194,1,0,0,52,6,0,0,162,0,0,0,48,0,0,0,36,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,141,0,0,48,3,0,0,120,3,0,0,156,0,0,0,46,0,0,0,220,0,0,0,38,7,0,0,68,5,0,0,200,0,0,0,170,0,0,0,244,0,0,0,134,1,0,0,26,6,0,0,228,0,0,0,116,0,0,0,146,6,0,0,90,0,0,0,238,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,141,0,0,82,3,0,0,114,2,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,141,0,0,204,0,0,0,104,2,0,0,12,2,0,0,48,1,0,0,202,2,0,0,58,0,0,0,106,2,0,0,76,7,0,0,72,0,0,0,158,5,0,0,32,2,0,0,58,2,0,0,224,10,0,0,246,0,0,0,154,1,0,0,80,0,0,0,170,1,0,0,88,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,250,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,141,0,0,202,1,0,0,122,0,0,0,26,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,182,1,0,0,142,1,0,0,100,0,0,0,10,9,0,0,184,1,0,0,170,2,0,0,120,4,0,0,240,0,0,0,154,1,0,0,124,0,0,0,20,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,141,0,0,66,2,0,0,240,2,0,0,200,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,26,4,0,0,76,7,0,0,50,0,0,0,28,10,0,0,196,1,0,0,58,2,0,0,174,3,0,0,186,0,0,0,154,1,0,0,112,0,0,0,26,1,0,0,244,0,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,141,0,0,226,1,0,0,42,1,0,0,200,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,26,4,0,0,76,7,0,0,50,0,0,0,72,7,0,0,196,1,0,0,58,2,0,0,174,3,0,0,186,0,0,0,154,1,0,0,112,0,0,0,26,1,0,0,244,0,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,141,0,0,72,2,0,0,62,3,0,0,106,0,0,0,48,0,0,0,58,0,0,0,92,4,0,0,28,6,0,0,26,6,0,0,134,6,0,0,102,3,0,0,202,8,0,0,98,0,0,0,24,1,0,0,142,9,0,0,206,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,142,0,0,68,0,0,0,200,1,0,0,72,0,0,0,60,0,0,0,202,0,0,0,170,3,0,0,252,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,142,0,0,38,2,0,0,126,3,0,0,72,0,0,0,60,0,0,0,202,0,0,0,170,3,0,0,252,5,0,0,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,142,0,0,180,2,0,0,168,3,0,0,200,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,26,4,0,0,76,7,0,0,50,0,0,0,136,8,0,0,196,1,0,0,58,2,0,0,174,3,0,0,186,0,0,0,154,1,0,0,112,0,0,0,26,1,0,0,244,0,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,142,0,0,62,0,0,0,248,2,0,0,66,0,0,0,48,1,0,0,202,2,0,0,58,0,0,0,224,1,0,0,76,7,0,0,136,0,0,0,250,6,0,0,108,0,0,0,28,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,16,1,0,0,68,1,0,0,110,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,142,0,0,46,1,0,0,56,3,0,0,170,1,0,0,220,3,0,0,58,9,0,0,244,0,0,0,232,3,0,0,2,1,0,0,52,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,142,0,0,28,2,0,0,178,0,0,0,64,2,0,0,48,1,0,0,202,2,0,0,58,0,0,0,14,4,0,0,114,8,0,0,90,0,0,0,150,6,0,0,92,1,0,0,72,2,0,0,110,4,0,0,90,0,0,0,154,1,0,0,10,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,142,0,0,160,2,0,0,134,3,0,0,164,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,36,3,0,0,76,7,0,0,76,0,0,0,234,4,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,58,1,0,0,60,1,0,0,84,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,142,0,0,122,3,0,0,220,2,0,0,164,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,36,3,0,0,76,7,0,0,76,0,0,0,234,4,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,58,1,0,0,60,1,0,0,84,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,142,0,0,194,3,0,0,46,2,0,0,46,0,0,0,74,0,0,0,88,0,0,0,86,2,0,0,64,0,0,0,234,0,0,0,64,1,0,0,120,7,0,0,180,8,0,0,22,1,0,0,208,4,0,0,230,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,142,0,0,184,0,0,0,198,0,0,0,208,1,0,0,220,3,0,0,196,8,0,0,208,0,0,0,68,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,142,0,0,30,2,0,0,148,1,0,0,164,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,36,3,0,0,76,7,0,0,76,0,0,0,234,4,0,0,172,0,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,58,1,0,0,60,1,0,0,84,1,0,0,120,1,0,0,220,6,0,0,64,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,142,0,0,104,1,0,0,166,2,0,0,138,1,0,0,48,1,0,0,202,2,0,0,58,0,0,0,220,5,0,0,76,7,0,0,56,0,0,0,6,8,0,0,26,1,0,0,58,2,0,0,86,6,0,0,118,0,0,0,154,1,0,0,214,0,0,0,60,0,0,0,134,1,0,0,120,1,0,0,214,6,0,0,146,1,0,0,90,8,0,0,204,8,0,0,136,6,0,0,238,1,0,0,38,1,0,0,78,4,0,0,250,0,0,0,72,0,0,0,188,1,0,0,0,0,0,0,0,0,0,0,90,78,75,50,53,98,116,67,111,110,118,101,120,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,51,49,99,97,108,99,117,108,97,116,101,80,114,105,110,99,105,112,97,108,65,120,105,115,84,114,97,110,115,102,111,114,109,69,82,49,49,98,116,84,114,97,110,115,102,111,114,109,82,57,98,116,86,101,99,116,111,114,51,82,102,69,49,53,73,110,101,114,116,105,97,67,97,108,108,98,97,99,107,95,48,0,90,78,75,50,53,98,116,67,111,110,118,101,120,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,51,49,99,97,108,99,117,108,97,116,101,80,114,105,110,99,105,112,97,108,65,120,105,115,84,114,97,110,115,102,111,114,109,69,82,49,49,98,116,84,114,97,110,115,102,111,114,109,82,57,98,116,86,101,99,116,111,114,51,82,102,69,49,52,67,101,110,116,101,114,67,97,108,108,98,97,99,107,0,0,0,0,90,78,75,50,50,98,116,66,118,104,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,49,57,112,114,111,99,101,115,115,65,108,108,84,114,105,97,110,103,108,101,115,69,80,49,56,98,116,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,82,75,57,98,116,86,101,99,116,111,114,51,83,52,95,69,50,49,77,121,78,111,100,101,79,118,101,114,108,97,112,67,97,108,108,98,97,99,107,0,0,0,90,78,75,49,57,98,116,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,49,57,112,114,111,99,101,115,115,65,108,108,84,114,105,97,110,103,108,101,115,69,80,49,56,98,116,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,82,75,57,98,116,86,101,99,116,111,114,51,83,52,95,69,49,54,70,105,108,116,101,114,101,100,67,97,108,108,98,97,99,107,0,0,0,90,78,51,51,98,116,77,105,110,107,111,119,115,107,105,80,101,110,101,116,114,97,116,105,111,110,68,101,112,116,104,83,111,108,118,101,114,49,50,99,97,108,99,80,101,110,68,101,112,116,104,69,82,50,50,98,116,86,111,114,111,110,111,105,83,105,109,112,108,101,120,83,111,108,118,101,114,80,75,49,51,98,116,67,111,110,118,101,120,83,104,97,112,101,83,52,95,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,55,95,82,57,98,116,86,101,99,116,111,114,51,83,57,95,83,57,95,80,49,50,98,116,73,68,101,98,117,103,68,114,97,119,80,49,50,98,116,83,116,97,99,107,65,108,108,111,99,69,50,48,98,116,73,110,116,101,114,109,101,100,105,97,116,101,82,101,115,117,108,116,0,0,0,0,0,0,0,90,78,51,51,98,116,67,111,110,118,101,120,67,111,110,99,97,118,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,50,49,99,97,108,99,117,108,97,116,101,84,105,109,101,79,102,73,109,112,97,99,116,69,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,83,49,95,82,75,49,54,98,116,68,105,115,112,97,116,99,104,101,114,73,110,102,111,80,49,54,98,116,77,97,110,105,102,111,108,100,82,101,115,117,108,116,69,51,49,76,111,99,97,108,84,114,105,97,110,103,108,101,83,112,104,101,114,101,67,97,115,116,67,97,108,108,98,97,99,107,0,0,0,90,78,50,56,98,116,72,97,115,104,101,100,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,67,97,99,104,101,51,55,114,101,109,111,118,101,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,115,67,111,110,116,97,105,110,105,110,103,80,114,111,120,121,69,80,49,55,98,116,66,114,111,97,100,112,104,97,115,101,80,114,111,120,121,80,49,50,98,116,68,105,115,112,97,116,99,104,101,114,69,49,56,82,101,109,111,118,101,80,97,105,114,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,0,90,78,50,56,98,116,72,97,115,104,101,100,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,67,97,99,104,101,49,57,99,108,101,97,110,80,114,111,120,121,70,114,111,109,80,97,105,114,115,69,80,49,55,98,116,66,114,111,97,100,112,104,97,115,101,80,114,111,120,121,80,49,50,98,116,68,105,115,112,97,116,99,104,101,114,69,49,55,67,108,101,97,110,80,97,105,114,67,97,108,108,98,97,99,107,0,0,0,90,78,50,51,98,116,83,116,114,105,100,105,110,103,77,101,115,104,73,110,116,101,114,102,97,99,101,50,51,99,97,108,99,117,108,97,116,101,65,97,98,98,66,114,117,116,101,70,111,114,99,101,69,82,57,98,116,86,101,99,116,111,114,51,83,49,95,69,50,51,65,97,98,98,67,97,108,99,117,108,97,116,105,111,110,67,97,108,108,98,97,99,107,0,0,0,90,78,50,51,98,116,68,105,115,99,114,101,116,101,68,121,110,97,109,105,99,115,87,111,114,108,100,49,54,115,111,108,118,101,67,111,110,115,116,114,97,105,110,116,115,69,82,49,57,98,116,67,111,110,116,97,99,116,83,111,108,118,101,114,73,110,102,111,69,50,55,73,110,112,108,97,99,101,83,111,108,118,101,114,73,115,108,97,110,100,67,97,108,108,98,97,99,107,0,0,0,0,0,0,90,78,50,51,98,116,67,111,110,118,101,120,67,111,110,118,101,120,65,108,103,111,114,105,116,104,109,49,54,112,114,111,99,101,115,115,67,111,108,108,105,115,105,111,110,69,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,83,49,95,82,75,49,54,98,116,68,105,115,112,97,116,99,104,101,114,73,110,102,111,80,49,54,98,116,77,97,110,105,102,111,108,100,82,101,115,117,108,116,69,49,51,98,116,68,117,109,109,121,82,101,115,117,108,116,0,0,0,0,90,78,50,50,98,116,66,118,104,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,49,55,112,101,114,102,111,114,109,67,111,110,118,101,120,99,97,115,116,69,80,49,56,98,116,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,82,75,57,98,116,86,101,99,116,111,114,51,83,52,95,83,52,95,83,52,95,69,50,49,77,121,78,111,100,101,79,118,101,114,108,97,112,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,0,90,78,50,50,98,116,66,118,104,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,49,52,112,101,114,102,111,114,109,82,97,121,99,97,115,116,69,80,49,56,98,116,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,82,75,57,98,116,86,101,99,116,111,114,51,83,52,95,69,50,49,77,121,78,111,100,101,79,118,101,114,108,97,112,67,97,108,108,98,97,99,107,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,55,111,98,106,101,99,116,81,117,101,114,121,83,105,110,103,108,101,69,80,75,49,51,98,116,67,111,110,118,101,120,83,104,97,112,101,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,53,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,53,95,82,78,83,95,50,48,67,111,110,118,101,120,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,102,69,51,50,66,114,105,100,103,101,84,114,105,97,110,103,108,101,67,111,110,118,101,120,99,97,115,116,67,97,108,108,98,97,99,107,95,48,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,55,111,98,106,101,99,116,81,117,101,114,121,83,105,110,103,108,101,69,80,75,49,51,98,116,67,111,110,118,101,120,83,104,97,112,101,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,53,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,53,95,82,78,83,95,50,48,67,111,110,118,101,120,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,102,69,51,50,66,114,105,100,103,101,84,114,105,97,110,103,108,101,67,111,110,118,101,120,99,97,115,116,67,97,108,108,98,97,99,107,0,0,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,55,111,98,106,101,99,116,81,117,101,114,121,83,105,110,103,108,101,69,80,75,49,51,98,116,67,111,110,118,101,120,83,104,97,112,101,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,53,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,53,95,82,78,83,95,50,48,67,111,110,118,101,120,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,102,69,49,52,76,111,99,97,108,73,110,102,111,65,100,100,101,114,95,49,0,0,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,51,114,97,121,84,101,115,116,83,105,110,103,108,101,69,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,50,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,50,95,82,78,83,95,49,55,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,69,57,82,97,121,84,101,115,116,101,114,95,49,0,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,51,114,97,121,84,101,115,116,83,105,110,103,108,101,69,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,50,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,50,95,82,78,83,95,49,55,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,69,50,57,66,114,105,100,103,101,84,114,105,97,110,103,108,101,82,97,121,99,97,115,116,67,97,108,108,98,97,99,107,95,48,0,0,0,0,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,51,114,97,121,84,101,115,116,83,105,110,103,108,101,69,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,50,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,50,95,82,78,83,95,49,55,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,69,50,57,66,114,105,100,103,101,84,114,105,97,110,103,108,101,82,97,121,99,97,115,116,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,90,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,51,114,97,121,84,101,115,116,83,105,110,103,108,101,69,82,75,49,49,98,116,84,114,97,110,115,102,111,114,109,83,50,95,80,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,80,75,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,83,50,95,82,78,83,95,49,55,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,69,49,53,76,111,99,97,108,73,110,102,111,65,100,100,101,114,50,0,0,0,0,0,90,78,49,52,98,116,79,112,116,105,109,105,122,101,100,66,118,104,53,98,117,105,108,100,69,80,50,51,98,116,83,116,114,105,100,105,110,103,77,101,115,104,73,110,116,101,114,102,97,99,101,98,82,75,57,98,116,86,101,99,116,111,114,51,83,52,95,69,50,57,81,117,97,110,116,105,122,101,100,78,111,100,101,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,0,0,0,0,0,90,78,49,52,98,116,79,112,116,105,109,105,122,101,100,66,118,104,53,98,117,105,108,100,69,80,50,51,98,116,83,116,114,105,100,105,110,103,77,101,115,104,73,110,116,101,114,102,97,99,101,98,82,75,57,98,116,86,101,99,116,111,114,51,83,52,95,69,50,48,78,111,100,101,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,95,48,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,101,120,99,101,112,116,105,111,110,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,78,54,98,116,68,98,118,116,56,73,67,111,108,108,105,100,101,69,0,0,0,0,0,0,78,51,54,98,116,68,105,115,99,114,101,116,101,67,111,108,108,105,115,105,111,110,68,101,116,101,99,116,111,114,73,110,116,101,114,102,97,99,101,54,82,101,115,117,108,116,69,0,78,51,52,98,116,83,112,104,101,114,101,84,114,105,97,110,103,108,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,0,78,51,51,98,116,67,111,110,118,101,120,67,111,110,99,97,118,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,55,83,119,97,112,112,101,100,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,0,0,0,78,51,51,98,116,67,111,110,118,101,120,67,111,110,99,97,118,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,0,0,78,51,50,98,116,83,112,104,101,114,101,83,112,104,101,114,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,0,0,0,78,51,49,98,116,67,111,110,118,101,120,80,108,97,110,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,78,50,56,98,116,67,111,109,112,111,117,110,100,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,55,83,119,97,112,112,101,100,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,78,50,56,98,116,67,111,109,112,111,117,110,100,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,78,50,54,98,116,66,111,120,66,111,120,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,0,78,50,53,98,116,83,105,109,117,108,97,116,105,111,110,73,115,108,97,110,100,77,97,110,97,103,101,114,49,52,73,115,108,97,110,100,67,97,108,108,98,97,99,107,69,0,0,0,78,50,51,98,116,67,111,110,118,101,120,67,111,110,118,101,120,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,78,49,54,98,116,69,109,112,116,121,65,108,103,111,114,105,116,104,109,49,48,67,114,101,97,116,101,70,117,110,99,69,0,0,0,0,0,0,0,0,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,50,55,67,108,111,115,101,115,116,67,111,110,118,101,120,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,0,0,0,0,0,0,0,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,50,52,67,108,111,115,101,115,116,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,0,0,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,50,52,65,108,108,72,105,116,115,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,0,0,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,50,49,67,111,110,116,97,99,116,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,0,0,0,0,0,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,50,48,67,111,110,118,101,120,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,0,0,0,0,0,0,78,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,49,55,82,97,121,82,101,115,117,108,116,67,97,108,108,98,97,99,107,69,0,78,49,50,98,116,67,111,110,118,101,120,67,97,115,116,49,48,67,97,115,116,82,101,115,117,108,116,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,51,54,98,116,68,105,115,99,114,101,116,101,67,111,108,108,105,115,105,111,110,68,101,116,101,99,116,111,114,73,110,116,101,114,102,97,99,101,0,0,51,53,98,116,83,101,113,117,101,110,116,105,97,108,73,109,112,117,108,115,101,67,111,110,115,116,114,97,105,110,116,83,111,108,118,101,114,0,0,0,51,52,98,116,83,112,104,101,114,101,84,114,105,97,110,103,108,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,0,0,51,52,98,116,80,111,108,121,104,101,100,114,97,108,67,111,110,118,101,120,65,97,98,98,67,97,99,104,105,110,103,83,104,97,112,101,0,0,0,0,51,52,98,116,67,108,111,115,101,115,116,78,111,116,77,101,67,111,110,118,101,120,82,101,115,117,108,116,67,97,108,108,98,97,99,107,0,0,0,0,51,51,98,116,77,105,110,107,111,119,115,107,105,80,101,110,101,116,114,97,116,105,111,110,68,101,112,116,104,83,111,108,118,101,114,0,0,0,0,0,51,51,98,116,67,111,110,118,101,120,67,111,110,99,97,118,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,0,0,0,51,50,98,116,83,112,104,101,114,101,83,112,104,101,114,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116])
.concat([104,109,0,0,0,0,0,0,51,50,98,116,67,111,110,118,101,120,73,110,116,101,114,110,97,108,65,97,98,98,67,97,99,104,105,110,103,83,104,97,112,101,0,0,0,0,0,0,51,49,98,116,73,110,116,101,114,110,97,108,84,114,105,97,110,103,108,101,73,110,100,101,120,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,51,49,98,116,68,101,102,97,117,108,116,67,111,108,108,105,115,105,111,110,67,111,110,102,105,103,117,114,97,116,105,111,110,0,0,0,0,0,0,0,51,49,98,116,67,111,110,118,101,120,80,108,97,110,101,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,0,0,0,0,0,51,48,98,116,71,106,107,69,112,97,80,101,110,101,116,114,97,116,105,111,110,68,101,112,116,104,83,111,108,118,101,114,0,0,0,0,0,0,0,0,51,48,98,116,67,111,110,118,101,120,80,101,110,101,116,114,97,116,105,111,110,68,101,112,116,104,83,111,108,118,101,114,0,0,0,0,0,0,0,0,51,48,98,116,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,67,114,101,97,116,101,70,117,110,99,0,0,0,0,0,0,0,0,51,48,98,116,65,99,116,105,118,97,116,105,110,103,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,0,0,0,0,0,0,50,57,98,116,71,101,110,101,114,105,99,54,68,111,102,83,112,114,105,110,103,67,111,110,115,116,114,97,105,110,116,0,50,57,67,111,110,99,114,101,116,101,67,111,110,116,97,99,116,82,101,115,117,108,116,67,97,108,108,98,97,99,107,0,50,56,98,116,84,114,105,97,110,103,108,101,67,111,110,118,101,120,99,97,115,116,67,97,108,108,98,97,99,107,0,0,50,56,98,116,83,99,97,108,101,100,66,118,104,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,0,0,50,56,98,116,72,97,115,104,101,100,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,67,97,99,104,101,0,0,50,56,98,116,67,111,109,112,111,117,110,100,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,50,55,98,116,67,111,110,116,105,110,117,111,117,115,67,111,110,118,101,120,67,111,108,108,105,115,105,111,110,0,0,0,50,54,98,116,84,114,105,97,110,103,108,101,73,110,100,101,120,86,101,114,116,101,120,65,114,114,97,121,0,0,0,0,50,54,98,116,66,111,120,66,111,120,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,0,0,50,54,76,111,99,97,108,83,117,112,112,111,114,116,86,101,114,116,101,120,67,97,108,108,98,97,99,107,0,0,0,0,50,53,98,116,84,114,105,97,110,103,108,101,82,97,121,99,97,115,116,67,97,108,108,98,97,99,107,0,0,0,0,0,50,53,98,116,83,105,109,117,108,97,116,105,111,110,73,115,108,97,110,100,77,97,110,97,103,101,114,0,0,0,0,0,50,53,98,116,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,67,97,108,108,98,97,99,107,0,0,0,0,0,50,53,98,116,72,101,105,103,104,116,102,105,101,108,100,84,101,114,114,97,105,110,83,104,97,112,101,0,0,0,0,0,50,53,98,116,68,101,102,97,117,108,116,86,101,104,105,99,108,101,82,97,121,99,97,115,116,101,114,0,0,0,0,0,50,53,98,116,67,111,110,118,101,120,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,0,0,0,0,0,50,53,98,116,67,111,110,116,105,110,117,111,117,115,68,121,110,97,109,105,99,115,87,111,114,108,100,0,0,0,0,0,50,52,98,116,83,99,97,108,101,100,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,0,0,0,0,0,0,50,52,98,116,80,101,114,116,117,114,98,101,100,67,111,110,116,97,99,116,82,101,115,117,108,116,0,0,0,0,0,0,50,52,98,116,80,97,105,114,67,97,99,104,105,110,103,71,104,111,115,116,79,98,106,101,99,116,0,0,0,0,0,0,50,52,98,116,67,111,110,118,101,120,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,0,0,0,0,0,0,50,52,98,116,67,111,108,108,105,115,105,111,110,67,111,110,102,105,103,117,114,97,116,105,111,110,0,0,0,0,0,0,50,52,98,116,66,114,111,97,100,112,104,97,115,101,65,97,98,98,67,97,108,108,98,97,99,107,0,0,0,0,0,0,50,51,98,116,83,116,114,105,100,105,110,103,77,101,115,104,73,110,116,101,114,102,97,99,101,0,0,0,0,0,0,0,50,51,98,116,83,105,110,103,108,101,67,111,110,116,97,99,116,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,50,51,98,116,80,111,108,121,104,101,100,114,97,108,67,111,110,118,101,120,83,104,97,112,101,0,0,0,0,0,0,0,50,51,98,116,80,111,105,110,116,50,80,111,105,110,116,67,111,110,115,116,114,97,105,110,116,0,0,0,0,0,0,0,50,51,98,116,71,101,110,101,114,105,99,54,68,111,102,67,111,110,115,116,114,97,105,110,116,0,0,0,0,0,0,0,50,51,98,116,68,105,115,99,114,101,116,101,68,121,110,97,109,105,99,115,87,111,114,108,100,0,0,0,0,0,0,0,50,51,98,116,67,111,110,118,101,120,67,111,110,118,101,120,65,108,103,111,114,105,116,104,109,0,0,0,0,0,0,0,50,51,98,116,67,111,108,108,105,115,105,111,110,80,97,105,114,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,50,51,98,116,66,114,111,97,100,112,104,97,115,101,82,97,121,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,50,51,98,116,66,114,105,100,103,101,100,77,97,110,105,102,111,108,100,82,101,115,117,108,116,0,0,0,0,0,0,0,50,50,98,116,83,117,98,115,105,109,112,108,101,120,67,111,110,118,101,120,67,97,115,116,0,0,0,0,0,0,0,0,50,50,98,116,79,118,101,114,108,97,112,112,105,110,103,80,97,105,114,67,97,99,104,101,0,0,0,0,0,0,0,0,50,50,98,116,67,111,109,112,111,117,110,100,76,101,97,102,67,97,108,108,98,97,99,107,0,0,0,0,0,0,0,0,50,50,98,116,66,118,104,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,0,0,0,0,0,0,0,0,50,50,83,112,104,101,114,101,84,114,105,97,110,103,108,101,68,101,116,101,99,116,111,114,0,0,0,0,0,0,0,0,50,49,98,116,85,110,105,118,101,114,115,97,108,67,111,110,115,116,114,97,105,110,116,0,50,49,98,116,85,110,105,102,111,114,109,83,99,97,108,105,110,103,83,104,97,112,101,0,50,49,98,116,83,105,110,103,108,101,83,119,101,101,112,67,97,108,108,98,97,99,107,0,50,49,98,116,83,105,109,112,108,101,68,121,110,97,109,105,99,115,87,111,114,108,100,0,50,49,98,116,78,111,100,101,79,118,101,114,108,97,112,67,97,108,108,98,97,99,107,0,50,49,98,116,67,111,110,118,101,120,73,110,116,101,114,110,97,108,83,104,97,112,101,0,50,49,98,116,67,111,110,101,84,119,105,115,116,67,111,110,115,116,114,97,105,110,116,0,50,49,98,116,67,111,108,108,105,115,105,111,110,68,105,115,112,97,116,99,104,101,114,0,50,49,98,116,66,114,111,97,100,112,104,97,115,101,73,110,116,101,114,102,97,99,101,0,50,49,83,117,112,112,111,114,116,86,101,114,116,101,120,67,97,108,108,98,97,99,107,0,50,48,98,116,68,101,102,97,117,108,116,77,111,116,105,111,110,83,116,97,116,101,0,0,50,48,98,116,67,111,108,108,105,115,105,111,110,65,108,103,111,114,105,116,104,109,0,0,50,48,98,116,65,120,105,115,83,119,101,101,112,51,73,110,116,101,114,110,97,108,73,116,69,0,0,0,0,0,0,0,50,48,98,116,65,120,105,115,83,119,101,101,112,51,73,110,116,101,114,110,97,108,73,106,69,0,0,0,0,0,0,0,50,48,66,114,111,97,100,112,104,97,115,101,65,97,98,98,84,101,115,116,101,114,0,0,49,57,98,116,84,114,105,97,110,103,108,101,77,101,115,104,83,104,97,112,101,0,0,0,49,57,98,116,83,105,110,103,108,101,82,97,121,67,97,108,108,98,97,99,107,0,0,0,49,57,98,116,71,104,111,115,116,80,97,105,114,67,97,108,108,98,97,99,107,0,0,0,49,57,66,114,111,97,100,112,104,97,115,101,82,97,121,84,101,115,116,101,114,0,0,0,49,56,98,116,86,101,104,105,99,108,101,82,97,121,99,97,115,116,101,114,0,0,0,0,49,56,98,116,84,114,105,97,110,103,108,101,67,97,108,108,98,97,99,107,0,0,0,0,49,56,98,116,83,116,97,116,105,99,80,108,97,110,101,83,104,97,112,101,0,0,0,0,49,56,98,116,83,108,105,100,101,114,67,111,110,115,116,114,97,105,110,116,0,0,0,0,49,56,98,116,83,105,109,112,108,101,66,114,111,97,100,112,104,97,115,101,0,0,0,0,49,56,98,116,77,117,108,116,105,83,112,104,101,114,101,83,104,97,112,101,0,0,0,0,49,56,98,116,72,105,110,103,101,50,67,111,110,115,116,114,97,105,110,116,0,0,0,0,49,56,98,116,68,98,118,116,84,114,101,101,67,111,108,108,105,100,101,114,0,0,0,0,49,56,98,116,67,111,110,118,101,120,80,111,108,121,104,101,100,114,111,110,0,0,0,0,49,56,98,116,67,111,110,115,116,114,97,105,110,116,83,111,108,118,101,114,0,0,0,0,49,55,98,116,84,121,112,101,100,67,111,110,115,116,114,97,105,110,116,0,0,0,0,0,49,55,98,116,79,118,101,114,108,97,112,67,97,108,108,98,97,99,107,0,0,0,0,0,49,55,98,116,72,105,110,103,101,67,111,110,115,116,114,97,105,110,116,0,0,0,0,0,49,55,98,116,71,106,107,80,97,105,114,68,101,116,101,99,116,111,114,0,0,0,0,0,49,55,98,116,67,111,110,118,101,120,72,117,108,108,83,104,97,112,101,0,0,0,0,0,49,55,98,116,67,111,108,108,105,115,105,111,110,79,98,106,101,99,116,0,0,0,0,0,49,55,98,116,65,99,116,105,111,110,73,110,116,101,114,102,97,99,101,0,0,0,0,0,49,55,98,116,51,50,66,105,116,65,120,105,115,83,119,101,101,112,51,0,0,0,0,0,49,55,68,101,98,117,103,68,114,97,119,99,97,108,108,98,97,99,107,0,0,0,0,0,49,54,98,116,82,97,121,99,97,115,116,86,101,104,105,99,108,101,0,0,0,0,0,0,49,54,98,116,80,111,105,110,116,67,111,108,108,101,99,116,111,114,0,0,0,0,0,0,49,54,98,116,77,97,110,105,102,111,108,100,82,101,115,117,108,116,0,0,0,0,0,0,49,54,98,116,69,109,112,116,121,65,108,103,111,114,105,116,104,109,0,0,0,0,0,0,49,54,98,116,68,98,118,116,66,114,111,97,100,112,104,97,115,101,0,0,0,0,0,0,49,54,98,116,67,121,108,105,110,100,101,114,83,104,97,112,101,90,0,0,0,0,0,0,49,54,98,116,67,121,108,105,110,100,101,114,83,104,97,112,101,88,0,0,0,0,0,0,49,54,98,116,67,111,108,108,105,115,105,111,110,87,111,114,108,100,0,0,0,0,0,0,49,54,98,116,67,111,108,108,105,115,105,111,110,83,104,97,112,101,0,0,0,0,0,0,49,54,98,116,66,111,120,66,111,120,68,101,116,101,99,116,111,114,0,0,0,0,0,0,49,54,98,116,66,85,95,83,105,109,112,108,101,120,49,116,111,52,0,0,0,0,0,0,49,53,98,116,84,114,105,97,110,103,108,101,83,104,97,112,101,0,0,0,0,0,0,0,49,53,98,116,78,117,108,108,80,97,105,114,67,97,99,104,101,0,0,0,0,0,0,0,49,53,98,116,71,106,107,67,111,110,118,101,120,67,97,115,116,0,0,0,0,0,0,0,49,53,98,116,68,121,110,97,109,105,99,115,87,111,114,108,100,0,0,0,0,0,0,0,49,53,98,116,67,121,108,105,110,100,101,114,83,104,97,112,101,0,0,0,0,0,0,0,49,53,98,116,67,111,109,112,111,117,110,100,83,104,97,112,101,0,0,0,0,0,0,0,49,53,98,116,67,97,112,115,117,108,101,83,104,97,112,101,90,0,0,0,0,0,0,0,49,53,98,116,67,97,112,115,117,108,101,83,104,97,112,101,88,0,0,0,0,0,0,0,49,52,98,116,84,114,105,97,110,103,108,101,77,101,115,104,0,0,0,0,0,0,0,0,49,52,98,116,81,117,97,110,116,105,122,101,100,66,118,104,0,0,0,0,0,0,0,0,49,52,98,116,79,112,116,105,109,105,122,101,100,66,118,104,0,0,0,0,0,0,0,0,49,52,98,116,67,111,110,99,97,118,101,83,104,97,112,101,0,0,0,0,0,0,0,0,49,52,98,116,67,97,112,115,117,108,101,83,104,97,112,101,0,0,0,0,0,0,0,0,49,51,98,116,84,121,112,101,100,79,98,106,101,99,116,0,49,51,98,116,83,112,104,101,114,101,83,104,97,112,101,0,49,51,98,116,77,111,116,105,111,110,83,116,97,116,101,0,49,51,98,116,71,104,111,115,116,79,98,106,101,99,116,0,49,51,98,116,67,111,110,118,101,120,83,104,97,112,101,0,49,50,98,116,69,109,112,116,121,83,104,97,112,101,0,0,49,50,98,116,68,105,115,112,97,116,99,104,101,114,0,0,49,50,98,116,67,111,110,118,101,120,67,97,115,116,0,0,49,50,98,116,67,111,110,101,83,104,97,112,101,90,0,0,49,50,98,116,67,111,110,101,83,104,97,112,101,88,0,0,49,50,98,116,65,120,105,115,83,119,101,101,112,51,0,0,49,49,98,116,82,105,103,105,100,66,111,100,121,0,0,0,49,49,98,116,67,111,110,101,83,104,97,112,101,0,0,0,49,48,98,116,66,111,120,83,104,97,112,101,0,0,0,0,0,0,0,0,216,102,0,0,32,136,0,0,0,0,0,0,0,0,0,0,72,103,0,0,32,136,0,0,0,0,0,0,0,0,0,0,184,103,0,0,240,138,0,0,0,0,0,0,0,0,0,0,40,104,0,0,32,136,0,0,0,0,0,0,0,0,0,0,144,104,0,0,88,134,0,0,0,0,0,0,0,0,0,0,80,105,0,0,208,139,0,0,0,0,0,0,0,0,0,0,240,105,0,0,96,140,0,0,0,0,0,0,0,0,0,0,120,106,0,0,96,140,0,0,0,0,0,0,0,0,0,0,232,106,0,0,32,136,0,0,0,0,0,0,0,0,0,0,72,107,0,0,224,134,0,0,0,0,0,0,0,0,0,0,176,107,0,0,88,134,0,0,0,0,0,0,0,0,0,0,48,108,0,0,240,138,0,0,0,0,0,0,0,0,0,0,168,108,0,0,240,138,0,0,0,0,0,0,0,0,0,0,16,109,0,0,152,136,0,0,0,0,0,0,0,0,0,0,200,109,0,0,152,136,0,0,0,0,0,0,0,0,0,0,128,110,0,0,64,135,0,0,0,0,0,0,0,0,0,0,40,111,0,0,80,134,0,0,0,0,0,0,0,0,0,0,176,111,0,0,24,137,0,0,0,0,0,0,0,0,0,0,80,112,0,0,24,137,0,0,0,0,0,0,0,0,0,0,240,112,0,0,72,135,0,0,0,0,0,0,0,0,0,0,128,113,0,0,32,136,0,0,0,0,0,0,0,0,0,0,232,113,0,0,32,136,0,0,0,0,0,0,0,0,0,0,72,114,0,0,0,0,0,0,88,114,0,0,0,0,0,0,104,114,0,0,56,134,0,0,0,0,0,0,0,0,0,0,120,114,0,0,0,0,0,0,144,114,0,0,0,0,0,0,192,114,0,0,96,136,0,0,0,0,0,0,0,0,0,0,248,114,0,0,96,136,0,0,0,0,0,0,0,0,0,0,56,115,0,0,96,136,0,0,0,0,0,0,0,0,0,0,112,115,0,0,96,136,0,0,0,0,0,0,0,0,0,0,168,115,0,0,96,136,0,0,0,0,0,0,0,0,0,0,216,115,0,0,96,136,0,0,0,0,0,0,0,0,0,0,16,116,0,0,96,136,0,0,0,0,0,0,0,0,0,0,64,116,0,0,96,136,0,0,0,0,0,0,0,0,0,0,112,116,0,0,0,0,0,0,160,116,0,0,96,136,0,0,0,0,0,0,0,0,0,0,200,116,0,0,96,136,0,0,0,0,0,0,0,0,0,0,240,116,0,0,64,135,0,0,0,0,0,0,0,0,0,0,40,117,0,0,72,135,0,0,0,0,0,0,0,0,0,0,88,117,0,0,72,135,0,0,0,0,0,0,0,0,0,0,136,117,0,0,0,0,0,0,184,117,0,0,0,0,0,0,232,117,0,0,0,0,0,0,16,118,0,0,0,0,0,0,48,118,0,0,120,135,0,0,0,0,0,0,0,0,0,0,88,118,0,0,120,135,0,0,0,0,0,0,0,0,0,0,128,118,0,0,136,135,0,0,0,0,0,0,0,0,0,0,168,118,0,0,48,134,0,0,0,0,0,0,0,0,0,0,208,118,0,0,0,0,0,0,248,118,0,0,64,140,0,0,0,0,0,0,0,0,0,0,32,119,0,0,104,136,0,0,0,0,0,0,0,0,0,0,72,119,0,0,224,137,0,0,0,0,0,0,0,0,0,0,112,119,0,0,8,135,0,0,0,0,0,0,0,0,0,0,152,119,0,0,88,136,0,0,0,0,0,0,0,0,0,0,192,119,0,0,104,136,0,0,0,0,0,0,0,0,0,0,232,119,0,0,104,136,0,0,0,0,0,0,0,0,0,0,16,120,0,0,248,138,0,0,0,0,0,0,0,0,0,0,56,120,0,0,0,0,0,0,96,120,0,0,184,137,0,0,0,0,0,0,0,0,0,0,136,120,0,0,80,139,0,0,0,0,0,0,0,0,0,0,176,120,0,0,88,136,0,0,0,0,0,0,0,0,0,0,216,120,0,0,0,0,0,0,0,121,0,0,0,0,0,0,40,121,0,0,80,139,0,0,0,0,0,0,0,0,0,0,80,121,0,0,0,138,0,0,0,0,0,0,0,0,0,0,112,121,0,0,56,135,0,0,0,0,0,0,0,0,0,0,144,121,0,0,208,139,0,0,0,0,0,0,0,0,0,0,176,121,0,0,32,142,0,0,0,0,0,0,0,0,0,0,208,121,0,0,112,138,0,0,0,0,0,0,0,0,0,0,240,121,0,0,104,136,0,0,0,0,0,0,0,0,0,0,16,122,0,0,152,142,0,0,0,0,0,0,0,0,0,0,48,122,0,0,200,137,0,0,0,0,0,0,0,0,0,0,80,122,0,0,104,136,0,0,0,0,0,0,0,0,0,0,112,122,0,0,32,136,0,0,0,0,0,0,0,0,0,0,144,122,0,0,208,139,0,0,0,0,0,0,0,0,0,0,176,122,0,0,0,0,0,0,208,122,0,0,0,0,0,0,240,122,0,0,32,142,0,0,0,0,0,0,0,0,0,0,16,123,0,0,200,139,0,0,0,0,0,0,0,0,0,0,48,123,0,0,192,135,0,0,0,0,0,0,0,0,0,0,80,123,0,0,16,138,0,0,0,0,0,0,0,0,0,0,112,123,0,0,208,139,0,0,0,0,0,0,0,0,0,0,144,123,0,0,248,140,0,0,0,0,0,0,0,0,0,0,176,123,0,0,96,142,0,0,0,0,0,0,0,0,0,0,208,123,0,0,208,139,0,0,0,0,0,0,0,0,0,0,240,123,0,0,0,0,0,0,16,124,0,0,0,0,0,0,48,124,0,0,0,0,0,0,80,124,0,0,192,137,0,0,0,0,0,0,0,0,0,0,112,124,0,0,248,138,0,0,0,0,0,0,0,0,0,0,144,124,0,0,72,140,0,0,0,0,0,0,0,0,0,0,176,124,0,0,72,140,0,0,0,0,0,0,0,0,0,0,208,124,0,0,168,141,0,0,0,0,0,0,0,0,0,0,240,124,0,0,104,136,0,0,0,0,0,0,0,0,0,0,16,125,0,0,96,140,0,0,0,0,0,0,0,0,0,0,48,125,0,0,192,137,0,0,0,0,0,0,0,0,0,0,80,125,0,0,248,140,0,0,0,0,0,0,0,0,0,0,112,125,0,0,152,142,0,0,0,0,0,0,0,0,0,0,144,125,0,0,48,137,0,0,0,0,0,0,0,0,0,0,176,125,0,0,80,134,0,0,0,0,0,0,0,0,0,0,208,125,0,0,136,139,0,0,0,0,0,0,0,0,0,0,240,125,0,0,152,135,0,0,0,0,0,0,0,0,0,0,16,126,0,0,0,138,0,0,0,0,0,0,0,0,0,0,40,126,0,0,112,142,0,0,0,0,0,0,0,0,0,0,64,126,0,0,64,138,0,0,0,0,0,0,0,0,0,0,88,126,0,0,168,141,0,0,0,0,0,0,0,0,0,0,112,126,0,0,0,0,0,0,136,126,0,0,112,142,0,0,0,0,0,0,0,0,0,0,160,126,0,0,72,140,0,0,0,0,0,0,0,0,0,0,184,126,0,0,144,142,0,0,0,0,0,0,0,0,0,0,208,126,0,0,0,0,0,0,232,126,0,0,208,139,0,0,0,0,0,0,0,0,0,0,0,127,0,0,88,142,0,0,0,0,0,0,0,0,0,0,24,127,0,0,0,0,0,0,48,127,0,0,40,139,0,0,0,0,0,0,0,0,0,0,80,127,0,0,40,139,0,0,0,0,0,0,0,0,0,0,112,127,0,0,80,134,0,0,0,0,0,0,0,0,0,0,136,127,0,0,32,142,0,0,0,0,0,0,0,0,0,0,160,127,0,0,64,138,0,0,0,0,0,0,0,0,0,0,184,127,0,0,48,137,0,0,0,0,0,0,0,0,0,0,208,127,0,0,80,134,0,0,0,0,0,0,0,0,0,0,232,127,0,0,0,0,0,0,0,128,0,0,0,0,0,0,24,128,0,0,32,142,0,0,0,0,0,0,0,0,0,0,48,128,0,0,72,140,0,0,0,0,0,0,0,0,0,0,72,128,0,0,40,139,0,0,0,0,0,0,0,0,0,0,96,128,0,0,16,136,0,0,0,0,0,0,0,0,0,0,120,128,0,0,120,136,0,0,0,0,0,0,0,0,0,0,144,128,0,0,80,134,0,0,0,0,0,0,0,0,0,0,168,128,0,0,0,0,0,0,192,128,0,0,128,76,0,0,216,128,0,0,0,0,0,0,1,0,0,0,64,142,0,0,2,4,0,0,0,0,0,0,240,128,0,0,0,0,0,0,8,129,0,0,72,140,0,0,0,0,0,0,0,0,0,0,32,129,0,0,152,135,0,0,0,0,0,0,0,0,0,0,56,129,0,0,192,135,0,0,0,0,0,0,0,0,0,0,80,129,0,0,0,0,0,0,104,129,0,0,0,0,0,0,128,129,0,0,104,139,0,0,0,0,0,0,128,76,0,0,152,129,0,0,0,0,0,0,2,0,0,0,208,139,0,0,2,0,0,0,32,136,0,0,2,4,0,0,0,0,0,0,176,129,0,0,160,140,0,0,0,0,0,0,0,0,0,0,200,129,0,0,88,134,0,0,0,0,0,0,0,0,0,0,224,129,0,0,88,134,0,0,0,0,0,0,0,0,0,0,248,129,0,0,80,139,0,0,0,0,0,0,0,0,0,0,16,130,0,0,40,139,0,0,0,0,0,0,0,0,0,0,40,130,0,0,184,141,0,0,0,0,0,0,0,0,0,0,64,130,0,0,184,141,0,0,0,0,0,0,0,0,0,0,88,130,0,0,0,0,0,0,112,130,0,0,0,0,0,0,136,130,0,0,152,135,0,0,0,0,0,0,0,0,0,0,160,130,0,0,192,135,0,0,0,0,0,0,0,0,0,0,184,130,0,0,224,137,0,0,0,0,0,0,0,0,0,0,208,130,0,0,112,138,0,0,0,0,0,0,0,0,0,0,232,130,0,0,152,142,0,0,0,0,0,0,0,0,0,0,0,131,0,0,72,141,0,0,0,0,0,0,0,0,0,0,24,131,0,0,248,138,0,0,0,0,0,0,0,0,0,0,48,131,0,0,80,141,0,0,0,0,0,0,0,0,0,0,72,131,0,0,48,142,0,0,0,0,0,0,0,0,0,0,96,131,0,0,48,142,0,0,0,0,0,0,0,0,0,0,120,131,0,0,232,136,0,0,0,0,0,0,0,0,0,0,144,131,0,0,0,0,0,0,168,131,0,0,8,142,0,0,0,0,0,0,0,0,0,0,192,131,0,0,80,141,0,0,0,0,0,0,0,0,0,0,216,131,0,0,248,138,0,0,0,0,0,0,0,0,0,0,240,131,0,0,0,0,0,0,0,132,0,0,248,138,0,0,0,0,0,0,0,0,0,0,16,132,0,0,0,0,0,0,32,132,0,0,152,140,0,0,0,0,0,0,0,0,0,0,48,132,0,0,80,141,0,0,0,0,0,0,0,0,0,0,64,132,0,0,32,142,0,0,0,0,0,0,0,0,0,0,80,132,0,0,0,0,0,0,96,132,0,0,0,0,0,0,112,132,0,0,224,142,0,0,0,0,0,0,0,0,0,0,128,132,0,0,224,142,0,0,0,0,0,0,0,0,0,0,144,132,0,0,88,139,0,0,0,0,0,0,0,0,0,0,160,132,0,0,152,140,0,0,0,0,0,0,0,0,0,0,176,132,0,0,248,138,0,0,0,0,0,0,0,0,0,0,192,132,0,0,224,137,0,0,0,0,0,0,160,167,0,0,0,0,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function ___gxx_personality_v0() {
    }
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___cxa_guard_abort() {}
  function ___cxa_guard_release() {}
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module.print('exit(' + status + ') called');
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }
  function __ZN20btAxisSweep3InternalItE26processAllOverlappingPairsEP17btOverlapCallback() {
  Module['printErr']('missing function: _ZN20btAxisSweep3InternalItE26processAllOverlappingPairsEP17btOverlapCallback'); abort(-1);
  }
  function __ZN20btAxisSweep3InternalIjE26processAllOverlappingPairsEP17btOverlapCallback() {
  Module['printErr']('missing function: _ZN20btAxisSweep3InternalIjE26processAllOverlappingPairsEP17btOverlapCallback'); abort(-1);
  }
  function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }
  var _sqrtf=Math.sqrt;
  var _acosf=Math.acos;
  var _sinf=Math.sin;
  var _cosf=Math.cos;
  var _llvm_pow_f32=Math.pow;
  function _fmod(x, y) {
      return x % y;
    }var _fmodf=_fmod;
  var _fabsf=Math.abs;
  var _asinf=Math.asin;
  var _atan2f=Math.atan2;
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,EDOTDOT:76,EBADMSG:77,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"No message of desired type",36:"Identifier removed",37:"Channel number out of range",38:"Level 2 not synchronized",39:"Level 3 halted",40:"Level 3 reset",41:"Link number out of range",42:"Protocol driver not attached",43:"No CSI structure available",44:"Level 2 halted",45:"Deadlock condition",46:"No record locks available",50:"Invalid exchange",51:"Invalid request descriptor",52:"Exchange full",53:"No anode",54:"Invalid request code",55:"Invalid slot",56:"File locking deadlock error",57:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",74:"Multihop attempted",76:"Cross mount point (not really error)",77:"Trying to read unreadable message",80:"Given log. name not unique",81:"f.d. invalid for this operation",82:"Remote address changed",83:"Can   access a needed shared lib",84:"Accessing a corrupted shared lib",85:".lib section in a.out corrupted",86:"Attempting to link in too many libs",87:"Attempting to exec a shared library",88:"Function not implemented",90:"Directory not empty",91:"File or path name too long",92:"Too many symbolic links",95:"Operation not supported on transport endpoint",96:"Protocol family not supported",104:"Connection reset by peer",105:"No buffer space available",106:"Address family not supported by protocol family",107:"Protocol wrong type for socket",108:"Socket operation on non-socket",109:"Protocol not available",110:"Can't send after socket shutdown",111:"Connection refused",112:"Address already in use",113:"Connection aborted",114:"Network is unreachable",115:"Network interface is not configured",116:"Connection timed out",117:"Host is down",118:"Host is unreachable",119:"Connection already in progress",120:"Socket already connected",121:"Destination address required",122:"Message too long",123:"Unknown protocol",124:"Socket type not supported",125:"Address not available",126:"Connection reset by network",127:"Socket is already connected",128:"Socket is not connected",129:"Too many references",131:"Too many users",132:"Quota exceeded",133:"Stale file handle",134:"Not supported",135:"No medium (in tape drive)",138:"Illegal byte sequence",139:"Value too large for defined data type",140:"Operation canceled",141:"State not recoverable",142:"Previous owner died",143:"Streams pipe error"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var VFS=undefined;
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path, ext) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var f = PATH.splitPath(path)[2];
        if (ext && f.substr(-1 * ext.length) === ext) {
          f = f.substr(0, f.length - ext.length);
        }
        return f;
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.filter(function(p, index) {
          if (typeof p !== 'string') {
            throw new TypeError('Arguments to path.join must be strings');
          }
          return p;
        }).join('/'));
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          // this wouldn't be required if the library wasn't eval'd at first...
          if (!TTY.utf8) {
            TTY.utf8 = new Runtime.UTF8Processor();
          }
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              if (process.stdin.destroyed) {
                return undefined;
              }
              result = process.stdin.read();
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          if (node.contentMode === MEMFS.CONTENT_OWNING) {
            assert(contents.byteOffset);
            Module['_free'](contents.byteOffset);
          }
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },mount:function (mount) {
        return MEMFS.create_node(null, '/', 0040000 | 0777, 0);
      },create_node:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek
          };
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap
          };
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink
          };
          node.stream_ops = {};
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr
          };
          node.stream_ops = FS.chrdev_stream_ops;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.create_node(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.create_node(parent, newname, 0777 | 0120000, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            assert(buffer.length);
            if (canOwn && buffer.buffer === HEAP8.buffer && offset === 0) {
              node.contents = buffer; // this is a subarray of the heap, and we can own it
              node.contentMode = MEMFS.CONTENT_OWNING;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 0x02) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,nodes:[null],devices:[null],streams:[null],nextInode:1,name_table:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        },handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + new Error().stack;
        return ___setErrNo(e.errno);
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.name_table.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.name_table[hash];
        FS.name_table[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.name_table[hash] === node) {
          FS.name_table[hash] = node.name_next;
        } else {
          var current = FS.name_table[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.name_table[hash]; node; node = node.name_next) {
          if (node.parent.id === parent.id && node.name === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        var node = {
          id: FS.nextInode++,
          name: name,
          mode: mode,
          node_ops: {},
          stream_ops: {},
          rdev: rdev,
          parent: null,
          mount: null
        };
        if (!parent) {
          parent = node;  // root node sets parent to itself
        }
        node.parent = parent;
        node.mount = parent.mount;
        // compatibility
        var readMode = 292 | 73;
        var writeMode = 146;
        // NOTE we must use Object.defineProperties instead of individual calls to
        // Object.defineProperty in order to make closure compiler happy
        Object.defineProperties(node, {
          read: {
            get: function() { return (node.mode & readMode) === readMode; },
            set: function(val) { val ? node.mode |= readMode : node.mode &= ~readMode; }
          },
          write: {
            get: function() { return (node.mode & writeMode) === writeMode; },
            set: function(val) { val ? node.mode |= writeMode : node.mode &= ~writeMode; }
          },
          isFolder: {
            get: function() { return FS.isDir(node.mode); },
          },
          isDevice: {
            get: function() { return FS.isChrdev(node.mode); },
          },
        });
        FS.hashAddNode(node);
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 0170000) === 0100000;
      },isDir:function (mode) {
        return (mode & 0170000) === 0040000;
      },isLink:function (mode) {
        return (mode & 0170000) === 0120000;
      },isChrdev:function (mode) {
        return (mode & 0170000) === 0020000;
      },isBlkdev:function (mode) {
        return (mode & 0170000) === 0060000;
      },isFIFO:function (mode) {
        return (mode & 0170000) === 0010000;
      },cwd:function () {
        return FS.currentPath;
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.currentPath, path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            return path ? PATH.join(node.mount.mountpoint, path) : node.mount.mountpoint;
          }
          path = path ? PATH.join(node.name, path) : node.name;
          node = node.parent;
        }
      },flagModes:{"r":0,"rs":8192,"r+":2,"w":1537,"wx":3585,"xw":3585,"w+":1538,"wx+":3586,"xw+":3586,"a":521,"ax":2569,"xa":2569,"a+":522,"ax+":2570,"xa+":2570},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 3;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 1024)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayMknod:function (mode) {
        switch (mode & 0170000) {
          case 0100000:
          case 0020000:
          case 0060000:
          case 0010000:
          case 0140000:
            return 0;
          default:
            return ERRNO_CODES.EINVAL;
        }
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.currentPath) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 3) !== 0 ||  // opening for write
              (flags & 1024)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        // compatibility
        Object.defineProperties(stream, {
          object: {
            get: function() { return stream.node; },
            set: function(val) { stream.node = val; }
          },
          isRead: {
            get: function() { return (stream.flags & 3) !== 1; }
          },
          isWrite: {
            get: function() { return (stream.flags & 3) !== 0; }
          },
          isAppend: {
            get: function() { return (stream.flags & 8); }
          }
        });
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join(parent, part);
          try {
            FS.mkdir(current, 0777);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(path, mode | 146);
          var stream = FS.open(path, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(path, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = input && output ? 0777 : (input ? 0333 : 0555);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = PATH.resolve(PATH.join(parent, name));
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp', 0777);
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev', 0777);
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', 0666, FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', 0666, FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', 0666, FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm', 0777);
        FS.mkdir('/dev/shm/tmp', 0777);
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },staticInit:function () {
        FS.name_table = new Array(4096);
        FS.root = FS.createNode(null, '/', 0040000 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },mount:function (type, opts, mountpoint) {
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
        }
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode &= 4095;
        mode |= 0100000;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode &= 511 | 0001000;
        mode |= 0040000;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        mode |= 0020000;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        path = PATH.normalize(path);
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 512)) {
          mode = (mode & 4095) | 0100000;
        } else {
          mode = 0;
        }
        var node;
        try {
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 0200000)
          });
          node = lookup.node;
          path = lookup.path;
        } catch (e) {
          // ignore
        }
        // perhaps we need to create the node
        if ((flags & 512)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 2048)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~1024;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 1024)) {
          FS.truncate(node, 0);
        }
        // register the stream with the filesystem
        var stream = FS.createStream({
          path: path,
          node: node,
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 8) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 3) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 3) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      }};
  function _send(fd, buf, len, flags) {
      var info = FS.getStream(fd);
      if (!info) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (info.socket.readyState === WebSocket.CLOSING || info.socket.readyState === WebSocket.CLOSED) {
        ___setErrNo(ERRNO_CODES.ENOTCONN);
        return -1;
      } else if (info.socket.readyState === WebSocket.CONNECTING) {
        ___setErrNo(ERRNO_CODES.EAGAIN);
        return -1;
      }
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      if (stream && ('socket' in stream)) {
        return _send(fildes, buf, nbyte, 0);
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  var _llvm_memset_p0i8_i32=_memset;
  function _llvm_umul_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return ((asm["setTempRet0"](x*y > 4294967295),(x*y)>>>0)|0);
    }
  function _llvm_bswap_i16(x) {
      return ((x&0xff)<<8) | ((x>>8)&0xff);
    }
  function _llvm_bswap_i32(x) {
      return ((x&0xff)<<24) | (((x>>8)&0xff)<<16) | (((x>>16)&0xff)<<8) | (x>>>24);
    }
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  Module["_llvm_uadd_with_overflow_i64"] = _llvm_uadd_with_overflow_i64;
  function _gettimeofday(ptr) {
      // %struct.timeval = type { i32, i32 }
      var now = Date.now();
      HEAP32[((ptr)>>2)]=Math.floor(now/1000); // seconds
      HEAP32[(((ptr)+(4))>>2)]=Math.floor((now-1000*Math.floor(now/1000))*1000); // microseconds
      return 0;
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  function ___resumeException(ptr) {
      if (HEAP32[((_llvm_eh_exception.buf)>>2)] == 0) HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr;
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = HEAP32[((_llvm_eh_exception.buf)>>2)];
      if (throwntype == -1) throwntype = HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiif(index,a1,a2,a3,a4,a5,a6) {
  try {
    return Module["dynCall_iiiiiif"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vif(index,a1,a2) {
  try {
    Module["dynCall_vif"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viifii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viifii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiifffffif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11) {
  try {
    Module["dynCall_viiiifffffif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiffii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiffii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiifii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiifii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ifffffffff(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    return Module["dynCall_ifffffffff"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiif(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiif"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiffffii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10) {
  try {
    Module["dynCall_viiiiffffii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiifif(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    return Module["dynCall_iiiiiiifif"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vifffi(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_vifffi"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ifiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_ifiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viifi(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viifi"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiiff(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiff"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiifiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    return Module["dynCall_iiiifiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13) {
  try {
    return Module["dynCall_iiiiiiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11,a12,a13);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viffff(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viffff"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viffiii(index,a1,a2,a3,a4,a5,a6) {
  try {
  