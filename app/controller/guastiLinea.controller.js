sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'myapp/controller/Library'
], function (Controller, JSONModel, Library) {
    "use strict";
    return Controller.extend("myapp.controller.guastiLinea", {
        ISLOCAL: Number(sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL),
        linea: "",
        menuJSON: {},
        row_binded: {},
        ModelTurni: sap.ui.getCore().getModel("turni"),
        ModelGuasti: sap.ui.getCore().getModel("guasti"),
        guasti: sap.ui.getCore().getModel("guasti").getData(),
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        data_json: {},
        onInit: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("guastidilinea").attachPatternMatched(this._onObjectMatched, this);
            var that = this;
            this.menuJSON.cause = [];
            var model = new JSONModel();
            if (this.ISLOCAL === 1) {
                Library.AjaxCallerData("model/JSON_FermoTestiNew.json", function (Jdata) {
                    that.SUCCESSCausali.bind(that)(Jdata, model);
                });
            }
            this.getView().setModel(model, "cause");
        },
        _onObjectMatched: function (oEvent) {
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.linea = oEvent.getParameter("arguments").guastiPath;
//            var oModel = new JSONModel();
//            var that = this;
//            if (this.ISLOCAL === 1) {
//                Library.AjaxCallerData("model/guasti_linee.json", function (Jdata) {
//                    that.SUCCESSGuasti.bind(that)(Jdata, oModel);
//                });
//            }
            this.getView().setModel(this.ModelGuasti, "guasti");
//            this.ModelTurni = this.getOwnerComponent().getModel("turni");
//            if (!this.ModelTurni) {
//                Library.SyncAjaxCallerData("model/pianidiconf_new.json", Library.SUCCESSDatiTurni.bind(this));
//                this.getOwnerComponent().setModel(this.ModelTurni, "turni");
//            }
            var oTitle = this.getView().byId("turno");
            this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
        },
        SUCCESSCausali: function (Jdata, model) {
            this.takeAllCause(Jdata);
            model.setData(this.menuJSON);
        },
//        SUCCESSGuasti: function (Jdata, oModel) {
//            //da rimpiazzare con parametrizzazione ajax (o comunque in base a come sarà la transazione)
//            for (var i = 0; i < Jdata.GuastiLinee.length; i++) {
//                if (Jdata.GuastiLinee[i].nome === this.linea) {
//                    this.guasti = Jdata.GuastiLinee[i];
//                    break;
//                }
//            }
//            this.guasti = Library.AddTimeGaps(this.guasti);
//            oModel.setData(this.guasti);
//        },
        takeAllCause: function (bck) {
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    bck[key] = this.takeAllCause(bck[key]);
                }
            }
            if (bck.fermo !== undefined) {
                this.menuJSON.cause.push(bck);
            }
            return bck;
        },
        onReturnToReport: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("Report", {turnoPath: this.turnoPath, pianoPath: this.pianoPath});
        },
//GESTIONE DEL TASTO CHE VIENE PREMUTO -> GENERO IL MENU CON LE VOCI PER LA MODIFICA/GESTIONE DEI GUASTI
        handlePressOpenMenuCausalizzazione: function (oEvent) {
            var oButton = oEvent.getSource();
            var row_id = oEvent.getSource().getParent().getId();
            var split_id = row_id.split("-");
            this.row_binded = this.getView().getModel("guasti").getData().guasti[parseInt(split_id[split_id.length - 1], 10)];
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuCausalizzazione",
                        this
                        );
                this.getView().addDependent(this._menu);
            }
            var eDock = sap.ui.core.Popup.Dock;
            this._menu.open(this._bKeyboard, oButton, eDock.EndTop, eDock.BeginBottom, oButton);
        },
