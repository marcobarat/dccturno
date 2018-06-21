sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/routing/History',
    'myapp/controller/Library'
], function (Controller, JSONModel, History, Library) {
    "use strict";
    return Controller.extend("myapp.controller.ManagePianoGrey", {
        StabilimentoID: sap.ui.getCore().getModel("stabilimento").getData().StabilimentoID,
        ModelReparti: sap.ui.getCore().getModel("reparti"),
        pdcID: sap.ui.getCore().getModel("ParametriPiano").pdc,
        ModelCausali: new JSONModel({}),
        ModelTurni: sap.ui.getCore().getModel("turni"),
        ModelLinea: sap.ui.getCore().getModel("linee"),
        ModelOEE: new JSONModel({}),
        ModelGuasti: new JSONModel({}),
        ModelGuastiLinea: new JSONModel({}),
        ModelPianoParameters: sap.ui.getCore().getModel("ParametriPiano"),
        oLinea_index: null,
        linea: null,
        button_fermo: null,
        ISLOCAL: Number(sap.ui.getCore().getModel("ISLOCAL").getData().ISLOCAL),
        oColumn: null,
        oContent: null,
        oVBox: null,
        CheckSingoloCausa: [],
        CheckTotaleCausa: 0,
        oDialog: null,
        CheckFermo: null,
        id_split: null,
        oButton: null,
        piano: null,
        pianoPath: null,
        turnoPath: null,
        data_json: {},
        onInit: function () {
            this.getView().setModel(this.ModelReparti, "reparti");
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("managePianoGrey").attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function (oEvent) {
            this.turnoPath = oEvent.getParameter("arguments").turnoPath;
            this.pianoPath = oEvent.getParameter("arguments").pianoPath;
//            var link;
//            this.ModelTurni = this.getOwnerComponent().getModel("turni");
//            if (!this.ModelTurni) {
//                Library.SyncAjaxCallerData("model/pianidiconf_new.json", Library.SUCCESSDatiTurni.bind(this));
//                this.getOwnerComponent().setModel(this.ModelTurni, "turni");
//            }
            var oTitle = this.getView().byId("ReportTitle");
            this.piano = this.ModelTurni.getData().pianidiconfezionamento[this.turnoPath][this.pianoPath];
            oTitle.setText(this.piano.data + "    -    " + this.piano.turno);
            oTitle.addStyleClass("customTextTitle");
            this.getView().setModel(this.ModelLinea, "linea");
//            Library.AjaxCallerData("./model/guasti_new.json", this.SUCCESSGuasti.bind(this));
//            sap.ui.getCore().setModel(this.ModelGuasti, "guasti");
//            if (this.ISLOCAL === 1) {
////                Library.AjaxCallerData("./model/linee.json", function (Jdata) {
////                    that.ModelLinea.setData(Jdata);
////                });
//                this.getView().setModel(this.ModelLinea, "linea");
//                Library.AjaxCallerData("./model/guasti_new.json", this.SUCCESSGuasti.bind(this));
//                sap.ui.getCore().setModel(this.ModelGuasti, "guasti");
////                link = "model/JSON_FermoTestiNew.json";
////                Library.AjaxCallerData(link, that.SUCCESSFermo.bind(that));
////                this.getView().setModel(this.ModelCausali, "CausaliFermo");
//            } else {
////                Library.AjaxCallerData("./model/linee.json", function (Jdata) {
////                    that.ModelLinea.setData(Jdata);
////                });
//                this.getView().setModel(this.ModelLinea, "linea");
//                Library.AjaxCallerData("./model/guasti_new.json", this.SUCCESSGuasti.bind(this));
//                sap.ui.getCore().setModel(this.ModelGuasti, "guasti");
//            }




//            var oItems = this.getView().byId("ManagePianoTable").getItems();
//            for (var i = 0; i < oItems.length; i++) {
//                var oLinea = oItems[i].getCells()[0].getItems()[0].getItems()[1];
//                if (oLinea.getItems().length > 1) {
//                    if (!this.ControlloCausalizzazioneGuasti(this.ModelGuasti.getData().GuastiLinee[i])) {
//                        oLinea.getItems()[3].setEnabled(false);
//                    } else {
//                        oLinea.getItems()[3].setEnabled(true);
//                    }
//                }
//            }
        },
        changeReparto: function (oEvent) {
            var link;
            var that = this;
            var area = this.piano.area;
            var repartoId = oEvent.getParameters().key;
            var pdcId = this.piano.PdcID;
            if (this.ISLOCAL === 1) {
                if (area === "0") {
                    link = "model/linee.json";
                } else {
                    link = "model/linee_new.json";
                }
            } else {
                if (area === "0") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDpassato&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else if (area === "1") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDattuale&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else if (area === "2") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcFromPdcIDandRepartoIDfuturo&Content-Type=text/json&PdcID=" + pdcId + "&RepartoID=" + repartoId + "&StabilimentoID=" + this.StabilimentoID + "&OutputParameter=JSON";
                }
            }
            Library.AjaxCallerData(link, function (Jdata) {
                that.ModelLinea.setData(Jdata);
            });
            this.getView().setModel(this.ModelLinea, "linee");
        },
//        SUCCESSGuasti: function (Jdata) {
//            var data = {};
//            data.GuastiLinee = [];
//            for (var i = 0; i < Jdata.GuastiLinee.length; i++) {
//                var dataAll = JSON.parse(JSON.stringify(Jdata.GuastiLinee[i]));
//                var dataReduced = JSON.parse(JSON.stringify(Jdata.GuastiLinee[i]));
//                dataAll = Library.AddTimeGaps(dataAll);
//                data.GuastiLinee.push({});
//                data.GuastiLinee[i].nome = null;
//                data.GuastiLinee[i].All = {};
//                data.GuastiLinee[i].NoCause = {};
//                data.GuastiLinee[i].nome = Jdata.GuastiLinee[i].nome;
//                data.GuastiLinee[i].All = dataAll;
//                dataReduced = Library.RemoveCaused(dataReduced);
//                dataReduced = Library.AddTimeGaps(dataReduced);
//                data.GuastiLinee[i].NoCause = dataReduced;
//            }
//            this.ModelGuasti.setData(data);
//        },
        SUCCESSFermo: function (Jdata) {
            this.ModelCausali.setData(Jdata);
            this.getView().setModel(this.ModelCausali, "CausaliFermo");
            var oView = this.getView();
            this.onCloseDialog();
            //PULIZIA DELLA PAGINA -DESELEZIONO UN'EVENTUALE CASELLA SELEZIONATA 
            var old_id = this.GetActiveCB();
            if (old_id !== 0) {
                var old_CB = sap.ui.getCore().byId(old_id);
                old_CB.setSelected(false);
                this.CheckFermo[old_id] = 0;
            }

            var dialog = oView.byId("CausalizzazioneFermoPanel");
            if (!dialog) {
                dialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermoPanel", this);
                oView.addDependent(dialog);
            }
            this.oDialog = dialog;
//            dialog.open();
            var data = this.ModelCausali.getData().gerarchie;
            var num_gerarchie = data.length;
            var ID, CB;
            var cols = 2;
            var rows = Math.ceil(num_gerarchie / cols);
            var outerVBox = this.getView().byId("CausalizzazioneFermoPanelBox");
            if (outerVBox.getItems().length > 0) {
                outerVBox.destroyItems();
            }
            var vvbb1 = new sap.m.VBox({height: "90%", width: "100%"});
            var vvbb3 = new sap.m.VBox({height: "10%", width: "100%"});
            vvbb3.addStyleClass("sapUiMediumMarginTop");
            var hbox = new sap.m.HBox({height: "100%"});
            var vb1 = new sap.m.VBox({width: "15%"});
            var VB1 = new sap.m.VBox({width: "85%"});
            var L1_vbox, L2_hbox, L3_vbox, title, subdata;
            var L3_width = String(Math.round(100 / cols)) + "%";
            var index = 0;
            this.CheckFermo = [];
            for (var i = 0; i < rows; i++) {
                L2_hbox = new sap.m.HBox();
                L2_hbox.addStyleClass("sapUiSmallMarginBottom");
                for (var j = 0; j < cols; j++) {
                    title = new sap.m.Text({text: data[index].gerarchia});
                    title.addStyleClass("customText");
                    L3_vbox = new sap.m.VBox({width: L3_width});
                    L3_vbox.addItem(title);
                    subdata = data[index].attributi;
                    for (var k = 0; k < subdata.length; k++) {
                        ID = "CBFermo" + subdata[k].id;
                        this.CheckFermo[ID] = 0;
                        CB = new sap.m.CheckBox({
                            id: ID,
                            text: subdata[k].fermo,
                            select: this.ChangeCheckedFermo.bind(this),
                            selected: false});
                        L3_vbox.addItem(CB);
                    }
                    L2_hbox.addItem(L3_vbox);
                    index++;
                    if (index === data.length) {
                        break;
                    }
                }
                L1_vbox = new sap.m.VBox({});
                L1_vbox.addItem(L2_hbox);
                VB1.addItem(L1_vbox);
            }
            hbox.addItem(vb1);
            hbox.addItem(VB1);
            vvbb1.addItem(hbox);
            outerVBox.addItem(vvbb1);
            var hbox1 = new sap.m.HBox({});
            var vb0 = new sap.m.VBox({width: "10%"});
            var vb01 = new sap.m.VBox({width: "37%"});
            var vb2 = new sap.m.VBox({width: "6%"});
            var vb3 = new sap.m.VBox({width: "37%"});
            var vb4 = new sap.m.VBox({width: "10%"});
            var bt1 = new sap.m.Button({
                id: "AnnullaFermo",
                text: "ANNULLA",
                width: "100%",
                enabled: true,
                press: this.onCloseDialog.bind(this)});
            bt1.addStyleClass("annullaButton");
            var bt2 = new sap.m.Button({
                id: "ConfermaFermo",
                text: "CONFERMA",
                width: "100%",
                enabled: false,
                press: this.onConfermaFermoCausalizzato.bind(this)});
            bt2.addStyleClass("confermaButton");
            vb3.addItem(bt2);
            vb01.addItem(bt1);
            vb0.addItem(new sap.m.Text({}));
            vb2.addItem(new sap.m.Text({}));
            vb4.addItem(new sap.m.Text({}));
            hbox1.addItem(vb0);
            hbox1.addItem(vb01);
            hbox1.addItem(vb2);
            hbox1.addItem(vb3);
            hbox1.addItem(vb4);
            vvbb3.addItem(hbox1);
            outerVBox.addItem(vvbb3);

            dialog.open();
        },
//SI ATTIVA QUANDO PREMO CREA REPORT OEE
        onReport: function () {
            if (!this.getView().byId("reportButton").getEnabled()) {
                var link;
                this.getView().byId("chiusuraPiano").setEnabled(true);
                if (this.ISLOCAL === 1) {
                    link = "model/OEE.json";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetPdcPassato_GetReportOEE&Content-Type=text/json&stabilimentoID=" + this.ModelPianoParameters.stabilimento + "&pdcID=" + this.ModelPianoParameters.pdc + "&repartoID=" + this.ModelPianoParameters.reparto + "&OutputParameter=JSON";
                }
                Library.AjaxCallerData(link, this.SUCCESSReportCreated.bind(this));
            }
        },
        SUCCESSReportCreated: function (Jdata) {
            if (this.ISLOCAL === 1) {
                this.ModelOEE.setData(Jdata);
            } else {
                this.ModelLinea.setData(Jdata.PDC);
                sap.ui.getCore().setModel(this.ModelLinea, "linee");
                this.getView().setModel(this.ModelLinea, "linea");
                this.ModelOEE.setData(Jdata.OEE);
            }
            sap.ui.getCore().setModel(this.ModelOEE, "ReportOEE");
            this.getView().setModel(this.ModelOEE, "ReportOEE");
            this.getView().byId("reportButton").setEnabled(true);
//            this.getView().byId("confermaButton").setVisible(true);
            var oItems = this.getView().byId("ManagePianoTableGrey").getAggregation("items");
            for (var i = 0; i < oItems.length; i++) {
                var oTable = oItems[i].getAggregation("cells")[0].getAggregation("items")[1].getAggregation("items")[0].getAggregation("items")[0];
                var oLinea = oItems[i].getAggregation("cells")[0].getAggregation("items")[0].getAggregation("items")[1];
                this.oContent = new sap.m.TextArea({value: "{linea>disponibilita}", editable: false, growing: true, rows: 1, cols: 3, textAlign: "Center"});
                oLinea.getItems()[0].addItem(this.oContent);
//                this.oContent.addStyleClass("sapUiTinyMarginEnd");
                this.oContent = new sap.m.TextArea({value: "{linea>efficienza}", editable: false, growing: true, rows: 1, cols: 3, textAlign: "Center"});
//                this.oContent.addStyleClass("sapUiSmallMarginBegin");
                oLinea.getItems()[1].addItem(this.oContent);
                this.oContent = new sap.m.Button({width: "100%", text: "{linea>fermo}", press: ["totali", this.onCausalizzazioneFermi, this]});
//                this.oContent.addStyleClass("sapUiTinyMarginBegin");
                oLinea.getItems()[2].addItem(this.oContent);
                this.oColumn = new sap.m.Column({
                    width: "6%",
                    styleClass: "sapUiSmallMarginBegin",
                    header: new sap.m.Label({text: "Disp"}),
                    vAlign: "Middle",
                    hAlign: "Center"});
                oTable.addColumn(this.oColumn);
                this.oColumn = new sap.m.Column({
                    width: "6%",
                    header: new sap.m.Label({text: "Prod"}),
                    vAlign: "Middle",
                    hAlign: "Center"});
                oTable.addColumn(this.oColumn);
                this.oColumn = new sap.m.Column({
                    width: "10%",
                    header: new sap.m.Label({text: ""}),
                    vAlign: "Middle",
                    hAlign: "Center"});
                oTable.addColumn(this.oColumn);
                var oColumnListItems = oTable.getAggregation("items");
                for (var j = 0; j < oColumnListItems.length; j++) {
                    var oText = new sap.m.Text({text: "{linea>disponibilita}"});
                    oColumnListItems[j].addCell(oText);
                    oText = new sap.m.Text({text: "{linea>produttivita}"});
                    oColumnListItems[j].addCell(oText);
                    oText = new sap.m.Button({text: "{linea>fermo}", press: ["{linea>batchID}", this.onCausalizzazioneFermi, this]});
                    oColumnListItems[j].addCell(oText);
                }
            }
        },
        removeReport: function () {
            if (this.getView().byId("reportButton").getEnabled()) {
                this.getView().byId("reportButton").setEnabled(false);
                var oItems = this.getView().byId("ManagePianoTableGrey").getAggregation("items");
                for (var i = 0; i < oItems.length; i++) {
                    var oTable = oItems[i].getCells()[0].getItems()[1].getItems()[0].getItems()[0];
                    var oLinea = oItems[i].getCells()[0].getItems()[0].getItems()[1];
                    oLinea.getItems()[2].removeItem(oLinea.getItems()[2].getItems()[0]);
                    oLinea.getItems()[1].removeItem(oLinea.getItems()[1].getItems()[0]);
                    oLinea.getItems()[0].removeItem(oLinea.getItems()[0].getItems()[0]);
                    oTable.removeColumn(oTable.getColumns()[9]);
                    oTable.removeColumn(oTable.getColumns()[8]);
                    oTable.removeColumn(oTable.getColumns()[7]);
                    var oColumnListItems = oTable.getItems();
                    for (var j = 0; j < oColumnListItems.length; j++) {
                        oColumnListItems[j].removeCell(oColumnListItems[j].getCells()[9]);
                        oColumnListItems[j].removeCell(oColumnListItems[j].getCells()[8]);
                        oColumnListItems[j].removeCell(oColumnListItems[j].getCells()[7]);
                    }
                }

            }
        },
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// APRO IL DIALOG E INIZIALIZZO TUTTE LE CHECKBOX E LE PROPRIETA' DEL CONTROLLER CHE MI SERVONO PER MONITORARE LE CHECKBOX
        onCausalizzazioneFermi: function (oEvent, batchId) {
            if (oEvent) {
                this.oLinea_index = oEvent.getSource().getBindingContext("linea").sPath.split("/")[2];
                var oLinea_path = oEvent.getSource().getBindingContext("linea").sPath;
                this.linea = this.getView().getModel("linea").getProperty(oLinea_path);
                this.button_fermo = oEvent.getSource();
            }
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/guasti_new.json";
            } else {
                if (batchId === "totali") {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausaFromLineaID&Content-Type=text/json&LineaID=" + this.linea.lineaID + "&OutputParameter=JSON";
                } else {
                    link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetAllFermiAutoSenzaCausaFromBatchID&Content-Type=text/json&BatchID=" + batchId + "&OutputParameter=JSON";
                }
            }
            Library.AjaxCallerData(link, this.SUCCESSGuasti.bind(this));
        },
        SUCCESSGuasti: function (Jdata) {
            var data = {};
            data.GuastiLinee = [];
            for (var i = 0; i < Jdata.GuastiLinee.length; i++) {
                var dataAll = JSON.parse(JSON.stringify(Jdata.GuastiLinee[i]));
                var dataReduced = JSON.parse(JSON.stringify(Jdata.GuastiLinee[i]));
                dataAll = Library.AddTimeGaps(dataAll);
                data.GuastiLinee.push({});
                data.GuastiLinee[i].nome = null;
                data.GuastiLinee[i].All = {};
                data.GuastiLinee[i].NoCause = {};
                data.GuastiLinee[i].nome = Jdata.GuastiLinee[i].nome;
                data.GuastiLinee[i].All = dataAll;
                dataReduced = Library.RemoveCaused(dataReduced);
                dataReduced = Library.AddTimeGaps(dataReduced);
                data.GuastiLinee[i].NoCause = dataReduced;
            }
            this.ModelGuasti.setData(data);
            var oView = this.getView();
            this.CheckSingoloCausa = [];
            var dato_linea = data.GuastiLinee[this.oLinea_index];
            for (var j in dato_linea.NoCause.guasti) {
                this.CheckSingoloCausa.push(0);
                dato_linea.NoCause.guasti[j].selected = false;
            }
            data.GuastiLinee[this.oLinea_index] = dato_linea;
            this.ModelGuastiLinea = new JSONModel({});
            this.ModelGuastiLinea.setData(dato_linea);
            oView.setModel(this.ModelGuastiLinea, "guastilinea");
            this.oDialog = oView.byId("CausalizzazioneFermo");
            if (!this.oDialog) {
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermo", this);
                oView.addDependent(this.oDialog);
            }

            //disabilito il bottone di accettazione
            this.getView().byId("ConfermaFermi").setEnabled(false);
            if (!this.ControlloCausalizzazioneGuasti(this.ModelGuastiLinea.getData())) {
                oView.byId("TotaleTable").setVisible(false);
                oView.byId("NoFermiDaCausalizzare").setVisible(true);
            } else {
                var oTable = this.getView().byId("TotaleTable");
                oTable.setVisible(true);
                oTable.getItems()[0].getCells()[3].setSelected(false);
                this.CheckTotaleCausa = 0;
                this.getView().byId("NoFermiDaCausalizzare").setVisible(false);
            }

            this.oDialog.open();
        },
//CHIUDO IL DIALOG (SIA CAUSALIZZAZIONE FERMO CHE CAUSALIZZAZIONE FERMO PANEL)	
        onCloseDialog: function () {
            var id_dialog = this.oDialog.getId().split("--")[1];
//            if (id_dialog === "CausalizzazioneFermo") {
////                var oItems = this.getView().byId("ManagePianoTableGrey").getItems();
////                for (var i = 0; i < oItems.length; i++) {
////                    var oLinea = oItems[i].getCells()[0].getItems()[0].getItems()[1];
////                    if (!this.ControlloCausalizzazioneGuasti(this.ModelGuasti.getData().GuastiLinee[i])) {
////                        oLinea.getItems()[2].getItems()[0].setEnabled(false);
////                    } else {
////                        oLinea.getItems()[2].getItems()[0].setEnabled(true);
////                    }
////                }
//            }
            if (this.button_fermo.getText() === "00:00") {
                this.button_fermo.setEnabled(false);
            }
            this.getView().byId(id_dialog).close();
            this.oDialog = null;
        },
//GESTIONE DELLE CHECKBOX DEL DIALOG CAUSALIZZAZIONE FERMO    
        ChangeCheckedCausa: function (event) {
            var id = event.getSource().getId();
            var CB = this.getView().byId(id);
            var root_name_totale = "CBTotaleCausa";
            var i, temp_id;
            if (id.indexOf(root_name_totale) > -1) {
                if (CB.getSelected()) {
                    this.CheckTotaleCausa = 1;
                    for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                        this.ModelGuastiLinea.getData().NoCause.guasti[i].selected = true;
                        this.CheckSingoloCausa[i] = 1;
                    }
                    this.ModelGuastiLinea.refresh();
                } else {
                    this.CheckTotaleCausa = 0;
                    for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                        this.ModelGuastiLinea.getData().NoCause.guasti[i].selected = false;
                        this.CheckSingoloCausa[i] = 0;
                    }
                    this.ModelGuastiLinea.refresh();
                }


            } else {
                var discr_id = event.getSource().getParent().getId();
                for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                    temp_id = event.getSource().getParent().getParent().getAggregation("rows")[i].getId();
                    if (discr_id === temp_id) {
                        break;
                    }
                }
                if (CB.getSelected()) {
                    this.CheckSingoloCausa[i] = 1;
                } else {
                    this.CheckSingoloCausa[i] = 0;
                }
            }
            temp_id = 0;
            for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                temp_id += this.CheckSingoloCausa[i];
            }
            if (temp_id > 0) {
                this.oDialog.getAggregation("content")[0].getAggregation("items")[3].getAggregation("items")[0].setEnabled(true);
            } else {
                this.oDialog.getAggregation("content")[0].getAggregation("items")[3].getAggregation("items")[0].setEnabled(false);
            }
        },
