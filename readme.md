# task

A task is a low level object representing an asynchonous work that will complete or fail.  
All task comes with pause, resume, cancel, & progress controls.  

## Express your work using tasks

By composing task together (in parallel or in serie) you can express higher level work.  
Composing task create a task chain and the task state is propaged in the tree.  
