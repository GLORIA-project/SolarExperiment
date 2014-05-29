'use strict';

function LoadWeatherValues($gloriaAPI, scope) {
	return scope.sequence.execute(function() {
		return $gloriaAPI.executeOperation(scope.rid, 'load_weather_values',
				function(data) {
				}, function(error) {
				});
	});
}

function LoadWeatherContent($gloriaAPI, scope) {
	return scope.sequence.execute(function() {
		return $gloriaAPI.getParameterValue(scope.rid, 'weather',
				function(data) {
					scope.wind.value = data.wind.value;
					scope.wind.high = data.wind.alarm;

					if (scope.wind.high) {
						scope.wind.style.color = '#FF9900';
					} else {
						scope.wind.style.color = 'silver';
					}

					scope.rh.value = data.rh.value;
					scope.rh.high = data.rh.alarm;

					if (scope.rh.high) {
						scope.rh.style.color = '#FF9900';
					} else {
						scope.rh.style.color = 'silver';
					}

					scope.valuesLoaded = true;
					scope.$parent.$parent.weatherLoaded = true;

					scope.$parent.$parent.weatherAlarm = scope.rh.high
							|| scope.wind.high;

				}, function(error) {

				});
	});
}

function SolarWeatherCtrl($gloriaAPI, $sequenceFactory, $scope, $timeout) {

	$scope.sequence = $sequenceFactory.getSequence();
	$scope.wind = {
		value : 0,
		high : false,
		style : {}
	};
	$scope.rh = {
		value : 0,
		high : false,
		style : {}
	};
	$scope.valuesLoaded = false;

	$scope.status = {
		time : {}
	};

	$scope.$watch('elapsedTimeLoaded', function() {
		if ($scope.rid > 0) {
			$scope.status.time.timer = $timeout($scope.status.time.onTimeout,
					1000, 1000);
		}
	});

	$scope.status.time.onTimeout = function() {

		if (!$scope.sharedMode) {
			LoadWeatherValues($gloriaAPI, $scope);
		}
		LoadWeatherContent($gloriaAPI, $scope).then(
				function() {
					$scope.status.time.timer = $timeout(
							$scope.status.time.onTimeout, 10000, 0);
				}, function() {
					$timeout.cancel($scope.status.time.timer);
				});
	};

	$scope.$on('$destroy', function() {
		$timeout.cancel($scope.status.time.timer);
	});
}