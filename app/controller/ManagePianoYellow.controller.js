sap.ui.define([
    'sap/m/MessageToast',
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/controller/Library',
    'myapp/model/TimeFormatter',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (MessageToast, Controller, JSONModel, History, Library, TimeFormatter, Filter, FilterOperator) {
    "use strict";
    var ManagePianoYellow = Controller.extend("myapp.controller.ManagePianoYellow", {

//        VARIABILI GLOBALI
        checkSingoloCausa: null,
        checkTotaleCausa: null,
        ModelGuastiLinea: null,
        ModelCausali: new JSONModel({}),
        StabilimentoID: null,
        pdcID: null,
        repartoID: null,
        linea_id: null,
        confezione: null,
        grammatura: null,
        row: null,
        linea: null,
        pezzi_cartone: 24, //ARRIVA DA BACKEND 
        tempo_ciclo: 4, //ARRIVA DA BACKEND
        TimeFormatter: TimeFormatter,
        ISLOCAL: sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL,
        data_json: {},
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        ModelMenu: new JSONModel({}),
        ModelLinea: null,
        ModelOperatori: new JSONModel({}),
        ModelParametri: new JSONModel({}),
        ModelSKU: new JSONModel({}),
        ModelTurni: null,
        ModelSKUstd: new JSONModel({}),
        ModelCause: new JSONModel({}),
        prova: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        oDialog: null,
        STOP: 0,
        oButton: null,
        TTBackup: new JSONModel({}),

//        FUNZIONI D'INIZIALIZZAZIONE
        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoYellow").attachPatternMatched(this.URLChangeCheck, this);
        },
        URLChangeCheck: function (event) {
            this.STOP = 0;
            this.StabilimentoID = sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID;
            this.pdcID = sap.ui.getCore().getModel("ParametriPiano").getData().pdc;
            this.repartoID = sap.ui.getCore().getModel("ParametriPiano").getData().reparto;
            this.ModelLinea = sap.ui.getCore().getModel("linee");
            this.ModelTurni = sap.ui.getCore().getModel("turni");
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("model/operators.json", this.LOCALSUCCESSDatiOperatore.bind(this));
                this.getView().setModel(this.ModelOperatori, 'operatore');
                Library.AjaxCallerData("model/SKU_standard.json", this.LOCALSUCCESSSKUstd.bind(this));
                this.getView().setModel(this.ModelSKUstd, 'SKUstd');
                Library.AjaxCallerData("model/SKU_backend.json", this.SUCCESSSKU.bind(this));
                this.getView().setModel(this.ModelSKU, 'SKU');
            }
            if (typeof event !== "undefined") {
                this.turnoPath = event.getParameter("arguments").turnoPath;
                this.pianoPath = event.getParameter("arguments").pianoPath;
                this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            }
            var oTitle = this.getView().byId("Title");
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            this.getView().setModel(this.ModelLinea, 'linea');
            var oModel = new JSONModel({inizio: this.piano.turno.split("-")[0].trim(), fine: this.piano.turno.split("-")[1].trim()});
            this.getView().setModel(oModel, "orarioturno");
            this.RefreshFunction(100, "0");
        },
        SUCCESSSKU: function (Jdata) {
            var bck = Jdata.SKUattuale;
            var std = Jdata.SKUstandard;
            bck = Library.RecursiveJSONComparison(std, bck, "attributi");
            bck = Library.RecursiveParentExpansion(bck);
            this.ModelSKU.setData(bck);
            this.getView().setModel(this.ModelSKU, "SKU");
            setTimeout(this.ShowRelevant.bind(this), 50, null, "SKU_TT");
        },
//        FUNZIONI DI REFRESH
        RefreshFunction: function (msec, IsRidotta) {
            this.Counter++;
            if (typeof IsRidotta === "undefined") {
                IsRidotta = "1";
                if ((this.Counter % 6) === 0) {
                    IsRidotta = "0";
                }
            }
            setTimeout(this.RefreshCall.bind(this), msec, IsRidotta);
        },
        RefreshCall: function (IsRidotta) {
            if (typeof IsRidotta === "undefined") {
                IsRidotta = "0";
            }
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=" + IsRidotta + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.RefreshDataSet.bind(this));
        },
        RefreshDataSet: function (Jdata) {
            if (this.ISLOCAL !== 1) {
                if (this.STOP === 0) {
                    var temp = JSON.parse(JSON.stringify(this.ModelLinea.getData()));
                    if (Jdata.isRidotta === "0") {
                        this.ModelLinea.getData().linee = this.ModelFullUpdate(Jdata.linee, temp.linee);
                    } else {
                        this.ModelLinea.getData().linee = this.ModelPartialUpdate(Jdata.linee, temp.linee, ["batchlist", "operatori", "lastbatch"]);
                    }
                    this.ModelLinea.setData(this.ModelLinea.getData());
                    this.getView().setModel(this.ModelLinea, "linea");
                    sap.ui.getCore().setModel(this.ModelLinea, "linee");
                    this.LineButtonStyle();
                    this.RefreshFunction(10000);
                }
            }
        },
        ModelFullUpdate: function (newData, oldData) {
            for (var i = 0; i < newData.length; i++) {
                for (var key in newData[i]) {
                    if (key === "batchlist") {
                        for (var j = 0; j < newData[i][key].length; j++) {
                            if (typeof oldData[i][key][j].modifyBatch === "undefined" || oldData[i][key][j].modifyBatch !== 1) {
                                oldData[i][key][j] = newData[i][key][j];
                            }
                        }
                    } else {
                        oldData[i][key] = newData[i][key];
                    }
                }
            }
            return oldData;
        },
        ModelPartialUpdate: function (newData, oldData, exceptions) {
            for (var i = 0; i < newData.length; i++) {
                for (var key in newData[i]) {
                    if (exceptions.indexOf(key) === -1) {
                        oldData[i][key] = newData[i][key];
                    }
                }
            }
            return oldData;
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//        >>>>>>>> FUNZIONI CHIAMATE AL CLICK <<<<<<<<
//        
//        ************************ INTESTAZIONE ************************
//        
//         -> PULSANTE D'USCITA
        BackToPiani: function () {
            var AddButton;
            for (var i = 0; i < this.ModelLinea.getData().linee.length; i++) {
                AddButton = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                AddButton.setEnabled(true);
            }
            this.DeleteUncompleteBatches();
            this.STOP = 1;
            this.getView().byId("ManageIconTabBar").setSelectedKey("1");
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("overview", true);
            }
        },
//         -> CAMBIO REPARTO
        ChangeReparto: function (event) {
            var link;
            var that = this;
            this.repartoID = event.getParameters().key;
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + this.pdcID + "&RepartoID=" + this.repartoID + "&StabilimentoID=" + this.StabilimentoID + "&IsRidotta=0&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, function (Jdata) {
                    that.ModelLinea.setData(Jdata);
                });
                this.LineButtonStyle();
                this.getView().setModel(this.ModelLinea, "linea");
            }
        },