//GESTIONE DEL MENU DI MODIFICA GUASTI
        modificaGuasti: function (oEvent) {
            var oText = oEvent.getParameter("item").getText();
            switch (oText) {
                case "Modifica Causale Fermo":
                    this.creaFinestraModificaCausale(oText);
                    break;
                case "Modifica Inizio/Fine del Fermo":
                    this.creaFinestraModificaTempi(oText);
                    break;
                case "Fraziona Causale di Fermo":
                    this.creaFinestraFrazionamento(oText);
                    break;
                case "Elimina Fermo":
                    this.creaFinestraEliminazione(oText);
                    break;
                case "Inserisci Fermo":
                    this.creaFinestraInserimento(oText);
            }

        },
        onConfermaCambio: function (oEvent) {
            var oText = this.getView().byId("title").getText();
            var obj, doc;
            switch (oText) {
                case "Modifica Causale Fermo":
                    if (Number(this.ISLOCAL) === 1) {
                        this.LOCALModificaCausaleFermo(oEvent);
                    } else {
                        obj = {};
                        obj.caso = "updateCausale";
                        obj.logId = "2089"; //DA SOSTITUIRE CON L'ID DEL FERMO (LO AVRO' NEL JSON E DOVREBBE ESSERE NEL ROW_BINDED
                        obj.batchId = "6"; // COME SOPRA
                        obj.dataFine = "";
                        obj.dataInizio = "";
                        obj.causaleId = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getSelectedKey();
                        doc = Library.createXMLFermo(obj);
                    }
                    break;
                case "Modifica Inizio/Fine del Fermo":
                    if (Number(this.ISLOCAL) === 1) {
                        this.LOCALModificaTempiFermo();
                    } else {
                        obj = {};
                        obj.caso = "updateInizioFine";
                        obj.logId = "2089"; //DA SOSTITUIRE CON L'ID DEL FERMO (LO AVRO' NEL JSON E DOVREBBE ESSERE NEL ROW_BINDED
                        obj.batchId = "6"; // COME SOPRA
                        obj.dataFine = Library.fromStandardToDate(this.piano.data, sap.ui.getCore().byId("Fine").getValue());
                        obj.dataInizio = Library.fromStandardToDate(this.piano.data, sap.ui.getCore().byId("Inizio").getValue());
                        obj.causaleId = "";
                        doc = Library.createXMLFermo(obj);
                    }
                    break;
                case "Fraziona Causale di Fermo":
                    if (Number(this.ISLOCAL) === 1) {
                        this.LOCALFrazionaFermo();
                    } else {
                        obj = {};
                        obj.caso = "divide";
                        obj.logId = "2089"; //DA SOSTITUIRE CON L'ID DEL FERMO (LO AVRO' NEL JSON E DOVREBBE ESSERE NEL ROW_BINDED
                        obj.batchId = "6"; // COME SOPRA
                        obj.dataFine = Library.fromStandardToDate(this.piano.data, sap.ui.getCore().byId("Fine").getValue());
                        obj.dataInizio = Library.fromStandardToDate(this.piano.data, sap.ui.getCore().byId("Inizio").getValue());
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        doc = Library.createXMLFermo(obj);
                    }
                    break;
                case "Elimina Fermo":
                    if (Number(this.ISLOCAL) === 1) {
                        this.LOCALEliminaFermo();
                    } else {
                        obj = {};
                        obj.caso = "delete";
                        obj.logId = "2089"; //DA SOSTITUIRE CON L'ID DEL FERMO (LO AVRO' NEL JSON E DOVREBBE ESSERE NEL ROW_BINDED
                        obj.batchId = "6"; // COME SOPRA
                        obj.dataFine = "";
                        obj.dataInizio = "";
                        obj.causaleId = "";
                        doc = Library.createXMLFermo(obj);
                    }
                    break;
                case "Inserisci Fermo":
                    if (Number(this.ISLOCAL) === 1) {
                        this.LOCALInserisciFermo();
                    } else {
                        obj = {};
                        obj.caso = "delete";
                        obj.logId = "";
                        obj.batchId = "6"; //DA SOSTITUIRE CON L'ID DEL FERMO (LO AVRO' NEL JSON E DOVREBBE ESSERE NEL ROW_BINDED
                        obj.dataFine = Library.fromStandardToDate(this.piano.data, sap.ui.getCore().byId("Fine").getValue());
                        obj.dataInizio = Library.fromStandardToDate(this.piano.data, sap.ui.getCore().byId("Inizio").getValue());
                        obj.causaleId = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        doc = Library.createXMLFermo(obj);
                    }
                    break;
            }
            this.oDialog.destroy();
        },
        onClose: function () {
            var id_dialog = this.oDialog.getId();
            sap.ui.getCore().byId(id_dialog).destroy();
        },
