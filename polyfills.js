import "react-native-url-polyfill/auto";
import { TextEncoder, TextDecoder } from "text-encoding";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";

// Polyfill Buffer globally
if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}

// Polyfill process for Node.js packages
if (typeof global.process === "undefined") {
  global.process = {
    env: {},
    version: "",
    platform: "react-native",
    nextTick: setImmediate,
  };
} else {
  // Ensure nextTick exists even if process is already defined
  if (!global.process.nextTick) {
    global.process.nextTick = setImmediate;
  }
  // Ensure env exists
  if (!global.process.env) {
    global.process.env = {};
  }
}

if (typeof TextEncoder === "undefined") {
  Object.defineProperty(global, "TextEncoder", {
    configurable: true,
    enumerable: true,
    value: TextEncoder,
  });
}

if (typeof TextDecoder === "undefined") {
  Object.defineProperty(global, "TextDecoder", {
    configurable: true,
    enumerable: true,
    value: TextDecoder,
  });
}

// Polyfill crypto.getRandomValues for packages that need it
if (typeof global.crypto === "undefined") {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues === "undefined") {
  global.crypto.getRandomValues = (array) => {
    const randomBytes = Crypto.getRandomBytes(array.length);
    for (let i = 0; i < array.length; i++) {
      array[i] = randomBytes[i];
    }
    return array;
  };
}