//        
//        
//        ************************ TABELLA 20% DI SINISTRA ************************
//        
//         -> PULSANTE DELLA LINEA
        ShowStatoLinea: function () {
            var oView = this.getView();
            this.oDialog = oView.byId("statoLinea");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.statoLinea", this);
                oView.addDependent(this.oDialog);
            }
            if (Number(this.ISLOCAL) === 1) {
                Library.AjaxCallerData("./model/JSON_FermoTestiNew.json", this.SUCCESSCause.bind(this));
                this.getView().setModel(this.ModelCause, "cause");
            }
            oView.byId("disponibile").setSelected(true);
            oView.byId("nondisponibile").setSelected(false);
            this.collapse();
            this.oDialog.open();
        },
        SUCCESSCause: function (Jdata) {
            this.data_json = {};
            this.data_json.cause = [];
            this.RecursiveTakeAllCause(Jdata);
            this.ModelCause.setData(this.data_json);
        },
//         -> DROPDOWN OPERATORI
        LoadOperatori: function (event) {
            var that = this;
            var selectBox = event.getSource();
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllOperatori&Content-Type=text/json&OutputParameter=JSON";
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSOperatori.bind(that)(Jdata, selectBox);
            });
        },
        SUCCESSOperatori: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{operatore>addettoID}",
                    text: "{operatore>cognome} {operatore>nome}"
                });
                selectBox.setModel(oModel, "operatore");
                selectBox.bindAggregation("items", "operatore>/operatori", oItemSelectTemplate);
                var aFilter = [];
                var query = this.getView().getModel("linea").getProperty(selectBox.getBindingContext("linea").sPath).sezione;
                if (query) {
                    aFilter.push(new Filter("sezione", FilterOperator.Contains, query));
                }
                selectBox.getBinding("items").filter(aFilter);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        CheckOperatore: function (event) {
            var that = this;
            var check = 0;
            var selectBoxValue = event.getSource().getValue();
            var oTables = this.getView().byId("managePianoTable").getItems();
            for (var i = 0; i < oTables.length; i++) {
                var table_operatore = oTables[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[1].getItems()[0].getContent()[0].getItems();
                for (var j = 0; j < table_operatore.length; j++) {
                    if (table_operatore[j].getCells()[0].getValue() === selectBoxValue && table_operatore[j].getCells()[0] !== event.getSource()) {
                        table_operatore[j].getCells()[0].setValue("");
                        table_operatore[j].getCells()[0].clearSelection();
                        check = 1;
                        break;
                    }
                }
                if (check === 1) {
                    break;
                }
            }
            var addetto_ID = event.getParameter("selectedItem").getKey();
            var posizione_ID = this.getView().getModel("linea").getProperty(event.getSource().getBindingContext("linea").sPath).posizioneId;
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdatePosizioneAddetto&Content-Type=text/json&AddettoID=" + addetto_ID + "&PosizioneAddettoID=" + posizione_ID + "&OutputParameter=JSON";
            Library.AjaxCallerVoid(link, function () {
                that.refreshCall.bind(that);
            }, function (error) {
                console.log(error);
            });
        },

//       ************************ TABELLA 80% DI DESTRA ************************

//         -> PULSANTE AGGIUNTA BATCH
        AddBatch: function (event) {
            var path = event.getSource().getBindingContext("linea").sPath.split("/");
            var index = Number(path[path.indexOf("linee") + 1]);
            var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
            AddButton.setEnabled(false);
            var Model = this.getView().getModel("linea");
            var oData = Model.getData();
            var oLinea_path = event.getSource().getBindingContext("linea").getPath().split("/");
            var obj = {};
            var linea = oData[oLinea_path[1]][oLinea_path[2]];
            var last_batch = linea.lastbatch[0];
            obj.sequenza = last_batch.sequenza;
            obj.formatoProduttivo = last_batch.formatoProduttivo;
            obj.confezione = last_batch.confezione;
            obj.grammatura = last_batch.grammatura;
            obj.confezioneCodiceInterno = last_batch.confezioneCodiceInterno;
            obj.destinazione = last_batch.destinazione;
            obj.secondiPerPezzo = last_batch.secondiPerPezzo;
            obj.pezziCartone = last_batch.pezziCartone;
            obj.modifyBatch = 1;
            obj.SKUCodiceInterno = last_batch.SKUCodiceInterno;
            linea.batchlist.push(obj);
            Model.setData(oData);
            this.getView().setModel(Model, "linea");
        },
//         -> ELEMENTI TABELLA 
//              - INPUT SEQUENZA
        ShowUpdateButton: function (event) {
            var rowPath = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            row_binded.modifyBatch = 1;
//            this.getView().getModel("linea").refresh();
        },
//              - DROPDOWN FORMATI
        CaricaFormati: function (event) {
            var link;
            var that = this;
            var SelectBox = event.getSource();
            if (this.ISLOCAL === 1) {
                link = "model/formati.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFormatiFilteredByLineID&Content-Type=text/json&LineaID=" + this.linea_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSFormati.bind(that)(Jdata, SelectBox);
            });
        },
        SUCCESSFormati: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{formati>ID}",
                    text: "{formati>formato}"
                });
                selectBox.setModel(oModel, "formati");
                selectBox.bindAggregation("items", "formati>/formati", oItemSelectTemplate);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        ResetConfezionamenti: function (event) {
            this.ShowUpdateButton(event);
            var oRow = event.getSource().getParent();
            var selectBox = oRow.getCells()[2];
            selectBox.destroyItems();
            selectBox.setValue("");
            var Button = oRow.getCells()[3];
            Button.setText("");
            Button.setEnabled(false);
            oRow.getCells()[4].setValue("");
            oRow.getCells()[5].setValue("");
            oRow.getCells()[6].setValue("");
            oRow.getCells()[4].setEnabled(false);
            oRow.getCells()[5].setEnabled(false);
            oRow.getCells()[6].setEnabled(false);
            oRow.getCells()[7].setVisible(true);
        },