//MODIFICA CAUSALE DIALOG
        creaFinestraModificaCausale: function (text) {
            var oView = this.getView();
            this.oDialog = oView.byId("modificaGuasti");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                oView.addDependent(this.oDialog);
            }
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var topBox = oView.byId("topBox");
            var oVBox1 = topBox.getItems()[0];
            var oVBox2 = topBox.getItems()[1];
            var oText1 = new sap.m.Text({
                text: "Valore Corrente"
            });
            var oText2 = new sap.m.Text({
                text: this.row_binded.causa
            });
            var bottomBox = oView.byId("bottomBox");
            var bBox1 = bottomBox.getItems()[0];
            var bBox2 = bottomBox.getItems()[1];
            var bText1 = new sap.m.Text({
                text: "Nuovo Valore"
            });
            var selectMenu = new sap.m.Select({
                autoAdjustWidth: true,
                id: "selectionMenu"
            });
            var oItemSelectTemplate = new sap.ui.core.Item({
                key: "{cause>id}",
                text: "{cause>fermo}"
            });
            selectMenu.setModel(this.getView().getModel("cause"));
            selectMenu.bindAggregation("items", "cause>/cause", oItemSelectTemplate);
            selectMenu.addStyleClass("myListItemRed");
            bText1.addStyleClass("red");
            topBox.addStyleClass("blackBorder");
            oText2.addStyleClass("size1");
            oVBox1.addItem(oText1);
            oVBox2.addItem(oText2);
            bBox1.addItem(bText1);
            bBox2.addItem(selectMenu);
            this.oDialog.open();
        },
//MODIFICA TEMPI DIALOG
        creaFinestraModificaTempi: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var topBox = oView.byId("topBox");
            var oVBox1 = topBox.getItems()[0];
            var oVBox2 = topBox.getItems()[1];
            var oText1 = new sap.m.Text({
                text: "Valore Corrente"
            });
            oVBox1.addItem(oText1);
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oHBox1 = new sap.m.HBox({
                width: "50%"
            });
            var oHBox2 = new sap.m.HBox({
                width: "50%"
            });
            var oText2 = new sap.m.Text({
                text: "inizio"
            });
            var oText3 = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.Text({
                text: this.row_binded.fine
            });
            var oTextInizio = new sap.m.Text({
                text: this.row_binded.inizio
            });
            oText2.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop");
            oText3.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop");
            oTextInizio.addStyleClass("size1 tempoBox");
            oTextFine.addStyleClass("size1 tempoBox");
            oHBox1.addItem(oText2);
            oHBox1.addItem(oTextInizio);
            oHBox2.addItem(oText3);
            oHBox2.addItem(oTextFine);
            oHBoxTop.addItem(oHBox1);
            oHBoxTop.addItem(oHBox2);
            oVBox2.addItem(oHBoxTop);
            topBox.addStyleClass("blackBorder");
            var bottomBox = oView.byId("bottomBox");
            oVBox1 = bottomBox.getItems()[0];
            oVBox2 = bottomBox.getItems()[1];
            var oText = new sap.m.Text({
                text: "Nuovi Valori"
            });
            oText.addStyleClass("red");
            oVBox1.addItem(oText);
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            oHBox1 = new sap.m.HBox({
                width: "50%"
            });
            oHBox2 = new sap.m.HBox({
                width: "50%"
            });
            oText1 = new sap.m.Text({
                text: "inizio"
            });
            oText2 = new sap.m.Text({
                text: "fine"
            });
            oTextFine = new sap.m.TimePicker({
                value: this.row_binded.fine,
                id: "Fine",
                change: this.onCheckValiditySimple.bind(this)
            });
            oTextInizio = new sap.m.TimePicker({
                value: this.row_binded.inizio,
                id: "Inizio",
                change: this.onCheckValiditySimple.bind(this)
            });
            oText1.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oText2.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox");
            oTextFine.addStyleClass("myRedTempoBox");
            oHBox1.addItem(oText1);
            oHBox1.addItem(oTextInizio);
            oHBox2.addItem(oText2);
            oHBox2.addItem(oTextFine);
            oHBoxBottom.addItem(oHBox1);
            oHBoxBottom.addItem(oHBox2);
            oVBox2.addItem(oHBoxBottom);
            this.oDialog.open();
        },
