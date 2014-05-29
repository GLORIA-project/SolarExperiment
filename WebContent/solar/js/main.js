'use strict';

function pad(n) {
	return (n < 10) ? ("0" + n) : n;
}

function SolarMainCtrl($gloriaAPI, $scope, $timeout, $gloriaLocale,
		$routeParams, Login) {

	$scope.mainPath = 'solar';
	$scope.solarReady = false;

	$gloriaLocale.loadResource($scope.mainPath + '/lang', 'solar', function() {
		$scope.solarReady = true;
	});

	$scope.requestRid = $routeParams.rid;
	$scope.reservationEnd = false;
	$scope.notAuthorized = false;
	$scope.serverDown = false;
	$scope.infoUpdated = false;
	$scope.wrongReservation = false;
	$scope.reservationActive = false;
	$scope.reservationObsolete = false;
	$scope.arrowsEnabled = false;
	$scope.weatherLoaded = false;
	$scope.ccdImagesLoaded = false;
	$scope.elapsedTimeLoaded = false;
	$scope.targetSettingsLoaded = false;
	$scope.movementDirection = null;
	$scope.imageTaken = true;
	$scope.deviceOnError = false;
	$scope.weatherAlarm = false;
	$scope.sharedMode = false;
	$scope.limits = {
		east : false,
		west : false,
		north : false,
		south : false
	};

	$scope.specificHtml = $scope.mainPath + '/html/content.html';

	$scope.onReservation = function() {
		$gloriaAPI.getReservationInformation($scope.preRid, function(data) {

			if (data.status == 'READY') {
				$scope.rid = $scope.preRid;
				$scope.reservationActive = true;
				$scope.infoUpdated = true;

				if (data.user != Login.getUser()) {
					$scope.sharedMode = true;
				}

			} else if (data.status == 'SCHEDULED') {
				$scope.resTimer = $timeout($scope.onReservation, 1000);
			} else if (data.status == 'OBSOLETE') {
				$scope.rid = -1;
				$scope.reservationObsolete = true;
				$scope.reservationActive = false;
				$scope.infoUpdated = true;
			}

		}, function(error) {
			$scope.rid = -1;
			$scope.reservationObsolete = false;
			$scope.reservationActive = false;
			$scope.infoUpdated = true;
		}, function() {
			$scope.notAuthorized = true;
		});
	};

	$scope.onUnauth = function() {
		$scope.$emit('unauthorized');
	};

	$scope.onDown = function() {
		$scope.$emit('server down');
	};

	$scope.onTimeout = function() {
		$scope.reservationActive = false;		
	};

	$scope.onDeviceProblem = function() {
		$scope.deviceProblem = true;
		$scope.reservationActive = false;
	};

	$scope.$watch('reservationEnd', function() {
		if ($scope.reservationEnd) {
			$scope.endTimer = $timeout($scope.onTimeout, 1500);
			$('#zoom').remove();
		}
	});

	$scope.$watch('notAuthorized', function() {
		if ($scope.notAuthorized) {
			$scope.unauthTimer = $timeout($scope.onUnauth, 1500);
			$('#zoom').remove();
		}
	});

	$scope.$watch('serverDown', function() {
		if ($scope.serverDown) {
			$scope.srvTimer = $timeout($scope.onDown, 1500);
			$('#zoom').remove();
		}
	});

	$scope.$watch('deviceOnError', function() {
		if ($scope.deviceOnError) {
			$scope.deviceOnErrorTimer = $timeout($scope.onDeviceProblem, 1500);
			$('#zoom').remove();
		}
	});

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.endTimer);
		$timeout.cancel($scope.unauthTimer);
		$timeout.cancel($scope.srvTimer);
		$timeout.cancel($scope.deviceOnErrorTimer);
		$timeout.cancel($scope.resTimer);
	});

	if ($routeParams.rid != undefined) {
		$scope.preRid = parseInt($scope.requestRid);

		if (!isNaN($scope.preRid)) {
			$scope.onReservation();
		} else {
			$scope.wrongReservation = true;
		}
	} else if ($routeParams.dev != undefined) {
		$scope.reservationActive = true;
	} else {
		$scope.rid = -1;
		$scope.preRid = '';
		$scope.reservationObsolete = true;
		$scope.reservationActive = false;
		$scope.infoUpdated = true;
	}
}
