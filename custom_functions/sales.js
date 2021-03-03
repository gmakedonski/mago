var path = require('path'),
    sequelize_t = require(path.resolve('./config/lib/sequelize')),
    db = require(path.resolve('./config/lib/sequelize')).models,
    dateFormat = require('dateformat'),
    moment = require('moment'),
    response = require(path.resolve("./config/responses.js")),
    eventSystem = require(path.resolve("./config/lib/event_system.js")),
    winston = require(path.resolve('./config/lib/winston'));
const { Op } = require('sequelize');

function add_subscription(req, res, login_id, combo_id, username){
    db.combo.findAll({
        attributes: ['id', 'duration'],where: {id: combo_id},
        include:[{
            model: db.combo_packages, required: true, attributes: ['package_id'], include: [{
                model: db.package, required: true, attributes: ['id'], include: [{
                    model: db.subscription, required: false, attributes: ['start_date', 'end_date'], where: {login_id: login_id}
                }]
            }]
        }]
    }).then(function(current_subscription){
        if(current_subscription.length < 1){
            const clear_response = new response.APPLICATION_RESPONSE(req.body.language, 200, 1, 'OK_DESCRIPTION', 'OK_DATA');
            clear_response.extra_data = "This product is empty";
            res.send(clear_response);
        }
        else{
            for(let i = 0; i < current_subscription.length; i++){
                let startdate, enddate;
                if(current_subscription[0].combo_packages[0].package.subscriptions[0]){
                    startdate = current_subscription[0].combo_packages[0].package.subscriptions[0].start_date;
                    enddate = moment(current_subscription[0].combo_packages[0].package.subscriptions[0].end_date, 'YYYY-MM-DD hh:mm:ss').add(current_subscription[0].duration, 'day');
                }
                else{
                    startdate = dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss');
                    enddate = dateFormat(Date.now() + current_subscription[0].duration*86400000, 'yyyy-mm-dd HH:MM:ss');
                }
                db.subscription.upsert({
                    login_id:            login_id,
                    package_id:          current_subscription[0].combo_packages[0].package_id,
                    customer_username:   username,
                    user_username:       '',
                    start_date:          startdate,
                    end_date:            enddate,
                    company_id:          current_subscription.company_id
                }).then(function(result){
                    db.salesreport.create({
                        user_id:            1,
                        combo_id:           combo_id,
                        login_data_id:      login_id,
                        user_username:      username,
                        distributorname:    '',
                        saledate:           dateFormat(Date.now(), 'yyyy-mm-dd HH:MM:ss'),
                        company_id:         current_subscription.company_id,
                        duration:           db.combo.duration,
                        value:              db.combo.value
                    }).then(function(result){
                        const clear_response = new response.APPLICATION_RESPONSE(req.body.language, 200, 1, 'OK_DESCRIPTION', 'OK_DATA');
                        res.send(clear_response);
                    }).catch(function(error){
                        winston.error("Error at creating sale report, error: ",error);
                    });
                    return null;
                }).catch(function(error){
                    winston.error("Error at upserting subscription, error: ",error);
                });
                return null;
            }
        }
    }).catch(function(error){
        winston.error("Error finding combo, error: ",error);
    });
}

