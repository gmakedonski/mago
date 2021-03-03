import edit_button from '../edit_button.html';
import modalImage from "../../templates/modalTemplate.html";
import filter_genre_btn from "../filter_genre_btn.html";

export default function (nga, admin) {
    var Webhooks = admin.getEntity('Webhooks');
    Webhooks
        .listView()
        .listActions(['<ma-edit-button entry="entry" entity="entity" label="Add Event" size="xs">', 'delete'])
        .title(
            '<h4>Webhooks <i class="fa fa-angle-right" aria-hidden="true"></i> List </h4>'
        )
        .batchActions([])
        .actions(['create'])
        .fields([
            nga.field('url', 'string').label('url'),
            nga
                .field('events', 'text')
                .isDetailLink(false)
                .label('Event Type'),
        ])
    //.listActions(['edit', 'delete']);

    Webhooks.creationView()
        .title('<h4>Webhooks <i class="fa fa-angle-right" aria-hidden="true"></i> Create: Webhooks</h4>')
        .fields([
            nga.field('url', 'string')
                .validation({required: true})
                .label('Recipient URL'),
            nga.field('events', 'choice')
                .choices([
                    {value: 'customer_created', label: 'customer_created'},
                    {value: 'customer_updated', label: 'customer_updated'},
                    {value: 'subscription_created', label: 'subscription_created'},
                    {value: 'subscription_canceled', label: 'subscription_canceled'}
                ])
                .attributes({placeholder: 'Choose from dropdown list'})
                .validation({validator: function(value) {
                        if(value === null || value === ''){
                            throw new Error('Please Select Event Type');
                        }
                    }
                })
                .label('Event Type'),
            nga.field('template')
                .label('')
                .template(edit_button)
        ])

    Webhooks.editionView()
        .actions(['list'])
        .title('<h4>Webhooks <i class="fa fa-angle-right" aria-hidden="true"></i> Add Event: {{ entry.values.description }}</h4>')
        .onSubmitSuccess(['progression', 'notification', '$state', 'entry', 'entity', function(progression, notification, $state, entry, entity) {
            progression.done(); // stop the progress bar
            notification.log(`Element successfully edited.`, { addnCls: 'humane-flatty-success' }); // add a notification
            // redirect to the list view
            $state.go($state.current, {}, {reload : true}); // cancel the default action (redirect to the edition view)
            return false;
        }])
        .fields([
            //Webhooks.creationView().fields()
            nga.field('url', 'string')
                .validation({required: true})
                .label('Recipient URL'),
            nga.field('events', 'choice')
                .choices([
                    {value: 'customer_created', label: 'customer_created'},
                    {value: 'customer_updated', label: 'customer_updated'},
                    {value: 'subscription_created', label: 'subscription_created'},
                    {value: 'subscription_canceled', label: 'subscription_canceled'}
                ])
                .attributes({placeholder: 'Choose from dropdown list'})
                .validation({validator: function(value) {
                        if(value === null || value === ''){
                            throw new Error('Please Select Event Type');
                        }
                    }
                })
                .label('Event Type'),
            nga.field('template')
                .label('')
                .template(edit_button)
        ]);


    Webhooks.deletionView()
        .title('<h4>Webhooks <i class="fa fa-angle-right" aria-hidden="true"></i> Remove <span style ="color:red;"> {{ entry.values.id }}')
        .actions(['<ma-back-button entry="entry" entity="entity"></ma-back-button>'])
    return Webhooks;

}