//CREA FRAZIONAMENTO DIALOG
        creaFinestraFrazionamento: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            //title e top box
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var oButton = oView.byId("confermaModificheButton");
            oButton.setEnabled(false);
            oButton.removeStyleClass("confermaButtonhover");
            var topBox = oView.byId("topBox");
            var oVBox = topBox.getItems()[1];
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oText1 = new sap.m.Text({
                text: "inizio"
            });
            var oTextInizio = new sap.m.Text({
                text: this.row_binded.inizio
            });
            oText1.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop");
            oTextInizio.addStyleClass("size1 tempoBox");
            oHBoxTop.addItem(oText1);
            oHBoxTop.addItem(oTextInizio);
            oVBox.addItem(oHBoxTop);
            topBox.addStyleClass("blackBorder");
            //bottom box
            var bottomBox = oView.byId("bottomBox");
            oVBox = bottomBox.getItems()[1];
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            oText1 = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.Text({
                text: this.row_binded.fine
            });
            oText1.addStyleClass("size1 sapUiMediumMarginEnd sapUiTinyMarginTop");
            oTextFine.addStyleClass("size1 tempoBox");
            oHBoxBottom.addItem(oText1);
            oHBoxBottom.addItem(oTextFine);
            oVBox.addItem(oHBoxBottom);
            //central box
            var centralBox = oView.byId("centralBox");
            oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxCentral = new sap.m.HBox({
                width: "100%"
            });
            oText1 = new sap.m.Text({
                text: "inizio"
            });
            oTextInizio = new sap.m.TimePicker({
                value: this.row_binded.inizio,
                change: this.onCheckValidity.bind(this),
                id: "Inizio"
            });
            oText1.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox");
            oHBoxTop.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxTop.addItem(oText1);
            oHBoxTop.addItem(oTextInizio);
            centralBox.addItem(oHBoxTop);
            oText1 = new sap.m.Text({
                text: "causale"
            });
            var selectMenu = new sap.m.Select({
                autoAdjustWidth: true,
                id: "selectionMenu"
            });
            var oItemSelectTemplate = new sap.ui.core.Item({
                key: "{cause>id}",
                text: "{cause>fermo}"
            });
            selectMenu.setModel(this.getView().getModel("cause"));
            selectMenu.bindAggregation("items", "cause>/cause", oItemSelectTemplate);
            selectMenu.addStyleClass("myListItemRed");
            oText1.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oHBoxCentral.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxCentral.addItem(oText1);
            oHBoxCentral.addItem(selectMenu);
            centralBox.addItem(oHBoxCentral);
            oText1 = new sap.m.Text({
                text: "fine"
            });
            oTextFine = new sap.m.TimePicker({
                value: this.row_binded.fine,
                change: this.onCheckValidity.bind(this),
                id: "Fine"
            });
            oText1.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oTextFine.addStyleClass("myRedTempoBox");
            oHBoxBottom.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxBottom.addItem(oText1);
            oHBoxBottom.addItem(oTextFine);
            centralBox.addStyleClass("blackBorder sapUiSmallMargin");
            centralBox.addItem(oHBoxBottom);
            this.oDialog.open();
        },