//              - DROPDOWN CONFEZIONI
        CaricaConfezionamenti: function (event) {
            var link, formato;
            var that = this;
            var SelectBox = event.getSource();
            if (this.getView().byId("formato_SKU")) {
                formato = this.getView().byId("formato_SKU").getValue();
            } else {
                formato = event.getSource().getParent().getCells()[1].getValue();
            }
            if (Number(this.ISLOCAL) === 1) {
                link = "model/confezionamenti.json";
            }
            if (Number(this.ISLOCAL) !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllConfezioniFilteredByLineIDAndFormatoProduttivo&Content-Type=text/json&LineaID=" + this.linea_id + "&FormatoProduttivo=" + formato + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSConfezionamenti.bind(that)(Jdata, SelectBox);
            });
        },
        SUCCESSConfezionamenti: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    key: "{confezionamenti>confezione} {confezionamenti>grammatura}gr",
                    text: "{confezionamenti>confezioneCodiceInterno}"
                });
                selectBox.setModel(oModel, "confezionamenti");
                selectBox.bindAggregation("items", "confezionamenti>/confezioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        LoadDestinazione: function (event) {
            this.ShowUpdateButton(event);
            var that = this;
            var PathLinea = event.getSource().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var link;
            var oRow = event.getSource().getParent();
            var row_path = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            if (oRow.getCells()[2].getSelectedItem().getKey()) {
                var array_confezione = oRow.getCells()[2].getSelectedItem().getKey().split(" ");
                row_binded.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                row_binded.confezione = array_confezione[0];
            }
            var Button = oRow.getCells()[3];
            if (this.ISLOCAL === 1) {
                row_binded.pezziCartone = 10;
                Button.setText("ITALIA + ESTERO");
                Button.setEnabled(true);
                oRow.getCells()[4].setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
            } else {
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.SKUCodiceInterno = "";
                obj.sequenza = "";
                obj.destinazione = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.lineaId = this.linea_id;
                obj.formatoProduttivo = oRow.getCells()[1].getValue();
                obj.grammatura = row_binded.grammatura;
                obj.tipologia = row_binded.confezione;
                var doc_xml = Library.createXMLBatch(obj);
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetInfoNewBatchStandard&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, function (Jdata) {
                    that.SUCCESSDestinazione.bind(that)(Jdata, oRow, row_binded);
                });
            }
            oRow.getCells()[7].setVisible(true);
        },
        SUCCESSDestinazione: function (Jdata, oRow, row_binded) {
            if (Number(Jdata.error) === 0) {
                oRow.getCells()[4].setEnabled(true);
                oRow.getCells()[5].setEnabled(true);
                oRow.getCells()[6].setEnabled(true);
                oRow.getCells()[4].setValue("");
                oRow.getCells()[5].setValue("");
                oRow.getCells()[6].setValue("");
                oRow.getCells()[3].setText(Jdata.destinazione);
                oRow.getCells()[3].setEnabled(true);
                row_binded.pezziCartone = Number(Jdata.pezziCartone);
                row_binded.secondiPerPezzo = Number(Jdata.secondiPerPezzo);
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
//              - BUTTON DESTINAZIONE
        ShowBatchDetails: function (event) {
            var oRow;
            if (event) {
                this.ModelLinea.getProperty(event.getSource().getBindingContext("linea").getPath()).modifyBatch = 1;
                this.getView().setModel(this.ModelLinea, "linea");
                oRow = event.getSource().getParent();
            }
            if (!oRow) {
                oRow = this.row;
            }
            var linea_path = oRow.getParent().getBindingContext("linea").sPath;
            this.linea = this.getView().getModel("linea").getProperty(linea_path);
            this.linea_id = this.linea.lineaID;
            this.row = oRow;
            var oView;
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            this.confezione = row_binded.confezione;
            this.grammatura = row_binded.grammatura;
            if (this.ISLOCAL === 1) {
                oView = this.getView();
                var std = this.getView().getModel("SKUstd").getData();
                var bck = this.getView().getModel("SKU").getData();
                bck = Library.RecursiveJSONComparison(std, bck, "attributi");
                bck = Library.RecursiveParentExpansion(bck);
                this.ModelSKU.setData(bck);
                this.getView().setModel(this.ModelSKU, "SKU");
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[1].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[3].getText());
                if (!event) {
                    this.getView().byId("formato_SKU").setEnabled(false);
                    this.getView().byId("confezione_SKU").setEnabled(false);
                    this.getView().byId("cliente_SKU").setEnabled(false);
                }
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            } else {
                oView = this.getView();
                var obj = {};
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = "";
                obj.formatoProduttivo = row_binded.formatoProduttivo;
                obj.tipologia = row_binded.confezione;
                obj.grammatura = row_binded.grammatura;
                obj.destinazione = row_binded.destinazione;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this), function (error) {
                    console.log(error);
                });
                this.oDialog = oView.byId("modificaAttributi");
                if (!this.oDialog) {
                    this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaAttributi", this);
                    oView.addDependent(this.oDialog);
                }
                this.getView().byId("formato_SKU").setValue(oRow.getCells()[1].getValue());
                this.getView().byId("confezione_SKU").setValue(oRow.getCells()[2].getValue());
                this.getView().byId("cliente_SKU").setValue(oRow.getCells()[3].getText());
                Library.RemoveClosingButtons.bind(this)("attributiContainer");
                this.oDialog.open();
            }
        },
