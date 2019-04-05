/// <reference lib="dom"/>
/// <reference types="node"/>
import {expectType} from 'tsd';
import contextMenu = require('.');

expectType<void>(contextMenu());
