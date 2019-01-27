import {expectType} from 'tsd-check';
import {BrowserWindow} from 'electron';
import contextMenu from '.';

expectType<void>(contextMenu());