//              - INPUT QLI, CARTONI E ORE
        ChangeValues: function (event) {
            this.ShowUpdateButton(event);
            var row_path = event.getSource().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(row_path);
            this.pezzi_cartone = row_binded.pezziCartone;
            this.tempo_ciclo = row_binded.secondiPerPezzo;
            var grammatura, numero_pezzi, cartoni, ore, quintali;
            var oValueChanged = event.getParameter("value");
            var oCellChanged = event.getSource();
            var oRow = event.getSource().getParent();
            grammatura = row_binded.grammatura;
            if (oCellChanged === oRow.getCells()[4]) {
                numero_pezzi = (oValueChanged * 100) / (grammatura / 1000);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                oRow.getCells()[5].setValue(cartoni);
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[6].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[5]) {
                numero_pezzi = oValueChanged * this.pezzi_cartone;
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[4].setValue(Library.roundTo(quintali, 2));
                ore = Math.ceil((numero_pezzi * this.tempo_ciclo) / 60);
                oRow.getCells()[6].setValue(Library.minutesToStandard(ore));
            }
            if (oCellChanged === oRow.getCells()[6]) {
                numero_pezzi = Library.standardToMinutes(oValueChanged) / (this.tempo_ciclo / 60);
                cartoni = Math.ceil(numero_pezzi / this.pezzi_cartone);
                quintali = (numero_pezzi * grammatura) / 100000;
                oRow.getCells()[4].setValue(Library.roundTo(quintali, 2));
                oRow.getCells()[5].setValue(cartoni);
            }
        },