//add subscription to user
exports.add_subscription_transaction = function(req,res,sale_or_refund,transaction_id,start_date,end_date) {

    // if product_id exists in param list search combo by product_id, else search by combo id
    const company_id = req.token.company_id || 1;
    const combo_where = {company_id: company_id, isavailable: true}; //query parameter
    if(req.body.product_id) {
        combo_where.product_id = req.body.product_id; //if product id is coming
    }
    else if(req.body.combo_id) {
        combo_where.id = req.body.combo_id //if combo id is coming
    }
    else if(req.body.product_name){
        combo_where.name = req.body.product_name //if product name is coming
    }
    else {
        return {status: false, message: 'Product identification parameters missing'};
    }

    let transactions_array = [];

    if(!sale_or_refund) sale_or_refund = 1;
    if(!transaction_id) transaction_id = "mago-" + Date.now();
    if(!start_date) start_date = Date.now(); //
    if(!end_date) end_date = false; //

    // Loading Combo with All its packages
    return db.combo.findOne({
        where: combo_where, include: [{model:db.combo_packages,include:[db.package]}]
    }).then(function(combo) {
        if (!combo)return {status: false, message: 'Product not found'}; //no combo found on database
        else {
            // Load Customer by LoginID
            return db.login_data.findOne({
                where: {
                    company_id: company_id,
                    [Op.or]: {
                        username: req.body.username ? req.body.username : null,
                        id: req.body.login_data_id ? req.body.login_data_id : null
                    }
                }, include: [{model: db.customer_data}, {model: db.subscription}]
            }).then(function (loginData) {
                if (!loginData) return {status: false, message: 'Login data not found during subscription transaction'}; //no username found

                return sequelize_t.sequelize.transaction(function (t) {
                        const startDate = new Date(start_date);

                        combo.combo_packages.forEach(function (item, i, arr) {
                            let salesreportdata = {};
                            const runningSub = hasPackage(item.package_id, loginData.subscriptions);

                            const sub = {
                                login_id: loginData.id,
                                package_id: item.package_id,
                                company_id: req.token.company_id,
                                customer_username: loginData.username,
                                user_username: req.token.username //live
                            };

                            if (!runningSub) {
                                sub.start_date = startDate;
                                if(end_date) {
                                    sub.end_date = end_date;
                                }
                                else {
                                    sub.end_date = addDays(sub.start_date, combo.duration * sale_or_refund);
                                }
                                transactions_array.push(
                                    db.subscription.create(sub, {transaction: t}) //add insert to transaction array
                                )
                            } else {

                                if(end_date) {  //if explicit end date
                                    runningSub.end_date = end_date;
                                }
                                else {
                                    if (runningSub.end_date.getTime() > startDate.getTime()) {
                                        runningSub.end_date = addDays(runningSub.end_date, combo.duration * sale_or_refund);
                                    } else {
                                        runningSub.start_date = startDate;
                                        runningSub.end_date = addDays(startDate, combo.duration * sale_or_refund);
                                    }
                                }

                                transactions_array.push(    //add update to transaction array
                                    db.subscription.update(runningSub.dataValues, {
                                        where: {id: runningSub.id},
                                        transaction: t
                                    })
                                );
                            }
                        });//end package loop


                         salesreportdata = {
                            transaction_id: transaction_id,
                            user_id : req.token.id,
                            on_behalf_id: req.body.on_behalf_id,
                            distributorname: req.token.username,
                            //combo_id: req.body.product_id,
                            combo_id: combo.id,
                            login_data_id: loginData.id,
                            user_username: loginData.id,
                            saledate: Date.now(),
                            active:sale_or_refund,
                            company_id: req.token.company_id,
                            value: combo.value,
                            duration:combo.duration
                        };

                        if(sale_or_refund == 1) {
                             transactions_array.push(
                                 db.salesreport.create(salesreportdata, {transaction: t}) //add insert to transaction array
                             );
                         }
                        else {
                            salesreportdata.active = 0;
                            salesreportdata.cancelation_date = Date.now();
                            salesreportdata.cancelation_user = req.token.id;
                            salesreportdata.cancelation_reason = "api request";

                            transactions_array.push(
                                 db.salesreport.update(salesreportdata,
                                     {where: {transaction_id: transaction_id}
                                    , transaction: t}) //add insert to transaction array
                            );
                         }

                    return Promise.all(transactions_array).catch(function (err) {
                        winston.error("Error executing subscription transaction, error: ", err);
                        return {status: false, message: 'Error executing subscription transaction'};
                    });

                }).then(function (result) {
  /*                  var response = {};
                    response = { transaction_id:result[result.length-1].dataValues.transaction_id }*/
                   // response = {transaction_id: transaction_id}
                    let eventType;
                    var customer_result = result[result.length-1]


                    var customer_data = loginData.dataValues;
                    delete customer_data.subscriptions;

                    let all_data = {...customer_data, ...customer_data.customer_datum.dataValues}

                    delete all_data.customer_datum;


                    let subsr_created_data = {...combo.dataValues, ...customer_result.dataValues, ...all_data}
                    let subscr_canceled_date = {...salesreportdata, ...all_data, ...combo.dataValues}

                    if(sale_or_refund == 1)
                    { eventType = eventSystem.EventType.subscription_created;
                        eventSystem.emit(req.token.company_id, eventType, subsr_created_data)
                    }
                     else
                    { eventType = eventSystem.EventType.subscription_canceled;
                        eventSystem.emit(req.token.company_id, eventType, subscr_canceled_date)
                    };

                    return {
                        status: true,
                        transaction_id: transaction_id,
                        message: 'subscription transaction executed correctly'
                    };
                }).catch(function (err) {
                    winston.error('Error executing subscription transaction: ', err);
                    return {status: false, message: 'Error executing subscription transaction'};
                })
            });
        } //end if combo found
    });//end combo search

    function hasPackage(package_id, subscription) {
        for (let i = 0; i < subscription.length; i++)
            if (subscription[i].package_id == package_id)
                return subscription[i];
    }

    function addDays(startdate, duration) {
        let date = new Date(startdate);
        date.setDate(date.getDate() + duration);
        return date;
    }
};

