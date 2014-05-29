'use strict';

function LoadDomeContent($gloriaAPI, scope) {
	return $gloriaAPI.executeOperation(scope.rid, 'load_dome_status',
			function(data) {
				console.log(data);
			}, function(error) {
				if (!$scope.sharedMode) {
					scope.$parent.$parent.deviceOnError = true;
				}
			}).then(function() {
		return $gloriaAPI.getParameterValue(scope.rid, 'dome', function(data) {
			if (data.last_operation != undefined) {
				scope.status.dome.lastOperation = data.last_operation;
				if (data.last_operation == 'open') {
					scope.status.dome.closeEnabled = true;
					scope.status.dome.openEnabled = false;
				} else {
					scope.status.dome.openStyle.left = "78.3%";
					scope.status.dome.closeEnabled = false;
					scope.status.dome.openEnabled = true;
				}
			}

			if (data.status == undefined || data.status == 'UNDEFINED') {
				scope.status.dome.error = true;
			}
		});
	});
}

function OpenDome($gloriaAPI, scope, $timeout) {

	return $gloriaAPI.setParameterTreeValue(scope.rid, 'dome',
			'last_operation', 'open',
			function() {
				$gloriaAPI.executeOperation(scope.rid, 'open', function(
						data) {
					scope.status.dome.timer = $timeout(
							scope.status.dome.timeout, 60000);
				}, function(error) {
					scope.status.dome.error = true;
					scope.status.dome.locked = true;
				});
			}, function() {
				scope.status.dome.error = true;
				scope.status.dome.locked = true;
			});
}

function CloseDome($gloriaAPI, scope, $timeout) {

	return $gloriaAPI.setParameterTreeValue(scope.rid, 'dome',
			'last_operation', 'close',
			function() {
				$gloriaAPI.executeOperation(scope.rid, 'close',
						function(data) {
							scope.status.dome.timer = $timeout(
									scope.status.dome.timeout, 60000);
						}, function(error) {
							scope.status.dome.error = true;
							scope.status.dome.locked = true;
						});
			}, function() {
				scope.status.dome.error = true;
				scope.status.dome.locked = true;
			});
}

function SolarScamCtrl($gloriaAPI, $scope, $timeout) {

	$scope.scams = [ {}, {} ];
	$scope.status = {
		time : {
			count : Math.floor(Math.random() * 100000)
		},
		dome : {
			closeEnabled : true,
			openEnabled : true,
			openStyle : {
				zIndex: 100
			},
			closeStyle : {
				zIndex: 100
			},
			barStyle : {
				position : 'absolute',
				bottom : '-164px',
				opacity : '0.0',
				height : '48px',
				left : '0px',
				width : '100%',
				backgroundColor : 'black'
			},
			error : false
		}
	};

	$scope.openDome = function() {
		$scope.status.dome.openEnabled = false;
		$scope.status.dome.closeEnabled = false;
		$scope.status.dome.lastOperation = 'open';
		OpenDome($gloriaAPI, $scope, $timeout);
	};

	$scope.status.dome.timeout = function() {
		if ($scope.status.dome.lastOperation == 'open') {
			$scope.status.dome.closeEnabled = true;
		} else {
			$scope.status.dome.openStyle.left = "78.3%";
			$scope.status.dome.openEnabled = true;
		}

	};

	$scope.closeDome = function() {
		$scope.status.dome.closeEnabled = false;
		$scope.status.dome.openEnabled = false;
		$scope.status.dome.lastOperation = 'close';
		CloseDome($gloriaAPI, $scope, $timeout);
	};

	$scope.showDomeBar = function() {
		$scope.status.dome.barStyle.opacity = 0.7;

	};

	$scope.hideDomeBar = function() {
		$scope.status.dome.barStyle.opacity = 0.0;
	};

	$scope.status.time.onTimeout = function() {
		$scope.status.time.count += 1;
		var i = 0;
		$scope.scams.forEach(function(index) {
			$scope.scams[i].purl = $scope.scams[i].url + '?d='
					+ $scope.status.time.count;
			i++;
		});
		$scope.status.time.timer = $timeout($scope.status.time.onTimeout, 5000,
				1000);
	};

	$scope.$watch('rid', function() {
		if ($scope.rid > 0) {

			LoadDomeContent($gloriaAPI, $scope);

			$gloriaAPI.getParameterTreeValue($scope.rid, 'cameras', 'scam',
					function(data) {
						console.log(data);

						$scope.scams = data.images.slice(0, 2);
						$scope.status.time.timer = $timeout(
								$scope.status.time.onTimeout, 1000);
					}, function(error) {
						console.log(error);
					});
		}
	});

	$scope.$watch('weatherAlarm', function() {
		$scope.status.dome.locked = $scope.$parent.weatherAlarm;
	});

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.status.time.timer);
		$timeout.cancel($scope.status.dome.timer);
	});
}