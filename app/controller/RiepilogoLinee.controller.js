sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";

    return Controller.extend("myapp.controller.RiepilogoLinee", {
        ModelLinee: new JSONModel(),
        ModelElencoLinee: new JSONModel(),
        ModelSinotticoLinea: new JSONModel(),
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
            var oLinea = oEvent.getSource().getBindingContext("linee").sPath; 
            var lineaID = this.getView().getModel("linee").getProperty(oLinea).lineaID;
            var oModel = new JSONModel({lineaID: lineaID});
            sap.ui.getCore().setModel(oModel, "LineaCliccata");

            Library.AjaxCallerData("model/elencolinee.json", this.SUCCESSElencoLinee.bind(this));
            sap.ui.getCore().setModel(this.ModelElencoLinee, "elencolinee");

// NEL BACKEND PASSERO' COME PARAMETRO LA VARIABLE OLINEA
            Library.AjaxCallerData("model/sinotticodilinea.json", this.SUCCESSLineaSinottico.bind(this));
            sap.ui.getCore().setModel(this.ModelSinotticoLinea, "sinotticodilinea");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("sinotticoLinea");



        },
        SUCCESSElencoLinee: function (Jdata) {
            this.ModelElencoLinee.setData(Jdata);
        },
        SUCCESSLineaSinottico: function (Jdata) {
            this.ModelSinotticoLinea.setData(Jdata);
        }





    });
});


