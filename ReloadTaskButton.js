define(["jquery", "qlik", "text!./ReloadTaskButton.css", "text!./template.html", "text!./modal.html"], function($, qlik, cssContent, template, modal) {
	if(!$("#emark-reload-button-style")[0]){
		$("<style id='emark-reload-button-style'>").html(cssContent).appendTo("head");
	}
   
    return{
        support :
        {
            snapshot : false,
            export : false,
            exportData : false
        },
		template: template,
        paint : function($element, layout){},
        controller : ['$scope', '$compile', function($scope, $compile){
			var modalContainer = $compile(modal)($scope);
			$("body").append(modalContainer);
			$scope.$on("$destroy", function(){ modalContainer.remove(); });
		
            var taskId = undefined;
            
            var app = qlik.currApp(this);
            var appId = app.id;
			var appName = "";
            var refreshInterval = $scope.layout.pRefresh || 3000;
			$scope.showModal = false;
			
			app.getAppLayout().then(applayout => {appName = applayout.layout.qTitle;});
			
			if ($scope.layout.pTask == "") {
                getReloadTaskId(appId).then(function(id){taskId = id;});
            } else {
                taskId = $scope.layout.pTask;
            }
			
			$scope.closeModal = function(){
				$scope.showOverlay = false;
				$scope.reloadRunning = false;
				$scope.askReload = false;
				$scope.showLoader = false;
				$scope.showReloadError = false;
				$scope.showSuccess = false;
				$scope.showFail = false;
			}
		
			$scope.confirmReload = function(){
                // Check if modal is displayed
                if ($scope.showOverlay) return false;
				$scope.showOverlay = true;
				if (taskId == undefined) {
					alert("Reload task missing or you not have access to.");
					//closeModal();
					$scope.showOverlay = false;
					return false;
				} else {
					getReloadSessionId(taskId).then(function(sessionId){
						getTaskStatus(sessionId, function(stat){
							if (stat == 1 || stat == 2 || stat == 3 || stat == 4 || stat == 5) {
								$scope.reloadRunning = true;
							} else {
								$scope.askReload = true;
							}
						});
					});
				}
			}
			
			$scope.startReload = function(){
				console.log("starting reload", taskId);
				$scope.askReload = false;
				if (taskId != 0) {
					var resposne = qlik.callRepository('/qrs/task/' + taskId + '/start/synchronous', 'POST')
						.success(function(reply){
							var sessionId = reply.value
							if ($scope.layout.pWaiting) {
								$scope.showOverlay = true;
								$scope.showLoader = true;		
								console.log("showing loader");
							} else {
								$scope.closeModal();
							}
						waitSessionStatus(sessionId, function(){
							if ($scope.layout.pWaiting){
								$scope.showOverlay = true;
								$scope.showSuccess = true;
							}
						}, function(){
							if ($scope.layout.pWaiting){
								$scope.showFail = true;
								$scope.showOverlay = true;
							}
						});
					}).error(function(error){
						console.log("reload error", error);
						$scope.showOverlay = true;
						$scope.showReloadError = true;
					});
				} else {
					$scope.closeModal();
				}
			};
		
		
		}],
        definition : {
            type : "items",
            component : "accordion",
            items : {
                dmServer : {
                    label : "Settings",
                    type : "items",
                    items : {
                        RefreshProp : {
                            ref : "pRefresh",
                            type : "number",
                            defaultValue : 3000,
                            label : "Refresh interval in ms",
                            expression : "optional"
                        },
						LabelsProp: {
								ref:"pWaiting",
								type: "boolean",
								label: "Waiting to finish reload",
								defaultValue: true,
								expresiion: "optional"
						},						
                        TaskProp : {
                            ref : "pTask",
                            type : "string",
                            label : "Task id",
                            expresiion : "optional"
                        }
                    }
                }
            }
        }
    };


    function waitSessionStatus(sessionId, onSuccess, onFail) {
        getTaskStatus(sessionId, function(stat){
            if (stat == 1 || stat == 2 || stat == 3 || stat == 4 || stat == 5) {
                setTimeout(waitSessionStatus(sessionId, onSuccess, onFail), 1000);
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
    };
	
});