//              - IMPOSTAZIONI BATCH
        BatchSettings: function (event) {
            this.oButton = event.getSource();
            var Path = this.oButton.getBindingContext("linea").sPath;
            var PathArray = Path.split("/");
            var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
            this.linea_id = this.ModelLinea.getData().linee[indexLinea].lineaID;
            this.batch_id = this.ModelLinea.getProperty(Path).batchID;
            this.row = event.getSource().getParent().getParent().getParent().getParent();
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/prova.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetMenuFromBatchID2&Content-Type=text/json&BatchID=" + this.batch_id + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, this.SUCCESSMenuOpened.bind(this));
        },
        SUCCESSMenuOpened: function (Jdata) {
            this.ModelMenu.setData(Jdata);
            this.getView().setModel(this.ModelMenu);
            if (!this._menu) {
                this._menu = sap.ui.xmlfragment(
                        "myapp.view.MenuItemEventing",
                        this
                        );
                this.getView().addDependent(this._menu);
            }
            var eDock = sap.ui.core.Popup.Dock;
            this._menu.setModel(this.prova);
            this._menu.open(this._bKeyboard, this.oButton, eDock.BeginTop, eDock.BeginBottom, this.oButton);
        },
//              - CONFERMA/INSERISCI BATCH
        InsertNewBatch: function (event) {
            var PathLinea = event.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getParent().getBindingContext("linea").sPath;
            this.linea_id = this.getView().getModel("linea").getProperty(PathLinea).lineaID;
            var oRow = event.getSource().getParent().getParent().getParent().getParent().getParent().getParent();
            var rowPath = event.getSource().getParent().getParent().getParent().getParent().getParent().getParent().getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var that = this;
            var link;
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
            obj.SKUCodiceInterno = "";
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.formatoProduttivo = oRow.getCells()[1].getValue();
            obj.grammatura = row_binded.grammatura;
            obj.tipologia = row_binded.confezione;
            obj.sequenza = oRow.getCells()[0].getValue();
            obj.destinazione = oRow.getCells()[3].getText();
            obj.quintali = oRow.getCells()[4].getValue();
            obj.cartoni = oRow.getCells()[5].getValue();
            obj.ore = oRow.getCells()[6].getValue();
            if (((Number(obj.quintali) !== 0) && (Number(obj.cartoni) !== 0))) {
                var doc_xml = Library.createXMLBatch(obj);
                if (Number(this.ISLOCAL) === 1) {
                    oRow.getCells()[7].setVisible(false);
                } else {
                    this.rowBinded = row_binded;
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/InsertUpdateBatch&Content-Type=text/json&xml=" + doc_xml + "&OutputParameter=JSON";
                    Library.SyncAjaxCallerData(link, function (Jdata) {
                        if (Number(Jdata.error) === 0) {
                            that.rowBinded.modifyBatch = 0;
                            that.RefreshCall("0");
                        } else {
                            MessageToast.show(Jdata.errorMessage, {duration: 180});
                        }
                    });
                    if (obj.batchId === "") {
                        var path = event.getSource().getBindingContext("linea").sPath.split("/");
                        var index = Number(path[path.indexOf("linee") + 1]);
                        var AddButton = this.getView().byId("managePianoTable").getItems()[index].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];
                        AddButton.setEnabled(true);
                    }
                }
            } else {
                MessageToast.show("Non si possono inserire batch con zero quintali", {duration: 2000});
            }
        },
//              - ANNULLA CONFERMA/INSERISCI BATCH
        UndoBatchCreation: function (event) {
            this.oButton = event.getSource();
            var Path = event.getSource().getBindingContext("linea").sPath;
            var PathArray = Path.split("/");
            var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
            this.linea_id = this.ModelLinea.getData().linee[indexLinea].lineaID;
            var row_binded = this.ModelLinea.getProperty(Path);
            var AddButton = this.getView().byId("managePianoTable").getItems()[indexLinea].getCells()[0].getItems()[0].getItems()[1].getItems()[0].getItems()[0].getItems()[0].getItems()[1].getItems()[0];

            if (row_binded.batchID && !row_binded.statoBatch) {
                AddButton.setEnabled(true);
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + row_binded.batchID + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
            } else {
                if (row_binded.batchID) {
                    row_binded.modifyBatch = 0;
                } else {
                    this.ModelLinea.getData().linee[indexLinea].batchlist.pop();
                    AddButton.setEnabled(true);
                }
                this.RefreshCall("0");
            }
        },

