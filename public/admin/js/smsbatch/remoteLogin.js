function remoteLogin(Restangular, $uibModal, $q, notification, $state) {
  'use strict';

  return {
    restrict: 'E',
    scope: {
      selection: '=',
      type: '@',
      ngConfirmMessage: '@',
      ngConfirm: '&'
    },
    link: function (scope, element, attrs) {

      scope.icon = 'glyphicon glyphicon-log-in';
      scope.label = 'Login';

      scope.modal = function () {
          const modalInstance = $uibModal.open({
            template: '<div class="modal-header">' +
              '<h5 class="modal-title">Please enter your username and password</h5>' +
              '</div>' +
              '<br>' +
              '<input class="form-control" style="padding: 20px; width: 91%;margin: 23px;"  id="remote-login-username" placeholder="Username" value="{{username}}" ng-required="true">' +
              '<input class="form-control" type="password" style="padding: 20px; width: 91%;margin: 23px;"  id="remote-login-password" placeholder="Password" value="{{password}}" ng-required="true">' +
              '<div class="modal-footer">' +
              '<button class="btn btn-primary" type="button" ng-click="ok()">OK</button>' +
              '<button class="btn btn-warning" type="button" ng-click="cancel()">Cancel</button>' +
              '</div>',


            controller: ('main', ['$scope', '$uibModalInstance', 'confirmClick', 'confirmMessge',
              function ($scope, $uibModalInstance, confirmClick, confirmMessge) {

                $scope.confirmMessage = confirmMessge;

                function closeModal() {
                  modalInstance.dismiss('resetModel');
                  $uibModalInstance.close('resetModel');
                }

                $scope.ok = function () {
                  const password = document.getElementById('remote-login-password').value;
                  const username = document.getElementById('remote-login-username').value;

                  closeModal();
                  Restangular.one('remote/login')
                    .customPOST({device_id: attrs.deviceId, password: password, username: username})
                    .then(function successCallback(response) {
                        notification.log(response.data.message, {addnCls: 'humane-flatty-success'})
                      },
                      function errorCallback(e) {
                        console.log("Error callback is ", e);
                        notification.log('A problem occurred, please try again', {addnCls: 'humane-flatty-error'}) && console.error(e)
                      })

                };

                $scope.cancel = function () {
                  closeModal();
                }

              }]),
            size: 'lg',
            windowClass: 'confirm-window',
            resolve: {
              confirmClick: function () {
                return scope.ngConfirm;
              },
              confirmMessge: function () {
                return scope.ngConfirmMessage;
              }
            }
          });
      }

    },
    template: '<a class="btn btn-default btn-xs" ng-click="modal()"><span class="{{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</a>'

  };
}

remoteLogin.$inject = ['Restangular', '$uibModal', '$q', 'notification', '$state'];

export default remoteLogin;