//CHIUDO IL DIALOG CAUSALIZZAZIONE FERMO E APRO IL CAUSALIZZAZIONE FERMO PANEL                        
        onCausalizzaButton: function () {
            var link;
            if (this.ISLOCAL === 1) {
                link = "model/JSON_FermoTestiNew.json";
            } else {
                link = "/XMII/Runner?Transaction=DeCecco/Transactions/GetListaCausaleFermo&Content-Type=text/json&OutputParameter=JSON&IsManuale=0";
            }
            Library.AjaxCallerData(link, this.SUCCESSFermo.bind(this));
        },
// GESTISCO LA SELEZIONE E LA CONFERMA DELLE CAUSE NEL CAUSALIZZAZIONEFERMOPANEL
        ChangeCheckedFermo: function (event) {
            var id = event.getSource().getId();
            var root_name = "CBFermo";
            this.id_split = this.SplitId(id, root_name);
            var old_id = this.GetActiveCB();
            if (typeof old_id === "string") {
                var old_CB = sap.ui.getCore().byId(old_id);
                old_CB.setSelected(false);
                this.CheckFermo[old_id] = 0;
            }
            if (old_id !== this.id_split[1]) {
                this.CheckFermo[this.id_split[1]] = 1;
            }
            var selected_index = this.GetActiveCB();
            var button = sap.ui.getCore().byId("ConfermaFermo");
            if (typeof selected_index === "string") {
                button.setEnabled(true);
            } else {
                button.setEnabled(false);
            }
        },
        GetActiveCB: function () {
            var res = 0;
            for (var key in this.CheckFermo) {
                if (this.CheckFermo[key] === 1) {
                    res = key;
                    break;
                }
            }
            return res;
        },
        onConfermaFermoCausalizzato: function () {
            var CB = sap.ui.getCore().byId(this.id_split[1]);
            var i;
            var data = this.ModelGuasti.getData().GuastiLinee[this.oLinea_index];
            for (i = 0; i < this.CheckSingoloCausa.length; i++) {
                if (this.CheckSingoloCausa[i] > 0) {
                    data.NoCause.guasti[i].causa = CB.getProperty("text");
                    for (var j in data.All.guasti) {
                        if (data.NoCause.guasti[i].inizio === data.All.guasti[j].inizio) {
                            data.All.guasti[j].causa = CB.getProperty("text");
                            break;
                        }
                    }
                }
            }
            this.ModelGuasti.getData().GuastiLinee[this.oLinea_index] = data;
            this.getView().setModel(this.ModelGuasti, "guastilinea");
            this.onCloseDialog();
//            this.onCausalizzazioneFermi();
        },