//ELIMINAZIONE DIALOG 
        creaFinestraEliminazione: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var centralBox = oView.byId("centralBox");
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxCentral = new sap.m.HBox({
                width: "100%"
            });
            var oText = new sap.m.Text({
                text: "inizio"
            });
            var oTextInizio = new sap.m.TimePicker({
                value: this.row_binded.inizio,
                id: "Inizio",
                enabled: false
            });
            oText.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox noOpacity");
            oHBoxTop.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxTop.addItem(oText);
            oHBoxTop.addItem(oTextInizio);
            centralBox.addItem(oHBoxTop);
            oText = new sap.m.Text({
                text: "causale"
            });
            var Causale = new sap.m.Text({
                id: "Causale",
                text: this.row_binded.causa
            });
            if (this.row_binded.causa === "") {
                Causale.setVisible(false);
            } else {
                Causale.addStyleClass("size1 sapUiSmallMarginEnd sapUiTinyMarginTop red tempoBox");
            }
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oHBoxCentral.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxCentral.addItem(oText);
            oHBoxCentral.addItem(Causale);
            centralBox.addItem(oHBoxCentral);
            oText = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.TimePicker({
                value: this.row_binded.fine,
                id: "Fine",
                enabled: false
            });
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oTextFine.addStyleClass("myRedTempoBox noOpacity");
            oHBoxBottom.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxBottom.addItem(oText);
            oHBoxBottom.addItem(oTextFine);
            centralBox.addItem(oHBoxBottom);
            this.oDialog.open();
        },
// INSERIMENTO DIALOG
        creaFinestraInserimento: function (text) {
            var oView = this.getView();
            this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
            oView.addDependent(this.oDialog);
            var oTitle = oView.byId("title");
            oTitle.setText(text);
            var centralBox = oView.byId("centralBox");
            var oHBoxTop = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxBottom = new sap.m.HBox({
                width: "100%"
            });
            var oHBoxCentral = new sap.m.HBox({
                width: "100%"
            });
            var oText = new sap.m.Text({
                text: "inizio"
            });
            var oTextInizio = new sap.m.TimePicker({
                value: "00:00:00",
                change: this.onCheckValiditySimple.bind(this),
                id: "Inizio"
            });
            oText.addStyleClass("size1 sapUiSmallMarginEnd sapUiSmallMarginTop red");
            oTextInizio.addStyleClass("myRedTempoBox");
            oHBoxTop.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxTop.addItem(oText);
            oHBoxTop.addItem(oTextInizio);
            centralBox.addItem(oHBoxTop);
            oText = new sap.m.Text({
                text: "causale"
            });
            var selectMenu = new sap.m.Select({
                autoAdjustWidth: true,
                id: "selectionMenu"
            });
            var oItemSelectTemplate = new sap.ui.core.Item({
                key: "{cause>id}",
                text: "{cause>fermo}"
            });
            selectMenu.setModel(this.getView().getModel("cause"));
            selectMenu.bindAggregation("items", "cause>/cause", oItemSelectTemplate);
            selectMenu.addStyleClass("myListItemRed");
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oHBoxCentral.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxCentral.addItem(oText);
            oHBoxCentral.addItem(selectMenu);
            centralBox.addItem(oHBoxCentral);
            oText = new sap.m.Text({
                text: "fine"
            });
            var oTextFine = new sap.m.TimePicker({
                value: "00:00:00",
                change: this.onCheckValiditySimple.bind(this),
                id: "Fine"
            });
            oText.addStyleClass("size1 sapUiMediumMarginEnd sapUiSmallMarginTop red");
            oTextFine.addStyleClass("myRedTempoBox");
            oHBoxBottom.addStyleClass("sapUiLargeMarginBegin sapUiSmallMarginBottom");
            oHBoxBottom.addItem(oText);
            oHBoxBottom.addItem(oTextFine);
            centralBox.addStyleClass("sapUiSmallMargin");
            centralBox.addItem(oHBoxBottom);
            this.oDialog.open();
        },