//        >>>>>>>>>>>>>>>>>> FUNZIONI DI SUPPORTO <<<<<<<<<<<<<<<<<<

//       ************************ TABELLA 20% DI SINISTRA ************************
        RecursiveTakeAllCause: function (bck) {
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    bck[key] = this.RecursiveTakeAllCause(bck[key]);
                }
            }
            if (bck.fermo !== undefined) {
                this.data_json.cause.push(bck);
            }
            return bck;
        },
//      GESTIONE STILE PULSANTE LINEA
        LineButtonStyle: function () {
            var classes = ["LineaDispo", "LineaNonDispo", "LineaVuota", "LineaAttrezzaggio", "LineaLavorazione", "LineaFermo", "LineaSvuotamento"];
            var data = this.ModelLinea.getData();
            var button;
            var state;
            for (var i = 0; i < data.linee.length; i++) {
                button = this.getView().byId("managePianoTable").getItems()[i].getCells()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[0].getItems()[0];
                for (var k = 0; k < classes.length; k++) {
                    button.removeStyleClass(classes[k]);
                }
                state = data.linee[i].statolinea.split(".");
                switch (state[0]) {
                    case 'Disponibile':
                        button.addStyleClass("LineaDispo");
                        break;
                    case 'Nondisponibile':
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

//       ************************ TABELLA 80% DI DESTRA ************************

        DeleteUncompleteBatches: function () {
            var model = this.ModelLinea.getData().linee;
            var link;
            for (var i = 0; i < model.length; i++) {
                for (var j = 0; j < model[i].batchlist.length; j++) {
                    if (model[i].batchlist[j].batchID && !model[i].batchlist[j].statoBatch) {
                        link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + model[i].batchlist[j].batchID + "&LineaID=" + model[i].lineaID + "&OutputParameter=JSON";
                        Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    }
                }
            }
        },

//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** POPUP MODIFICA ATTRIBUTI BATCH ****************
        TabSelection: function (event) {
            if (event.getParameters().item !== "Attributi") {
                var tabName = event.getParameters().item.getProperty("name");
                if (tabName === "Parametri") {
                    var formatoSKU = this.getView().byId("formato_SKU");
                    var confezioneSKU = this.getView().byId("confezione_SKU");
                    var clienteSKU = this.getView().byId("cliente_SKU");
                    if (formatoSKU.getValue() !== "" && confezioneSKU.getValue() !== "" && clienteSKU.getValue() !== "") {
                        var rowPath = this.row.getBindingContext("linea").sPath;
                        var row_binded = this.ModelLinea.getProperty(rowPath);
                        var link;
                        if (row_binded.batchID) {
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchCalcolo&Content-Type=text/json&BatchID=" + row_binded.batchID + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                        } else {
                            var xml = this.BuildXMLForInsertBatch();
                            link = "/XMII/Runner?Transaction=DeCecco/Transactions/SegmentoBatchCalcoloTmp&Content-Type=text/json&xml=" + xml + "&OutputParameter=JSON";
                        }
                        Library.AjaxCallerData(link, this.SUCCESSComboParametri.bind(this));
                    } else {
                        MessageToast.show("Selezionare prima tutti i parametri.", {duration: 3000});
                        var TabContainer = this.getView().byId("attributiContainer");
                        TabContainer.setSelectedItem("Attributi");
                    }
                }
            }
        },
        SUCCESSComboParametri: function (Jdata) {
            var data = Jdata.attributi;
            data = Library.RecursiveLinkRemoval(data);
            data = Library.RecursiveModifyExpansion(data);
            data = Library.RecursiveParentExpansion(data);
            data = Library.RecursivePropertyAdder(data, "valueModify");
            data = Library.RecursivePropertyCopy(data, "valueModify", "value");
            this.TTBackup.setData(data);
            this.ModelParametri.setData(data);
            this.getView().setModel(this.ModelParametri, "ModelParametri");
        },

        ChangeSKU: function () {
            var array_confezione;
            if (this.ISLOCAL !== 1) {
                if (this.getView().byId("confezione_SKU").getSelectedItem() !== null) {
                    array_confezione = this.getView().byId("confezione_SKU").getSelectedItem().getKey().split(" ");
                    this.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                    this.confezione = array_confezione[0];
                }
                var obj = {};
                obj.destinazione = this.getView().byId("cliente_SKU").getValue();
                obj.pianodiconfezionamento = "";
                obj.lineaId = "";
                obj.batchId = "";
                obj.sequenza = "";
                obj.quintali = "";
                obj.cartoni = "";
                obj.ore = "";
                obj.SKUCodiceInterno = "";
                obj.formatoProduttivo = this.getView().byId("formato_SKU").getValue();
                obj.tipologia = this.confezione;
                obj.grammatura = this.grammatura;
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetSKUFromFiltered&Content-Type=text/json&xml=" + Library.createXMLBatch(obj) + "&OutputParameter=JSON";
                Library.SyncAjaxCallerData(link, this.SUCCESSSKU.bind(this));
            }
        },
        EnableDestinazioni: function () {
            var array_confezione;
            if (this.getView().byId("confezione_SKU").getSelectedItem() !== null) {
                array_confezione = this.getView().byId("confezione_SKU").getSelectedItem().getKey().split(" ");
                this.grammatura = array_confezione[1].slice(0, array_confezione[1].length - 2);
                this.confezione = array_confezione[0];
            }
            this.getView().byId("cliente_SKU").destroyItems();
            this.getView().byId("cliente_SKU").setValue("");
            this.getView().byId("cliente_SKU").setEnabled(true);
        },
        ResetConfezionamentiDialog: function () {
            var selectBox = this.getView().byId("confezione_SKU");
            selectBox.destroyItems();
            selectBox.setValue("");
            var destinazione = this.getView().byId("cliente_SKU");
            destinazione.destroyItems();
            destinazione.setValue("");
            destinazione.setEnabled(false);
        },
        CaricaDestinazioni: function () {
            var link;
            var that = this;
            var selectBox = this.getView().byId("cliente_SKU");
            if (this.ISLOCAL !== 1) {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllDestinazioniFiltered&Content-Type=text/json&LineaID=" + this.linea_id + "&FormatoProduttivo=" + this.getView().byId("formato_SKU").getValue() + "&Tipologia=" + this.confezione + "&Grammatura=" + this.grammatura + "&OutputParameter=JSON";
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.SUCCESSDestinazioni.bind(that)(Jdata, selectBox);
            });
        },
        SUCCESSDestinazioni: function (Jdata, selectBox) {
            if (Number(Jdata.error) === 0) {
                var oModel = new JSONModel(Jdata);
                var oItemSelectTemplate = new sap.ui.core.Item({
                    text: "{destinazioni>destinazione}"
                });
                selectBox.setModel(oModel, "destinazioni");
                selectBox.bindAggregation("items", "destinazioni>/destinazioni", oItemSelectTemplate);
                selectBox.clearSelection();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        ConfermaModifiche: function () {
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.getView().getModel("linea").getProperty(rowPath);
            var idBatch = "";
            if (row_binded.batchID) {
                idBatch = row_binded.batchID;
            }
            var xmlInsert = this.BuildXMLForInsertBatch();
            var xmlModify = Library.XMLSetupUpdatesCT(this.ModelParametri.getData(), idBatch);
            var link = "/XMII/Runner?Transaction=DeCecco/Transactions/ComboInsert_Change&Content-Type=text/json&xmlinsert=" + xmlInsert + "&xmlchange=" + xmlModify + "&OutputParameter=JSON";
            Library.SyncAjaxCallerData(link, this.SUCCESSConfermaModifiche.bind(this));
        },
        SUCCESSConfermaModifiche: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var rowPath = this.row.getBindingContext("linea").sPath;
                var row_binded = this.getView().getModel("linea").getProperty(rowPath);
                row_binded.batchID = Jdata.NewBatchID;
                row_binded.pezziCartone = Jdata.JSONinfo.pezziCartone;
                row_binded.secondiPerPezzo = Jdata.JSONinfo.secondiPerPezzo;
                this.row.getCells()[1].setValue(this.getView().byId("formato_SKU").getValue());
                this.row.getCells()[2].destroyItems();
                this.row.getCells()[2].setValue(this.getView().byId("confezione_SKU").getValue());
                row_binded.confezione = this.confezione;
                row_binded.grammatura = this.grammatura;
                this.row.getCells()[3].setText(this.getView().byId("cliente_SKU").getValue());
                this.row.getCells()[4].setValue("");
                this.row.getCells()[5].setValue("");
                this.row.getCells()[6].setValue("");
                row_binded.SKUCodiceInterno = "";
                this.oDialog.destroy();
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 180});
            }
        },
        AnnullaModifiche: function () {
            this.oDialog.destroy();
        },
        BuildXMLForInsertBatch: function () {
            var formatoSKU = this.getView().byId("formato_SKU");
            var clienteSKU = this.getView().byId("cliente_SKU");
            var rowPath = this.row.getBindingContext("linea").sPath;
            var row_binded = this.ModelLinea.getProperty(rowPath);
            var obj = {};
            if (row_binded.batchID) {
                obj.batchId = row_binded.batchID;
            } else {
                obj.batchId = "";
            }
            obj.formatoProduttivo = formatoSKU.getValue();
            obj.tipologia = this.confezione;
            obj.grammatura = this.grammatura;
            obj.destinazione = clienteSKU.getValue();
            obj.pianodiconfezionamento = this.pdcID;
            obj.lineaId = this.linea_id;
            obj.sequenza = row_binded.sequenza;
            obj.quintali = "";
            obj.cartoni = "";
            obj.ore = "";
            obj.SKUCodiceInterno = "";
            return Library.createXMLBatch(obj);
        },
