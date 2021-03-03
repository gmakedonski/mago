import edit_button from '../edit_button.html';

export default function (nga, admin) {
    var salesreport = admin.getEntity('Salesreports');

    salesreport.listView()
        .title('<h4>Subscription Activation <i class="fa fa-angle-right" aria-hidden="true"></i> List</h4>')
        .listActions(['<cancel-subscription type="cancelSubscription" post="entry"></cancel-subscription>','edit','<download-invoice post="entry"></download-invoice>'])
        .batchActions([])
        .fields([
            nga.field('id', 'number')
                .cssClasses('hidden-xs')
                .label('ID'),
            /*			nga.field('user_id', 'reference')
                                .targetEntity(admin.getEntity('Users'))
                                .targetField(nga.field('username'))
                                .isDetailLink(false)*/
            nga.field('user_id','reference')
                .targetEntity(admin.getEntity('Users'))
                .targetField(nga.field('username'))
                .isDetailLink(false)
                .cssClasses('hidden-xs')
                .label('Sales Agent'),
            nga.field('login_data_id', 'reference')
                .targetEntity(admin.getEntity('LoginData'))
                .targetField(nga.field('username'))
                .isDetailLink(false)
                .label('Username'),
            nga.field('login_data_id', 'reference')
                .targetEntity(admin.getEntity('LoginData'))
                .targetField(
                    nga.field('customer_datum.firstname').map(function (value, entry) {
                        return entry['customer_datum.firstname'] + ' ' + entry['customer_datum.lastname'];
                    })
                )
                .isDetailLink(false)
                .label('Full Name'),
            nga.field('transaction_id', 'string')
                .label('Transaction ID')
                .editable(false),
            nga.field('saledate', 'date')
                .cssClasses('hidden-xs')
                .label('Sale Date'),
            nga.field('combo.name', 'string')
                .label('Products'),
            nga.field('combo_id','reference')
                .targetEntity(admin.getEntity('Combos'))
                .targetField(nga.field('value'))
                .isDetailLink(false)
                .label('Value'),
            nga.field('active', 'boolean')
                .label('Active sale'),
            nga.field('cancelation_date', 'date')
                .cssClasses('hidden-xs')
                .label('Cancelation Date'),
            nga.field('cancelation_user', 'reference')
                .targetEntity(admin.getEntity('Users'))
                .targetField(nga.field('username'))
                .isDetailLink(false)
                .label('Cancelation User'),
            nga.field('cancelation_reason', 'text')
                .cssClasses('hidden-xs')
                .label('Cancelation Reason'),

        ]).filters([
        nga.field('user_username')
            .attributes({ placeholder: 'Client' })
            .label('Client'),
        nga.field('distributorname')
            .attributes({ placeholder: 'Distributor' })
            .label('Distributor'),
        nga.field('startsaledate', 'date')
            .attributes({ placeholder: 'From date' })
            .label('From date'),
        nga.field('endsaledate', 'date')
            .attributes({placeholder: 'To date' })
            .label('To date'),
        nga.field('name', 'reference')
            .targetEntity(admin.getEntity('Combos'))
            .attributes({ placeholder: 'Product' })
            .perPage(-1)
            .targetField(nga.field('name'))
            .label('Product'),
        nga.field('active', 'choice')
            .choices([
                { value: 'active', label: 'Active sales' },
                { value: 'cancelled', label: 'Canceled sales' },
                { value: 'all', label: 'All sales' }
            ])
            .attributes({placeholder: 'Sale active' })
            .label('Sale status'),
    ])
        .exportFields([
            salesreport.listView().fields(),
        ]);

    salesreport.editionView()
        .title('<h4>Transaction <i class="fa fa-angle-right" aria-hidden="true"></i> Edit: {{ entry.values.id }}</h4>')
        .actions(['list'])
        .fields([
            nga.field('user_id','reference')
                .targetEntity(admin.getEntity('Users'))
                .targetField(nga.field('username'))
                .isDetailLink(false)
                .label('Sales Agent'),
            nga.field('login_data_id', 'reference')
                .targetEntity(admin.getEntity('LoginData'))
                .targetField(nga.field('username'))
                .isDetailLink(false)
                .editable(false)
                .label('Username'),
            nga.field('login_data_id', 'reference')
                .targetEntity(admin.getEntity('LoginData'))
                .targetField(
                    nga.field('customer_datum.firstname').map(function (value, entry) {
                        return entry['customer_datum.firstname'] + ' ' + entry['customer_datum.lastname'];
                    })
                )
                .isDetailLink(false)
                .editable(false)
                .label('Full Name'),
            nga.field('transaction_id', 'string')
                .label('Transaction ID')
                .editable(false),
            nga.field('saledate', 'date')
                .cssClasses('hidden-xs')
                .editable(false)
                .label('Sale Date'),
            nga.field('combo_id', 'reference')
                .targetEntity(admin.getEntity('Combos'))
                .attributes({ placeholder: 'Product' })
                .editable(false)
                .targetField(nga.field('name'))
                .label('Product'),
            nga.field('combo_id','reference')
                .targetEntity(admin.getEntity('Combos'))
                .targetField(nga.field('value'))
                .isDetailLink(false)
                .editable(false)
                .label('Value'),
            nga.field('active', 'boolean')
                .editable(false)
                .label('Active sale'),
            nga.field('cancelation_date', 'date')
                .cssClasses('hidden-xs')
                .editable(false)
                .label('Cancelation Date'),
            nga.field('cancelation_user', 'reference')
                .targetEntity(admin.getEntity('Users'))
                .targetField(nga.field('username'))
                .editable(false)
                .isDetailLink(false)
                .label('Cancelation User'),
            nga.field('cancelation_reason', 'text')
                .cssClasses('hidden-xs')
                .editable(false)
                .label('Cancelation Reason'),


            nga.field('template')
                .label('')
                .template(edit_button),

        ]);

    return salesreport;

}