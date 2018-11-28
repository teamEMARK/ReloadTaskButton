# ReloadTaskButton
Reload task button is Qlik Sense extension for starting qmc reload task directly from application.
Working on published application without user admin roles.

Prerequisites:
  - created reload task
  - security rule for user to read access for reload tasks
  - security rule for user to read access for ExecutionResult* and executionsession* resource

Configuration:
  - Refresh interval in ms - interval for reload task status check
  - Task ID - if field is clear, taskId is detected automatically 
  - Waiting to finish reload - application is waiting in "idle" state when reload start if setting is checked