//      FUNZIONI PER TREETABLE
        CollapseAll: function (event) {
            var View = this.getView().byId(event.getSource().data("mydata"));
            View.collapseAll();
        },
        ExpandAll: function (event) {
            var View = this.getView().byId(event.getSource().data("mydata"));
            View.expandToLevel(20);
        },
        ShowRelevant: function (event, TT) {
            var View;
            if (typeof TT === "undefined") {
                View = this.getView().byId(event.getSource().data("mydata"));
            } else {
                View = this.getView().byId(TT);
            }
            View.expandToLevel(20);
            setTimeout(jQuery.proxy(this.CollapseNotRelevant, this, [View]), 50);
        },
        CollapseNotRelevant: function (Views) {
            var total, temp;
            for (var i = 0; i < Views.length; i++) {
                total = Views[i]._iBindingLength;
                for (var j = total - 1; j >= 0; j--) {
                    temp = Views[i].getContextByIndex(j).getObject();
                    if (temp.expand === 0) {
                        Views[i].collapse(j);
                    }
                }
            }
        },
        RestoreDefault: function () {
            var data = JSON.parse(JSON.stringify(this.TTBackup.getData()));
            this.ModelParametri.setData(data);
            this.getView().setModel(this.ModelParametri, "ModelParametri");
        },
        TreeTableRowClickExpander: function (event) {
            var View = this.getView().byId(event.getSource().data("mydata"));
            var clicked_row = event.getParameters().rowIndex;
            var clicked_column = event.getParameters().columnIndex;
            if (clicked_column === "0") {
                if (!View.isExpanded(clicked_row)) {
                    View.expand(clicked_row);
                } else {
                    View.collapse(clicked_row);
                }
            }
        },

