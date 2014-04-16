'use strict';

toolbox.lazy.directive('ngElevateZoom', function() {
	return {
		restrict : 'A',
		link : function(scope, element, attrs) {

			// var url = attrs.zoomImage;//.substring(0,
			// attrs.zoomImage.indexOf("?d="));

			// Will watch for changes on the attribute
			attrs.$observe('zoomImage', function() {
				var image = new Image();
				var url = attrs.zoomImage;
				if (scope.loading == undefined || !scope.loading) {
					scope.loading = true;
					image.onload = function() {
						element.attr('src', url);
						scope.loading = false;
						
						element.attr('src', url);
						scope.elevate = $.data(element[0], 'elevateZoom');
						if (scope.elevate != undefined
								&& scope.elevate.zoomLens != undefined) {
							element.attr('data-zoom-image', url);
							scope.elevate.refresh_image(image);
						} else
							linkElevateZoom(image);
						
					};
					image.src = url;
				}
				/*
				 * .load(function() { if (!this.complete || typeof
				 * this.naturalWidth == "undefined" || this.naturalWidth == 0) { //
				 * alert('broken image!'); } else { scope.elevate =
				 * $.data(element[0], 'elevateZoom'); if (scope.elevate !=
				 * undefined && scope.elevate.zoomLens != undefined) {
				 * element.attr('data-zoom-image', url);
				 * scope.elevate.refresh_image(url); } else
				 * linkElevateZoom(url); } });
				 */

				// image.src = attrs.zoomImage;
				// linkElevateZoom();
			});

			function linkElevateZoom(image) {
				// Check if its not empty
				if (!attrs.zoomImage)
					return;
				element.attr('data-zoom-image', image.src);
				$(element).elevateZoom({
					zoomType : "lens",
					lensShape : "round",
					lensSize : 150
				});
			}

			// linkElevateZoom();
		}
	};
});

function LoadDomeContent($gloriaAPI, scope) {
	return $gloriaAPI.getParameterValue(scope.rid, 'dome', function(data) {
		console.log(data);

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
	});
}

function OpenDome($gloriaAPI, scope) {

	$gloriaAPI.setParameterTreeValue(scope.rid, 'dome', 'last_operation',
			'open');

	return $gloriaAPI.executeOperation(scope.rid, 'open', function(data) {
	}, function(error) {
	});
}

function CloseDome($gloriaAPI, scope) {

	$gloriaAPI.setParameterTreeValue(scope.rid, 'dome', 'last_operation',
			'close');

	return $gloriaAPI.executeOperation(scope.rid, 'close', function(data) {
	}, function(error) {
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
			openStyle : {},
			closeStyle : {}
		}
	};

	$scope.openDome = function() {
		$scope.status.dome.openEnabled = false;
		$scope.status.dome.closeEnabled = false;
		$scope.status.dome.lastOperation = 'open';
		OpenDome($gloriaAPI, $scope);
		$scope.status.dome.timer = $timeout($scope.status.dome.timeout, 60000);
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
		CloseDome($gloriaAPI, $scope);
		$scope.status.dome.timer = $timeout($scope.status.dome.timeout, 60000);
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