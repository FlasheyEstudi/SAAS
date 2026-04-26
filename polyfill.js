// Polyfill for Node.js environment (Node 18 compatibility for Next.js 15)
if (typeof globalThis === 'undefined') {
  global.globalThis = global;
}

if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof crypto === 'undefined' || !global.crypto) {
  const crypto = require('crypto');
  global.crypto = crypto;
}

// Array.prototype.toSorted polyfill
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return [...this].sort(compareFn);
  };
}

// Array.prototype.toReversed polyfill
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return [...this].reverse();
  };
}

// Array.prototype.toSpliced polyfill
if (!Array.prototype.toSpliced) {
  Array.prototype.toSpliced = function(start, deleteCount, ...items) {
    const copy = [...this];
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
}

// Object.hasOwn polyfill
if (!Object.hasOwn) {
  Object.hasOwn = function(instance, prop) {
    return Object.prototype.hasOwnProperty.call(instance, prop);
  };
}

if (typeof fetch === 'undefined') {
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
  } catch (e) {
    // node-fetch might not be installed, using native fetch if available (Node 18 has it)
  }
}