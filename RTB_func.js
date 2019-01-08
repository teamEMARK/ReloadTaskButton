// JavaScript
define( ['jquery','qlik'], function ( $, qlik) { 
		
    function waitSessionStatus(sessionId, onSuccess, onFail) {
        getTaskStatus(sessionId, function(stat){
            if (stat == 1 || stat == 2 || stat == 3 || stat == 4 || stat == 5) {
                setTimeout(function(){
					waitSessionStatus(sessionId, onSuccess, onFail)
				}, 1000);
            } else if (stat == 7) {
				onSuccess();
			} else {
				onFail();
			}
        });
    }

    function getTaskStatus(session, callback) {
        if (session == undefined){ callback(0);	return; }
		qlik.callRepository('/qrs/executionresult?filter=ExecutionId eq ' + session, 'GET').success(function(reply){
			if (reply && reply[0]) {
				callback(reply[0].status);
			} else {
				callback(0);
			}
		}).error(function(err){
			callback(-1);
		});
    };

	function getReloadTaskId(appId){
        return qlik.callRepository('/qrs/reloadtask/full').then(function(reply){
			var tasks = reply.data.filter(function(task)
			{ return task.app.id == appId;});
			if (tasks[0]) return tasks[0].id;
			else return undefined;
        });
    }

    function getReloadSessionId(taskId){
        if (taskId == undefined) return undefined;
            return qlik.callRepository('/qrs/executionsession').then(function(reply){
                var sessions = reply.data.filter(function(task){ return task.reloadTask.id == taskId;});
				if (sessions[0]){
					return sessions[0].id;
				}
			}, function(error) {
                return undefined;
            });
    }
 
	return {
		waitSessionStatus: waitSessionStatus,
		getTaskStatus: getTaskStatus,
		getReloadTaskId: getReloadTaskId,
		getReloadSessionId: getReloadSessionId
	} 
});
