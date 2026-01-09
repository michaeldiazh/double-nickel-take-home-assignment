"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.pool = void 0;
/**
 * Database module exports
 */
var connection_1 = require("./connection");
Object.defineProperty(exports, "pool", { enumerable: true, get: function () { return connection_1.pool; } });
Object.defineProperty(exports, "closePool", { enumerable: true, get: function () { return connection_1.closePool; } });
