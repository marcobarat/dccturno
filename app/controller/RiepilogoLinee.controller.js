sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";

    return Controller.extend("myapp.controller.RiepilogoLinee", {
        ModelLinee: new JSONModel(),
        onInit: function () {
            var that = this;
            Library.AjaxCallerData("model/linee_riepilogo.json", function (Jdata) {
                that.ModelLinee.setData(Jdata);
            });
            this.getView().setModel(this.ModelLinee, "linee");
        },
        GoToHome: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
        GoToSinotticoLinea: function (oEvent) {
            var oLinea = oEvent.getSource().getText();
            var oModel = new JSONModel({lineaPath: oLinea});
            this.getView().setModel(oModel, "LineaCliccata");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("sinotticoLinea");

        }





    });
});


