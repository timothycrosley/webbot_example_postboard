/* Python built-ins for JavaScript

   Useful links:

    * https://developer.mozilla.org/En/SpiderMonkey/Introduction_to_the_JavaScript_shell

*/

var py_builtins = {};

py_builtins.__python3__ = false;

/* A reference to the global object */

var _global_this = this;

/* JavaScript helper functions */

function defined(obj) {
    return typeof(obj) != 'undefined';
}

function assert(cond, msg) {
    if (!cond) {
        throw new py_builtins.AssertionError(msg);
    }
}

function iterate(seq, func) {
    while (true) {
        try {
            func(seq.next());
        } catch (exc) {
            if (isinstance(exc, py_builtins.StopIteration)) {
                break;
            } else {
                throw exc;
            }
        }
    }
}

function copy(iterator) {
    var items = [];

    iterate(iterator, function(item) {
        items.push(item);
    });

    return items;
}

function _new(cls, arg) {
    return new cls(arg);
}

function js(obj) {
    /*
       Converts (recursively) a Python object to a javascript builtin object.

       In particular:

       tuple -> Array
       list -> Array
       dict -> Object

       It uses the obj._js_() if it is defined, otherwise it just returns the
       same object. It is the responsibility of _js_() to convert recursively
       the object itself.
    */
    if ((obj != null) && defined(obj._js_))
        return obj._js_();
    else
        return obj;
}

/* Python built-in exceptions */

py_builtins.__exceptions__ = [
    'NotImplementedError',
    'ZeroDivisionError',
    'AssertionError',
    'AttributeError',
    'RuntimeError',
    'ImportError',
    'TypeError',
    'ValueError',
    'NameError',
    'IndexError',
    'KeyError',
    'StopIteration'
];

for (var i in py_builtins.__exceptions__) {
    var name = py_builtins.__exceptions__[i];

    py_builtins[name] = function() {
        return function(message) {
            this.message = defined(message) ? message : "";
        };
    }();

    py_builtins[name].__name__ = name;
    py_builtins[name].prototype.__class__ = py_builtins[name];

    py_builtins[name].prototype.__str__ = function() {
        return str(js(this.__class__.__name__) + ": " + js(this.message));
    };

    py_builtins[name].prototype.toString = function() {
        return js(this.__str__());
    };
}

/* Python built-in functions */

function hasattr(obj, name) {
    return defined(obj[name]);
}

function getattr(obj, name, value) {
    var _value = obj[name];

    if (defined(_value)) {
        return _value;
    } else {
        if (defined(value)) {
            return value;
        } else {
            throw new py_builtins.AttributeError(obj, name);
        }
    }
}

function setattr(obj, name, value) {
    obj[name] = value;
}

function hash(obj) {
    if (hasattr(obj, '__hash__')) {
        return obj.__hash__();
    } else if (typeof(obj) == 'number') {
        return obj == -1 ? -2 : obj;
    } else {
        throw new py_builtins.AttributeError(obj, '__hash__');
    }
}

function len(obj) {
    if (hasattr(obj, '__len__')) {
        return obj.__len__();
    } else {
        throw new py_builtins.AttributeError(obj, '__name__');
    }
}

function range(start, end, step) {
    if (!defined(end)) {
        end = start;
        start = 0;
    }

    if (!defined(step)) {
        step = 1;
    }

    var seq = [];

    for (var i = start; i < end; i += step) {
        seq.push(i);
    }

    if (py_builtins.__python3__)
        return iter(seq);
    else
        return list(seq);
}

function xrange(start, end, step) {
    return iter(range(start, end, step));
}

function map() {
    if (arguments.length < 2) {
        throw new py_builtins.TypeError("map() requires at least two args");
    }

    if (arguments.length > 2) {
        throw new py_builtins.NotImplementedError("only one sequence allowed in map()");
    }

    var func = arguments[0];
    var seq = iter(arguments[1]);

    var items = list();

    iterate(seq, function(item) {
        items.append(func(item));
    });

    if (py_builtins.__python3__)
        return iter(items);
    else
        return items;
}

function zip() {
    if (!arguments.length) {
        return list();
    }

    var iters = list();
    var i;

    for (i = 0; i < arguments.length; i++) {
        iters.append(iter(arguments[i]));
    }

    var items = list();

    while (true) {
        var item = list();

        for (i = 0; i < arguments.length; i++) {
            try {
                var value = iters.__getitem__(i).next();
            } catch (exc) {
                if (isinstance(exc, py_builtins.StopIteration)) {
                    return items;
                } else {
                    throw exc;
                }
            }

            item.append(value);
        }

        items.append(tuple(item));
    }
}

function isinstance(obj, cls) {
    if (cls instanceof _tuple) {
        var length = cls.__len__();

        if (length == 0) {
            return false;
        }

        for (var i = 0; i < length; i++) {
            var _cls = cls.__getitem__(i);

            if (isinstance(obj, _cls)) {
                return true;
            }
        }

        return false;
    } else {
        if (defined(obj.__class__) && defined(cls.__name__)) {
            return obj.__class__ == cls;
        } else {
            return obj instanceof cls;
        }
    }
}

py_builtins.bool = function(a) {
    if ((a != null) && defined(a.__bool__))
        return a.__bool__();
    else {
        if (a)
            return true;
        else
            return false;
    }
};

py_builtins.eq = function(a, b) {
    if ((a != null) && defined(a.__eq__))
        return a.__eq__(b);
    else if ((b != null) && defined(b.__eq__))
        return b.__eq__(a);
    else
        return a == b;
};

py_builtins._int = function(value) {
    return value;
};

py_builtins._float = function(value) {
    return value;
};

py_builtins.max = function(list) {
    if (len(list) == 0)
        throw new py_builtins.ValueError("max() arg is an empty sequence");
    else {
        var result = null;

        iterate(iter(list), function(item) {
                if ((result == null) || (item > result))
                    result = item;
        });

        return result;
    }
};

py_builtins.min = function(list) {
    if (len(list) == 0)
        throw new py_builtins.ValueError("min() arg is an empty sequence");
    else {
        var result = null;

        iterate(iter(list), function(item) {
                if ((result == null) || (item < result))
                    result = item;
        });

        return result;
    }
};

py_builtins.sum = function(list) {
    var result = 0;

    iterate(iter(list), function(item) {
        result += item;
    });

    return result;
};

py_builtins.print = function(s) {
    if (typeof(console) != "undefined" && defined(console.log))
        console.log(js(str(s)));
    else {
        if (arguments.length <= 1) {
            if (defined(s))
                print(s);
            else
                print("");
        } else {
            var args = tuple(to_array(arguments));
            print(str(" ").join(args));
        }
    }
};

/* Python 'iter' type */

function iter(obj) {
    if (obj instanceof Array) {
        return new _iter(obj);
    } else if (typeof(obj) === "string") {
        return iter(obj.split(""));
    } else if (obj.__class__ == _iter) {
        return obj;
    } else if (defined(obj.__iter__)) {
        return obj.__iter__();
    } else {
        throw new py_builtins.TypeError("object is not iterable");
    }
}

function _iter(seq) {
    this.__init__(seq);
}

_iter.__name__ = 'iter';
_iter.prototype.__class__ = _iter;

_iter.prototype.__init__ = function(seq) {
    this._seq = seq;
    this._index = 0;
};

_iter.prototype.__str__ = function () {
    return str("<iter of " + this._seq + " at " + this._index + ">");
};

_iter.prototype.toString = function () {
    return js(this.__str__());
};

_iter.prototype.next = function() {
    var value = this._seq[this._index++];

    if (defined(value)) {
        return value;
    } else {
        throw new py_builtins.StopIteration('no more items');
    }
};

/* Python 'slice' object */

function slice(start, stop, step) {
    return new _slice(start, stop, step);
}

function _slice(start, stop, step) {
    this.__init__(start, stop, step);
}

_slice.__name__ = 'slice';
_slice.prototype.__class__ = _slice;

_slice.prototype.__init__ = function(start, stop, step) {
    if (!defined(stop) && !defined(step))
    {
        stop = start;
        start = null;
    }
    if (!start && start != 0) start = null;
    if (!defined(stop)) stop = null;
    if (!defined(step)) step = null;
    this.start = start;
    this.stop = stop;
    this.step = step;
};

_slice.prototype.__str__ = function() {
    return str("slice(" + this.start + ", " + this.stop + ", " + this.step + ")");
};

_slice.prototype.indices = function(n) {
    var start = this.start;
    if (start == null)
        start = 0;
    if (start > n)
        start = n;
    if (start < 0)
        start = n+start;
    var stop = this.stop;
    if (stop > n)
        stop = n;
    if (stop == null)
        stop = n;
    if (stop < 0)
        stop = n+stop;
    var step = this.step;
    if (step == null)
        step = 1;
    return tuple([start, stop, step]);
};

/* Python 'tuple' type */

function tuple(seq) {
    if (arguments.length <= 1) {
        return new _tuple(seq);
    } else {
        throw new py_builtins.TypeError("tuple() takes at most 1 argument (" + arguments.length + " given)");
    }
}

function _tuple(seq) {
    this.__init__(seq);
}

_tuple.__name__ = 'tuple';
_tuple.prototype.__class__ = _tuple;

_tuple.prototype.__init__ = function(seq) {
    if (!defined(seq)) {
        this._items = [];
        this._len = 0;
    } else {
        this._items = copy(iter(seq));
        this._len = -1;
    }
};

_tuple.prototype.__str__ = function () {
    if (this.__len__() == 1) {
        return str("(" + this._items[0] + ",)");
    } else {
        return str("(" + this._items.join(", ") + ")");
    }
};

_tuple.prototype.__eq__ = function (other) {
    if (other.__class__ == this.__class__) {
        if (len(this) != len(other))
            return false;
        for (var i = 0; i < len(this); i++) {
            // TODO: use __eq__ here as well:
            if (this._items[i] != other._items[i])
                return false;
        }
        return true;
        // This doesn't take into account hash collisions:
        //return hash(this) == hash(other)
    } else
        return false;
};

_tuple.prototype.toString = function () {
    return js(this.__str__());
};

_tuple.prototype._js_ = function () {
    var items = [];

    iterate(iter(this), function(item) {
        items.push(js(item));
    });

    return items;
};

_tuple.prototype.__hash__ = function () {
    var value = 0x345678;
    var length = this.__len__();

    for (var index in this._items) {
        value = ((1000003*value) & 0xFFFFFFFF) ^ hash(this._items[index]);
        value = value ^ length;
    }

    if (value == -1) {
        value = -2;
    }

    return value;
};

_tuple.prototype.__len__ = function() {
    if (this._len == -1) {
        var count = 0;

        for (var index in this._items) {
            count += 1;
        }

        this._len = count;
        return count;
    } else
        return this._len;
};

_tuple.prototype.__iter__ = function() {
    return new _iter(this._items);
};

_tuple.prototype.__contains__ = function(item) {
    for (var index in this._items) {
        if (py_builtins.eq(item, this._items[index])) {
            return true;
        }
    }

    return false;
};

_tuple.prototype.__getitem__ = function(index) {
    var seq;
    if (isinstance(index, _slice)) {
        var s = index;
        var inds = s.indices(len(this));
        var start = inds.__getitem__(0);
        var stop = inds.__getitem__(1);
        var step = inds.__getitem__(2);
        seq = [];
        for (var i = start; i < stop; i += step) {
            seq.push(this.__getitem__(i));
        }
        return new this.__class__(seq);
    } else if ((index >= 0) && (index < len(this)))
        return this._items[index];
    else if ((index < 0) && (index >= -len(this)))
        return this._items[index+len(this)];
    else
        throw new py_builtins.IndexError("list assignment index out of range");
};

_tuple.prototype.__setitem__ = function(index, value) {
    throw new py_builtins.TypeError("'tuple' object doesn't support item assignment");
};

_tuple.prototype.__delitem__ = function(index) {
    throw new py_builtins.TypeError("'tuple' object doesn't support item deletion");
};

_tuple.prototype.count = function(value) {
    var count = 0;

    for (var index in this._items) {
        if (value == this._items[index]) {
            count += 1;
        }
    }

    return count;
};

_tuple.prototype.index = function(value, start, end) {
    if (!defined(start)) {
        start = 0;
    }

    for (var i = start; !defined(end) || (start < end); i++) {
        var _value = this._items[i];

        if (!defined(_value)) {
            break;
        }

        if (_value == value) {
            return i;
        }
    }

    throw new py_builtins.ValueError("tuple.index(x): x not in list");
};

/* Python 'list' type */

function list(seq) {
    if (arguments.length <= 1) {
        return new _list(seq);
    } else {
        throw new py_builtins.TypeError("list() takes at most 1 argument (" + arguments.length + " given)");
    }
}

function _list(seq) {
    this.__init__(seq);
}

_list.__name__ = 'list';
_list.prototype.__class__ = _list;

_list.prototype.__init__ = _tuple.prototype.__init__;

_list.prototype.__str__ = function () {
    return str("[" + this._items.join(", ") + "]");
};

_list.prototype.__eq__ = _tuple.prototype.__eq__;

_list.prototype.toString = _tuple.prototype.toString;

_list.prototype._js_ = _tuple.prototype._js_;

_list.prototype.__len__ = _tuple.prototype.__len__;

_list.prototype.__iter__ = _tuple.prototype.__iter__;

_list.prototype.__contains__ = _tuple.prototype.__contains__;

_list.prototype.__getitem__ = _tuple.prototype.__getitem__;

_list.prototype.__setitem__ = function(index, value) {
    if ((index >= 0) && (index < len(this)))
        this._items[index] = value;
    else if ((index < 0) && (index >= -len(this)))
        this._items[index+len(this)] = value;
    else
        throw new py_builtins.IndexError("list assignment index out of range");
};
_list.prototype.__setslice__ = function(lower, upper, value) {
     var it = list(value)._items;
     if ( lower < len(this) && upper < len(this)){
       this._items = this._items.slice(0,lower).concat(it).concat(this._items.slice(upper,len(this)));
       this._len = -1;
     }
};

_list.prototype.__delitem__ = function(index) {
    if ((index >= 0) && (index < len(this))) {
        var a = this._items.slice(0, index);
        var b = this._items.slice(index+1, len(this));
        this._items = a.concat(b);
        this._len = -1;
    } else
        throw new py_builtins.IndexError("list assignment index out of range");
};

_list.prototype.count = _tuple.prototype.count;

_list.prototype.index = function(value, start, end) {
    if (!defined(start)) {
        start = 0;
    }

    for (var i = start; !defined(end) || (start < end); i++) {
        var _value = this._items[i];

        if (!defined(_value)) {
            break;
        }

        if (_value == value) {
            return i;
        }

        if (defined(_value.__eq__)) {
            if (_value.__eq__(value))
                return i;
        }
    }

    throw new py_builtins.ValueError("list.index(x): x not in list");
};

_list.prototype.remove = function(value) {
    this.__delitem__(this.index(value));
};

_list.prototype.append = function(value) {
    this._items.push(value);
    this._len = -1;
};

_list.prototype.extend = function(l) {
    var items;
    items = this._items;
    iterate(iter(l), function(item) {
        items.push(item);
    });
    this._len = -1;
};

_list.prototype.pop = function() {
    if (len(this) > 0) {
        this._len = -1;
        return this._items.pop();
    } else
        throw new py_builtins.IndexError("pop from empty list");
};

_list.prototype.sort = function() {
    this._items.sort();
};

_list.prototype.insert = function(index, x) {
    var a = this._items.slice(0, index)
    var b = this._items.slice(index, len(this))
    this._items = a.concat([x], b)
    this._len = -1;
}

_list.prototype.reverse = function() {
    var new_list = list([]);
    iterate(iter(this), function(item) {
            new_list.insert(0, item);
    });
    this._items = new_list._items;
}

/* Python 'dict' type */

function dict(args) {
    return new _dict(args);
}

function _dict(args) {
    this.__init__(args);
}

_dict.__name__ = 'dict';
_dict.prototype.__class__ = _dict;

_dict.prototype.__init__ = function(args) {
    var items;
    var key;
    var value;

    if (defined(args)) {
        if (defined(args.__iter__)) {
            items = {};
            iterate(iter(args), function(item) {
                    key = js(item.__getitem__(0));
                    value = item.__getitem__(1);
                    items[key] = value;
            });
            this._items = items;
        }
        else
            this._items = args;
    } else {
        this._items = {};
    }
};

_dict.prototype.__str__ = function () {
    var strings = [];

    for (var key in this._items) {
        strings.push(js(str(key)) + ": " + js(str(this._items[key])));
    }

    return str("{" + strings.join(", ") + "}");
};

_dict.prototype.toString = function () {
    return js(this.__str__());
};

_dict.prototype._js_ = function () {
    var items = {};

    var _this_dict = this; // so that we can access it from within the closure:
    iterate(iter(this), function(key) {
        items[key] = js(_this_dict.__getitem__(key));
    });

    return items;
};

_dict.prototype.__hash__ = function () {
    throw new py_builtins.TypeError("unhashable type: 'dict'");
};

_dict.prototype.__len__ = function() {
    var count = 0;

    for (var key in this._items) {
        count += 1;
    }

    return count;
};

_dict.prototype.__iter__ = function() {
    return new _iter(this.keys());
};

_dict.prototype.__contains__ = function(key) {
    return defined(this._items[key]);
};

_dict.prototype.__getitem__ = function(key) {
    var value = this._items[key];

    if (defined(value)) {
        return value;
    } else {
        throw new py_builtins.KeyError(str(key));
    }
};

