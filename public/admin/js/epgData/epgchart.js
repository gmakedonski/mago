import Template from './epgchart.html'

export default function($stateProvider) {
  $stateProvider.state('epgdata_chart', {
    parent: 'main',
    url: '/epggraph',
    params: {},

    controller: function(Restangular, $scope, VisDataSet) {
      $scope.page = 0;
      $scope.visiblePrevPageButton = false;
      $scope.visibleNextPageButton = true;


      $scope.options = {
        stack: false,
        start: new Date(),
        end: new Date(1000 * 60 * 60 * 24 + new Date().valueOf()),
        editable: false,
        orientation: 'top',
        // right order
        groupOrder: function(a, b) {
          return b.channel_number - a.channel_number;
        },
      };

      $scope.loadMore = function(p) {
        if($scope.page - 1 < 0 && !p) {
          $scope.visiblePrevPageButton = false;
          return;
        } else {
          $scope.visiblePrevPageButton = true;
        }

        if($scope.page + 1 > $scope.total_pages && p) {
          $scope.visibleNextPageButton = false;
          return;
        } else {
          $scope.visibleNextPageButton = true;
        }

        $scope.page = p ? $scope.page + 1 : $scope.page - 1;

        if($scope.page === 0) {
          $scope.visiblePrevPageButton = false;
        }

        if($scope.page === $scope.total_pages) {
          $scope.visibleNextPageButton = false;
        }

        Restangular.one(`epgdata_chart?page=${$scope.page}`)
          .get()
          .then(
            function successCallback(response) {
              $scope.data_timeline = {
                items: response.data ? response.data.items : response.items,
                groups: response.data ? response.data.groups : response.groups
              }
            },
            function errorCallback(response) {}
          )
      };

      Restangular.one(`epgdata_chart?page=${$scope.page}`)
        .get()
        .then(
          function successCallback(response) {
            $scope.data_timeline = {
              items: response.data ? response.data.items : response.items,
              groups: response.data ? response.data.groups : response.groups
            };
            $scope.total_pages = response.data ? response.data.total_pages : response.total_pages
          },
          function errorCallback(response) {
            console.error("There has been an error at getting epg data, error: ", response);
          }
        )
    },

    template: Template
  })
}