//FUNZIONE PER SPLITTARE L'ID DA XML
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
        },
        ControlloCausalizzazioneGuasti: function (data) {
            var check = false;
            data = data.NoCause.guasti;
            var i;
            for (i in data) {
                if (data[i].causa === "") {
                    check = true;
                    break;
                }
            }
            return check;
        },
        onReportView: function () {
            var that = this;
            this.getOwnerComponent().getRouter().navTo("Report", {turnoPath: that.turnoPath, pianoPath: that.pianoPath});
        },
// quando chiudo il piano ritorno alla pagina iniziale e: 1) creo PDF tree table 2) salvo dati (quindi il file json) 3) archivio dati (backend??)        
        onConfermaChiusuraPiano: function () {
//            var dataTurni = this.ModelTurni.getData();
//            dataTurni.pianidiconfezionamento.splice(this.pianoPath, 1);
//            this.ModelTurni.setData(dataTurni);
//            this.getOwnerComponent().setModel("turni");
//            var oModel = new JSONModel();
//            var view = this.getOwnerComponent()._oViews._oViews["myapp.view.Piani"];
//            var data = view.getModel().getData().turniconclusi.splice(this.pianoPath, 1);
//            oModel.setData(data);
//            view.setModel(oModel);
            if (this.ISLOCAL === 1) {
                this.SUCCESSConfermaChiusura();
            } else {
                var link = "/XMII/Runner?Transaction=DeCecco/Transactions/UpdatePdcToChiuso&Content-Type=text/json&PdcID=" + this.pdcID + "&OutputParameter=JSON";
                Library.AjaxCallerData(link, this.SUCCESSConfermaChiusura.bind(this));
            }
        },
        SUCCESSConfermaChiusura: function (Jdata) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("piani");
        },
//BUTTON NAVBACK        
        onNavBack: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("piani", true);
            this.getView().byId("chiusuraPiano").setEnabled(false);
            this.removeReport();
        }
    });
});


