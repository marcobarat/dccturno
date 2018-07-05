sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (jQuery, Controller, JSONModel, Library) {
    "use strict";

    var MainController = Controller.extend("myapp.controller.Main", {

        ISLOCALModel: new JSONModel({}),
        ModelReparti: new JSONModel({}),
        ISLOCAL: null,

        onInit: function () {
            this.ISLOCAL = Number(jQuery.sap.getUriParameters().get("ISLOCAL"));
            this.ISLOCALModel.setData({"ISLOCAL": this.ISLOCAL});
            sap.ui.getCore().setModel(this.ISLOCALModel, "ISLOCAL");
        },
        onToPianiPage: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_Reparti.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSReparti.bind(this));
        },
        SUCCESSReparti: function (Jdata) {
            this.ModelReparti.setData(Jdata);
            sap.ui.getCore().setModel(this.ModelReparti, "reparti");
            this.getOwnerComponent().getRouter().navTo("piani");
        },
        onSinotticiPage: function () {
            this.getOwnerComponent().getRouter().navTo("RiepilogoLinee");
        }
    });
    return MainController;
});