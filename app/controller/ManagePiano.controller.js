sap.ui.define([
    'jquery.sap.global',
    './Formatter',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Formatter, Controller, JSONModel) {
    "use strict";

    var ManagePiano = Controller.extend("myapp.controller.ManagePiano", {

        onInit: function () {

            var params = jQuery.sap.getUriParameters(window.location.href);
            // set explored app's demo model on this sample
            var oModel = new JSONModel("./model/linee.json");
            var oModel2 = new JSONModel("./model/products.json");
            var oModel3 = new JSONModel("./model/operators.json");

            this.getView().setModel(oModel,'linea');
            this.getView().setModel(oModel,'operatore');
            //this.getView().setModel(oModel2,"prodotto");

        },

        onAfterRendering: function () {


        },

        onToTmpPage: function (event) {

            this.getOwnerComponent().getRouter().navTo("tmp");

        },
        managePiano: function (evt) {
            alert("miao anche a te");
        }

    });

    return ManagePiano;

});