_dict.prototype.__setitem__ = function(key, value) {
    this._items[key] = value;
};

_dict.prototype.__delitem__ = function(key) {
    if (this.__contains__(key)) {
        delete this._items[key];
    } else {
        throw new py_builtins.KeyError(str(key));
    }
};

_dict.prototype.get = function(key, value) {
    var _value = this._items[key];

    if (defined(_value)) {
        return _value;
    } else {
        if (defined(value)) {
            return value;
        } else {
            return null;
        }
    }
};

_dict.prototype.items = function() {
    var items = [];

    for (var key in this._items) {
        items.push([key, this._items[key]]);
    }

    return items;
};

_dict.prototype.keys = function() {
    var keys = [];

    for (var key in this._items) {
        keys.push(key);
    }

    return keys;
};

_dict.prototype.values = function() {
    var values = [];

    for (var key in this._items) {
        values.push(this._items[key]);
    }

    return values;
};

_dict.prototype.update = function(other) {
    for (var key in other) {
        this._items[key] = other[key];
    }
};

_dict.prototype.clear = function() {
    for (var key in this._items) {
        delete this._items[key];
    }
};

_dict.prototype.pop = function(key, value) {
    var _value = this._items[key];

    if (defined(_value)) {
        delete this._items[key];
    } else {
        if (defined(value)) {
            _value = value;
        } else {
            throw new py_builtins.KeyError(str(key));
        }
    }

    return _value;
};

_dict.prototype.popitem = function() {
    var _key;

    for (var key in this._items) {
        _key = key;
        break;
    }

    if (defined(key)) {
        return [_key, this._items[_key]];
    } else {
        throw new py_builtins.KeyError("popitem(): dictionary is empty");
    }
};

/* Python 'str' type */

function str(s) {
    return new _str(s);
}

function _str(s) {
    this.__init__(s);
}

_str.__name__ = 'str';
_str.prototype.__class__ = _str;

_str.prototype.__init__ = function(s) {
    if (!defined(s)) {
        this._obj = '';
    } else {
        if (typeof(s) === "string") {
            this._obj = s;
        } else if (defined(s.toString)) {
            this._obj = s.toString();
        } else if (defined(s.__str__)) {
            this._obj = js(s.__str__());
        } else
            this._obj = js(s);
    }
};

_str.prototype.__str__ = function () {
    return this;
};

_str.prototype.__eq__ = function (other) {
    if (other.__class__ == this.__class__) {
        if (len(this) != len(other))
            return false;
        for (var i = 0; i < len(this); i++) {
            if (this._obj[i] != other._obj[i])
                return false;
        }
        return true;
    } else
        return false;
};

_str.prototype.toString = function () {
    return js(this.__str__());
};

_str.prototype._js_ = function () {
    return this._obj;
};

_str.prototype.__hash__ = function () {
    var value = 0x345678;
    var length = this.__len__();

    for (var index in this._obj) {
        value = ((1000003*value) & 0xFFFFFFFF) ^ hash(this._obj[index]);
        value = value ^ length;
    }

    if (value == -1) {
        value = -2;
    }

    return value;
};

_str.prototype.__len__ = function() {
    return this._obj.length;
};

_str.prototype.__iter__ = function() {
    return iter(this._obj);
};

_str.prototype.__bool__ = function() {
    return py_builtins.bool(this._obj);
};

_str.prototype.__eq__ = function(s) {
    if (typeof(s) === "string")
        return this._obj == s;
    else if (isinstance(s, _str))
        return this._obj == s._obj;
    else
        return false;
};

_str.prototype.__contains__ = function(item) {
    for (var index in this._obj) {
        if (item == this._obj[index]) {
            return true;
        }
    }

    return false;
};

_str.prototype.__getitem__ = function(index) {

    var seq;
    if (isinstance(index, _slice)) {
        var s = index;
        var inds = s.indices(len(this));
        var start = inds.__getitem__(0);
        var stop = inds.__getitem__(1);
        var step = inds.__getitem__(2);
        seq = "";
        for (var i = start; i < stop; i += step) {
            seq = seq + js(this.__getitem__(i));
        }
        return new this.__class__(seq);
    } else if ((index >= 0) && (index < len(this)))
        return this._obj[index];
    else if ((index < 0) && (index >= -len(this)))
        return this._obj[index+len(this)];
    else
        throw new py_builtins.IndexError("string index out of range");
};

_str.prototype.__setitem__ = function(index, value) {
    throw new py_builtins.TypeError("'str' object doesn't support item assignment");
};

_str.prototype.__delitem__ = function(index) {
    throw new py_builtins.TypeError("'str' object doesn't support item deletion");
};

_str.prototype.count = function(str, start, end) {
    if (!defined(start))
        start = 0;
    if (!defined(end))
        end = null;
    var count = 0;
    s = this.__getitem__(slice(start, end));
    idx = s.find(str);
    while (idx != -1) {
        count += 1;
        s = s.__getitem__(slice(idx+1, null));
        idx = s.find(str);
    }
    return count;
};

_str.prototype.index = function(value, start, end) {
    if (!defined(start)) {
        start = 0;
    }

    for (var i = start; !defined(end) || (start < end); i++) {
        var _value = this._obj[i];

        if (!defined(_value)) {
            break;
        }

        if (_value == value) {
            return i;
        }
    }

    throw new py_builtins.ValueError("substring not found");
};

_str.prototype.find = function(s) {
    return this._obj.search(s);
};

_str.prototype.rfind = function(s) {
    rev = function(s) {
        var a = list(str(s));
        a.reverse();
        a = str("").join(a);
        return a;
    }
    var a = rev(this);
    var b = rev(s);
    var r = a.find(b);
    if (r == -1)
        return r;
    return len(this)-len(b)-r
};

_str.prototype.join = function(s) {
    return str(js(s).join(js(this)));
};

_str.prototype.replace = function(old, _new, count) {
    old = js(old);
    _new = js(_new);
    var old_s;
    var new_s;

    if (defined(count))
        count = js(count);
    else
        count = -1;
    old_s = "";
    new_s = this._obj;
    while ((count != 0) && (new_s != old_s)) {
        old_s = new_s;
        new_s = new_s.replace(old, _new);
        count -= 1;
    }
    return str(new_s);
};

_str.prototype.lstrip = function(chars) {
    if (len(this) == 0)
        return this;
    if (defined(chars))
        chars = tuple(chars);
    else
        chars = tuple(["\n", "\t", " "]);
    var i = 0;
    while ((i < len(this)) && (chars.__contains__(this.__getitem__(i)))) {
        i += 1;
    }
    return this.__getitem__(slice(i, null));
};

_str.prototype.rstrip = function(chars) {
    if (len(this) == 0)
        return this
    if (defined(chars))
        chars = tuple(chars);
    else
        chars = tuple(["\n", "\t", " "]);
    var i = len(this)-1;
    while ((i >= 0) && (chars.__contains__(this.__getitem__(i)))) {
        i -= 1;
    }
    return this.__getitem__(slice(i+1));
};

_str.prototype.strip = function(chars) {
    return this.lstrip(chars).rstrip(chars);
};

_str.prototype.split = function(sep) {
    if (defined(sep)) {
        var r = list(this._obj.split(sep));
        var r_new = list([]);
        iterate(iter(r), function(item) {
                r_new.append(str(item));
        });
        return r_new;
    }
    else {
        var r_new = list([]);
        iterate(iter(this.split(" ")), function(item) {
                if (len(item) > 0)
                    r_new.append(item);
        });
        return r_new;
    }
};

_str.prototype.splitlines = function() {
    return this.split("\n");
};

_str.prototype.lower = function() {
    return str(this._obj.toLowerCase());
};

_str.prototype.upper = function() {
    return str(this._obj.toUpperCase());
};

/**
Copyright 2010 Jared Forsyth <jared@jareforsyth.com>

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

**/

/** python function madness =) **/

/**
 * How to use:

    $m([defaults], [aflag], [kflag], fn);

    defaults, aflag, and kflag are all optional, but required to be in that
        order to avoid ambiguity.

    defaults = an associative array of key, value pairs; the key is the arg
        name, anf the vaule is default value.

    aflag signals that the last (or second-to-last, if kflag is true) is to be
        populated with excess positional arguments. (in python, this is the *args
        syntax).

    kflag is like aflag, but for positional arguments, e.g. **kwargs.

    there's also checks happening the whole way, so you won't be stuck debugging
    another annoying undefined error.

    Here's an example that uses all of these:

    var foo = $m({c:null, d:10}, true, true, function foo(a, b, c, d, args, kwargs) {
        // only a and b are required, and excess positional and dictionary
        // arguments will be captured.
        console.log([a, b, c, d, args, kwargs]);
    });
    
    and in use...

    > foo(1);
    TypeError: foo requires 2 arguments (1 given)
    > foo(1,2);
    [1, 2, null, 10, [], {}]
    > foo(1,2,3);
    [1, 2, 3, 10, [], {}]
    > foo(1,2,3,4,5,6,7,8,9);
    [1, 2, 3, 4, [5, 6, 7, 8, 9], {}]

    now some some real magic; dictionary arguments:

    > foo.args([1], {'b':9, 'd':20, 'man':'hatten'}
    [1, 9, null, 20, [], {'man': 'hatten'}]

    !! that looks like python !! well...almost. but it's lovely :)
**/

var to_array = function(a){return Array.prototype.slice.call(a,0);};
var fnrx = /function(?:\s+\w*)?\s*\(([\w,\s]*)\)/;

function defined(x){
    return typeof(x) != 'undefined';
}
/*
String.prototype.strip = function(){
    return this.replace(/^\s+/,'').replace(/\s+$/,'');
};
*/
function get_fn_args(func) {
    /* get the arguments of a function */
    var match = (func + '').match(fnrx);
    if (!match)
        throw "ParseError: sorry, something went wrong on my end; are you sure you're passing me a valid function?" + (func+'');
    var args = match[1].split(',');
    for (var i=0;i<args.length;i++) {
        args[i] = args[i].replace(/^\s+/,'').replace(/\s+$/,'');
    }
    if (args.length == 1 && !args[0])
        return [];
    if (args.length !== func.length)
        throw "ParseError: didn't parse the right number of arguments: "+args.length+' vs '+func.length;
    return args;
}
    
function check_defaults(func_args, defaults, argnum) {
    var dflag = false;
    for (var i=0;i<argnum;i++) {
        if (defined(defaults[func_args[i]]))
            dflag = true;
        else if (dflag)
            return false;
    }
    return true;
}

function $m() {
    var args = Array.prototype.slice.call(arguments);
    if (!args.length)
        throw new Error("JS Error: $m requires at least one argument.");
    var func = args.pop();
    var name = func.__name__ || func.name;
    if (typeof(func) !== 'function')
        throw new Error("JS Error: $m requires a function as the last argument");
    var func_args = get_fn_args(func);
    var defaults = args.length?args.shift():{};
    if (!(defaults instanceof Object))
        throw new Error("the defaults argument must be an object");
    var aflag = args.length?args.shift():false;
    var kflag = args.length?args.shift():false;
    if (args.length) throw new Error("JS Error: $m takes at most 4 arguments. (" + (4+args.length) + " given)");

    var argnum = func_args.length;
    if (aflag) argnum--;
    if (kflag) argnum--;
    if (argnum < 0)
        throw new Error('SyntaxError: not enough arguments specified');

    if (!check_defaults(func_args, defaults, argnum))
        throw new Error("SyntaxError in function " + name + ": non-default argument follows default argument");

    var ndefaults = 0;
    var first_default = -1;
    for (var x in defaults){
        ndefaults++;
        var at = func_args.slice(0,argnum).indexOf(x);
        if (at === -1) {
            throw new Error('ArgumentError: unknown default key ' + x + ' for function ' + name);
        }
        else if (first_default === -1 || at < first_default)
            first_default = at;
    }
    if (first_default !== -1)
        for (var i=first_default;i<argnum;i++)
            if (!defined(defaults[func_args[i]]))
                throw new Error('SyntaxError: non-default argument follows default argument');

    var meta = function() {
        var name = func.__name__ || func.name;
        var args = to_array(arguments);
        for (var i=0;i<args.length;i++)
            if (!defined(args[i])) {
                var an = func_args[i] || aflag && func_args.slice(-1)[0];
                throw new Error("TypeError: you passed in something that was undefined to " + __builtins__.str(meta) + '() for argument ' + an);
            }
        if (args.length > argnum) {
            if (!aflag)
                throw new Error("TypeError: " + name + "() takes at most " + (argnum) + " arguments (" + args.length + " given)");
            var therest = __builtins__.tuple(args.slice(argnum));
            args = args.slice(0, argnum);
            args.push(therest);
        } else {
            for (var i=args.length; i<argnum; i++) {
                if (!defined(defaults[func_args[i]])) {
                    throw __builtins__.TypeError(name + "() takes at least " + (argnum-ndefaults) +" arguments (" + args.length + " given)");
                }
                args.push(defaults[func_args[i]]);
            }
            if (aflag)
                args.push(__builtins__.tuple());
        }
        if (kflag)
            args.push(__builtins__.dict());
        if (__builtins__)
            __builtins__._debug_stack.push([name, meta, args]);
        var result = func.apply(null, args);
        if (__builtins__)
            __builtins__._debug_stack.pop();
        if (result === undefined) result = null;
        return result;
    };

    meta.args = function(args, dict) {
        if (!defined(dict))
            throw new Error('TypeError: $m(fn).args must be called with both arguments.');
        if (args.__class__) {
            if (!__builtins__.isinstance(args, [__builtins__.tuple, __builtins__.list])) {
                throw new Error('can only pass a list or tuple to .args()');
            } else {
                args = args.as_js();
            }
        }
        if (dict.__class__) {
            if (!__builtins__.isinstance(dict, [__builtins__.dict])) {
                __builtins__.raise(__builtins__.TypeError('can only pass a dict to .args()'));
            } else {
                dict = dict.as_js();
            }
        }
        // convert args, dict to types
        if (args.length > argnum) {
            if (!aflag)
                throw new Error("TypeError: " + name + "() takes at most " + argnum + ' arnuments (' + args.length + ' given)');
            therest = __builtins__.tuple(args.slice(argnum));
            args = args.slice(0, argnum);
            args.push(therest);
        } else {
            for (var i=args.length;i<argnum;i++) {
                var aname = func_args[i];
                if (defined(dict[aname])) {
                    args.push(dict[aname]);
                    delete dict[aname];
                } else if (defined(defaults[aname]))
                    args.push(defaults[aname]);
                else
                    throw new Error('TypeError: ' + name + '() takes at least ' + argnum-ndefaults + ' non-keyword arguments');
            }
            if (aflag)
                args.push(__builtins__.tuple());
        }
        if (kflag)
            args.push(__builtins__.dict(dict));
        else
            for (var kname in dict)
                throw new Error("TypeError: " + name + '() got unexpected keyword argument: ' + kname);
        if (__builtins__)
            __builtins__._debug_stack.push([name, func, [args, dict]]);
        var result = func.apply(null, args);
        if (__builtins__)
            __builtins__._debug_stack.pop();
        if (result === undefined) result = null;
        return result;
    };
    meta.__wraps__ = func;
    meta.__type__ = func.__type__?func.__type__:'function';
    meta.__name__ = func.__name__?func.__name__:func.name;
    func.__wrapper__ = meta;
    meta.args.__wraps__ = func;
    meta.args.__type__ = meta.__type__;
    meta.args.__name__ = meta.__name__;
    return meta;
}

// vim: sw=4 sts=4
/**
Copyright 2010 Jared Forsyth <jared@jareforsyth.com>

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

**/

/** python-style classes in javascript!! **/

var to_array = function to_array(a){return Array.prototype.slice.call(a,0);};

function instancemethod(cls, fn) {
    var meta = function $_instancemethod() {
        /*
        if (!__builtins__.isinstance(arguments[0], cls))
            throw new Error('TypeError: unbound method '+fn.__name__+'() must be called with '+cls.__name__+' instance as the first argument');
        */
        return fn.apply(null, arguments);
    }
    meta.__name__ = fn.__name__?fn.__name__:fn.name;
    meta.__type__ = instancemethod;
    meta.__wraps__ = fn;
    fn.__wrapper__ = meta;
    meta.__str__ = function str(){
        return '<unbound method '+cls.__name__+'.'+meta.__name__+'>';
    };
    meta.im_class = cls;
    meta.im_func = fn;
    meta.im_self = null;
    meta.__get__ = function $_get(self, cls) {
        cls = cls||self.__class__;
        /*
        if (!__builtins__.isinstance(self, cls))
            throw new Error('idk what just happened... invalid self while binding instancemethod');
        */
        var m2 = function() {
            return fn.apply(this, [self].concat(to_array(arguments)));
        };
        m2.__name__ = meta.__name__;
        m2.__class__ = cls;
        m2.__type__ = instancemethod;
        m2.__wraps__ = fn;
        fn.__wraper__ = fn;
        m2.__str__ = function(){
            return '<bound method '+cls.__name__+'.'+meta.__name__+' of '+self.__str__()+'>';
        };
        m2.im_class = cls;
        m2.im_func = fn;
        m2.im_self = self;
        m2.args = function $_args(pos, kwd) {
            if (pos.__class__)
               pos = __builtins__.tuple([self]).__add__(pos);
            else
               pos = [self].concat(pos);
            return fn.args(pos, kwd);
        };
        m2.args.__name__ = meta.__name__;
        return m2;
    };
    return meta;
}

