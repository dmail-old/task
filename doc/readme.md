# task

A task is a low level object represeningt an asynchonous work that will complete or fail.  
By composing task together (in parallel or in serie) you can express higher level work.  
All task comes with pause, resume, cancel, & progress controls. 

## Example

Increase the id of a JSON file containing `{"id": 0}`

```javascript
import Task from 'dmail/task';

function createReadFilePromise(path){
  return new Promise(function(resolve, reject){
      require('fs').readFile(path, function(error, content){
        error ? reject(error) : resolve(String(content));
      })
  });
}

function createWriteFilePromise(path, content){
  return new Promise(function(resolve, reject){
      require('fs').writeFile(path, content, function(error, content){
        error ? reject(error) : resolve(String(content));
      })
  });
}

function increaseFileContentJSONId(path){
  return Task.serie([
    function(){
      return createReadFilePromise(path),
    },
    JSON.parse,
    function(content){
      content.id++;
      return content;
    },
    JSON.stringify,
    function(content){
      return createWriteFilePromise(path, content);
    }
  ]);
}

var task = increaseFileContentJSONId('file.json');

// using task to express your work let you control the async work hapenning behind

// at any moment you can pause or resume the task
task.pause();
task.resume();
// if you're no longer interested in the task result, you can cancel it
task.cancel();
```

The code above can put the file content in a inconsistent state : you cancel the task while the code is writing the file content and you think the task is cancelled while it has done the job.  
This can be fixed by changing the last task to

```javascript
function increaseFileContentJSONId(path){
  var serie = Task.serie([
    function(){
      return createReadFilePromise(path),
    },
    JSON.parse,
    function(content){
      content.id++;
      return content;
    },
    JSON.stringify,
    function(content){
      var task = new Task();

      // cancel() will call task.abort() that will write the right content into the file
      task.abort = function(){
        return createWriteFilePromise(path, serie.tasks[0].value);
      };

      task.complete(createWriteFilePromise(path, content));

      return task; 
    }
  ]);
  return serie;
}
```

## properties

Name  | Description | Default
----- | --- | ---------
useDebug | Log many things to help task debugging | false
state | Can be 'pending', 'completed', 'failed' | 'pending'
value | Value of this task | null
isPaused  | Boolean indicating if the task is paused | false
isCancelled | Boolean indicating if the task is cancelled | false
nextList | An array of tasks waiting for this one to cancel/complete/fail | null
previous | The task this one wants to become asap | null
propagationDirection | The task state will propagate in this direction ('both', 'left', 'right', 'none') | 'both'
completionTransformer | A function used to transform the completion value | null
failureTransformer | A function used to transform the failure value | null

## Before going further

The term task state refers to the completed/failed/cancelled/paused state of a task.<br />
The term task chain refer to the chain formed by previous & nextList properties.<br />
**The task state is propaged on the task chain**

## cancel()

The task will never complete or fail

## pause()

The task completion/failure is ignored until task.resume()

## resume()

Reconsider task completion/failure. If the task has completed/failed while paused, it complete/fails immediatly

## complete(value)

Initiate the task completion with the provided value

## fail(value)

Initiate the task failure with the provided value

## adoptState(otherTask)

This task adopt the completed/failed state of otherTask, calling optional completionTransformer/failureTransformer

## become(otherTask)

This task mimic otherTask cancelled/paused state immediatly or completed/failed state as as soon as possible

## chain(otherTask)

Add otherTask to the list of tasks becoming this one. <br />

Exemple of circular dependency error

```javascript
var A = new Task('A'), B = new Task('B');

A.chain(B);
B.chain(A); // throw 'cannot chain task : it would create a circular dependency because [Task B] depends on [Task A]'
````

Example of multiple dependency error

```javascript
var A = new Task('A'), B = new Task('B'), C = new Task('C');

A.chain(C);
B.chain(C); // throw 'cannot chain task : multiple dependency not supported and [Task C] already depends on [Task A]'

// the proper way to declare multiple dependency is
Task.all([A, B]).chain(C);
```

## insert(otherTask)

This task will become otherTask

## Difference between chain & insert

`A.chain(B)` means B depends on A `A.insert(B)` means A depends on B

## then(completionTransformer, failureTransformer, bind)

Create a task & chain it with this one. It also set the optional completionTransformer & failureTransformer properties.

```javascript
Task.complete('foo').then(function(value){
  return value + 'bar';
}).then(console.log); // 'foobar'
```

The returned value is used as completion value, note that completing to a task allow lazy insert

```javascript
var A = new Task(), B = new Task();

A.then(function(){ return B; }); // is equivalent to A.insert(B)
```

## fork()

Same as then() but prevent the created task from propagating his state to previous tasks

## Illustration of the difference between then() & fork()

```javascript
var A = new Task();
var B1 = A.fork();
var B2 = A.then();

B1.cancel(); // cancel B1
B2.cancel(); // cancel B2 & B1 & A
```

## Progression

When a task completes next tasks are informed of the progression. If you listen for `progress` after an ancestor task completed, the event is lost.

```javascript
var A = new Task('A');
var B = new Task('B');
var C = new Task('C');

A.chain(B);
B.chain(C);

C.listen('progress', function(task, ancestorTask){ console.log(ancestorTask); });

A.complete(); // logs A
B.complete(); // logs B
```

Advanced example

```javascript
var increaseAllTask = Task.map([0,1], function increase(value){
  return Task.complete(value + 1).then(function decrease(value)){
    return value - 1;
  });
});

increaseAllTask.listen('progress', function(task, ancestorTask){ console.log(ancestorTask.name); });
// logs decrease, decrease, increase, increase
```

## Undocumented

- delay(ms)
- timeout(ms)
- spread(onCompletion, onFailure, bind)
- finally(onCompletionOrFailure, bind)

## Static function (helpers)

- Task.complete(value)
- Task.fail(value)
- Task.delay(ms, value)
- Task.all(iterable)
- Task.any(iterable)
- Task.race(iterable)
- Task.pipe(iterable, bind, initialValue)
- Task.map(iterable, fn, bind)
- Task.mapAny(iterable, fn, bind)
- Task.mapRace(iterable, fn, bind)
- Task.reduce(iterable, fn, bind, initialValue)
