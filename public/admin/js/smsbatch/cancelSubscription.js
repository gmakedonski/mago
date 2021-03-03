function cancelSubscription(Restangular, $uibModal, $q, notification, $state,$http) {
    'use strict';

    return {
        restrict: 'E',
        scope: { post: '&' },
        link: function(scope, element, attrs) {
            //icon
            scope.icon = 'fa fa-ban fa-md';

            //label
            if (attrs.type === 'cancelSubscription') scope.label = 'Cancel Subscription';

            //modal function
            scope.modal = function () {
                $uibModal.open({
                    template:
                        '<div class="modal-header">' +
                            '<h5 class="modal-title" style="font-weight: bold;font-size: 20px;">Cancel Subscription</h5>' +
                        '</div>' +
                        '<div class="modal-body">'+
                            '<div class="row">'+
                                '<form>'+
                                    '<div class="form-group" style="padding: 20px;">'+
                                        '<input type="text" id="subscriptionId" class="form-control" placeholder="Subscription ID" value="{{id}}" disabled><br /> '+
                                        '<input type="text" id="transactionId" class="form-control" placeholder="Transaction ID" value="{{transaction_id}}" disabled><br />'+
                                        '<input type="text" id="cancelationReason" class="form-control" placeholder="Please enter your cancelation reason"><br />'+
                                    '</div>'+
                                '</form>'+
                            '</div>'+
                        '</div>'+
                        '<div class="modal-footer">' +
                         '<button class="btn btn-primary" type="button" ng-click="ok()">OK</button>' +
                         '<button class="btn btn-warning" type="button" ng-click="cancel()">Cancel</button>' +
                        '</div>',

                    controller:('main', ['$scope', '$uibModalInstance', function ($scope, $uibModalInstance) {
                        //close modal
                        function closeModal() {
                            $uibModalInstance.dismiss();
                        }
                        $scope.cancel = function () {
                            closeModal();
                        };

                        //populate subscriptionID & transactionID from Administration Panel
                         $scope.id = scope.post().values.id;
                         $scope.transaction_id = scope.post().values.transaction_id;
                         $scope.cancelation_reason = scope.post().values.cancelation_reason;


                        //When OK button is clicked
                        $scope.ok = function () {
                            var id = document.getElementById('subscriptionId').value,
                                transaction_id = document.getElementById('transactionId').value,
                                cancelation_reason = document.getElementById('cancelationReason').value;

                            if (cancelation_reason.length > 0){
                                if (cancelation_reason !== $scope.cancelation_reason) {
                                    var data = { 'id': id,'transaction_id': transaction_id, 'cancelation_reason': cancelation_reason};
                                    $http.post('../api/salesreports/cancel/'+id, data).then(function successCallback(response) {
                                        new Promise(function(resolve, reject) {
                                            closeModal();
                                            notification.log(response.data.data.message, { addnCls: 'humane-flatty-success' });
                                            setTimeout(function() {
                                                resolve(window.location.reload(true));
                                            }, 1000);
                                        });

                                    },function errorCallback(response) {
                                        notification.log(response.data.message, { addnCls: 'humane-flatty-error' });
                                    });
                                } else {
                                    notification.log('Please write a different cancelation reason', { addnCls: 'humane-flatty-error' });
                                }
                            } else {
                                notification.log('Please write your cancelation reason', { addnCls: 'humane-flatty-error' });
                            }
                        };
                    }]) //./controller
                }) //./modal open
            }  //./modal function
        },

        template: '<a class="btn btn-default btn-xs" ng-click="modal()"><span class="{{ icon }}" aria-hidden="true"></span>&nbsp;{{ label }}</a>'
    };
}

cancelSubscription.$inject = ['Restangular', '$uibModal', '$q', 'notification', '$state','$http'];

export default cancelSubscription;