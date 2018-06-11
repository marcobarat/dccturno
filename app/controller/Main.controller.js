sap.ui.define([
    'jquery.sap.global',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (jQuery, Controller, JSONModel) {
    "use strict";

    var MainController = Controller.extend("myapp.controller.Main", {

        ISLOCALModel: new JSONModel({}),

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
            this.getOwnerComponent().getRouter().navTo("piani");
        },
        onSinotticiPage: function(){
           this.getOwnerComponent().getRouter().navTo("RiepilogoLinee"); 
        }
    });
    return MainController;
});