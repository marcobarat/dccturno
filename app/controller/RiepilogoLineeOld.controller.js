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
        STOP: null,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        BusyDialog: new sap.m.BusyDialog(),
        CHECKFIRSTTIME: 0,
//  FUNZIONI D'INIZIALIZZAZIONE        
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RiepilogoLinee").attachPatternMatched(this.URLChangeCheck, this);
            this.getView().addEventDelegate({
                onAfterShow: jQuery.proxy(function (evt) {
                    this.BusyDialog.open();
                    this.loadObject();
                }, this)
            });
        },
        loadObject: function () {
            var that = this;
            $('object')[0].contentDocument.addEventListener("DOMContentLoaded", function () {
                if (that.CHECKFIRSTTIME === 0) {
                    that.PositionFunction();
                } else {
                    that.BusyDialog.close();
                }
            });
        },
        URLChangeCheck: function () {
            this.STOP = 0;
            this.ModelLinee = sap.ui.getCore().getModel("linee");
            this.getView().setModel(this.ModelLinee, "linee");
            this.LineButtonStyle();
            this.BarColorCT(this.ModelLinee.getData());
            this.checkCells();
            var oButtons = this.getView().byId("buttonsPanelRiepilogo").getContent();
            for (var i=0; i<oButtons.length; i++){
                if (i%2 === 0){
                    oButtons[i].addStyleClass("marginPanel");
                }
            }
            this.RefreshFunction(10000);
        },
//  FUNZIONI DI REFRESH
        RefreshFunction: function (msec) {
            this.TIMER = setTimeout(this.RefreshCall.bind(this), msec);
        },
        RefreshCall: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/linee_riepilogo1.json";
            } else {

            }
            Library.SyncAjaxCallerData(link, this.RefreshModelLinee.bind(this));
        },
        RefreshModelLinee: function (Jdata) {
            if (this.STOP === 0) {
                this.ModelLinee.setData(Jdata);
                this.ModelLinee.refresh(true);
                this.getView().setModel(this.ModelLinee, "linee");
                this.LineButtonStyle();
                this.BarColorCT(this.ModelLinee.getData());
                this.checkCells();
                this.RefreshFunction(10000);
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> FUNZIONI CHIAMATE AL CLICK <<<<<<<<
//        
//        ************************ INTESTAZIONE ************************
//              
        GoToHome: function () {
            this.STOP = 1;
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("main", true);
        },
//        ************************ BOTTONE DI LINEA ************************        
        GoToSinotticoLinea: function (oEvent) {
            this.STOP = 1;
            var oLinea = oEvent.getSource().getBindingContext("linee").sPath;
            var lineaID = this.getView().getModel("linee").getProperty(oLinea).lineaID;
            var oModel = new JSONModel({lineaID: lineaID});
            sap.ui.getCore().setModel(oModel, "LineaCliccata");
            Library.AjaxCallerData("model/elencolinee.json", this.SUCCESSElencoLinee.bind(this));
            sap.ui.getCore().setModel(this.ModelElencoLinee, "elencolinee");
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
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> GESTIONE STILE <<<<<<<<
//  
//        ************************ GESTIONE STILE PULSANTE DI LINEA ************************    
        LineButtonStyle: function () {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinee.getData();
            var button;
            var state;
            for (var i = 0; i < data.linee.length; i++) {
                button = this.getView().byId("linee").getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data.linee[i].statolinea.split(".");
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
//        ************************ GESTIONE STILE PROGRESS INDICATOR ************************     
        BarColorCT: function (data) {
            var progressBar;
            if (data.linee.length > 0) {
                for (var i = 0; i < data.linee.length; i++) {
                    if (Number(data.linee[i].avanzamento) >= 100) {
                        data.linee[i].avanzamento = 100;
                    } else {
                        data.linee[i].avanzamento = Number(data.linee[i].avanzamento);
                    }
                    progressBar = this.getView().byId("linee").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0];
                    switch (data.linee[i].barColor) {
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
                    if (data.linee[i].statolinea === "Disponibile.Fermo") {
                        progressBar.setState("None");
                    }
                }
            }
            return data;
        },
        checkCells: function(){
          var oItems = this.getView().byId("linee").getItems();
          for (var i=0; i<oItems.length; i++){
              var cellText = oItems[i].getCells()[0].getItems()[1].getItems()[3];
              var cellBugged = oItems[i].getCells()[0].getItems()[1].getItems()[2];
              if (cellBugged.getHeight() !== cellText.getHeight()){
                  cellBugged.setHeight(cellText.getHeight());
              }
          }
        },
// ***********************GESTIONE DELLA POSIZIONE DELLE LINEE************************************
        PositionFunction: function () {
            var items = this.getView().byId("linee").getItems();
            for (var i = 0; i < items.length; i++) {
                var item_binded = this.getView().getModel("linee").getProperty(items[i].getBindingContext("linee").sPath);
                var id = item_binded.lineaID;
                var coordinates = $('object')[0].contentDocument.getElementById(id).getBoundingClientRect();
                var elem_coordinates = $('tr')[i + 1].getBoundingClientRect();
                var offsetTop = $('object')[0].offsetTop;
                var offsetLeft = $('object')[0].offsetLeft;
                $('tr')[i + 1].style.transform = 'translate(' + (coordinates.left - elem_coordinates.left + offsetLeft - 28) + 'px,' + (coordinates.top + offsetTop - elem_coordinates.top - elem_coordinates.height / 2) + 'px)';
                // il numero 28 sta effettivamente per il padding opaco di ogni elemento della tabella, ossia 1 rem + 0.75 rem -> 28px 
            }
            this.getView().byId("linee").removeStyleClass("invisible");
            this.BusyDialog.close();
            this.CHECKFIRSTTIME = 1;
        },
// *********************** FUNZIONE PER RINTRACCIARE LA LINEA DESIDERATA **********************
        FocusOnElement: function (event) {
            var oButtonLinea = event.getSource().getText();
            var buttons = $("span:contains(" + oButtonLinea + ")");
            var topPos = buttons[0].getBoundingClientRect().y;
            var topViewPos = this.getView().byId("RiepilogoLineePage")._oScroller.getScrollTop();
            this.getView().byId("RiepilogoLineePage").scrollTo(topPos + topViewPos - 200);
            $("span:contains(" + oButtonLinea + ")")[0].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.backgroundColor = '#FFD300';
            $("span:contains(" + oButtonLinea + ")")[0].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.transition = 'background-color 1s';
            setTimeout(function () {
                $("span:contains("+ oButtonLinea +")")[0].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }, 1000);
        }

    });
});


