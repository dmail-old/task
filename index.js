/*
une task en cours est un job, un job c'est Object.create(task)
https://github.com/rpominov/fun-task
*/

import Task from './lib/task.js';

// prototype extensions
import delay from './lib/prototype-delay.js';
import finallyMethod from './lib/prototype-finally.js';
import spread from './lib/prototype-spread.js';
import timeout from './lib/prototype-timeout.js';
import time from './lib/prototype-time.js';
// helpers
import callback from './lib/callback.js';
import call from './lib/call.js';
// list helpers
import all from './lib/all.js'; // rename parallel?
import any from './lib/any.js';
import race from './lib/race.js';

Task.prototype.delay = delay;
Task.prototype.finally = finallyMethod;
Task.prototype.spread = spread;
Task.prototype.time = time;
Task.prototype.timeout = timeout;

Task.callback = callback;
Task.call = call;

Task.all = all;
Task.any = any;
Task.race = race;

export default Task;
