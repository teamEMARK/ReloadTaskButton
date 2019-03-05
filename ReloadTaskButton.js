define(["jquery", "qlik","./RTB_func", "text!./ReloadTaskButton.css", "text!./template.html", "text!./modal.html"], function($, qlik, RTB_func, cssContent, template, modal)  {
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
			
			app.getAppLayout().then(applayout => {appName = applayout.layout.qTitle;});
			
			if ($scope.layout.pTask == "") {
                RTB_func.getReloadTaskId(appId).then(function(id){taskId = id;});
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
				$scope.showStarted = false;
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
					RTB_func.getReloadSessionId(taskId).then(function(sessionId){
						RTB_func.getTaskStatus(sessionId, function(stat){
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
							} else {
								$scope.closeModal();
								$scope.showOverlay = true;
								$scope.showStarted = true;
							}
						RTB_func.waitSessionStatus(sessionId, function(){
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
				expression: "optional"
			},						
                        TaskProp : {
                            ref : "pTask",
                            type : "string",
                            label : "Task id",
                            expression: "optional"
                        },
	                    ButtonText : {
                            ref : "pButtonText",
                            type : "string",
                            label : "Button label",
                            expression: "optional",
			    defaultValue: "Reload"
                        },
	                    ButtonTextSize : {
                            ref : "pButtonTextSize",
                            type : "number",
                            label : "Button text size in px",
                            expression: "optional",
			    defaultValue: 30
                        }
                    }
                },
		about: {
			label: "About",
			type: "items",
			items: {
				text: {
					label: "EMARK Reload Task Button extenstion",
					component: "text"
				},				
				version: {
					label: 'Version: 0.3',
					component: "text"
				}					
			}
		}		    
            }
        }
    };


});
