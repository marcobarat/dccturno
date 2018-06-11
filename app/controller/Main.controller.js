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
        
        onInit: function () {
//            this.getSplitAppObj().toDetail(this.createId("Home"));
            this.ISLOCALModel.setData({"ISLOCAL": Number(jQuery.sap.getUriParameters().get("ISLOCAL"))});
            sap.ui.getCore().setModel(this.ISLOCALModel, "ISLOCAL");
        },
        getSplitAppObj: function () {
            var result = this.byId("SplitAppDemo");
            if (!result) {
                jQuery.sap.log.info("SplitApp object can't be found");
            }
            return result;
        },
        onToPianiPage: function () {
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllReparti&Content-Type=text/json&OutputParameter=JSON";
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