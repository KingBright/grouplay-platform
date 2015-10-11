foreach = function (array, callback) {
    var size = array.length
    for (var i = 0; i < size; i++) {
        if (callback) {
            var result = callback(array[i], i)
            if (result == true) {
                return
            }
        }
    }
}

loop = function (count, callback) {
    for (var i = 0; i < count; i++) {
        if (callback) {
            var result = callback(i)
            if (result == true) {
                return
            }
        }
    }
}

deepcopy = function (obj) {
    var out = [],
        i = 0,
        len = obj.length;
    for (; i < len; i++) {
        if (obj[i] instanceof Array) {
            out[i] = deepcopy(obj[i]);
        } else out[i] = obj[i];
    }
    return out;
}