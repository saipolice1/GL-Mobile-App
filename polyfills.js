import "react-native-url-polyfill/auto";
import { TextEncoder, TextDecoder } from "text-encoding";
import * as Crypto from "expo-crypto";

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
