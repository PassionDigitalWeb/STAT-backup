"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/setup");
const actions_1 = __importDefault(require("./lib/actions"));
(0, actions_1.default)().then();
