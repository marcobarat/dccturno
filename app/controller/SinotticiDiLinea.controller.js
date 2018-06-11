sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";

    return Controller.extend("myapp.controller.SinotticiDiLinea", {
        ModelLinee: new JSONModel({}),
        onInit: function () {
            this.getView().setModel(sap.ui.getCore().getModel("elencolinee"), "elencolinee");
//            Library.AjaxCallerData("model/sinotticodilinea.json", this.SUCCESSLinee.bind(this));
//            this.getView().setModel(this.ModelLinee, "sinotticiLinea");

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("sinotticoLinea").attachPatternMatched(this._onObjectMatched, this);
        },
        SUCCESSLinee: function (Jdata) {
//            var i;
//            for (i = 0; i < Jdata.linee.PastaLunga.length; i++) {
//                TabContainer.addItem(new sap.m.TabContainerItem({key: Jdata.linee.PastaLunga[i].lineaID, name: Jdata.linee.PastaLunga[i].linea}));
//                this.buildTabElement();
//            }
//            for (i = 0; i < Jdata.linee.PastaCorta.length; i++) {
//                TabContainer.addItem(new sap.m.TabContainerItem({key: Jdata.linee.PastaCorta[i].lineaID, name: Jdata.linee.PastaCorta[i].linea}));
//                this.buildTabElement();
//            }

            this.ModelLinee.setData(Jdata);
            var TabContainer = this.getView().byId("TabContainerSinotticiLinea");
            Library.RemoveClosingButtons.bind(this)("TabContainerSinotticiLinea");
            this.selectItem(TabContainer);

        },
        selectItem: function (TabContainer) {
            var i;
            var LineaCliccataView = this.getOwnerComponent()._oViews._oViews["myapp.view.RiepilogoLinee"];
            if (LineaCliccataView) {
                var LineaCliccataModel = LineaCliccataView.getModel("LineaCliccata");
                var Linea = LineaCliccataModel.getData().lineaPath;
                for (i = 0; i < TabContainer.getItems().length; i++) {
                    if (TabContainer.getItems()[i].getName() === Linea) {
                        break;
                    }
                }
            }
            TabContainer.setSelectedItem(TabContainer.getItems()[i]);

        },
        _onObjectMatched: function (oEvent) {
            var oModel = sap.ui.getCore().getModel("elencolinee");
            var TabContainer = this.getView().byId("TabContainerSinotticiLinea");
            var Table = TabContainer.getItems()[0].getContent()git 
//            if (TabContainer.getItems().length > 0) {
//                this.selectItem(this.getView().byId("TabContainerSinotticiLinea"));
//            }
        },
        GoToHome: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        }

    });
});

