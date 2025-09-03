// server/src/utils/logger.js
// Wrapper semplice per i log - in prod non stampa

const isDev = process.env.NODE_ENV !== "production";

function dlog(...args) {
  if (isDev) console.log(...args);
}

function dwarn(...args) {
  if (isDev) console.warn(...args);
}

function derr(...args) {
  console.error(...args); // gli errori sempre
}

module.exports = { dlog, dwarn, derr };