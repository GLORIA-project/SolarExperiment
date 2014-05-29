'use strict';

function SetSavedStatus($gloriaAPI, scope, status) {
	return $gloriaAPI.setParameterTreeValue(scope.rid, 'mount', 'saved_status',
			status, function(data) {
				scope.status.context = status;
			});
}

function LoadMountStatus($gloriaAPI, scope) {
	return $gloriaAPI.executeOperation(scope.rid, 'load_mount_status',
			function(data) {
			}, function(error) {
				scope.$parent.$parent.deviceOnError = true;
			});
}

function GetMountStatus($gloriaAPI, scope) {
	return $gloriaAPI.getParameterTreeValue(scope.rid, 'mount', 'status',
			function(data) {
				console.log('mount status: ' + data);
				scope.status.actual = data;

				return scope.status.actual;
			}, function(error) {
			});
}

function GetSavedStatus($gloriaAPI, scope) {
	return $gloriaAPI.getParameterTreeValue(scope.rid, 'mount', 'saved_status',
			function(data) {

				if (data == null || data == "") {
					if (scope.sharedMode) {
						scope.$parent.$parent.deviceOnError = true;
					} else {
						SetSavedStatus($gloriaAPI, scope, 'TARGET_SET');
						scope.status.context = 'TARGET_SET';
					}
				} else {
					scope.status.context = data;
				}

				return scope.status.context;
			}, function(error) {
				scope.status.context = 'TARGET_SET';
				SetSavedStatus($gloriaAPI, scope, 'TARGET_SET');
			});
}

function GetMountPositionConstraints($gloriaAPI, scope) {
	return $gloriaAPI
			.getParameterTreeValue(
					scope.rid,
					'mount',
					'constraints',
					function(data) {
						scope.status.constraints = data;
						console.log(scope.status.constraints);

						scope.$parent.limits.east = scope.status.constraints.x.current == scope.status.constraints.x.max;
						scope.$parent.limits.west = scope.status.constraints.x.current == -scope.status.constraints.x.max;
						scope.$parent.limits.north = scope.status.constraints.y.current == scope.status.constraints.y.max;
						scope.$parent.limits.south = scope.status.constraints.y.current == -scope.status.constraints.y.max;

						return scope.status.constraints;
					}, function(error) {
					});
}

function PointToTarget($gloriaAPI, scope, $timeout) {
	scope.pointDone = false;
	scope.pointingEnabled = false;
	scope.sunIconStyle.opacity = 0.3;
	scope.targetMessage = scope.messages.pointing;
	scope.inAction = true;
	scope.$parent.arrowsEnabled = false;
	var time = 5000;
	if (scope.status.actual == 'PARKED') {
		time = 10000;
	}

	return $gloriaAPI.executeOperation(scope.rid, 'point_to_object', function(
			data) {
		scope.inAction = false;
		scope.pointDone = true;
		scope.targetMessage = scope.messages.pointed;
		SetSavedStatus($gloriaAPI, scope, 'POINTED');

		scope.status.time.pointingTimer = $timeout(
				scope.status.time.reenablePointing, time);
	}, function(error) {
		scope.inAction = false;
		scope.pointDone = true;
		scope.targetMessage = scope.messages.movementError;
		scope.status.time.pointingTimer = $timeout(
				scope.status.time.reenablePointing, time);
	});
}

function MoveMount($gloriaAPI, scope, direction, $timeout) {

	var operation = '';

	scope.inAction = true;
	scope.$parent.arrowsEnabled = false;

	if (direction == 'WEST') {
		scope.targetMessage = scope.messages.movingWest;
		operation = 'move_west';
		scope.$parent.limits.east = false;
	} else if (direction == 'EAST') {
		scope.targetMessage = scope.messages.movingEast;
		operation = 'move_east';
		scope.$parent.limits.west = false;
	} else if (direction == 'NORTH') {
		scope.targetMessage = scope.messages.movingNorth;
		operation = 'move_north';
		scope.$parent.limits.south = false;
	} else if (direction == 'SOUTH') {
		scope.targetMessage = scope.messages.movingSouth;
		operation = 'move_south';
		scope.$parent.limits.north = false;
	}

	return $gloriaAPI.executeOperation(scope.rid, operation, function(data) {
		GetMountPositionConstraints($gloriaAPI, scope).then(
				function() {
					scope.targetMessage = scope.messages.movementDone;
					scope.status.time.messageTimer = $timeout(
							scope.status.time.refreshMessages, 3000);
				});
	}, function(error) {
		console.log(error);
		scope.targetMessage = scope.messages.movementError;
		scope.status.time.messageTimer = $timeout(
				scope.status.time.refreshMessages, 3000);
	});
}