function _set_name(fn, name) {
    fn.__name__ = name;
    while(fn = fn.__wraps__)
        fn.__name__ = name;
}

var type = $m(function type(name, bases, namespace) {
    var cls = function $_type() {
        var self = {};
        self.__init__ = instancemethod(cls, function(){}).__get__(self);
        self.__class__ = cls;
        self.__type__ = 'instance';

        for (var attr in cls) {
            if (['__type__','__class__'].indexOf(attr)!==-1)
              continue;
            var val = cls[attr];
            if (val && val.__type__ == instancemethod && !val.im_self) {
                self[attr] = val.__get__(self, cls);
                _set_name(self[attr], attr);
            } else
                self[attr] = val;
        }
        self.__init__.apply(null, arguments);
        self._old_toString = self.toString;
        if (self.__str__)
            self.toString = function(){ return self.__str__()._data; };
        return self;
    };
    var ts = cls.toString;
    var __setattr__ = $m(function class_setattr(key, val) {
        if (val && val.__type__ === 'function' ||
                (val && !val.__type__ && typeof(val)==='function')) {
            cls[key] = instancemethod(cls, val);
        } else if (val && val.__type__ === classmethod) {
            cls[key] = val.__get__(cls);
        } else if (val && val.__type__ === staticmethod) {
            cls[key] = val.__get__(cls);
        } else if (val && val.__type__ === instancemethod) {
            cls[key] = instancemethod(cls, val.im_func);
        } else
            cls[key] = val;
    });
    for (var i=0;i<bases.length;i++) {
        for (var key in bases[i]) {
            if (key === 'prototype') continue;
            var val = bases[i][key];
            __setattr__(key, val);
        }
    }
    cls.__type__ = 'type';
    cls.__bases__ = bases;
    cls.__name__ = name;
    for (var key in namespace) {
        __setattr__(key, namespace[key]);
    }
    //if (cls.toString === ts)
    //  cls.toString = cls.__str__;
    return cls;
});

function classmethod(val) {
    var clsm = {};
    clsm.__get__ = function(cls) {
        return instancemethod(cls, val).__get__(cls);
    };
    clsm.__type__ = classmethod;
    clsm.__str__ = function(){return '<classmethod object at 0x10beef01>';};
    return clsm;
}
/*
function __classmethod(cls, val){
    var fn = function() {
        return val.apply(this, [cls].concat(to_array(arguments)));
    };
    if (val.args) {
        fn.args = function(pos, kwd) {
            return val.args([cls].concat(pos), kwd);
        };
    }
    fn.__type__ = 'classmethod';
    fn.__wraps__ = val;
    return fn;
}

// decorators
function classmethod(method){
    method.__cls_classmethod = true;
    return method;
}
*/
function staticmethod(method){
    var obj = {};
    obj.__type__ = staticmethod;
    obj.__get__ = function(){return method;}
    obj.__str__ = function(){return '<staticmethod object at 0x10beef01>';};
    return obj;
}

var Class = type;

function object(){
    /* object constructor */
}

object.__name__ = 'object';

object.prototype.__class__ = object;

object.prototype.__mro__ = [];

object.prototype.__inherited__ = {};

object.prototype.__init__ = function() {
    /* object constructor */
};

object.prototype.__getattr__ = function (key) {
    return this[key];
};

object.prototype.__setattr__ = function (key, value) {
    this[key] = value;
};

var extend = function(cls, base_list) {
    var _mro = mro(cls,base_list);
    cls.prototype.__mro__ = _mro;
    //properties not defined in the original definition
    cls.prototype.__inherited__ = {};
    for (var i = 1; i < _mro.length; i++){
        base = _mro[i];
        for(var property in base.prototype){
            if(!(property in cls.prototype) && !(property in base.prototype.__inherited__)){
                cls.prototype[property] = base.prototype[property];
                cls.prototype.__inherited__[property] = base.prototype[property];
            }
        }
    }
    //static properties not defined in the original definition
    cls.__inherited__ = {};
    for (var i = 1; i < _mro.length; i++){
        base = _mro[i];
        for(var property in base){
            if(!(property in cls) && !(property in base.__inherited__)){
                cls[property] = base[property];
                cls.__inherited__[property] = base[property];
            }
        }
    }
}

var mro = function(cls, base_list) {
    var order = [];
    if (cls === object) {
        return [object];
    }else if(base_list.length === 1 && base_list[0]===object) {
        return [cls, object];
    }
    
    var orderlists = [];
    for (var i = 0; i < base_list.length; i++){
        orderlists[i] = base_list[i].prototype.__mro__.slice(0);
    }
    orderlists[orderlists.length] = [cls].concat(base_list);
    while (orderlists.length > 0) {
        candidate_found = false;
        for (var i = 0; i < orderlists.length; i++){
            candidatelist = orderlists[i]
            candidate = candidatelist[0];
            if(mro_not_blocking(candidate,orderlists)){
                /**good candidate */
                candidate_found = true;
                break;
                }
            }
        if(!candidate_found || order.indexOf(candidate)>-1){
            throw Exception;
            }
        order[order.length] = candidate;
        for (var i = orderlists.length-1; i >= 0; i--){
            if(orderlists[i][0] === candidate){
                orderlists[i].splice(0,1);
                if(orderlists[i].length === 0){
                    orderlists.splice(i,1);
                    }
                }
            }
        }
    return order;
}

var mro_not_blocking = function(candidate, orderlists) {
    for(var j = 0; j < orderlists.length; j++){
        if(orderlists[j].indexOf(candidate)>0){
            return false;
            }
        }
        return true;
}

var _super = function(cls,instance){
    super_instance = {};
    _mro = instance.__mro__;
    cls_name = cls.__name__;
    function make_caller(base, property){
        var f = function(){
            base.prototype[property].apply(instance,arguments);
        }
        return f;
    }

    var k = 0;
    while((_mro[k].__name__ !== cls_name) && k<_mro.length){
        k = k + 1;
    }
    if(k === _mro.length){
        cls_name = cls.__name__;
        throw new py_builtins.AttributeError(instance, cls_name);}
    k = k + 1;
    for (var i = k; i < _mro.length; i++){
        base = _mro[i];
        for(var property in base.prototype){
            if(!(property in super_instance)){
                try{
                    super_instance[property] = make_caller(base,property);
                }catch(e){
                    super_instance[property] = base.prototype[property];
                }
                }
        }
    }
    //TODO: super of static methods and class attributes
    return super_instance;
}

/**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};

/**
Copyright 2010 Jared Forsyth <jared@jareforsyth.com>

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

**/

/** general module loading... not spectacular, I know; it gets better when you
 * add sys and __builtins__
 **/

var __module_cache = {};
function module(filename, fn) {
    var that = {};
    that.__file__ = filename;
    that.__init__ = fn;
    that.load = $m({'mod':null}, function load_module(name, mod) {
        if (mod === null) mod = {};
        mod.__name__ = name;
        if (__builtins__) mod.__name__ = __builtins__.str(name);
        mod.__file__ = that.__file__;
        if (__builtins__) mod.__file__ = __builtins__.str(that.__file__);
        mod.__dict__ = mod;
        that._module = mod;
        fn(mod);
        return mod;
    });
    __module_cache[that.__file__] = that;
}

/**
Copyright 2010 Jared Forsyth <jared@jareforsyth.com>

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

**/

// dumb IE fix
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0)
      from += len;

    for (; from < len; from++)
    {
      if (from in this &&
          this[from] === elt)
        return from;
    }
    return -1;
  };
}

//include slice method
if (!Array.slice)
{
    Array.slice= function(){
        array_like = arguments[0];
        start = arguments[1];
        end = arguments[2];
        arr=[];
        if(end === undefined){
            for(var i = start; i < array_like.length; i++){
                arr[i-start] = array_like[i];
            }
        }else{
            for(var i = start; i < end; i++){
                arr[i-start] = array_like[i];
            }
        }
        return arr;
    }
}

/**
Now you can import stuff...just like in python.
**/

var __not_implemented__ = function __not_implemented__(name) {
    return function not_implemented() {
        if (arguments.callee.__name__)
            name = arguments.callee.__name__;
        $b.raise($b.NotImplementedError("the builtin function "+name+" is not implemented yet. You should help out and add it =)"));
    };
};

module('<builtin>/sys.py', function sys_module(_) {
    _.__doc__ = "The PJs module responsible for system stuff";
    _.modules = {'sys':_}; // sys and __builtin__ won't be listed
                             // it doesn't make sense for them to be
                             // reloadable.
    _.path = ['.', '<builtin>'];
    _.exit = $m({'code':0}, function exit(code) {
        _.raise("SystemExit: sys.exit() was called with code "+code);
    });
});

module('<builtin>/os/path.py', function os_path_module(_) {
    _.__doc__ = "a module for dealing with paths";
    _.join = $m({}, true, function join(first, args) {
        first = $b.js(first);
        args = $b.js(args);
        var path = first;
        for (var i=0;i<args.length;i++) {
            args[i] = $b.js(args[i]);
            if (_.isabs(args[i])) {
                path = args[i];
            } else if (path === '' || '/\\:'.indexOf(path.slice(-1)) !== -1) {
                path += args[i];
            } else
                path += '/' + args[i];
        }
        return $b.str(path);
    });
    _.isabs = $m(function isabs(path) {
        path = $b.js(path);
        if (!path)return false;
        return path && path[0] == '/';
    });
    _.abspath = $m(function abspath(path) {
        path = $b.js(path);
        if (!_.isabs(path))
            _.raise("not implementing this atm");
        return _.normpath(path);
    });
    _.dirname = $m(function dirname(path) {
        path = $b.js(path);
        return $b.str(path.split('/').slice(0,-1).join('/') || '/');
    });
    _.basename = $m(function basename(path) {
        path = $b.js(path);
        return $b.str(path.split('/').slice(-1)[0]);
    });
    _.normpath = $m(function normpath(path) {
        path = $b.js(path);
        var prefix = path.match(/^\/+/) || '';
        var comps = path.slice(prefix.length).split('/');
        var i = 0;
        while (i < comps.length) {
            if (comps[i] == '.')
                comps = comps.slice(0, i).concat(comps.slice(i+1));
            else if (comps[i] == '..' && i > 0 && comps[i-1] && comps[i-1] != '..') {
                comps = comps.slice(0, i-1).concat(comps.slice(i+1));
                i -= 1;
            } else if (comps[i] == '' && i > 0 && comps[i-1] != '') {
                comps = comps.slice(0, i).concat(comps.slice(i+1));
            } else
                i += 1
        }
        if (!prefix && !comps)
            comps.push('.');
        return $b.str(prefix + comps.join('/'));
    });
});