// FUNZIONI USATE            
        onCheckValidity: function () {
            var oView = this.getView();
            var oButton = oView.byId("confermaModificheButton");
            if (sap.ui.getCore().byId("Inizio").getValue() !== "" && sap.ui.getCore().byId("Fine").getValue() !== "") {
                var secondi_inizio_row = this.fromStringToSeconds(this.row_binded.inizio);
                var secondi_fine_row = this.fromStringToSeconds(this.row_binded.fine);
                var secondi_inizio = this.fromStringToSeconds(sap.ui.getCore().byId("Inizio").getValue());
                var secondi_fine = this.fromStringToSeconds(sap.ui.getCore().byId("Fine").getValue());
                var intervallo_inizio = secondi_inizio - secondi_inizio_row;
                var intervallo_fine = secondi_fine_row - secondi_fine;
                if ((intervallo_inizio > 0 && intervallo_fine >= 0 && secondi_inizio < secondi_fine) || (intervallo_inizio >= 0 && intervallo_fine > 0 && secondi_inizio < secondi_fine)) {
                    oButton.setEnabled(true);
                    oButton.addStyleClass("confermaButtonhover");
                } else {
                    oButton.setEnabled(false);
                    oButton.removeStyleClass("confermaButtonhover");
                }
            } else {
                oButton.setEnabled(false);
                oButton.removeStyleClass("confermaButtonhover");
            }
        },
        onCheckValiditySimple: function () {
            var oView = this.getView();
            var oButton = oView.byId("confermaModificheButton");
            if (sap.ui.getCore().byId("Inizio").getValue() !== "" && sap.ui.getCore().byId("Fine").getValue() !== "") {
                var secondi_inizio = this.fromStringToSeconds(sap.ui.getCore().byId("Inizio").getValue());
                var secondi_fine = this.fromStringToSeconds(sap.ui.getCore().byId("Fine").getValue());
                var intervallo = secondi_fine - secondi_inizio;
                if (intervallo > 0) {
                    oButton.setEnabled(true);
                    oButton.addStyleClass("confermaButtonhover");
                } else {
                    oButton.setEnabled(false);
                    oButton.removeStyleClass("confermaButtonhover");
                }
            } else {
                oButton.setEnabled(false);
                oButton.removeStyleClass("confermaButtonhover");
            }
        },
        fromStringToSeconds: function (stringa) {
            var array_stringa = stringa.split(":");
            return  parseInt(array_stringa[0], 10) * 60 * 60 + parseInt(array_stringa[1], 10) * 60 + parseInt(array_stringa[2], 10);
        },
        takeIdByBindedCausa: function (causa) {
            for (var i in this.menuJSON.cause) {
                if (this.menuJSON.cause[i].fermo === causa) {
                    return this.menuJSON.cause[i].id;
                }
            }
            return -1;
        },
// NEL CASO IL MODEL NON CI SIA
        groupTurni: function (data, group0, group1, group2, group3) {
            for (var key in data) {
                if (typeof data[key] === "object") {
                    this.groupTurni(data[key], group0, group1, group2, group3);
                }
            }
            if (data.area) {
                switch (data.area) {
                    case "0":
                        this.data_json[group0].push(data);
                        break;
                    case "1":
                        this.data_json[group1].push(data);
                        break;
                    case "2":
                        this.data_json[group2].push(data);
                        break;
                    case "-1":
                        this.data_json[group3].push(data);
                }
            }
            return;
        },