function SetTargetMessage(scope) {
	if (scope.status.actual == 'TRACKING') {
		scope.targetMessage = scope.messages.pointed;
	} else if (scope.status.context == 'POINTED') {
		scope.targetMessage = scope.messages.pointed;
	} else if (scope.status.context == 'TARGET_SET') {
		scope.targetMessage = scope.messages.requestPoint;
	}
}

function SolarMountCtrl($gloriaAPI, $sequenceFactory, $scope, $timeout) {

	$scope.sequence = $sequenceFactory.getSequence();
	$scope.targetReady = false;
	$scope.pointDone = true;
	$scope.pointingEnabled = false;
	$scope.targetMessage = "";
	$scope.sunIconStyle = {
		opacity : 0.3
	};

	$scope.messages = {
		init : "solar.blocks.target.loading",
		settingTarget : "solar.blocks.target.set",
		pointing : "solar.blocks.target.point",
		requestPoint : "solar.blocks.target.request",
		pointed : "solar.blocks.target.pointed",
		movingEast : "solar.blocks.target.moving-e",
		movingWest : "solar.blocks.target.moving-w",
		movingNorth : "solar.blocks.target.moving-n",
		movingSouth : "solar.blocks.target.moving-s",
		movementDone : "solar.blocks.target.done",
		movementError : "solar.blocks.target.error",
		sharedMode : "solar.blocks.target.shared"
	};

	$scope.targetMessage = $scope.messages.init;

	$scope.status = {
		time : {},
		context : null
	};

	$scope.$watch('movementRequested', function() {
		if ($scope.$parent.movementRequested
				&& $scope.$parent.movementDirection != null
				&& $scope.$parent.movementDirection != undefined) {
			MoveMount($gloriaAPI, $scope, $scope.$parent.movementDirection,
					$timeout);
		}
	});

	$scope.$watch('ccdImagesLoaded', function() {
		if ($scope.rid > 0) {
			$scope.sequence.execute(function() {
				return LoadMountStatus($gloriaAPI, $scope);
			});
			$scope.sequence.execute(function() {
				return GetMountStatus($gloriaAPI, $scope);
			});
			$scope.sequence.execute(function() {
				return GetMountPositionConstraints($gloriaAPI, $scope);
			});
			$scope.sequence.execute(function() {
				return GetSavedStatus($gloriaAPI, $scope);
			}).then(function() {

				if (!$scope.sharedMode) {
					SetTargetMessage($scope);
				}

				if ($scope.status.actual != 'PARKED') {
					$scope.$parent.arrowsEnabled = true;
				}

				if ($scope.status.context == 'TARGET_SET') {
					$scope.targetReady = true;
					$scope.pointingEnabled = true;
					$scope.sunIconStyle.opacity = 1.0;
					$scope.$parent.targetSettingsLoaded = true;
				} else if ($scope.status.context == 'POINTED') {
					$scope.targetReady = true;
					$scope.pointDone = true;
					$scope.pointingEnabled = true;
					$scope.sunIconStyle.opacity = 1.0;
					$scope.$parent.targetSettingsLoaded = true;
				}

				if ($scope.sharedMode) {
					$scope.pointingEnabled = false;
					$scope.$parent.arrowsEnabled = false;
					$scope.sunIconStyle.opacity = 0.5;
					$scope.targetMessage = $scope.messages.sharedMode;
					$scope.inAction = true;
				}
			});
		}
	});

	$scope.pointToTarget = function() {
		if ($scope.pointingEnabled && $scope.targetReady) {
			PointToTarget($gloriaAPI, $scope, $timeout);
		}
	};

	$scope.status.time.refreshMessages = function() {
		SetTargetMessage($scope);
		$scope.inAction = false;
		$scope.$parent.arrowsEnabled = true;
		$scope.$parent.movementRequested = false;
	};

	$scope.status.time.reenablePointing = function() {
		console.log('polling mount state...');
		$scope.sequence.execute(function() {
			return LoadMountStatus($gloriaAPI, $scope);
		});
		$scope.sequence.execute(function() {
			return GetMountStatus($gloriaAPI, $scope);
		}).then(
				function() {
					if ($scope.status.actual == 'TRACKING'
							|| $scope.status.actual == 'STOP') {
						$scope.pointingEnabled = true;
						$scope.sunIconStyle.opacity = 1.0;
						$scope.$parent.arrowsEnabled = true;
					} else {
						$scope.status.time.pointingTimer = $timeout(
								$scope.status.time.reenablePointing, 5000);
					}
				}, function() {
					$scope.pointingEnabled = true;
					$scope.$parent.arrowsEnabled = false;
					$scope.sunIconStyle.opacity = 1.0;
				});

	};

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.status.time.messageTimer);
		$timeout.cancel($scope.status.time.pointingTimer);
	});
}