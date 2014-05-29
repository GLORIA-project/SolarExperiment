'use strict';

function LoadRemainingTime($gloriaAPI, scope) {
	return scope.sequence.execute(function() {
		return $gloriaAPI.getRemainingTime(scope.rid, function(data) {
			scope.remaining = Math.max(0, parseInt(data));
		});
	}).then(function() {
	}, function(response) {
		if (response.status == 401) {
			scope.$parent.$parent.$parent.notAuthorized = true;
		} else {
			scope.$parent.$parent.$parent.reservationEnd = true;
		}
	});
}
function LoadElapsedTime($gloriaAPI, scope) {

	return scope.sequence.execute(function() {
		return $gloriaAPI.getElapsedTime(scope.rid, function(data) {
			scope.elapsed = parseInt(data);
			scope.total = scope.remaining + scope.elapsed;
			scope.progressStyle.width = Math.floor(scope.elapsed
					/ (scope.total / 100))
					+ "%";			
			
			if (scope.remaining <= 60) {
				scope.fewSecondsLeft = true;
				scope.progressStyle.backgroundColor = '#FF9900';
			}
			
			scope.loaded = true;
			scope.$parent.$parent.$parent.elapsedTimeLoaded = true;
		});
	});
}

function SolarElapsedCtrl($gloriaAPI, $sequenceFactory, $scope, $timeout) {

	$scope.sequence = $sequenceFactory.getSequence();
	$scope.remaining = 0;
	$scope.elapsed = 0;
	$scope.total = 900;
	$scope.loaded = false;
	$scope.progressStyle = {};
	$scope.fewSecondsLeft = false;

	$scope.status = {
		time : {}
	};

	$scope.$watch('rid', function() {
		if ($scope.rid > 0) {
			$scope.status.time.timer = $timeout($scope.status.time.onTimeout,
					1000);
		}
	});

	$scope.status.time.onTimeout = function() {

		LoadRemainingTime($gloriaAPI, $scope);
		LoadElapsedTime($gloriaAPI, $scope).then(
				function() {
					$scope.status.time.timer = $timeout(
							$scope.status.time.onTimeout, 5000);
				}, function() {
					$timeout.cancel($scope.status.time.timer);
				});
	};

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.status.time.timer);
	});
}