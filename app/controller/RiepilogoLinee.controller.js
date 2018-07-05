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
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RiepilogoLinee").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (oEvent) {
            var that = this;
            Library.AjaxCallerData("model/linee_riepilogo.json", function (Jdata) {
                that.ModelLinee.setData(Jdata);
                that.LineButtonStyle("PastaCorta");
                that.LineButtonStyle("PastaLunga");
                Jdata = that.BarColorCT(Jdata, "PastaLunga");
                that.ModelLinee.setData(Jdata);
            });
            this.getView().setModel(this.ModelLinee, "linee");
        },
        LineButtonStyle: function (nome_table) {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinee.getData();
            var button;
            var state;
            for (var i = 0; i < data.linee[nome_table].length; i++) {
                button = this.getView().byId(nome_table).getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data.linee[nome_table][i].statolinea.split(".");
                switch (state[0]) {
                    case "Disponibile":
                        button.addStyleClass("LineaDispo");
                        break;
                    case "Nondisponibile":
                        button.addStyleClass("LineaNonDispo");
                        break;
                }
                switch (state[1]) {
                    case "Vuota":
                        button.addStyleClass("LineaVuota");
                        break;
                    case "Attrezzaggio":
                        button.addStyleClass("LineaAttrezzaggio");
                        break;
                    case "Lavorazione":
                        button.addStyleClass("LineaLavorazione");
                        break;
                    case "Fermo":
                        button.addStyleClass("LineaFermo");
                        break;
                    case "Svuotamento":
                        button.addStyleClass("LineaSvuotamento");
                        break;
                }
            }
        },
        BarColorCT: function (data, nome_table) {
            var progressBar;
            if (data.linee[nome_table].length > 0) {
                for (var i = 0; i < data.linee[nome_table].length; i++) {
                    if (Number(data.linee[nome_table][i].avanzamento) >= 100) {
                        data.linee[nome_table][i].avanzamento = 100;
                    } else {
                        data.linee[nome_table][i].avanzamento = Number(data.linee[nome_table][i].avanzamento);
                    }
                    progressBar = this.getView().byId(nome_table).getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0];
                    switch (data.linee[nome_table][i].barColor) {
                        case "yellow":
                            progressBar.setState("Warning");
                            break;
                        case "green":
                            progressBar.setState("Success");
                            break;
                        case "orange":
                            progressBar.setState("Error");
                            break;
                    }
                    if (data.linee[nome_table][i].statolinea === "Disponibile.Fermo") {
                        progressBar.setState("None");
                    }
                }
            }
            return data;
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