//saves movie in list of movies bought by this client
exports.buy_movie = function(req, res, username, vod_id, transaction_id) {

    let movie_purchase_data = []; //the records saved will be stored here
    //const company_id = req.body.company_id;
    const company_id = req.get('company_id') || 1;
    // search for the combo for transactional vod. if available, proceed
    return db.combo.findOne({
        attributes: ['id', 'duration', 'product_id'],
        where: {product_id: 'transactional_vod', isavailable: true, company_id: company_id}
        // where: { isavailable: true, company_id: company_id}
    }).then(function(t_vod_combo) {

        if(typeof t_vod_combo.duration !== "number"){
            return {status: false, message:'buying movie failed. transactional vod not available', sale_data: []}; //the feature of transactional vod is not active
        }
        else{
            // find the id of the client. if successful, proceed saving the sale records
            return db.login_data.findOne({
                attributes: ['id'],
                where: {username: username, company_id: company_id}
            }).then(function (client) {
                if (!client) return {status: false, message: 'unable to find this client', sale_data: []}; //client not found

                return sequelize_t.sequelize.transaction(function (t) {
                    const t_vod_sales_data = {
                        vod_id: vod_id,
                        login_data_id: client.id,
                        start_time: Date.now(),
                        end_time: moment().add(t_vod_combo.duration, 'day'),
                        transaction_id: transaction_id,
                        company_id: company_id
                    };
                    const salesreport_data = {
                        transaction_id: transaction_id,
                        user_id: 1,
                        combo_id: t_vod_combo.id,
                        login_data_id: client.id,
                        user_username: username,
                        distributorname: '',
                        saledate: Date.now(),
                        company_id: company_id
                    };
                    movie_purchase_data.push(db.t_vod_sales.create(t_vod_sales_data, {transaction: t})); //insert subscription data in the final response
                    movie_purchase_data.push(db.salesreport.create(salesreport_data, {transaction: t})); //insert sale data in the final response

                    return Promise.all(movie_purchase_data, {transaction:t}); //execute transaction, return promise
                }).then(function (result) {
                    return {status: true, message:'subscription transaction executed correctly', sale_data: movie_purchase_data, };
                }).catch(function (error) {
                    winston.error("Buying this movie failed with error ", error);
                    return {status: false, message:'error executing transactional vod operation', sale_data: [] };
                });
            });
        }
    });
};

exports.add_subscription = add_subscription;