//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** MENU IMPOSTAZIONI BATCH ****************
        AzioneBatch: function (event) {
            var oText = event.getParameter("item").getText();
            var link;
            switch (oText) {
                case "Visualizza Attributi Batch":
                    this.ShowBatchDetails();
                    break;
                case "Cancellazione Batch":
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/CancellazioneBatch&Content-Type=text/json&BatchID=" + this.batch_id + "&LineaID=" + this.linea_id + "&OutputParameter=JSON";
                    Library.AjaxCallerData(link, this.SUCCESSCancellazioneBatch.bind(this));
                    break;
            }

        },
        SUCCESSCancellazioneBatch: function (Jdata) {
            if (Number(Jdata.error) === 0) {
                var Path = this.oButton.getBindingContext("linea").sPath;
                var PathArray = Path.split("/");
                var indexLinea = Number(PathArray[PathArray.indexOf("linee") + 1]);
                var indexBatch = Number(PathArray[PathArray.indexOf("batchlist") + 1]);
                this.ModelLinea.getData().linee[indexLinea].batchlist.splice(indexBatch, 1);
                this.RefreshCall("0");
            } else {
                MessageToast.show(Jdata.errorMessage, {duration: 120});
            }
        },
//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** POPUP LINEA ****************

        GestioneStato: function (event) {
            var oText = event.getSource().getText();
            if (oText === "Disponibile per la produzione") {
                this.getView().byId("disponibile").setSelected(true);
                this.getView().byId("nondisponibile").setSelected(false);
                this.collapse();
            } else {
                this.getView().byId("nondisponibile").setSelected(true);
                this.getView().byId("disponibile").setSelected(false);
                this.expand();
            }
        },
        CloseDialog: function () {
            this.oDialog.close();
        },

//        -------------------------------------------------
//        -------------------------------------------------
//        -------------------------------------------------
//        
//      **************** FUNZIONI LOCALI ****************

        LOCALSUCCESSSKUstd: function (Jdata) {
            this.ModelSKUstd.setData(Jdata);
        },
        LOCALSUCCESSDatiOperatore: function (Jdata) {
            this.ModelOperatori.setData(Jdata);
            this.getView().setModel(this.ModelOperatori, 'operatore');
        },
        LOCALTakeLineaById: function (id, obj) {
            for (var j = 0; j < this.ModelLinea.getData().linee.length; j++) {
                if (Number(this.ModelLinea.getData().linee[j].id) === Number(id)) {
                    this.ModelLinea.getData().linee[j].batchlist.push(obj);
                    return;
                }
            }
            return;
        }
    });
    return ManagePianoYellow;
});