module('<builtin>/__builtin__.py', function builting_module(_) {

    var sys = __module_cache['<builtin>/sys.py']._module;

    _.__doc__ = 'Javascript corrospondences to python builtin functions';

    _.js = $m(function(what) {
        if (what === null) return what;
        if (_.isinstance(what, [_.list, _.tuple])) {
          var l = what.as_js();
          var res = [];
          for (var i=0;i<l.length;i++) {
            res.push(_.js(l[i]));
          }
          return res;
        } else if (_.isinstance(what, _.dict)) {
          var obj = {};
          var k = what.keys().as_js();
          var v = what.values().as_js();
          for (var i=0;i<k.length;i++) {
            obj[_.js(k[i])] = _.js(v[i]);
          }
          return obj;
        }
        if (typeof(what) === 'object') {
          if (defined(what.as_js))
              return what.as_js();
          else if (what.__class__ || what.__type__)
              _.raise(_.TypeError('cannot coerce to javascript'));
        }
        return what;
    });
    /** importing modules **/
    _.__import__ = $m({'file':'','from':''},
      function __import__(name, from, file) {
        from = $b.js(from);
        file = $b.js(file);
        if (defined(sys.modules[name]))
            return sys.modules[name];
        var path = __module_cache['<builtin>/os/path.py']._module;
        var relflag = false;
        var foundat = null;
        var syspath = $b.js(sys.path);
        for (var i=0;i<syspath.length;i++) {
            relflag = syspath[i][0] !== '/' && syspath[i].indexOf('<builtin>') !== 0;
            if (relflag)
                var dname = $b.js(path.normpath(path.join(path.dirname(file), syspath[i])));
            else
                var dname = $b.js(syspath[i]);
            var fname = $b.js(path.join(dname, $b.js(name).replace('.', '/')+'.py'));
            if (defined(__module_cache[fname])) {
                foundat = fname;
                break;
            }
        }
        if (!foundat)
            _.raise("ImportError: no module named "+name);
        if (relflag) {
            var mname = [from.split('.').slice(0,-1)].concat([name]).join('.');
            if (mname[0] == '.')mname = mname.slice(1);
        } else
            var mname = name;
        if (!defined(sys.modules[mname])) {
            sys.modules[mname] = {}
            __module_cache[foundat].load(mname, sys.modules[mname]);
        }
        return sys.modules[mname];
    });

    _.reload = $m(function reload(module) {
        delete sys.modules[module.__name__];
        // TODO: this could cause problems, not providing a source file or
        // source name...import might not go through
        return _.__import__(module.__name__);
    });

    /** operators **/
    _.do_op = $m(function do_op(op, rop, a, b) {
        var val;
        if (a[op]) {
            val = a[op](b);
            if (val !== _.NotImplemented)
                return val;
        }
        if (b[rop]) {
            return b[rop](a);
        }
        return _.NotImplemented;

    });
    _.do_ops = $m({}, true, function do_ops(allthem) {
        var ops = {'<':_.lt,'>':_.gt,'<=':_.lte,'>=':_.gte,'==':_.eq,'!=':_.ne};
        if (_.len(allthem) % 2 === 0)
            _.raise(_.ValueError('do_ops requires an odd number of arguments'));
        allthem = _.js(allthem);
        for (var i=0;i<allthem.length-2;i+=2) {
            if (allthem[i+1] === '===') {
                if (allthem[i] !== allthem[i+2])
                    return false;
            } else if (allthem[i+1] === '!==') {
                if (allthem[i] === allthem[i+2])
                    return false;
            } else {
                if (undefined === ops[allthem[i+1]])
                    _.raise(_.ValueError('invalid op'));
                if (!ops[allthem[i+1]](allthem[i], allthem[i+2]))
                    return false;
            }
        }
        return true;
    });
    _.add = $m(function add(a, b) {
        var val = _.do_op('__add__', '__radd__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a + b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.add.__module__ = _.__name__;
    _.sub = $m(function sub(a, b) {
        var val = _.do_op('__sub__', '__rsub__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a - b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.gt = $m(function gt(a, b) {
        var val = _.do_op('__gt__', '__lt__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a > b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.lt = $m(function lt(a, b) {
        return !_.gte(a, b);
    });
    _.gte = $m(function ge(a, b) {
        var val = _.do_op('__ge__', '__le__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a >= b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.lte = $m(function le(a, b) {
        return !_.gt(a, b);
    });
    _.mod = $m(function mod(a, b) {
        var val = _.do_op('__mod__', '__rmod__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a % b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for %'));
        } else
            return val;
    });
    _.mult = $m(function mul(a, b) {
        var val = _.do_op('__mul__', '__rmul__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return a * b;
            else
                _.raise(_.TypeError('unsupported operand type(s) for *'));
        } else
            return val;
    });
    _.ne = $m(function ne(a, b) {
        var val = _.do_op('__ne__', '__ne__', a, b);
        if (val === _.NotImplemented) {
              return a !== b;
        } else
            return val;
    });
    _.eq = $m(function eq(a, b) {
        var val = _.do_op('__eq__', '__eq__', a, b);
        if (val === _.NotImplemented) {
              return a === b;
        } else
            return val;
    });
    _.div = $m(function div(a, b) {
        var val = _.do_op('__div__', '__rdiv__', a, b);
        if (val === _.NotImplemented) {
            if (typeof(a) === typeof(b) && typeof(a) === 'number')
                return Math.floor(a / b);
            else
                _.raise(_.TypeError('unsupported operand type(s) for /'));
        } else
            return val;
    });


    /** basic value types **/

    _.dict = Class('dict', [], {
        // **TODO** add a **kwargs to this
        __init__: $m({'itable':{}}, function __init__(self, itable){
            self._keys = [];
            self._values = [];
            if (!itable.__class__) {
                if (itable instanceof Array) {
                    for (var i=0;i<itable.length;i++) {
                        self.__setitem__(itable[i][0], itable[i][1]);
                    }
                } else if (!(itable instanceof Object))
                    _.raise(_.ValueError('arg cannot be coerced to a dict'));
                else {
                    for (var k in itable) {
                        self.__setitem__(k, itable[k]);
                    }
                }
            } else if (_.isinstance(itable, _.dict)) {
                var keys = itable.keys();
                for (var i=0;i<keys.__len__();i++){
                    self.__setitem__(key, itable.__getitem__(keys.__getitem__(i)));
                }
            } else {
                var args = _.iter(itable);
                while (true) {
                    try {
                        var kv = args.next();
                        self.__setitem__(kv[0], kv[1]);
                    } catch(e) {
                        if (_.isinstance(e, _.StopIteration))
                            break;
                        throw e;
                    }
                }
            }
        }),
        as_js: $m(function as_js(self) {
            var dct = {}
            for (var i=0;i<self._keys.length;i++){
                dct[self._keys[i]] = self._values[i];
            }
            return dct;
        }),
        __cmp__: $m(function __cmp__(self, other){
            _.raise(_.AttributeError('not yet implemented'));
        }),
        __contains__: $m(function __contains__(self, key){
            return self._keys.indexOf(key) !== -1;
        }),
        __delitem__: $m(function __delattr__(self, key){
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                self._keys = self._keys.slice(0, i).concat(self._keys.slice(i+1));
                self._values = self._values.slice(0, i).concat(self._values.slice(i+1));
            } else
                _.raise(_.KeyError(key+' not found'));
        }),
        __delattr__: $m(function __delitem__(self, key){
            _.raise(_.KeyError('doesnt make sense'));
        }),
        __doc__: 'builtin dictionary type',
        __eq__: $m(function __eq__(self, dct){
            var mk = self.keys();
            var ok = dct.keys();
            if (!mk.__eq__(ok))return false;
            for (var i=0;i<mk.__len__();i++) {
                if (!_.eq(self.__getitem__(mk.__getitem__(i)),
                        dct.__getitem__(mk.__getitem__(i))))
                    return false;
            }
            return true;
        }),
        __format__: __not_implemented__('format'),
        __ge__: __not_implemented__('ge'),
        __hash__: null,
        __iter__: $m(function __iter__(self) {
            return self.keys().__iter__();
        }),
        __len__: $m(function __len__(self){
            return self.keys().__len__();
        }),
        __repr__: $m(function __repr__(self){
            return self.__str__();
        }),
        __setitem__: $m(function __setitem__(self, key, value){
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                self._values[i] = value;
            } else {
                self._keys.push(key);
                self._values.push(value);
            }
        }),
        __str__: $m(function __str__(self){
            var strs = [];
            for (var i=0;i<self._keys.length;i++){
                strs.push(_.repr(self._keys[i])+': '+_.repr(self._values[i]));
            }
            return _.str('{'+strs.join(', ')+'}');
        }),
        clear: $m(function clear(self){
            delete self._keys;
            delete self._values;
            self._keys = [];
            self._values = [];
        }),
        copy: $m(function copy(self){
            return _.dict(self);
        }),
        fromkeys: classmethod($m({'v':null}, function fromkeys(cls, keys, v){
            var d = cls();
            var keys = _.iter(keys);
            while (true) {
                try {
                    d.__setitem__(keys.next(), v);
                } catch(e) {
                    if (_.isinstance(e, _.StopIteration))
                        break
                    throw e;
                }
            }
            return d;
        })),
        get: $m({'def':null}, function get(self, key, def){
            var i = self._keys.indexOf(key);
            if (i !== -1)
                return self._values[i];
            return def;
        }),
        has_key: $m(function has_key(self, key){
            return self._keys.indexOf(key) !== -1;
        }),
        items: $m(function items(self){
            var items = [];
            for (var i=0;i<self._keys.length;i++) {
                items.push(_.list([self._keys[i], self._values[i]]));
            }
            return _.list(items);
        }),
        iteritems: $m(function iteritems(self){
            // TODO: nasty hack...doesn't actually get you any lazy benefits
            return self.items().__iter__();
        }),
        iterkeys: $m(function iterkeys(self){
            return self.keys().__iter__();
        }),
        itervalues: $m(function itervalues(self){
            return self.values().__iter__();
        }),
        keys: $m(function keys(self){
            return _.list(self._keys.slice());
        }),
        pop: $m({'default_':null}, function pop(self, key, default_){
            var i = self._keys.indexOf(key);
            if (i !== -1) {
                var v = self._values[i];
                self.__delitem__(key);
                return v;
            }
            return default_;
        }),
        popitem: $m(function popitem(self){
            if (self.__len__()==0)
                _.raise(_.KeyError('popitem(): dictionary is empty'));
            return self.pop(self._keys[0]);
        }),
        setdefault: $m(function setdefault(self, k, d){
            if (!self.has_key(k))
                self.__setitem__(k, d);
            return self.__getitem__(k);
        }),
        update: $m(function update(self, other){
            var keys = _.dict(other).keys().as_js();
            for (var i=0;i<keys.length;i++){
                self.__setitem__(keys[i], other.__getitem__(keys[i]));
            }
        }),
        values: $m(function values(self){
            return _.list(self._values.slice());
        })
    });

    _.unicode = __not_implemented__("unicode");
    _.bytearray = __not_implemented__("bytearray");
    _.object = __not_implemented__("object");
    _.complex = __not_implemented__("complex");

    _.bool = $m(function bool(what) {
        if (defined(what.__bool__))
            return what.__bool__();
        else if (defined(what.__len__))
            return _.len(what) !== 0;
        if (what)
            return true;
        return false;
    });

    _._int = $m(function _int(what) {
        if (typeof(what) === 'string')
            return parseInt(what);
        else if (typeof(what) === 'number') return what;
        else
            _.raise(_.TypeError('can\'t coerce to int'));
    });
    _._float = Class('float', [], {
        __init__: $m({'what':0.0}, function __init__(self, what) {
            self._data = what;
        }),
        as_js: $m(function(self){
            return self._data;
        }),
        __str__: $m(function (self) {
            return _.str('' + self._data);
        }),
        __div__: $m(function __div__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(self._data/_.js(other));
            }
            return _.NotImplemented;
        }),
        __rdiv__: $m(function __rdiv__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other)/self._data);
            }
            return _.NotImplemented;
        }),
        __add__: $m(function __add__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) + self._data);
            }
            return _.NotImplemented;
        }),
        __radd__: $m(function __radd__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) + self._data);
            }
            return _.NotImplemented;
        }),
        __mul__: $m(function __mul__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) * self._data);
            }
            return _.NotImplemented;
        }),
        __rmul__: $m(function __rmul__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) * self._data);
            }
            return _.NotImplemented;
        }),
        __sub__: $m(function __sub__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(self._data - _.js(other));
            }
            return _.NotImplemented;
        }),
        __rsub__: $m(function __rsub__(self, other) {
            if ([_._int, _._float].indexOf(_.type(other)) !== undefined) {
                return _._float(_.js(other) - self._data);
            }
            return _.NotImplemented;
        })
    });


    _.tuple = Class('tuple', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._len = ible.length;
                self._list = ible.slice();
            } else if (_.isinstance(ible, [_.tuple, _.list])) {
                self._list = ible.as_js().slice();
                self._len = self._list.length;
            } else {
                var __ = _.foriter(ible);
                self._list = [];
                self._len = 0;
                while (__.trynext()){
                    self._list.push(__.value);
                    self._len++
                }
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!_.isinstance(other, _.tuple))
                _.raise(_.TypeError('can only concatenate tuple to tuple'));
            return _.tuple(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            return self._list.indexOf(one) !== -1;
        }),
        __doc__: 'javascript equivalent of the python builtin tuble class',
        __eq__: $m(function __eq__(self, other){
            if (!_.isinstance(other, _.tuple))
                return false;
            if (self.__len__() !== other.__len__()) return false;
            var ln = self.__len__();
            for (var i=0;i<ln;i++) {
                if (!_.eq(self._list[i], other._list[i]))
                    return false;
            }
            return true;
        }),
        __ge__: __not_implemented__('nope'),
        __getitem__: $m(function __getitem__(self, index) {
            if (_.isinstance(index, _.slice)) {
                var nw = [];
                var sss = index.indices(self._list.length).as_js();
                for (var i=sss[0];i<sss[1];i+=sss[2])
                    nw.push(self._list[i]);
                return _.tuple(nw);
            } else if (typeof(index) === 'number') {
                if (index < 0) index += self._list.length;
                if (index < 0 || index >= self._list.length)
                    _.raise(_.IndexError('index out of range'));
                return self._list[index];
            } else
                _.raise(_.ValueError('index must be a number or slice'));
        }),
        __getnewargs__: __not_implemented__('sorry'),
        __getslice__: $m(function __getslice__(self, a, b) {
            return _.tuple(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __hash__: __not_implemented__(''),
        __iter__: $m(function __iter__(self) {
            return _.tupleiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $m(function __len__(self) { return self._len; }),
        __lt__: __not_implemented__(''),
        __mul__: $m(function __mul__(self, other) {
            if (_.isinstance(other, _._int))
                other = other.as_js();
            if (typeof(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return _.tuple(res);
            }
            _.raise(_.TypeError('only can multiply by a number'));
        }),
        __ne__: __not_implemented__(''),
        __repr__: $m(function __repr__(self) { return self.__str__(); }),
        __rmul__: $m(function __rmul__(self, other) {
            return self.__mul__(other);
        }),
        count: $m(function count(self, value) {
            var c = 0;
            for (var i=0;i<self._len;i++) {
                if (_.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        index: $m(function index(self, value) {
            for (var i=0;i<self._len;i++) {
                if (_.eq(self._list[i], value))
                    return i;
            }
            _.raise(_.ValueError('x not in list'));
        }),
        __str__: $m(function __str__(self) {
            var a = [];
            for (var i=0;i<self._len;i++) {
                a.push(_.repr(self._list[i]));
            }
            if (a.length == 1) {
                return _.str('('+a[0]+',)');
            }
            return _.str('('+a.join(', ')+')');
        })
    });

    _.frozenset = __not_implemented__("frozenset");
    _.hash = __not_implemented__("hash");
    _._long = __not_implemented__("long");
    _.basestring = __not_implemented__("basestring");
    _.floordiv = $m(function floordiv(a, b) {
        return Math.floor(a/b);
    });

    _.str = Class('str', [], {
        __init__: $m({'item':''}, function __init__(self, item) {
            if (item === null)
                self._data = 'None';
              else if (typeof(item) === 'string')
                self._data = item;
            else if (typeof(item) === 'number')
                self._data = ''+item;
            else if (typeof(item) === 'boolean')
                self._data = _.str(''+item).title()._data;
            else if (defined(item.__str__) && item.__str__.im_self)
                self._data = item.__str__()._data;
            else if (item.__type__ === 'type')
                self._data = "<class '" + item.__module__ + '.' + item.__name__ + "'>";
            else if (item.__class__)
                self._data = '<' + item.__class__.__module__ + '.' + item.__class__.__name__
                                + ' instance at 0xbeaded>';
            else if (item instanceof Array) {
                var m = [];
                for (var i=0;i<item.length;i++) {
                    m.push(_.repr(item[i]));
                }
                self._data = '[:'+m.join(', ')+':]';
            } else if (item instanceof Function) {
                if (!item.__name__) {
                    if (item.name)
                        self._data = '<javascript function "' + item.name + '">';
                    else if (!item.__module__)
                        self._data = '<anonymous function...>';
                    else
                        self._data = '<anonymous function in module "' + item.__module__ + '">';
                } else {
                    var name = item.__name__;
                    while (item.__wrapper__)
                      item = item.__wrapper__;
                    if (item.im_class)
                        name = item.im_class.__name__ + '.' + name;
                    if (item.__class__)
                        name = item.__class__.__name__ + '.' + name;
                    if (!item.__module__)
                        
                        self._data = '<function '+ name +'>';
                    else
                        self._data = '<function '+ name +' from module '+item.__module__+'>';
                }
            } else if (typeof(item) === 'object') {
                var m = [];
                for (var a in item) {
                    m.push("'"+a+"': "+_.repr(item[a]));
                }
                self._data = '{'+m.join(', ')+'}';
            } else {
                self._data = ''+item;
            }
        }),
        __str__: $m(function(self) {
            return self;
        }),
        __len__: $m(function(self) {
            return self._data.length;
        }),
        __repr__: $m(function(self) {
            // TODO: implement string_escape
            return _.str("'" + self._data.replace('\n','\\n') + "'");
        }),
        __add__: $m(function __add__(self, other) {
            if (_.isinstance(other, _.str))
                return _.str(self._data + other._data);
            if (typeof(other) === 'string')
                return _.str(self._data + other);
            return _.NotImplemented;
        }),
        __contains__: $m(function __contains__(self, other) {
            return self.find(other) !== -1;
        }),
        __eq__: $m(function __eq__(self, other) {
            if (typeof(other) === 'string')
                other = _.str(other);
            if (!_.isinstance(other, _.str))
                return false;
            return self._data === other._data;
        }),
        __ne__: $m(function __ne__(self, other) {
            return !self.__eq__(other);
        }),
        __format__: __not_implemented__('no formatting'),
        __ge__: $m(function __ge__(self, other) {
            return self.__cmd__(other) === -1;
        }),
        __getitem__: $m(function __getitem__(self, at) {
            if (_.isinstance(at, _.slice)) {
                var sss = at.indices(self._data.length).as_js();
                if (sss[2] === 1)
                    return _.str(self._data.slice(sss[0],sss[1]));
                var res = '';
                for (var i=sss[0];i<sss[1];i+=sss[2])
                    res += self._data[i];
                return _.str(res);
            } else if (!_.isinstance(at, _._int))
                _.raise(_.TypeError('need an int in getitem...' + _.str(at)));
            if (at < 0)
                at += self._data.length;
            if (at < 0 || at >= self._data.length)
                _.raise(_.IndexError('index out of range'));
            return self._data[at];
        }),
        __getslice__: $m(function __getslice__(self, i, j) {
            if (i<0) i = 0;
            if (j<0) j = 0;
            return _.str(self._data.slice(i,j));
        }),
        toString: $m(function(self) {
            return self._data;
        }),
        as_js: $m(function(self) {
            return self._data;
        }),
        capitalize: $m(function(self) {
            var s = self._data[0].toUpperCase();
            return _.str(s + self._data.slice(1).toLowerCase());
        }),
        center: __not_implemented__('str.center'),
        count: __not_implemented__('str.count'),
        decode: __not_implemented__('str.decode'),
        encode: __not_implemented__('str.encode'),
        endswith: $m(function(self, what) {
            if (!_.isinstance(what, [_.tuple, _.list]))
                what = [what]
            else
                what = what.as_js();
            for (var i=0;i<what.length;i++) {
                if (self._data.slice(-what[i].length).indexOf(what[i]) === 0)
                    return true;
            }
            return false;
        }),
        expandtabs: __not_implemented__('str.expandtabs'),
        find: $m({'start':null, 'end':null}, function find(self, sub, start, end) {
            if (start === null) start = 0;
            if (end === null) end = self._data.length;
            var at = self._data.slice(start,end).indexOf(sub);
            if (at !== -1)at += start;
            return at;
        }),
        format: __not_implemented__('str.format'),
        index: $m({'start':null, 'end':null}, function index(self, sub, start, end) {
            var res = self.find(sub, start, end);
            if (res === -1)
                _.raise(_.ValueError('substring not found'));
            return res;
        }),
        isalnum: __not_implemented__('str.isalnum'),
        isalpha: __not_implemented__('str.isalpha'),
        isdigit: __not_implemented__('str.isdigit'),
        islower: __not_implemented__('str.islower'),
        isspace: __not_implemented__('str.isspace'),
        istitle: __not_implemented__('str.istitle'),
        isupper: __not_implemented__('str.isupper'),
        join: $m(function(self, ible) {
            var __ = _.foriter(ible);
            var res = [];
            var v;
            while (__.trynext()) {
                v = __.value;
                if (typeof(v) === 'string')
                    v = _.str(v);
                if (!_.isinstance(v, _.str))
                    _.raise(_.TypeError('joining: string expected'));
                res.push(v._data);
            }
            return _.str(res.join(self._data));
        }),
        ljust: __not_implemented__('str.ljust'),
        lower: $m(function(self) {
            return _.str(self._data.toLowerCase());
        }),
        lstrip: __not_implemented__('str.lstrip'),
        partition: __not_implemented__('str.partition'),
        replace: __not_implemented__('str.replace'),
        rfind: __not_implemented__('str.rfind'),
        rindex: __not_implemented__('str.rindex'),
        split: $m({'count':-1}, function split(self, sub, count) {
            var res = _.list();
            if (typeof(sub) === 'string') sub = _.str(sub);
            if (!_.isinstance(sub, _.str))
                _.raise(_.TypeError('sub must be a string'));
            if (!sub._data.length)
                _.raise(_.ValueError('empty separator'));
            if (typeof(count) !== 'number')
                _.raise(_.TypeError('a number is required'));
            var rest = self._data;
            while(count < 0 || count > 0) {
                var at = rest.indexOf(sub._data);
                if (at == -1)
                    break;
                count -= 1;
                res.append(_.str(rest.slice(0, at)));
                rest = rest.slice(at + sub._data.length);
            }
            res.append(_.str(rest));
            return res;
        }),
        splitlines: $m({'keepends':false}, function(self, keepends) {
            var res = self._data.split(/\n/g);
            var l = _.list();
            for (var i=0;i<res.length-1;i++) {
                var k = res[i];
                if (keepends) k += '\n';
                l.append(_.str(k));
            }
            l.append(_.str(res[res.length-1]));
            return l;
        }),
        startswith: $m({'start':null, 'end':null}, function(self, sub, start, end) {
            if (!_.isinstance(sub, [_.tuple, _.list]))
                sub = [sub]
            else
                sub = sub.as_js();
            if (start === null)start = 0;
            if (end === null)end = self._data.length;
            for (var i=0;i<sub.length;i++) {
                if (self._data.slice(start,end).indexOf(sub[i]) === 0)
                    return true;
            }
            return false;
        }),
        strip: __not_implemented__('str.strip'),
        swapcase: __not_implemented__('str.swapcase'),
        title: $m(function (self) {
            var parts = self.split(' ');
            for (var i=0;i<parts._list.length;i++) {
                parts._list[i] = parts._list[i].capitalize();
            }
            return _.str(' ').join(parts);
        }),
        translate: __not_implemented__('str.translate'),
        upper: $m(function(self) {
            return _.str(self._data.toUpperCase());
        }),
        zfill: __not_implemented__('str.zfill')
    });

    _.slice = Class('slice', [], {
        __init__: $m({}, true, function __init__(self, args) {
            if (_.len(args) > 3)
                _.raise(_.TypeError('slice() takes a max of 3 arguments'));
            args = args.as_js();
            if (args.length === 0)
                _.raise(_.TypeError('slice() takes at leat 1 argument (0 given)'));
            if (args.length === 1) {
                upper = args[0];
                lower = null;
                step = null;
            } else if (args.length === 2) {
                upper = args[1];
                lower = args[0];
                step = null;
            } else {
                lower = args[0];
                upper = args[1];
                step = args[2];
            }
            self.upper = upper;
            self.lower = lower;
            self.step = step;
        }),
        __str__: $m(function __str__(self) {
            return _.str('slice(' + self.lower + ', ' + self.upper + ', ' + self.step + ')');
        }),
        indices: $m(function indices(self, len) {
            var start = self.lower, stop = self.upper, step = self.step;
            if (start === null)start = 0;
            if (stop === null)stop = len;
            if (step === null)step = 1;
            if (start < 0) start += len;
            if (start < 0) start = 0;
            if (start > len) start = len;
            if (stop < 0) stop += len;
            if (stop < 0) stop = 0;
            if (stop > len) stop = len;
            return _.tuple([start, stop, step]);
        })
    });

    _.list = Class('list', [], {
        __init__: $m({'ible':[]}, function __init__(self, ible) {
            if (ible instanceof Array) {
                self._list = ible.slice();
            } else if (_.isinstance(ible, [_.tuple, _.list])) {
                self._list = ible.as_js().slice();
            } else {
                var __ = _.foriter(ible);
                self._list = [];
                while (__.trynext()){
                    self._list.push(__.value)
                }
            }
        }),
        as_js: $m(function as_js(self){
           return self._list;
        }),
        __add__: $m(function __add__(self, other) {
            if (!_.isinstance(other, _.list))
                _.raise(_.TypeError('can only concatenate list to list'));
            return _.list(self._list.concat(other._list));
        }),
        __contains__: $m(function __contains__(self, one){
            return self._list.indexOf(one) !== -1;
        }),
        __delitem__: $m(function __delitem__(self, i) {
            self._list = self._list.slice(0, i).concat(self._list.slice(i+1));
        }),
        __delslice__: $m(function __delslice__(self, a, b) {
            self._list = self._list.slice(0, a).concat(self._list.slice(b));
        }),
        __doc__: 'javascript equivalent of the python builtin list class',
        __eq__: $m(function __eq__(self, other){
            if (!_.isinstance(other, _.list))
                return false;
            if (self.__len__() !== other.__len__()) return false;
            var ln = self.__len__();
            for (var i=0;i<ln;i++) {
                if (!_.eq(self._list[i], other._list[i]))
                    return false;
            }
            return true;
        }),
        __ge__: __not_implemented__('ge'),
        __getitem__: $m(function __getitem__(self, index) {
            if (_.isinstance(index, _.slice)) {
                var nw = [];
                var sss = index.indices(self._list.length).as_js();
                for (var i=sss[0];i<sss[1];i+=sss[2])
                    nw.push(self._list[i]);
                return _.list(nw);
            } else if (typeof(index) === 'number') {
                if (index < 0) index += self._list.length;
                if (index < 0 || index >= self._list.length)
                    _.raise(_.IndexError('index out of range'));
                return self._list[index];
            } else
                _.raise(_.ValueError('index must be a number or slice'));
        }),
        __getslice__: $m(function __getslice__(self, a, b) {
            return _.list(self._list.slice(a,b));
        }),
        __gt__: __not_implemented__(''),
        __iadd__: $m(function __iadd__(self, other) {
            if (!_.isinstance(other, _.list))
                __builtins__.raise(_.TypeError('can only add list to list'));
            self._list = self._list.concat(other._list);
        }),
        __imul__: $m(function __imul__(self, other) {
            if (_.isinstance(other, _._int))
                other = other.as_js();
            if (typeof(other) != 'number')
                _.raise(_.TypeError('only can multiply by a number'));
            var res = []
            for (var i=0;i<other;i++) {
                res = res.concat(self.as_js());
            }
            self._list = res;
        }),
        __iter__: $m(function __iter__(self) {
            return _.listiterator(self);
        }),
        __le__: __not_implemented__(''),
        __len__: $m(function __len__(self) { return self._list.length; }),
        __lt__: __not_implemented__(''),
        __mul__: $m(function __mul__(self, other) {
            if (_.isinstance(other, _._int))
                other = other.as_js();
            if (typeof(other) == 'number') {
                var res = []
                for (var i=0;i<other;i++) {
                    res = res.concat(self.as_js());
                }
                return _.list(res);
            }
            _.raise(_.TypeError('only can multiply by a number'));
        }),
        __ne__: __not_implemented__(''),
        __repr__: $m(function __repr__(self) { return self.__str__(); }),
        __reversed__: $m(function __reversed__(self) {
            return _.listreversediterator(self);
        }),
        __rmul__: $m(function __rmul__(self, other) {
            return self.__mul__(other);
        }),
        __setitem__: $m(function __setitem__(self, i, val) {
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                _.raise(_.IndexError('list index out of range'));
            self._list[i] = val;
        }),
        __setslice__: $m(function __setslice__(self, i, j, val) {
            var it = _.list(val)._list;
            self._list = self._list.slice(0, i).concat(it).concat(self._list.slice(j));
        }),
        append: $m(function append(self, what){
            self._list.push(what);
        }),
        count: $m(function count(self, value) {
            var c = 0;
            for (var i=0;i<self._list.length;i++) {
                if (_.eq(self._list[i], value))
                    c++;
            }
            return c;
        }),
        extend: $m(function extend(self, what) {
            self.__iadd__(_.list(what));
        }),
        index: $m(function index(self, value) {
            for (var i=0;i<self._list.length;i++) {
                if (_.eq(self._list[i], value))
                    return i;
            }
            _.raise(_.ValueError('x not in list'));
        }),
        insert: $m(function insert(self, i, val) {
            self._list = self._list.slice(0, i).concat([val]).concat(self._list.slice(i));
        }),
        pop: $m({'i':-1}, function pop(self, i) {
            if (i < 0) i += self._list.length;
            if (i < 0 || i >= self._list.length)
                __builtins__.raise(_.IndexError('pop index out of range'));
            var val = self._list[i];
            self.__delitem__(i);
            return val;
        }),
        remove: $m(function(self, val) {
            var i = self.index(val);
            self.__delitem__(i);
        }),
        reverse: $m(function(self, val) {
            var ol = self._list;
            self._list = [];
            for (var i=ol.length-1;i>=0;i--)
                self._list.push(ol[i]);
        }),
        sort: __not_implemented__('sort'),
        __str__: $m(function __str__(self) {
            var a = [];
            for (var i=0;i<self._list.length;i++) {
                a.push(_.repr(self._list[i]));
            }
            return _.str('['+a.join(', ')+']');
        })
    });

    _.listiterator = Class('listiterator', [], {
        __init__: $m(function(self, lst) {
            self.lst = lst;
            self.at = 0;
            self.ln = lst._list.length;
        }),
        __iter__: $m(function(self){
            return self;
        }),
        next: $m(function(self) {
            if (self.at >= self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.at];
            self.at += 1;
            return val;
        })
    });

    _.listreversediterator = Class('listreversediterator', [_.listiterator], {
        next: $m(function(self) {
            if (self.at >= self.lst._list.length)
                _.raise(_.StopIteration());
            var val = self.lst._list[self.lst._list.length-1-self.at];
            self.at += 1;
            return val;
        })
    });

    _.tupleiterator = Class('tupleiterator', [_.listiterator], {});

    _.iter = $m({'sentinel':null}, function iter(ible, sentinel) {
        if (sentinel)
            return callable_iterator(ible, sentinel);
        if (ible instanceof Array) 
            return _.tuple(ible).__iter__();
        if (!defined(ible.__iter__))
            _.raise('item not iterable');
        return ible.__iter__();
    });

    /** for use in emulating python for loops. example:
     *
     * for a in b:
     *      pass
     *
     * becomes
     *
     * var __iter = foriter(b);
     * while (__iter.trynext()) {
     *      a = __iter.value;
     * }
     */
    _.foriter = Class('foriter', [], {
        __init__: $m(function(self, ible){
            self.iter = _.iter(ible);
            self.value = null;
        }),
        trynext: $m(function(self){
            try {
                self.value = self.iter.next();
            } catch (e) {
                if (_.isinstance(e, _.StopIteration))
                    return false;
                throw e;
            }
            return true;
        })
    });

    /** function progging **/

    _.all = __not_implemented__("all");
    _.vars = $m(function vars(obj) {
        // TODO::: this isn't good
        var dct = {};
        for (var a in obj) {
            dct[a] = obj[a];
        }
        return dct;
    });

    /** inheritence **/

    _.type = $m(function (what) {
        if (typeof(what) === 'number')
            return _._int;
        if (what.__class__ !== undefined)
            return what.__class__;
        if (what.__type__ !== undefined)
            return that.__type__;
        return typeof(what);
    });
    _.classmethod = classmethod;
    _.staticmethod = staticmethod;

    _.isinstance = $m(function isinstance(inst, clsses) {
        if (inst === null || !defined(inst.__class__))
            return false;
            // _.raise("PJs Error: isinstance only works on objects");
        return _.issubclass(inst.__class__, clsses);
    });

    _.issubclass = $m(function issubclass(cls, clsses) {
        if (!defined(cls.__bases__))
            _.raise("PJs Error: issubclass only works on classes");
        if (clsses.__class__ === _.list || clsses.__class__ === _.tuple)
            clsses = clsses.as_js();
        if (!(clsses instanceof Array))
            clsses = [clsses];
        for (var i=0;i<clsses.length;i++) {
            if (cls === clsses[i]) return true;
        }
        for (var a=0;a<cls.__bases__.length;a++) {
            if (_.issubclass(cls.__bases__[a], clsses))
                return true;
        }
        return false;
    });

    _.help = __not_implemented__("help");

    _.copyright = 'something should go here...';

    _.input = __not_implemented__("input");
    _.oct = __not_implemented__("oct");
    _.bin = __not_implemented__("bin");
    _.SystemExit = __not_implemented__("SystemExit");
    _.format = __not_implemented__("format");
    _.sorted = __not_implemented__("sorted");
    _.__package__ = __not_implemented__("__package__");
    _.round = __not_implemented__("round");
    _.dir = __not_implemented__("dir");
    _.cmp = __not_implemented__("cmp");
    _.set = __not_implemented__("set");
    _.bytes = __not_implemented__("bytes");
    _.reduce = __not_implemented__("reduce");
    _.intern = __not_implemented__("intern");
    _.Ellipsis = __not_implemented__("Ellipsis");
    _.locals = __not_implemented__("locals");
    _.sum = __not_implemented__("sum");
    _.getattr = __not_implemented__("getattr");
    _.abs = __not_implemented__("abs");
    _.exit = __not_implemented__("exit");
    _.print = $m({}, true, function _print(args) {
        var strs = [];
        for (var i=0;i<args._list.length;i++) {
            strs.push(_.str(args._list[i]));
        }
        console.log(strs.join(' '));
    });
    _.print.__name__ = 'print';
    _.assert = $m(function assert(bool, text) {
        if (!bool) {
            _.raise(_.AssertionError(text));
        }
    });
    _._debug_stack = [];
    _.raise = $m(function raise(obj) {
        obj.stack = _._debug_stack.slice();
        throw obj;
    });
    _.True = true;
    _.False = false;
    _.None = null;
    _.len = $m(function len(obj) {
        if (obj instanceof Array) return obj.length;
        if (typeof(obj) === 'string') return obj.length;
        if (obj.__len__) return obj.__len__();
        _.raise(_.TypeError('no function __len__ in object <' + _.str(obj) + '> ' + typeof(obj)));
    });
    _.credits = __not_implemented__("credits");
    _.ord = __not_implemented__("ord");
    // _.super = __not_implemented__("super");
    _.license = __not_implemented__("license");
    _.KeyboardInterrupt = __not_implemented__("KeyboardInterrupt");
    _.filter = __not_implemented__("filter");
    _.range = $m({'end':null, 'step':1}, function(start, end, step) {
        if (end === null) {
            end = start;
            start = 0;
        }
        var res = _.list();
        for (var i=start;i<end;i+=step)
            res.append(i);
        return res;
    });
    _.BaseException = __not_implemented__("BaseException");
    _.pow = __not_implemented__("pow");
    _.globals = __not_implemented__("globals");
    _.divmod = __not_implemented__("divmod");
    _.enumerate = __not_implemented__("enumerate");
    _.apply = __not_implemented__("apply");
    _.open = __not_implemented__("open");
    _.quit = __not_implemented__("quit");
    _.zip = __not_implemented__("zip");
    _.hex = __not_implemented__("hex");
    _.next = __not_implemented__("next");
    _.chr = __not_implemented__("chr");
    _.xrange = __not_implemented__("xrange");

    _.reversed = __not_implemented__("reversed");
    _.hasattr = __not_implemented__("hasattr");
    _.delattr = __not_implemented__("delattr");
    _.setattr = __not_implemented__("setattr");
    _.raw_input = __not_implemented__("raw_input");
    _.compile = __not_implemented__("compile");

    _.repr = $m(function repr(item) {
        if (item === null)
            return _.str('None');
        if (typeof(item) === 'string') {
            return _.str("'" + item + "'");
        } else if (typeof(item) === 'number') {
            return _.str('' + item);
        } else if (defined(item.__repr__)) {
            return item.__repr__();
        } else return _.str(item);
    });

    _.property = __not_implemented__("property");
    _.GeneratorExit = __not_implemented__("GeneratorExit");
    _.coerce = __not_implemented__("coerce");
    _.file = __not_implemented__("file");
    _.unichr = __not_implemented__("unichr");
    _.id = __not_implemented__("id");
    _.min = $m({}, true, function(args) {
        if (_.len(args) === 1)
            args = _.list(args.__getitem__(0));
        args = _.js(args);
        var m = null;
        for (var i=0;i<args.length;i++) {
            if (m === null || _.lt(args[i], m))
                m = args[i];
        }
        return m;
    });
    _.execfile = __not_implemented__("execfile");
    _.any = __not_implemented__("any");
    _.NotImplemented = (Class('NotImplementedType', [], {
        __str__:$m(function(self){return _.str('NotImplemented');})
    })());
    _.map = __not_implemented__("map");
    _.buffer = __not_implemented__("buffer");
    _.max = $m({}, true, function(args) {
        if (_.len(args) === 1)
            args = _.list(args.__getitem__(0));
        args = _.js(args);
        var m = null;
        for (var i=0;i<args.length;i++) {
            if (m === null || _.gt(args[i], m))
                m = args[i];
        }
        return m;
    });
    _.callable = __not_implemented__("callable");
    _.eval = __not_implemented__("eval");
    _.__debug__ = __not_implemented__("__debug__");

    _.BaseException = Class('BaseException', [], {
        __init__: $m({}, true, function __init__(self, args) {
            self.args = args;
        }),
        __str__: $m(function __str__(self) {
            if (_.len(self.args) == 1)
                return _.str(self.__class__.__name__+': '+_.str(self.args.__getitem__(0)));
            return _.str(self.__class__.__name__+': '+_.str(self.args));
        })
    });
    _.Exception = Class('Exception', [_.BaseException], {});
    _.StandardError = Class('StandardError', [_.Exception], {});
    _.TypeError = Class('TypeError', [_.StandardError], {});
    _.StopIteration = Class('StopIteration', [_.Exception], {});
    _.GeneratorExit = Class('GeneratorExit', [_.BaseException], {});
    _.SystemExit = Class('SystemExit', [_.BaseException], {});
    _.KeyboardInterrupt = Class('KeyboardInterrupt', [_.BaseException], {});
    _.ImportError = Class('ImportError', [_.StandardError], {});
    _.EnvironmentError = Class('EnvironmentError', [_.StandardError], {});
    _.IOError = Class('IOError', [_.EnvironmentError], {});
    _.OSError = Class('OSError', [_.EnvironmentError], {});
    _.EOFError = Class('EOFError', [_.StandardError], {});
    _.RuntimeError = Class('RuntimeError', [_.StandardError], {});
    _.NotImplementedError = Class('NotImplementedError', [_.RuntimeError], {});
    _.NameError = Class('NameError', [_.StandardError], {});
    _.UnboundLocalError = Class('UnboundLocalError', [_.NameError], {});
    _.AttributeError = Class('AttributeError', [_.StandardError], {});
    _.SyntaxError = Class('SyntaxError', [_.StandardError], {});
    _.IndentationError = Class('IndentationError', [_.SyntaxError], {});
    _.TabError = Class('TabError', [_.IndentationError], {});
    _.LookupError = Class('LookupError', [_.StandardError], {});
    _.IndexError = Class('IndexError', [_.LookupError], {});
    _.KeyError = Class('KeyError', [_.LookupError], {});
    _.ValueError = Class('ValueError', [_.StandardError], {});
    _.UnicodeError = Class('UnicodeError', [_.ValueError], {});
    _.UnicodeEncodeError = Class('UnicodeEncodeError', [_.UnicodeError], {});
    _.UnicodeDecodeError = Class('UnicodeDecodeError', [_.UnicodeError], {});
    _.UnicodeTranslateError = Class('UnicodeTranslateError', [_.UnicodeError], {});
    _.AssertionError = Class('AssertionError', [_.StandardError], {});
    _.ArithmeticError = Class('ArithmeticError', [_.StandardError], {});
    _.FloatingPointError = Class('FloatingPointError', [_.ArithmeticError], {});
    _.OverflowError = Class('OverflowError', [_.ArithmeticError], {});
    _.ZeroDivisionError = Class('ZeroDivisionError', [_.ArithmeticError], {});
    _.SystemError = Class('SystemError', [_.StandardError], {});
    _.ReferenceError = Class('ReferenceError', [_.StandardError], {});
    _.MemoryError = Class('MemoryError', [_.StandardError], {});
    _.BufferError = Class('BufferError', [_.StandardError], {});
    _.Warning = Class('Warning', [_.Exception], {});
    _.UserWarning = Class('UserWarning', [_.Warning], {});
    _.DeprecationWarning = Class('DeprecationWarning', [_.Warning], {});
    _.PendingDeprecationWarning = Class('PendingDeprecationWarning', [_.Warning], {});
    _.SyntaxWarning = Class('SyntaxWarning', [_.Warning], {});
    _.RuntimeWarning = Class('RuntimeWarning', [_.Warning], {});
    _.FutureWarning = Class('FutureWarning', [_.Warning], {});
    _.ImportWarning = Class('ImportWarning', [_.Warning], {});
    _.UnicodeWarning = Class('UnicodeWarning', [_.Warning], {});
    _.BytesWarning = Class('BytesWarning', [_.Warning], {});

    _.assertdefined = function assertdefined(x, name) {
        if (x === undefined)
            _.raise(_.NameError('undefined variable "' + name + '"'));
        return x;
    };
    _.run_main = $m(function(filename){
        try {
            __module_cache[filename].load('__main__');
        } catch (e) {
            var stack = __builtins__._debug_stack;
            var pf = __builtins__.print;
            // if __builtins__.print is in the stack, don't use it here
            for (var i=0;i<stack.length;i++) {
                if (stack[1] == pf) {
                    console.log('using rhino\'s print -- error printing pythony');
                    pf = console.log;
                    break;
                }
            }
            pf('Traceback (most recent call last)');
            for (var i=0;i<stack.length;i++){
                var fn = stack[i][1];
                var ost = fn.toString;
                if (fn._to_String)
                    fn.toString = fn._old_toString;
                pf('  ', stack[i][1]);
            }
            if (e.__class__)
                pf('Python Error:', e);
            else
                console.log('Javascript Error:', e);
        }
    });
});

__module_cache['<builtin>/sys.py'].load('sys'); // must be loaded for importing to work.
__module_cache['<builtin>/os/path.py'].load('os.path');
var __builtins__ = __module_cache['<builtin>/__builtin__.py'].load('__builtin__');
var __import__ = __builtins__.__import__; // should I make this global?
var $b = __builtins__;

var $def = $m;
/* WebElementUtils
 *
 * Contains general functions which ease the usage of multi-browser Javascript coding
 * Is a self contained namespaced library so it can interact well with other javascript libraries
 *
 */

//Provide a mapping of all commonly used keys under Keys.KEY_NAME
var Keys = Keys || {}
Keys.SPACE = 32;
Keys.ENTER = 13;
Keys.TAB = 9;
Keys.ESC = 27;
Keys.BACKSPACE = 8;
Keys.SHIFT = 16;
Keys.CONTROL = 17;
Keys.ALT = 18;
Keys.CAPSLOCK = 20;
Keys.NUMLOCK = 144;
Keys.LEFT = 37;
Keys.UP = 38;
Keys.RIGHT = 39;
Keys.DOWN = 40;
Keys.HOME = 36;
Keys.END = 35;
Keys.PAGE_UP = 33;
Keys.PAGE_DOWN = 34;
Keys.INSERT = 45;
Keys.DELETE = 46;
Keys.FUNCTIONS = [112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123];
Keys.NUMBERS = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];

var MessageTypes = MessageTypes || {}
MessageTypes.ERROR = "error";
MessageTypes.INFO = "info";
MessageTypes.WARNING = "warning";
MessageTypes.SUCCESS = "success";
MessageTypes.CLASSES = {"error":"WError", "info":"WInfo", "warning":"WWarning", "success":"WSuccess"};
MessageTypes.CLASS_LIST = ["WError", "WInfo", "WWarning", "WSuccess"];

//Provide basic platform information under Platform name-space
var Platform = Platform || {}
Platform.IS_IOS = /Apple.*Mobile/.test(navigator.userAgent)
Platform.IS_OPERA = Object.prototype.toString.call(window.opera) == '[object Opera]';
Platform.IS_IE = navigator.appVersion.match(/\bMSIE\b/) && !!window.attachEvent && !Platform.IS_OPERA;
Platform.IS_WEBKIT = navigator.userAgent.indexOf('AppleWebKit/') > -1
Platform.IS_GECKO = navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') === -1

//Provides basic event handling
var Events = Events || {}

Events.addEvent = function(element, type, handler)
{
    var element = WebElements.get(element);

    if(typeof(type) == typeof([]))
    {
        return WebElements.forEach(type, function(eventType){Events.addEvent(element, eventType, handler);});
    }
    if(typeof(handler) == typeof([]))
    {
        return WebElements.forEach(handler, function(eventHandler){Events.addEvent(element, type, eventHandler);});
    }
    if (element.addEventListener)
    {
        element.addEventListener(type, handler, false);
    }
    else
    {
        if (!handler.$$guid)
        {
            handler.$$guid = Events.addEvent.guid++;
        }
        if (!element.events)
        {
            element.events = {};
        }

        var handlers = element.events[type];
        if (!handlers)
        {
            handlers = element.events[type] = {};
            if (element["on" + type])
            {
                handlers[0] = element["on" + type];
            }
        }
        handlers[handler.$$guid] = handler;
        element["on" + type] = handleEvent;
    }
};
Events.addEvent.guid = 1;

Events.removeEvent = function(element, type, handler)
{
    var element = WebElements.get(element);

    if(typeof(type) == typeof([]))
    {
        return WebElements.forEach(type, function(eventType){Events.removeEvent(element, eventType, handler);});
    }
    if(typeof(handler) == typeof([]))
    {
        return WebElements.forEach(handler, function(eventHandler){Events.removeEvent(element, type, eventHandler);});
    }
    if (element.removeEventListener)
    {
        element.removeEventListener(type, handler, false);
    }
    else
    {
        if (element.events && element.events[type])
        {
            delete element.events[type][handler.$$guid];
        }
    }
};

Events.handleEvent = function(event)
{
    var returnValue = true;
    event = event || Events.fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
    var handlers = this.events[event.type];
    for (var i in handlers)
    {
        this.$$handleEvent = handlers[i];
        if (this.$$handleEvent(event) === false)
        {
            returnValue = false;
        }
    }
    return returnValue;
};

Events.fixEvent = function(event)
{
    event.preventDefault = Events.preventDefault;
    event.stopPropagation = Events.stopPropagation;
    return event;
};

Events.preventDefault = function()
{
    this.returnValue = false;
};

Events.stopPropagation = function()
{
    this.cancelBubble = true;
};

//Create main WebElement name space - pulling in Keys and Platform name space's
var WebElements = WebElements || {}
WebElements.Keys = Keys;
WebElements.Platform = Platform;
WebElements.Events = Events;

WebElements.Settings = {}
WebElements.Settings.throbberImage = 'images/throbber.gif';
WebElements.Settings.Serialize = ['input', 'textarea', 'select'];

WebElements.State = {}
WebElements.State.isPopupOpen = false;
WebElements.State.currentDropDown = null;
WebElements.State.currentButton = null;

//Returns the element given (if it is a page element) or the result of getElementId
WebElements.get = function (element)
{
    //If an actual element is given (or nothing is given) just return it
    if(!element || element.innerHTML != null || element == document || element == window)
    {
        return element;
    }

    //If a element id is given -- return the element associated with the id
    var idElement = document.getElementById(element);
    if(idElement != null && idElement.innerHTML != null)
    {
        return idElement;
    }

    //If a element name is given -- return the first element associated with the name
    var nameElement = document.getElementsByName(element);
    if(nameElement.length != 0 && nameElement[0].innerHTML != null)
    {
        return nameElement[0]
    }

    return null;
}

//Calls a callback method for each item in a list
WebElements.forEach = function(arrayOfItems, callBack)
{
    if(arrayOfItems.forEach)
    {
        return arrayOfItems.forEach(callBack);
    }

    for(var currentItem=0; currentItem < arrayOfItems.length; currentItem++)
    {
        callBack(arrayOfItems[currentItem]);
    }
    return true;
}

//Calls a callback for each item in a list and returns an array of the results
WebElements.map = function(arrayOfItems, callBack)
{
    if(arrayOfItems.map)
    {
        return arrayOfItems.map(callBack);
    }

    newArray = []
    for(var currentItem=0; currentItem < arrayOfItems.length; currentItem++)
    {
        newArray.push(arrayOfItems[currentItem]);
    }
    return newArray;
}

//Returns a list of nodes sorted by placement in the dom
WebElements.sortElements = function(elements)
{
    firstNode = elements[0];
    if(!firstNode)
    {
        return [];
    }
    if(firstNode.sourceIndex)
    {
        elements.sort(function(first, second){return first.sourceIndex - second.sourceIndex;});
    }
    else if(firstNode.compareDocumentPosition)
    {
        elements.sort(function(first, second){return 3 - (first.compareDocumentPosition(second) & 6)});
    }
    return elements;
}

//Returns a list of sorted and unique elements
WebElements.sortUnique = function(elements)
{
    var elements = WebElements.sortElements(elements);
    var lastAdded = null;
    return WebElements.getByCondition(function(element)
                                      {
                                        if(element !== lastAdded)
                                        {
                                            lastAdded = element;
                                            return true
                                        }
                                        return false;
                                      }, elements);
}

//An optimized way to getElements that match against a list of tagNames
WebElements.getElementsByTagNames = function(tagNames, parentElement, unsorted)
{
    var parentElement = WebElements.get(parentElement);
    var results = [];
    WebElements.forEach(tagNames, function(tagName){
        WebElements.forEach(parentElement.getElementsByTagName(tagName),
                            function(item){results.push(item);})});

    if(!unsorted)
    {
        return WebElements.sortElements(results)
    }

    return results;
}

//Returns elements that pass a conditional callback, optionally returning on the first match
WebElements.getByCondition = function(conditional, parentNode, stopOnFirstMatch)
{
    if(!stopOnFirstMatch){stopOnFirstMatch = false;}
    var elements_to_return = [];
    var elements = parentNode;
    if(!parentNode instanceof Array)
    {
        parentNode = WebElements.get(parentNode);
        elements = parentNode.getElementsByTagName("*");
    }

    for(var currentElement=0; currentElement < elements.length; currentElement++)
    {
        element = elements[currentElement];
        if(conditional(element))
        {
            if(stopOnFirstMatch)
            {
                return element;
            }
            elements_to_return.push(element);
        }
    }

    return elements_to_return;
}

//Gets an element and returns its value
WebElements.getValue = function(element)
{
    var element = WebElements.get(element)
    return element && element.value || ""
}

//Hides Elements with a particular class name
WebElements.hideClass = function(className, parentNode)
{
    WebElements.forEach(WebElements.getElementByClassName(className, parentNode), WebElements.hide);
}

//Shows Elements with a particular class name
WebElements.showClass = function(className, parentNode)
{
    WebElements.forEach(WebElements.getElementByClassName(className, parentNode), WebElements.show);
}

//Creates a throbber on the fly, change WebElements.Settings.throbberImage to change image file
WebElements.buildThrobber = function()
{
    var throbber = document.createElement('img');
    throbber.src = WebElements.Settings.throbberImage;
    return throbber;
}

//Gets elements by there css class that are childern of a certain node - uses native implementation if present
WebElements.getElementsByClassName = function(className, parentNode, stopOnFirstMatch)
{
    parentNode = WebElements.get(parentNode);
    if(document.getElementsByClassName){
        if(parentNode)
        {
            return parentNode.getElementsByClassName(className);
        }
        else
        {
            return document.getElementsByClassName(className);
        }
    }
    if(!parentNode)
    {
        parentNode = document.getElementsByTagName("body")[0];
    }

    var regexp = new RegExp('\\b' + className + '\\b');
    return WebElements.getByCondition(function(element){regexp.test(element.className)}, parentNode, stopOnFirstMatch);
}

//Gets the first element in parent node with a certain class name
WebElements.getElementByClassName = function(className, parentNode)
{
    return WebElements.getElementsByClassName(className, parentNode, true)[0];
}

//Returns all children with a particular attribute value
WebElements.getChildrenByAttribute = function(parentNode, attributeName, attributeValue)
{
    return WebElements.getByCondition(function(element){return element[attributeName] === attributeValue;}, parentNode);
}

//Returns the first child with a particular attribute value
WebElements.getChildByAttribute = function(parentNode, attributeName, attributeValue)
{
    return WebElements.getByCondition(function(element){return element[attributeName] === attributeValue;}, parentNode,
                                      true);
}

//Returns children of an element by their name
WebElements.getChildrenByName = function(parentNode, name)
{
    return WebElements.getByCondition(function(element){return element.name == name}, parentNode);
}

//Returns a child of an element by its name
WebElements.getChildByName = function(parentNode, name)
{
    return WebElements.getByCondition(function(element){return element.name == name}, parentNode, true);
}

//populates a form using an id/name:value dictionary -- such as a request dictionary.
WebElements.populate = function(fieldDict)
{
    for(fieldId in fieldDict)
    {
        field = WebElements.get(fieldId);
        value = fieldDict[fieldId];
        if(field)
        {
            field.value = value;
        }
    }
}

//updates a countdown label slowly deincrementing till reaches 0 than calls action
WebElements.countDown = function(label, seconds, action)
{
    var label = WebElements.get(label);
    label.innerHTML = seconds;
    label.timeoutList = []

    for(var currentCount = 1; currentCount < seconds; currentCount++)
    {
        timeout = setTimeout('WebElements.get(\'' + label.id + '\').innerHTML = ' +
                  (seconds - currentCount) + ';', (currentCount * 1000));
        label.timeoutList.push(timeout);
    }

    timeout = setTimeout('WebElements.get(\'' + label.id + '\').innerHTML = 0;' +
                         action, seconds * 1000);
    label.timeoutList.push(timeout);
}

//updates a countdown label slowly deincrementing till reaches 0 than calls action
WebElements.abortCountDown = function(label)
{
    WebElements.forEach(WebElements.get(label).timeoutList, clearTimeout);
}

//Returns the number of pixels left of element
WebElements.pixelsToLeft = function(element)
{
    var aTag = WebElements.get(element);

    var pixelsToLeft = 0;
    do
    {
        pixelsToLeft += aTag.offsetLeft;
        aTag = aTag.offsetParent;
    } while(aTag && aTag.tagName!="BODY");

    var aTag = element.parentNode;
    do
    {
        if(aTag.scrollLeft)
        {
            pixelsToLeft -= aTag.scrollLeft;
        }
        aTag = aTag.parentNode;
    } while(aTag && aTag.tagName!="BODY");

    return pixelsToLeft;
}

//Returns the number of pixels above an element
WebElements.pixelsAbove = function(element)
{
    var aTag = WebElements.get(element);

    var pixelsAbove = 0;
    do
    {
        pixelsAbove += aTag.offsetTop;
        aTag = aTag.offsetParent;
    } while(aTag && aTag.tagName!="BODY");

    var aTag = element.parentNode;
    do
    {
        if(aTag.scrollTop)
        {
            pixelsAbove -= aTag.scrollTop;
        }
        aTag = aTag.parentNode;
    } while(aTag && aTag.tagName!="BODY");

    return pixelsAbove;
}

//Sets an element position to that of its parents + pixelsDown & pixelsToRight
WebElements.setAbsoluteRelativeToParent = function(element, pixelsDown, pixelsToRight, parentElement)
{
    var element = WebElements.get(element);
    if(!parentElement){parentElement = element.parentNode;}
    if(!pixelsDown){pixelsDown = 0;}
    if(!pixelsToRight){pixelsToRight = 0;}

    var parentElement = WebElements.get(parentElement);
    element.style.left = WebElements.pixelsToLeft(parentElement) + pixelsToRight;
    element.style.top = WebElements.pixelsAbove(parentElement) + pixelsDown;
}

//Sets an element position to that of its parents + pixelsDown & pixelsToRight
WebElements.displayDropDown = function(dropDown, parentElement)
{
    var dropDownElement = WebElements.get(dropDown);
    if(!parentElement){parentElement = dropDownElement.parentNode;}
    var parentElement = WebElements.get(parentElement);

    WebElements.setAbsoluteRelativeToParent(dropDownElement, parentElement.offsetHeight -1,
                                  0, parentElement);
    WebElements.show(dropDownElement);
}

//Toggles the displayed state of a drop down menu
WebElements.toggleDropDown = function(dropDown, parentElement)
{
    var dropDown = WebElements.get(dropDown);
    if(WebElements.shown(dropDown))
    {
        WebElements.hide(dropDown);
        return false;
    }
    WebElements.displayDropDown(dropDown, parentElement);
    return true;
}

WebElements.openAccordion = function(accordionName)
{
    WebElements.show(WebElements.getElementByClassName('AccordionContent', accordionName));
    WebElements.get(accordionName + 'Value').value = 'True';
    WebElements.get(accordionName + 'Image').src = 'images/hide.gif';
}

WebElements.fellowChild = function(element, parentClass, childClass)
{
    return WebElements.getElementByClassName(childClass, WebElements.parent(element, parentClass));
}

//Get first child element (exluding empty elements)
WebElements.firstChild = function(element)
{
    var element = WebElements.get(element);
    if(element.firstChild)
    {
        element = element.firstChild
    }
    while ((!element || element.innerHTML == null) && element.nextSibling)
    {
        element = element.nextSibling;
    }
    return element;
}

//Get last child element (exluding empty elements)
WebElements.lastChild = function(element)
{
    var element = WebElements.get(element);
    if(element.lastChild)
    {
        element = element.lastChild
    }
    while ((!element || element.innerHTML == null) && element.prevSibling)
    {
        element = element.prevSibling;
    }
    return element;
}


//Gets the next sibling (ignoring empty elements)
WebElements.next = function(element)
{
    var element = WebElements.get(element);
    if(element.nextSibling)
    {
        element = element.nextSibling;
    }
    while ((!element || element.innerHTML == null) && element.nextSibling)
    {
        element = element.nextSibling;
    }
    return element;
}

//Gets the previous sibling (ignoring empty elements)
WebElements.prev = function(element)
{
    var element = WebElements.get(element);
    if(element.previousSibling)
    {
        element = element.previousSibling;
    }
    while ((!element || element.innerHTML == null) && element.previousSibling)
    {
        element = element.previousSibling;
    }
    return element;
}

//increments the value of a hiddenField
WebElements.increment = function(element, max)
{
    var element = WebElements.get(element);
    var number = (parseInt(element.value) || 0) + 1;
    if(max != undefined && number > max){
        number = max;
    }
    element.value = number;
    element.onchange && element.onchange();
}

//deincrements the value of a hiddenField
WebElements.deincrement = function(element, min)
{
    var element = WebElements.get(element);
    var number = (parseInt(element.value) || 0) - 1;
    if(min != undefined && number < min){
        number = min;
    }
    element.value = number;
    element.onchange && element.onchange();
}

//Sets the prefix for the container and all childElements
WebElements.setPrefix = function(container, prefix)
{
    var container = WebElements.get(container);
    container.id = prefix + container.id;
    container.name = prefix + container.name;

    WebElements.forEach(WebElements.childElements(container), function(child){
            child.id = prefix + child.id;
            child.name = prefix + child.name;});
}

//Gets a parent element based on its class name or alternatively giving up when it hits a particular class
WebElements.parent = function(element, className, giveUpAtClass)
{
    var element = WebElements.get(element);
    var regexp = new RegExp('\\b' + className + '\\b');
    var regexpCancel = false;
    if(giveUpAtClass)
    {
        regexpCancel = new RegExp('\\b' + giveUpAtClass + '\\b');
    }

    if(element.parentNode)
    {
        element = element.parentNode;
    }
    while ((!element || element.innerHTML == null || !regexp.test(element.className))
           && element.parentNode)
    {
        element = element.parentNode;
        if(regexpCancel && regexpCancel.test(element.className)){
            return false;
        }
    }
    return element;
}


//Removes all children
WebElements.clearChildren = function(element, replacement)
{
    var element = WebElements.get(element)
    WebElements.forEach(WebElements.childElements(element), function(element){WebElements.remove(element)});
    if(replacement)
    {
        element.appendChild(replacement)
    }
}

//Allows you to get a list of all non empty childElements
WebElements.childElements = function(parentElement)
{
    return WebElements.getByCondition(function(element){return element && element.innerHTML}, parentElement)
}

//Allows you to get an element in the same location on the tree based on a classname
WebElements.peer = function(element, className)
{
    return WebElements.getElementByClassName(className, WebElements.get(element).parentNode);
}

//Allows you to get elements in the same location on the tree based on a classname
WebElements.peers = function(element, className)
{
    return WebElements.getElementsByClassName(className, WebElements.get(element).parentNode);
}


//Forces this to be the only peer with class
WebElements.stealClassFromPeer = function(element, className)
{
    WebElements.forEach(WebElements.peers(element, className),
                                         function(element){WebElements.removeClass(element, className)});
    WebElements.addClass(element, className);
}

//Forces this to be the only peer with class
WebElements.stealClassFromFellowChild = function(element, parentClassName, className)
{
    var fellowChild = WebElements.fellowChild(element, parentClassName, className);
    if(fellowChild)
    {
        WebElements.removeClass(fellowChild, className);
    }
    WebElements.addClass(element, className);
}

//hides an element by setting its display property to none
WebElements.hide = function(element)
{
    var element = WebElements.get(element);
    if(element != null)
    {
        element.style.display = "none";
        return true;
    }
    return false;
}

//shows an element by setting its display property to block
WebElements.show = function(element)
{
    var element = WebElements.get(element);
    if(element != null)
    {
       element.style.display = "";
        return true;
    }
    return false;
}

//shows the element if it is hidden - hides it if it is visable
WebElements.toggleVisibility = function(element)
{
    var element = WebElements.get(element);
    WebElements.shown(element) && WebElements.hide(element) || WebElements.show(element);
}

//return if the element is visable or not
WebElements.shown = function(element)
{
    element = WebElements.get(element);
    if(!element || element.style.display == "none")
    {
        return false;
    }
    return true;
}

//replaces 'element' with 'newElement' (element must contain a parent element)
WebElements.replace = function(element, newElement)
{
   var element = WebElements.get(element);
   var elementParent = element.parentNode;
   if(!elementParent)
   {
       return false;
   }
   elementParent.replaceChild(WebElements.get(newElement), element);
   return true;
}

//removes 'element' from the page (element must contain a parent element)
WebElements.remove = function(element)
{
    var element = WebElements.get(element);
    var elementParent = element.parentNode;
    if(!elementParent)
    {
        return false;
    }

    elementParent.removeChild(element);
    return true;
}

//clears the innerHTML of an element
WebElements.clear = function(element)
{
    WebElements.get(element).innerHTML = "";
}

//adds an option to a selectbox with a specified name and value
WebElements.addOption = function(selectElement, optionName, optionValue)
{
    if(!optionValue){optionValue = optionName}

    var newOption = document.createElement('option');
    newOption.innerHTML = optionName;
    newOption.value = optionValue;
    WebElements.get(selectElement).appendChild(newOption);
}

//adds a list of options option to a selectbox with a specified name/value
WebElements.addOptions = function(selectElement, options)
{
    var selectElement = WebElements.get(selectElement);
    WebElements.forEach(options, function(option){WebElements.addOption(selectElement, option);})
}

//adds html to element
WebElements.addHtml = function(element, html)
{
    var newDiv = document.createElement('div');
    newDiv.innerHTML = html;
    WebElements.get(element).appendChild(newDiv);
    return newDiv
}

//moves an element to a new location
WebElements.move = function(element, to)
{
    WebElements.get(to).appendChild(WebElements.get(element));
}

//makes a copy of an element into 'to' and returns the copy optionally incrementing its ID
WebElements.copy = function(element, to, incrementId)
{
    if(incrementId == null){incrementId = false;}

    var elementCopy = WebElements.get(element).cloneNode(true);
    var toReplace = elementCopy.id
    if(toReplace && incrementId)
    {
        for(currentChar = toReplace.length - 1; currentChar >= 0; currentChar--)
        {
            var character = toReplace[currentChar];
            if(isNaN(character))
            {
                break;
            }
        }
        var splitAt = currentChar + 1
        var increment = (toReplace.substring(splitAt, toReplace.length) * 1) + 1
        var replacement = toReplace.substring(0, splitAt) + increment
        elementCopy.id = replacement

        var html = elementCopy.innerHTML

    }
    WebElements.get(to).appendChild(elementCopy);

    if(incrementId)
    {
        elementCopy.innerHTML = WebElements.replaceAll(html, toReplace, replacement);
    }

    return elementCopy
}

//returns true if text WEContains subtext false if not
WebElements.contains = function(text, subtext, caseSensitive)
{
    if(!caseSensitive)
    {
        var text = text.toLowerCase();
        var subtext = subtext.toLowerCase();
    }

    return text.indexOf(subtext) != -1 && true || false
}

//returns true if any words within text start with subtext
WebElements.startsWith = function(text, subtext, caseSensitive)
{
    if(!caseSensitive)
    {
        var text = text.toLowerCase();
        var subtext = subtext.toLowerCase();
    }

    var text = WebElements.replaceAll(text, ">", " ");
    text = WebElements.replaceAll(text, "<", " ");
    text = WebElements.replaceAll(text, ",", " ");
    text = WebElements.replaceAll(text, "|", " ");
    text = text.split(" ")

    for(currentWord = 0; currentWord < text.length; currentWord++)
    {
        var word = text[currentWord]
        if(word.indexOf(subtext) == 0)
        {
            return true;
        }
    }

    return false;
}

//Adds a prefix to all child elements
WebElements.addPrefix = function(container, prefix)
{
    if(!caseSensitive)
    {
        var text = text.toLowerCase();
        var subtext = subtext.toLowerCase();
    }

    if(text.indexOf(subtext) == -1)
    {
        return false;
    }
    return true;
}

//sorts a list alphabetically by innerHTML
WebElements.sortSelect = function(selectElement, sortByValue)
{
    if(!sortByValue){sortByValue = false;}

    var selectElement = WebElements.get(selectElement);
    var selectOptions = selectElement.options;
    var sorted = new Array();
    var selectElementSorted = new Array();

    for(currentOption in selectedOptions)
    {
        var option = selectOptions[currentOption];
        if(sortByValue)
        {
            sorted[currentOption] = [option.value, option.innerHTML, option.id, option.disabled];
        }
        else
        {
            sorted[currentOption] = [option.innerHTML, option.value, option.id, option.disabled];
        }
    }

    sorted.sort();
    for(currentOption in sorted)
    {
        if(sortByValue)
        {
            selectElement.options[currentOption].value=sorted[currentOption][0];
            selectElement.options[currentOption].innerHTML=sorted[currentOption][1];
        }
        else
        {
            selectElement.options[currentOption].innerHTML=sorted[currentOption][0];
            selectElement.options[currentOption].value=sorted[currentOption][1];
        }
        selectElement.options[currentOption].id = sorted[currentOption][2];
        selectElement.options[currentOption].disabled = sorted[currentOption][3];
    }
}

//returns a list without duplicate elements
WebElements.removeDuplicates = function(inArray)
{
    var result = {};

    for(var i = 0; i < inArray.length; i++)
    {
      result[inArray[i]] = true;
    }

    var outArray = new Array();
    for(var dictKey in result)
    {
        outArray.push(dictKey)
    }

    return outArray;
}

//returns the selected options within a select box
WebElements.selectedOptions = function(selectBox)
{
    return WebElements.getByCondition(function(option){return option.selected}, WebElements.get(selectBox).options);
}

//Selects all element of a select box
WebElements.selectAllOptions = function(selectBox)
{
    WebElements.forEach(WebElements.get(selectBox).options, function(option){option.selected = true;});
}

//sets the options available for selection within a select box
WebElements.setOptions = function(selectBox, options)
{
    selectBox = WebElements.get(selectBox);
    WebElements.forEach(selectBox.options, WebElements.remove);
    WebElements.clear(selectBox);
    WebElements.addOptions(selectBox, options);
}

//returns the selected checkboxes withing a container
WebElements.selectedCheckboxes = function(container)
{
    return WebElements.getByCondition(function(element){return element.checked}, container);
}

WebElements.selectAllCheckboxes = function(container, check)
{
    WebElements.forEach(WebElements.getChildrenByAttribute(container, 'type', 'checkbox'),
                        function(child){child.checked = check;});
}

//returns all nested values within a contianer
WebElements.getValues = function(container, checkSelected, tagName)
{
    if(checkSelected == null){var checkSelected = false;}
    if(!tagName) {tagName = "option";}

    var container = WebElements.get(container);
    var optionElements = container.getElementsByTagName(tagName);

    var values = Array();
    for(currentOption = 0; currentOption < optionElements.length; currentOption++)
    {
        option = optionElements[currentOption];
        if (!checkSelected || option.selected || option.checked)
        {
            values.push(option.value)
        }
    }
    return values
}

//Get a child element of element based on value
WebElements.getElementByValue = function(element, value)
{
    return WebElements.getChildByAttribute(element, 'value', value);
}

//Get a child element of element based on value
WebElements.getElementByInnerHTML = function(element, html)
{
    return WebElements.getChildByAttribute(element, 'innerHTML', html);
}

//returns the first selected option within a select box
WebElements.selectedOption = function(selectBox)
{
    return WebElements.getByCondition(function(element){return element.selected;}, WebElements.get(selectBox).options,
                                      true);
}

//selects an element based on its value
WebElements.selectOption = function(selectBox, option)
{
    WebElements.selectedOption(selectBox).selected = false;
    WebElements.getElementByValue(selectBox, option).selected = true;
}

//replaces all instances of a string with another string
WebElements.replaceAll = function(string, toReplace, replacement)
{
    return string.split(toReplace).join(replacement);
}

//returns all css classes attached to an element as a list
WebElements.classes = function(element)
{
    var element = WebElements.get(element);
    if(!element)
    {
        return [];
    }
    var classes = element.className;
    return classes.split(" ");
}

//returns true if element contains class
WebElements.hasClass = function(element, className)
{
    var element = WebElements.get(element)
    var regexp = new RegExp('\\b' + className + '\\b');
    if(regexp.test(element.className))
    {
        return true;
    }
    return false;
}

//sets an elements classes based on the passed in list
WebElements.setClasses = function(element, classList)
{
    var element = WebElements.get(element);
    element.className = classList.join(" ");
}

//removes a css class
WebElements.removeClass = function(element, classToRemove)
{
    WebElements.setClasses(element, WebElements.removeFromArray(WebElements.classes(element), classToRemove));
}

//adds a css class
WebElements.addClass = function(element, classToAdd)
{
    var element = WebElements.get(element);
    var styleClasses = WebElements.classes(element);

    for(currentClass = 0; currentClass < styleClasses.length; currentClass++)
    {
        var styleClass = styleClasses[currentClass];
        if(styleClass == classToAdd)
        {
            return;
        }
    }

    element.className += " " + classToAdd;
}

//Removes all instances of an element from an array
WebElements.removeFromArray = function(arrayOfItems, toRemove)
{
    return WebElements.getByCondition(function(item){return item != toRemove}, arrayOfItems);
}

//lets you choose one class out of a list of class choices
WebElements.chooseClass = function(element, classes, choice)
{
    var element = WebElements.get(element);
    var styleClasses = WebElements.classes(element);
    for(currentClass = 0; currentClass < classes.length; currentClass++){
        styleClasses = WebElements.removeFromArray(styleClasses, classes[currentClass]);
    }
    styleClasses.push(choice);
    WebElements.setClasses(element, styleClasses);
}

// Forces the browser to redraw the element
WebElements.redraw = function(element)
{
    var parentElement = WebElements.get(element).parentNode;
    var html = parentElement.innerHTML;

    parentElement.innerHTML = "";
    parentElement.innerHTML = html;
}

//Strip spaces before and after string
WebElements.strip = function(string)
{
    return string.replace(/^\s+|\s+$/g,"");
}

WebElements.stripLeadingZeros = function(someStr)
{
   var someStr2 = String(someStr);
   if(someStr2 == '0')
       return someStr2;
   return someStr2.replace(/^[0]+/, '');
}

//Easy way to see if a value is contained in a list
WebElements.inList = function(list, value)
{
    for(var current = 0; current < list.length; current++)
    {
        if(list[current] == value)
        {
            return true;
        }
    }
    return false;
}

//Appens to a list only if the value is not already contained in the list
WebElements.appendOnce = function(list, listItem)
{
    if(!WebElements.inList(list, listItem))
    {
        list.push(listItem)
    }
}

//Combines two lists into one ignoring duplicate values
WebElements.combine = function(list, list2)
{
    for(var currentListItem = 0; currentListItem < list2.length; currentListItem++)
    {
        listItem = list2[currentListItem];
        WebElements.appendOnce(list, listItem);
    }
}

//suppress a single elements attribute (usually an event)
WebElements.suppress = function(element, attribute)
{
    var element = WebElements.get(element);

    element['suppressed_' + attribute] = element[attribute];
    element[attribute] = null;
}

//unsuppress a single elements attribute
WebElements.unsuppress = function(element, attribute)
{
    var element = WebElements.get(element);

    element[attribute] = element['suppressed_' + attribute];
    element['suppressed_' + attribute] = element[attribute];
}

WebElements.toggleMenu = function(button)
{
    var menu = WebElements.peer(button, 'WMenu');
    if(WebElements.State.currentDropDown != menu){
        WebElements.hide(WebElements.State.currentDropDown);
    }
    WebElements.State.currentDropDown = menu;
    WebElements.toggle(WebElements.State.currentDropDown);
}

WebElements.closeMenu = function()
{
    WebElements.hide(WebElements.State.currentDropDown);
    if(WebElements.State.currentButton){
        WebElements.removeClass(WebElements.State.currentButton, 'WSelected');
    }
}

WebElements.selectText = function(element, start, end)
{
    var element = WebElements.get(element);
    if(element.setSelectionRange){
        element.setSelectionRange(parseInt(start), parseInt(end));
    }
    else if (element.createTextRange){
        var range = element.createTextRange();
        range.collapse(true);
        range.moveStart('character', parseInt(start));
        range.moveEnd('character', parseInt(end - start));
        range.select();
    }
}

WebElements.openPopup = function(popupName, popupURL, width, height, normal, options)
{
    var popupName = WebElements.replaceAll(popupName, ' ', '');

    params = ["focus=true,scrollbars=yes,resizable=yes"]
    if(height)
    {
        params.push("height=" + height);
    }
    if(width)
    {
        params.push("width=" + width);
    }
    if(normal)
    {
        params.push("menubar=yes,status=yes,toolbar=yes,location=yes");
    }

    var newWindow = window.open(popupURL, popupName, params.join(","));

    if(window.focus)
    {
        newWindow.focus()
    }
    return false;
}

WebElements.scrolledToBottom = function(scroller)
{
    var scroller = WebElements.get(scroller);
    var oldScrollTop = scroller.scrollTop;
    scroller.scrollTop += 10;
    if (scroller.scrollTop != oldScrollTop)
    {
        scroller.scrollTop = oldScrollTop;
        return false
    }
    else
    {
        return true
    }
}

// Toggle between Adding or Removing a class from an element.
WebElements.toggleClass = function(element, className)
{
	if(WebElements.hasClass(element, className))
	{
		WebElements.removeClass(element, className);
	}
	else
	{
		WebElements.addClass(element, className);
	}
}

// Toggle between selecting/unselecting a row on a table.
WebElements.toggleTableRowSelect = function(input)
{
	var row = input
	for (var levels = 3; levels > 0; levels -= 1)
	{
		row = row.parentElement
		if (row.parentElement.tagName == "TR")
		{
			WebElements.toggleClass(row.parentElement, 'selected');
			levels = 0;
		}
	}
}

WebElements.getNotificationPermission = function()
{

    if (window.webkitNotifications)
    {
        if (window.webkitNotifications.checkPermission() != 0)
        {
            window.webkitNotifications.requestPermission();
        }
    }
}

WebElements.showNotification = function(title, content, icon)
{
    if(!icon){icon = "images/info.png";}

    if (window.webkitNotifications)
    {
        if (window.webkitNotifications.checkPermission() == 0)
        {
            var notification = window.webkitNotifications.createNotification(icon, title, content);
            notification.show();
            return notification;
        }
    }
}

// Make two checkboxes act like radio button. element is "this" and pair is the other checkbox
WebElements.checkboxActsLikeRadioButton = function(element, pair)
{
    var element = WebElements.get(element);
    var pair = WebElements.get(pair);
    if(!element.checked)
    {
        return;
    }
    pair.checked = false;
}

// Accepts an event performing no operation on it and stopping any further operations from taking place
WebElements.stopOperation = function(evt)
{
  evt.stopPropagation();
  evt.preventDefault();
}

// attaches html5 drag and drop file uploading capabilities to an drop down skeleton
WebElements.buildFileOpener = function(dropBox)
{
    var dropBox = WebElements.get(dropBox);
    var statusBar = WebElements.get(dropBox.id + 'StatusBar');
    var dropLabel = WebElements.get(dropBox.id + 'DropLabel');
    var fileTemplate = WebElements.get(dropBox.id + 'File');
    var filesContainer = WebElements.get(dropBox.id + 'Files');

    // init event handlers
    dropBox.addEventListener("dragenter", WebElements.stopOperation, false);
    dropBox.addEventListener("dragexit", WebElements.stopOperation, false);
    dropBox.addEventListener("dragover", WebElements.stopOperation, false);
    dropBox.addEventListener("drop", function(evt){
        evt.preventDefault(evt);

        var files = evt.dataTransfer.files;
        var count = files.length;

        // Only call the handler if 1 or more files was dropped.
        if (files.length > 0)
        {
            WebElements.show(statusBar);
            WebElements.removeClass(dropBox, "WEmpty");
            WebElements.forEach(files, function(file){
                dropLabel.innerHTML = "Processing " + file.name;

                var reader = new FileReader();
                reader.file = file;

                // init the reader event handlers
                reader.onload = function(evt)
                {
                    var fileName = dropBox.id + evt.target.file.name;
                     if(WebElements.get(fileName))
                     {
                         return; // Don't upload the same file twice but don't annoy users with pesky errors
                     }
                    newFile = WebElements.copy(fileTemplate, filesContainer, false);
                    alert("OO")
                    newFile.id = fileName;
                    WebElements.show(newFile);
                    WebElements.getElementByClassName('WThumbnail', newFile).src = evt.target.result;
                    WebElements.getElementByClassName('WFileName', newFile).innerHTML = evt.target.file.name;
                };

                // begin the read operation
                reader.readAsDataURL(file);
            });
        }
        WebElements.hide(statusBar);

    }, false);
}

WebElements.clickDropDown = function(menu, openOnly, button, parentElement)
{
    WebElements.State.isPopupOpen = true;
    if(WebElements.State.currentDropDown && WebElements.State.currentDropDown != menu)
    {
        WebElements.hide(WebElements.State.currentDropDown);
        WebElements.removeClass(WebElements.State.currentButton, 'WSelected');
    }
    WebElements.State.currentDropDown = menu;
    WebElements.State.currentButton = button;
    if(!openOnly || !WebElements.shown(WebElements.State.currentDropDown)){
        if(WebElements.toggleDropDown(WebElements.State.currentDropDown, parentElement)){
            WebElements.addClass(button, 'WSelected');
        }
        else{
            WebElements.removeClass(button, 'WSelected');
       }
   }
}


//attach on click event to body to close any open pop up menus when a random click is placed
WebElements.Events.addEvent(window, 'load', function()
{
    document.body.onclick = function closeOpenMenu()
    {
        if(WebElements.State.isPopupOpen)
        {
            WebElements.State.isPopupOpen = false;
        }
        else
        {
            WebElements.closeMenu();
            WebElements.State.isPopupOpen = false;
        }
    }
});

WebElements.serialize = function(field)
{
    var element = WebElements.get(field);
    var tagName = element.tagName.toLowerCase();
    var key = encodeURIComponent(element.name);
    if(!key)
    {
        return '';
    }
    if(tagName == "input" || tagName == "textarea")
    {
        if(tagName == "input")
        {
            var type = element.type.toLowerCase();
            if(((type == "checkbox" || type == "radio") && !element.checked) || type == "button")
            {
                return '';
            }
        }
        return key + '=' + encodeURIComponent(element.value);
    }
    if(tagName == "select")
    {
        var value = [];
        WebElements.forEach(element.options, function(option){
                        if(option.selected){value.push(key + "=" + encodeURIComponent(option.value))}});
        return value.join("&");
    }
}

WebElements.serializeElements = function(elements)
{
    var params = []
    WebElements.forEach(elements,
                        function(item){result = WebElements.serialize(WebElements.get(item));
                                       if(result){params.push(result);}});
    return params.join("&");
}

WebElements.serializeAll = function(container)
{
    if(!container){container = document}

    var container = WebElements.get(container);
    return WebElements.serializeElements(WebElements.getElementsByTagNames(WebElements.Settings.Serialize, container));
}

//Presents a confirm window to the user, before doing an action
WebElements.confirm = function(message, action)
{
    if(window.confirm('%s'))
    {
        action();
    }
}

//Evaluates a method on the popup's opener
WebElements.callOpener = function(method)
{
    if(opener && !opener.closed)
    {
        try
        {
            eval("opener." + method + ";");
        }
        catch(err)
        {
        }
    }
}


//Tells the popup's opener that it has updated
WebElements.updateParent = function()
{
    return WebElements.callOpener("updatedFromChild()");
}

//Sets the focus to a specif element - optionally selecting text
WebElements.focus = function(element, selectText)
{
    var element = WebElements.get(element);
    element.focus();
    if(selectText)
    {
        element.select();
    }
}

//Sets the value of an element
WebElements.setValue = function(element, value)
{
    var element = WebElements.get(element).value = value;
}

//Shows the defined element only if the value matches
WebElements.showIfValue = function(element, value, elementToShow)
{
    var element = WebElements.get(element);
    if(element.value == value)
    {
        WebElements.show(elementToShow);
    }
    else
    {
        WebElements.hide(elementToShow);
    }
}

//Shows the defined element only if the checkbox is checked
WebElements.showIfChecked = function(checkbox, value, elementToShow)
{
    var checkbox = WebElements.get(checkbox);
    if(checkbox.checked)
    {
        WebElements.show(elementToShow);
    }
    else
    {
        WebElements.hide(elementToShow);
    }
}

//Expands a template written in the form of a python template
WebElements.expandTemplate = function(template, valueDictionary)
{
    var result = template;
    for(key in valueDictionary)
    {
        result = WebElements.replaceAll(template, "$" + key, valueDictionary[key]);
    }

    return result
}
/* DynamicForm
 *
 * Contains functions to update (via AJAX) certain sections of the page as defined as update-able
 * by the server - and to make basic REST calls.
 */

var RestClient = RestClient || {}

// Returns the XMLHTTPRequest supported by the users browser
RestClient.getXMLHttp = function()
{
  var xmlhttp = false;
  if (window.XMLHttpRequest)
  {
    xmlhttp = new XMLHttpRequest()
  }
  else if (window.ActiveXObject)
  {
    try
    {
      xmlhttp = new ActiveXObject("Msxml2.XMLHTTP")
    }
    catch (e)
    {
      try
      {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP")
      }
      catch (E)
      {
        xmlhttp=false
      }
    }
  }
  if (xmlhttp.overrideMimeType)
  {
      xmlhttp.overrideMimeType('text/xml');
  }
  return xmlhttp;
}

//Makes a raw AJAX call, passing in the response to a callback function - Returns true if the request is made
RestClient.makeRequest = function(url, method, params, callbackFunction)
{
    var xmlhttp = RestClient.getXMLHttp();
    if(!xmlhttp) return false;
    if(!method) method = "POST";

    if(method == "GET" || method == "DELETE")
    {
        xmlhttp.open(method, url + "?" + params, true);
        params = null;
    }
    else
    {
        xmlhttp.open(method, url, true);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.setRequestHeader("Content-length", params.length);
        xmlhttp.setRequestHeader("Connection", "close");
        csrfToken = WebElements.getValue('csrfmiddlewaretoken');
        if(csrfToken)
        {
            xmlhttp.setRequestHeader('X-CSRFToken', csrfToken);
        }
    }

    xmlhttp.onreadystatechange =
            function ()
            {
                if (xmlhttp && xmlhttp.readyState == 4) // something was returned from the server
                {
                    callbackFunction(xmlhttp);
                }
            }
    xmlhttp.send(params);
    return xmlhttp;
}

// Makes a GET rest call against the provided URL
RestClient.get = function(url, params, callbackFunction)
{
    return RestClient.makeRequest(url, "GET", params, callbackFunction);
}

// Makes a POST rest call against the provided URL
RestClient.post = function(url, params, callbackFunction)
{
    return RestClient.makeRequest(url, "POST", params, callbackFunction);
}

// Makes a PUT rest call against the provided URL
RestClient.put = function(url, params, callbackFunction)
{
    return RestClient.makeRequest(url, "PUT", params, callbackFunction);
}

// Makes a DELETE rest call against the provided URL
RestClient.delete = function(url, params, callbackFunction)
{
    return RestClient.makeRequest(url, "DELETE", params, callbackFunction);
}


var DynamicForm = DynamicForm || {};
DynamicForm.RestClient = RestClient;
DynamicForm.handlers = {};
DynamicForm.loading = {};
DynamicForm.baseURL = '';

// Returns a serialized string representation of a single control
DynamicForm.serializeControl = function(pageControl)
{
    return DynamicForm.serializeControls([pageControl])
}

// Quickly and efficiently serializes one or more controls returning a string representation
DynamicForm.serializeControls = function(pageControls)
{
    var pageControls = WebElements.map(pageControls, WebElements.get);
    var fields = Array();
    var serializedHandlers = []

    for(currentPageControl = 0; currentPageControl < pageControls.length; currentPageControl++)
    {
        var pageControl = pageControls[currentPageControl];
        var requestHandler = pageControl.attributes.handler.value;
        fields = fields.concat(WebElements.map(DynamicForm.handlers[requestHandler].grabFields, WebElements.get) || []);
        WebElements.map(DynamicForm.handlers[requestHandler].grabForms,
                            function(form)
                            {
                                fields = fields.concat(WebElements.getElementsByTagNames(WebElements.Settings.Serialize,
                                                                                        form, true));
                            });
        fields = fields.concat(WebElements.getElementsByTagNames(WebElements.Settings.Serialize, pageControl, true));
        serializedHandlers.push("requestHandler=" + requestHandler);
    }
    return serializedHandlers.concat([WebElements.serializeElements(WebElements.sortUnique(fields))]).join("&");
}

// Stops the loading of a control
DynamicForm.abortLoading = function(view)
{
    if(DynamicForm.loading.hasOwnProperty(view) && DynamicForm.loading[view] != null)
    {
        if(DynamicForm.loading[view].abort)
        {
            DynamicForm.loading[view].onreadystatechange = function(){};
            DynamicForm.loading[view].abort();
        }
    }
}

// Requests one or many controls on a page
DynamicForm._requestPageControls = function(pageControls, method, silent, params, timeout)
{
    if(typeof(pageControls) != typeof([]))
    {
        pageControls = [pageControls];
    }
    var pageControls = WebElements.map(pageControls, WebElements.get);
    var pageControlIds = WebElements.map(pageControls, function(control){return '"' + control.id + '"';}).join(",");
    var pageControlName = WebElements.map(pageControls, function(control){return control.id;}).join(",");

    if(!method){method = "GET";}
    if(!params){params = '';}

    DynamicForm.abortLoading(pageControlName);

    if(timeout)
    {
        timeoutMethod = setTimeout("DynamicForm." + method.toLowerCase() + "([" + pageControlIds + "], " + silent +
                                   ", '" + params + "');", timeout);
        DynamicForm.loading[pageControlName] = {'timeout':timeoutMethod,
                                    'abort':function(){clearTimeout(DynamicForm.loading[pageControlName]['timeout']);}};
        return;
    }

    var params = [DynamicForm.serializeControls(pageControls), params].join("&");
    if(!silent)
    {
        for(currentPageControl = 0; currentPageControl < pageControls.length; currentPageControl++)
        {
            var pageControl = pageControls[currentPageControl];
            var loader = WebElements.get(pageControl.id + ":Loading");
            var contentHeight = pageControl.offsetHeight;

            WebElements.hide(pageControl);
            WebElements.show(loader);

            if(contentHeight > loader.offsetHeight)
            {
                var half = String((contentHeight - loader.offsetHeight) / 2) + "px";
                loader.style.marginTop = half;
                loader.style.marginBottom = half;
            }
        }
    }

    DynamicForm.loading[pageControlName] = RestClient.makeRequest(DynamicForm.baseURL, method, params,
                                                function(response){DynamicForm._applyUpdates(response, pageControls)});
}

// Applies the servers updated HTML
DynamicForm._applyUpdates = function(xmlhttp, pageControls)
{
    var pageControls = WebElements.map(pageControls, WebElements.get);

    if(document.activeElement && ((document.activeElement.tagName.toLowerCase() == "input"
                                    && document.activeElement.type.toLowerCase() != "button"
                                    && document.activeElement.type.toLowerCase() != "submit") ||
                                    document.activeElement.tagName.toLowerCase() == "textarea" ||
                                    document.activeElement.tagName.toLowerCase() == "select"))
    {
        var lastSelectedId = document.activeElement.id;
        if(lastSelectedId){
            setTimeout("var element = WebElements.get('" + lastSelectedId + "'); element.focus();", 10);
        }
        if(document.activeElement.type == "text"){
            var selectStart = document.activeElement.selectionStart;
            var selectEnd = document.activeElement.selectionEnd;
            if(selectStart != selectEnd){
                setTimeout("WebElements.selectText('" + lastSelectedId + "', " + selectStart + ", " + selectEnd + ");", 11);
            }
        }
    }

    var responses = [];
    if(pageControls.length == 1)
    {
        responses = [xmlhttp];
    }
    else
    {
        responses = eval(xmlhttp.responseText);
    }

    for(currentPageControl = 0; currentPageControl < pageControls.length; currentPageControl++)
    {
        var pageControl = pageControls[currentPageControl];
        var response = responses[currentPageControl];

        DynamicForm.loading[pageControl.id] = null;
        pageControl.innerHTML = response.responseText;
        WebElements.show(pageControl);

        WebElements.hide(pageControl.id + ':Loading');

        WebElements.forEach(pageControl.getElementsByTagName('script'), function(scr){
                if(scr.innerHTML)
                {
                    scriptTag = document.createElement('script');
                    scriptTag.type = "text/javascript"
                    WebElements.replace(scr, scriptTag);
                    scriptTag.text = scr.innerHTML;
                }
            });
    }
}

// Asks the server to provide a new version of the control
DynamicForm.get = function(pageControl, silent, params, timeout)
{
    return DynamicForm._requestPageControls(pageControl, "GET", silent, params, timeout);
}

// Posts the current version of the control to the server for it to respond
DynamicForm.post = function(pageControl, silent, params, timeout)
{
    return DynamicForm._requestPageControls(pageControl, "POST", silent, params, timeout);
}

// Puts the current version of the control to the server for it to respond
DynamicForm.put = function(pageControl, silent, params, timeout)
{
    return DynamicForm._requestPageControls(pageControl, "PUT", silent, params, timeout);
}

// Request a delete of the current version of the control for the server to respond to
DynamicForm.delete = function(pageControl, silent, params, timeout)
{
    return DynamicForm._requestPageControls(pageControl, "DELETE", silent, params, timeout);
}