////////////////////////////////////////////////////////////////////////////////////////////////////////////// FUNZIONI LOCALI 

        LOCALModificaCausaleFermo: function (oEvent) {
            var oModel = new JSONModel();
            var selected_key = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getSelectedKey();
            for (var i in this.guasti.guasti) {
                if (this.isObjectEquivalent(this.guasti.guasti[i], this.row_binded)) {
                    var causa = this.takeCausaById(selected_key);
                    this.guasti.guasti[i].causa = causa;
                    oModel.setData(this.guasti);
                    this.getView().setModel(oModel, "guasti");
                    break;
                }
            }
        },
        LOCALModificaTempiFermo: function () {
            var oModel = new JSONModel();
            var stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
            var stringa_fine = sap.ui.getCore().byId("Fine").getValue();
            if (stringa_inizio !== "" || stringa_fine !== "") {
                if (stringa_inizio === "") {
                    stringa_inizio = this.row_binded.inizio;
                }
                if (stringa_fine === "") {
                    stringa_fine = this.row_binded.fine;
                }
                var secondi_inizio = this.fromStringToSeconds(stringa_inizio);
                var secondi_fine = this.fromStringToSeconds(stringa_fine);
                if (secondi_fine - secondi_inizio > 0) {
                    var stringa_intervallo = Library.MillisecsToStandard(1000 * (secondi_fine - secondi_inizio));
                    for (var i in this.guasti.guasti) {
                        if (this.isObjectEquivalent(this.guasti.guasti[i], this.row_binded)) {
                            this.guasti.guasti[i].inizio = stringa_inizio;
                            this.guasti.guasti[i].fine = stringa_fine;
                            this.guasti.guasti[i].intervallo = stringa_intervallo;
                            oModel.setData(this.guasti);
                            this.getView().setModel(oModel, "guasti");
                            break;
                        }
                    }
                }
            }
        },
        LOCALFrazionaFermo: function () {
            var binded_inizio = this.row_binded.inizio;
            var stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
            var stringa_fine = sap.ui.getCore().byId("Fine").getValue();
            var binded_fine = this.row_binded.fine;
            var binded_causale = this.row_binded.causa;
            var selected_key = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
            var causale = this.takeCausaById(selected_key);
            var i = this.findIndex(this.guasti.guasti, this.row_binded);
            //il terzo parametro mi serve per decidere se settare o no il modello (così da poterlo settare solo alla fine e poter riusare le funzioni anche per azioni successive
            this.removeGuasto(this.guasti, i, false);
            this.addGuasto(this.guasti, binded_inizio, stringa_inizio, binded_causale, false);
            this.addGuasto(this.guasti, stringa_inizio, stringa_fine, causale, false);
            this.addGuasto(this.guasti, stringa_fine, binded_fine, binded_causale, true);
        },
        LOCALEliminaFermo: function () {
            var i = this.findIndex(this.guasti.guasti, this.row_binded);
            this.removeGuasto(this.guasti, i, true);
        },
        LOCALInserisciFermo: function () {
            var stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
            var stringa_fine = sap.ui.getCore().byId("Fine").getValue();
            var selected_key = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
            var causale = this.takeCausaById(selected_key);
            this.addGuasto(this.guasti, stringa_inizio, stringa_fine, causale, true);
        },
        findIndex: function (array, obj) {
            for (var i in array) {
                if (this.isObjectEquivalent(array[i], obj)) {
                    return i;
                }
            }
            return -1;
        },
        isObjectEquivalent: function (obj1, obj2) {
            var aProps = Object.getOwnPropertyNames(obj1);
            var bProps = Object.getOwnPropertyNames(obj1);
            if (aProps.length !== bProps.length) {
                return false;
            }
            for (var key in obj1) {
                if (obj1[key] !== obj2[key]) {
                    return false;
                }
            }
            return true;
        },
        removeGuasto: function (JSONObject, index, flag) {
            var aProps = Object.getOwnPropertyNames(JSONObject);
            var array = JSONObject[aProps[1]];
            array.splice(index, 1);
            if (flag) {
                var oModel = new JSONModel();
                oModel.setData(JSONObject);
                this.getView().setModel(oModel, "guasti");
            }
        },
        addGuasto: function (JSONObject, inizio, fine, causale, flag) {
            var aProps = Object.getOwnPropertyNames(JSONObject);
            var array = JSONObject[aProps[1]];
            var secondi_intervallo = 1000 * (this.fromStringToSeconds(fine) - this.fromStringToSeconds(inizio));
            if (secondi_intervallo !== 0) {
                var obj = {};
                obj.inizio = inizio;
                obj.fine = fine;
                obj.causa = causale;
                obj.intervallo = Library.MillisecsToStandard(secondi_intervallo);
                array.push(obj);
            }
            if (flag) {
                var oModel = new JSONModel();
                oModel.setData(JSONObject);
                this.getView().setModel(oModel, "guasti");
            }
        },
        takeCausaById: function (selected_key) {
            var causa = "";
            for (var i in this.menuJSON.cause) {
                if (this.menuJSON.cause[i].id === selected_key) {
                    causa = this.menuJSON.cause[i].fermo;
                    break;
                }
            }
            return causa;
        }






    });
});

