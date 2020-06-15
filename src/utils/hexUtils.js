// // hexutils.js - Helper functions for hex string to ascii string conversion

// export function decodeFromHex(hex) {
//   if (!hex || hex.length < 4 || hex[0] != "0" || hex[1] != "x" || hex.length % 2 != 0) {
//     console.log(`Invalid hex string: ${hex}`);
//     return "";
//   } else {
//     let result = "";

//     for (let i = 2; i < hex.length; i += 2) {
//       let n = parseInt(hex.slice(i, i + 2), 16);
//       result += String.fromCharCode(n);
//     }

//     try {
//       return JSON.parse(result);
//     } catch (e) {
//       return "Error: message could not be decrypted";
//     }
//   }
// }

// export function encodeToHex(string) {
//   let hexEncodedMessage = "0x";
//   string = encodeURI(string)
//   try {
//     for (let c of string) {
//       hexEncodedMessage += c.charCodeAt(0).toString(16);
//     }
//   } catch (e) {

//   }

//   return hexEncodedMessage;
// }
var writeUTF = function (str, isGetBytes) {
  var back = [];
  var byteSize = 0;
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (0x00 <= code && code <= 0x7f) {
      byteSize += 1;
      back.push(code);
    } else if (0x80 <= code && code <= 0x7ff) {
      byteSize += 2;
      back.push((192 | (31 & (code >> 6))));
      back.push((128 | (63 & code)))
    } else if ((0x800 <= code && code <= 0xd7ff) ||
      (0xe000 <= code && code <= 0xffff)) {
      byteSize += 3;
      back.push((224 | (15 & (code >> 12))));
      back.push((128 | (63 & (code >> 6))));
      back.push((128 | (63 & code)))
    }
  }
  for (i = 0; i < back.length; i++) {
    back[i] &= 0xff;
  }
  if (isGetBytes) {
    return back
  }
  if (byteSize <= 0xff) {
    return [0, byteSize].concat(back);
  } else {
    return [byteSize >> 8, byteSize & 0xff].concat(back);
  }
}


var readUTF = function (arr) {
  if (typeof arr === 'string') {
    return arr;
  }
  var UTF = '',
    _arr = arr;
  for (var i = 0; i < _arr.length; i++) {
    var one = _arr[i].toString(2),
      v = one.match(/^1+?(?=0)/);
    if (v && one.length == 8) {
      var bytesLength = v[0].length;
      var store = _arr[i].toString(2).slice(7 - bytesLength);
      for (var st = 1; st < bytesLength; st++) {
        store += _arr[st + i].toString(2).slice(2)
      }
      UTF += String.fromCharCode(parseInt(store, 2));
      i += bytesLength - 1
    } else {
      UTF += String.fromCharCode(_arr[i])
    }
  }
  return UTF
}




export function encodeToHex(str) {
  var charBuf = writeUTF(str, true);
  var re = '';
  for (var i = 0; i < charBuf.length; i++) {
    var x = (charBuf[i] & 0xFF).toString(16);
    if (x.length === 1) {
      x = '0' + x;
    }
    re += x;
  }
  return `0x${re}`;
}


export function decodeFromHex(str) {
  var buf = [];
  for (var i = 2; i < str.length; i += 2) {
    buf.push(parseInt(str.substring(i, i + 2), 16));
  }
  return readUTF(buf);
}