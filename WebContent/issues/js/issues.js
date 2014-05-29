function IssuesController($scope, $ghAPI, $timeout, $gloriaLocale, $filter,
		$locale) {

	$scope.ready = false;
	$scope.bugs = [];
	$scope.enhancements = [];
	$scope.enhancementsReady = false;
	$scope.bugsReady = false;
	$scope.bugsLoaded = false;
	$scope.enhancementsLoaded = false;

	$gloriaLocale.loadResource('issues/lang', 'issues', function() {
		$scope.introHtml = "<p>"
				+ $filter('highlight')($filter('i18n')('issues.intro'),
						$scope.repo) + "</p>";
		$scope.scopeHtml = "<p>"
				+ $filter('highlight')($filter('i18n')('issues.scope'),
						$scope.repo) + "</p>";
		$scope.ready = true;
	});

	$scope.$watch('repo', function() {
		if ($scope.repo != undefined) {
			$ghAPI.getLabelIssues($scope.repo, 'bug', function(data) {
				$scope.bugs = data;
				$scope.bugsLoaded = true;
				if (data.length > 0) {
					$scope.bugsReady = true;
				}
			}, function() {
				alert('error');
			});

			$ghAPI.getLabelIssues($scope.repo, 'enhancement', function(data) {
				$scope.enhancements = data;
				$scope.enhancementsLoaded = true;

				if (data.length > 0) {
					$scope.enhancementsReady = true;
				}

			}, function() {
				alert('error');
			});
		}
	});
}