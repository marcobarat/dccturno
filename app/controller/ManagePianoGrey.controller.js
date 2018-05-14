sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("myapp.controller.ManagePianoGrey", {
        oColumn: null,
        oModel: null,
        oContent: null,
        oVBox: null, 
        ModelDetailPages: new JSONModel({}),
        CheckSingoloCausa: [],
        CheckTotaleCausa: 0,
        oDialog: null,
        CheckFermo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        id_split: null,
        oButton: null,
        
        onInit: function () {
            this.oModel = new JSONModel("./model/linee.json");
            this.getView().setModel(this.oModel, "linea");
            this.ModelDetailPages.setProperty("/Causalizzazione/", {});
            this.ModelDetailPages.setProperty("/Fermo/", {});
            
//            this.oModel = new JSONModel("./model/guasti.json");
//            this.getOwnerComponent().setModel(this.oModel, 'guasti');

            this.AjaxCaller("model/guasti.json", this.ModelDetailPages, "/Causalizzazione/", true);
            this.AjaxCaller("model/JSON_FermoTesti.json", this.ModelDetailPages, "/Fermo/Testi/");
            this.getOwnerComponent().setModel(this.ModelDetailPages, "GeneralModel");
            
            var oItems = this.getView().byId("ManagePianoTable").getAggregation("items");
            for (var i=0; i<oItems.length; i++) {
                var oLinea = oItems[i].getAggregation("cells")[0].getAggregation("items")[0].getAggregation("items")[1];
                if (!this.ControlloCausalizzazioneGuasti()){
                    oLinea.getAggregation("items")[3].setEnabled(false);
                } else {
                    oLinea.getAggregation("items")[3].setEnabled(true);
                }
                
                }
        },


//SI ATTIVA QUANDO PREMO CREA REPORT OEE
        onReport: function() {
             this.getView().byId("reportButton").setVisible(true);
             this.getView().byId("confermaButton").setVisible(true);
             if (!this.oColumn){
                var oItems = this.getView().byId("ManagePianoTable").getAggregation("items");
                for (var i=0; i<oItems.length; i++) {
                    var oTable = oItems[i].getAggregation("cells")[0].getAggregation("items")[1].getAggregation("items")[0].getAggregation("items")[0];
                    var oLinea = oItems[i].getAggregation("cells")[0].getAggregation("items")[0].getAggregation("items")[1];
                    this.oContent = new sap.m.TextArea({value:"{linea>disp}", editable:false, growing:true, rows:1, cols:3, textAlign:"Center"});
                    oLinea.addItem(this.oContent);
                    this.oContent = new sap.m.TextArea({value:"{linea>prod}", editable:false, growing:true, rows:1, cols:3, textAlign:"Center"});
                    oLinea.addItem(this.oContent);
                    this.oContent = new sap.m.Button({text:"{linea>fermo}", press:this.onCausalizzazioneFermi.bind(this)});
                    oLinea.addItem(this.oContent);
                    this.oColumn = new sap.m.Column({
                        styleClass: "sapUiSmallMarginBegin",
                        header: new sap.m.Label({text: "Disp"}),
                        hAlign: "Center"});
                    oTable.addColumn(this.oColumn);
                    this.oColumn = new sap.m.Column({
                        header: new sap.m.Label({text: "Prod"}),
                        hAlign: "Center"});
                    oTable.addColumn(this.oColumn);
                    this.oColumn = new sap.m.Column({
                        styleClass: "sapUiMediumMarginBegin",
                        header: new sap.m.Label({text: ""}),
                        hAlign: "Center"});
                    oTable.addColumn(this.oColumn);
                    var oColumnListItems = oTable.getAggregation("items");
                    for (var j=0; j<oColumnListItems.length; j++) {
                        oColumnListItems[j].addCell(new sap.m.Text({text:"{linea>disp}"}));
                        oColumnListItems[j].addCell(new sap.m.Text({text:"{linea>prod}"}));
                        oColumnListItems[j].addCell(new sap.m.Text({text:"{linea>fermo}"}));
                        
                    }
                    
                }
                
             }
         },
        
        AjaxCaller: function (addressOfJSON, model, targetAddress, faults) {
                        if (faults === undefined) {
                            faults = false;
                        }
                        var param = {};
                        var req = jQuery.ajax({
                            url: addressOfJSON,
                            data: param,
                            method: "GET",
                            dataType: "json",
                            async: true,
                            Selected: true
                        });
                        var passer = {};
                        passer.model = model;
                        passer.target = targetAddress;
                        passer.faults = faults;
                        var tempfunc = jQuery.proxy(this.FillModel, this, passer);
                        req.done(tempfunc);
                    },
        
        FillModel: function (struct, data) {
                        var model = struct.model;
                        var target = struct.target;
                        var faults = struct.faults;
                        if (!faults) {
                            model.setProperty(target, data);
                        } else {
                            var dataAll = JSON.parse(JSON.stringify(data));
                            var dataReduced = JSON.parse(JSON.stringify(data));
                            dataAll = this.AddTimeGaps(dataAll);
                            model.setProperty(target + "All/", dataAll);
                            dataReduced = this.RemoveCaused(dataReduced);
                            dataReduced = this.AddTimeGaps(dataReduced);
                            model.setProperty(target + "NoCause/", dataReduced);
                        }
                    },
                    
        AddTimeGaps: function (data) {
                        var millisec_diff = [];
                        var start, end;
                        for (var iter in data.guasti) {
                            start = new Date(data.guasti[iter].inizio);
                            end = new Date(data.guasti[iter].fine);
                            millisec_diff.push(end - start);
                            data.guasti[iter].inizio = this.DateToStandard(start);
                            data.guasti[iter].fine = this.DateToStandard(end);
                        }
                        var temp;
                        var sum = 0;
                        var arrayGaps = [];
                        for (iter in millisec_diff) {
                            temp = millisec_diff[iter];
                            sum += temp;
                            arrayGaps.push(this.MillisecsToStandard(temp));
                        }
                        for (var i = 0; i < arrayGaps.length; i++) {
                            data.guasti[i].intervallo = arrayGaps[i];
                        }
                        data.Totale = {};
                        data.Totale.tempoGuastoTotale = this.MillisecsToStandard(sum);
                        data.Totale.causaleTotale = "";
                        return data;
                    },
                    
        RemoveCaused: function (data) {
                        for (var i = data.guasti.length - 1; i >= 0; i--) {
                            if (data.guasti[i].causa !== "") {
                                data.guasti.splice(i, 1);
                            }
                        }
                        return data;
                    },
        
        DateToStandard: function (date) {
                        var hours = this.StringTime(date.getHours());
                        var mins = this.StringTime(date.getMinutes());
                        var secs = this.StringTime(date.getSeconds());
                        return (hours + ":" + mins + ":" + secs);
                    },
        
        MillisecsToStandard: function (val) {
                        var hours = Math.floor(val / 1000 / 60 / 60);
                        val -= hours * 1000 * 60 * 60;
                        var mins = Math.floor(val / 1000 / 60);
                        val -= mins * 1000 * 60;
                        var secs = Math.floor(val / 1000);
                        val -= secs * 1000;
                        var string_hours, string_mins, string_secs;
                        if (val !== 0) {
                            console.log("C'è un problema");
                        } else {
                            string_hours = this.StringTime(hours);
                            string_mins = this.StringTime(mins);
                            string_secs = this.StringTime(secs);
                        }
                        return (string_hours + ":" + string_mins + ":" + string_secs);
                    },
        
        StringTime: function (val) {
                        if (val < 10) {
                            return  ('0' + String(val));
                        } else {
                            return  String(val);
                        }
                    },



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// APRO IL DIALOG E INIZIALIZZO TUTTE LE CHECKBOX E LE PROPRIETA' DEL CONTROLLER CHE MI SERVONO PER MONITORARE LE CHECKBOX
        onCausalizzazioneFermi : function (oEvent) {
            this.CheckSingoloCausa = [];
            for (var j in this.ModelDetailPages.getData().Causalizzazione.NoCause.guasti) {
                this.CheckSingoloCausa.push(0);
                this.ModelDetailPages.getData().Causalizzazione.NoCause.guasti[j].selected = false;
            }
            this.getOwnerComponent().setModel(this.ModelDetailPages, "GeneralModel");            
            
            var oView = this.getView();
            this.oDialog = oView.byId("CausalizzazioneFermo");
            // create dialog lazily
            if (!this.oDialog) {
               // create dialog via fragment factory
               this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermo", this);
               oView.addDependent(this.oDialog);
            }
            
//            var vbox = this.getView().byId("TotaleTable").getParent();
//            var oText = new sap.m.TextArea({width: "100%", value:"Non esistono fermi automatici da causalizzare", textAlign:"Center", editable:false});
//            vbox.addItem(oText);
            
            if (!this.ControlloCausalizzazioneGuasti()){
                this.getView().byId("TotaleTable").setVisible(false);
                this.getView().byId("NoFermiDaCausalizzare").setVisible(true);
            } else {
                this.getView().byId("TotaleTable").setVisible(true);
                this.getView().byId("NoFermiDaCausalizzare").setVisible(false); 
            }
            

            
            this.oDialog.open();
        },
        
 
//CHIUDO IL DIALOG (SIA CAUSALIZZAZIONE FERMO CHE CAUSALIZZAZIONE FERMO PANEL)	
        onCloseDialog : function () {
                        var id_dialog = this.oDialog.getId();
                        if (id_dialog === "__xmlview1--CausalizzazioneFermo"){
                                var oItems = this.getView().byId("ManagePianoTable").getAggregation("items");
                                    for (var i=0; i<oItems.length; i++) {
                                            var oLinea = oItems[i].getAggregation("cells")[0].getAggregation("items")[0].getAggregation("items")[1];
                                            if (!this.ControlloCausalizzazioneGuasti()){
                                                oLinea.getAggregation("items")[3].setEnabled(false);
                                            } else {
                                                oLinea.getAggregation("items")[3].setEnabled(true);
                                            }
                
                                    }
                        }
			this.getView().byId(id_dialog).close();
                        this.getView().byId(id_dialog).destroy();
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
                                    for (i=0; i<this.CheckSingoloCausa.length; i++) {
                                        this.ModelDetailPages.getData().Causalizzazione.NoCause.guasti[i].selected = true;
                                        this.CheckSingoloCausa[i] = 1;
                                    }
                                    this.ModelDetailPages.refresh();
//                                    this.getView().setModel(this.ModelDetailPages, "GeneralModel");
                                } else {
                                    this.CheckTotaleCausa = 0;
                                    for (i=0; i<this.CheckSingoloCausa.length; i++) {
                                        this.ModelDetailPages.getData().Causalizzazione.NoCause.guasti[i].selected = false;
                                        this.CheckSingoloCausa[i] = 0;
                                    }
                                    this.ModelDetailPages.refresh();

                                }
                                
                               
                            } else {
                                var discr_id = event.getSource().getParent().getId();
                                for (i=0; i<this.CheckSingoloCausa.length; i++) {
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
                            for (i=0; i<this.CheckSingoloCausa.length; i++) {
                                temp_id += this.CheckSingoloCausa[i];
                            }
                            if (temp_id > 0) {
                                this.oDialog.getAggregation("content")[0].getAggregation("items")[3].getAggregation("items")[0].setEnabled(true);
                            } else {
                                this.oDialog.getAggregation("content")[0].getAggregation("items")[3].getAggregation("items")[0].setEnabled(false);
                            }
                        },
//CHIUDO IL DIALOG CAUSALIZZAZIONE FERMO E APRO IL CAUSALIZZAZIONE FERMO PANEL                        
        onCausalizzaButton: function(){
            var oView = this.getView();
            this.onCloseDialog();
            this.AjaxCaller("model/JSON_FermoSelezioni.json", this.ModelDetailPages, "/Fermo/Selezioni/");
            this.getOwnerComponent().setModel(this.ModelDetailPages, "GeneralModel");
            this.oDialog = oView.byId("CausalizzazioneFermoPanel");
            // create dialog lazily
            if (!this.oDialog) {
               // create dialog via fragment factory
               this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.CausalizzazioneFermoPanel", this);
               oView.addDependent(this.oDialog);
            }


            this.oDialog.open(); 
            
//            var button = this.getView().byId("ConfermaFermo");
            
        },
        onConfermaFermoCausalizzato: function(){
            var CB = this.getView().byId(this.id_split[1]); //in questo modo prendo l'array id_split che contiene i 3 pezzi dell'id della checkbox selezionata 
            var i;                                            // (es: id_split[0] = "__xmlview1--", id_split[1] = "CBFERMO8", id_split[2]= "8")
            var data = this.ModelDetailPages.getData().Causalizzazione.NoCause;
            var data_All = this.ModelDetailPages.getData().Causalizzazione.All;
                for (i=0; i<this.CheckSingoloCausa.length; i++) {
                    if (this.CheckSingoloCausa[i] > 0){
                         data.guasti[i].causa = CB.getProperty("text");
                         for (var j in data_All.guasti) {
                            if (data.guasti[i].inizio === data_All.guasti[j].inizio) {
                                data_All.guasti[j].causa = CB.getProperty("text");
                                break;
                            }
                        }
                    }
                }
            
            this.ModelDetailPages.setProperty("/Causalizzazione/NoCause/", data); //faccio l'update dei dati (su cui ho lavorato)
            this.ModelDetailPages.setProperty("/Causalizzazione/All/", data_All);
            this.getOwnerComponent().setModel(this.ModelDetailPages, "GeneralModel");
            
            this.onCloseDialog();
            this.onCausalizzazioneFermi();
        },
// GESTISCO LA SELEZIONE DELLE CAUSE NEL CAUSALIZZAZIONEFERMOPANEL
        ChangeCheckedFermo: function (event) {
            var id = event.getSource().getId();
            var root_name = "CBFermo";
            this.id_split = this.SplitId(id, root_name);
            var old_index = this.CheckFermo.indexOf(1);
            if (old_index > -1) {
                var old_CB = this.getView().byId(this.id_split[0] + root_name + String(old_index + 1));
                old_CB.setSelected(false);
                this.CheckFermo[old_index] = 0;
            }
            if (old_index !== this.id_split[2] - 1) {
                this.CheckFermo[this.id_split[2] - 1] = 1;
            }
            var selected_index = this.CheckFermo.indexOf(1);
            var button = this.getView().byId("ConfermaFermoCausalizzato");
            if (selected_index > -1) {
                button.setEnabled(true);
            } else {
                button.setEnabled(false);
            }
        },
//FUNZIONE PER SPLITTARE L'ID DA XML
        SplitId: function (id, string) {
            var splitter = id.indexOf(string);
            var root = id.substring(0, splitter);
            var real_id = id.substring(splitter, id.length);
            var index = id.substring(splitter + string.length, id.length);
            return [root, real_id, index];
        },
        ControlloCausalizzazioneGuasti: function(){
            var check = false;
            var data = this.ModelDetailPages.getData().Causalizzazione.NoCause.guasti;
            var i; 
            for (i in data) {
                if (data[i].causa===""){
                    check = true;
                    break;
                }
            }
            return check;
        },
        onReportView: function(){
            this.getOwnerComponent().getRouter().navTo("Report");
        }
    
//ANDARE AL REPORT
    
              
//                    onInit: function(){
//                        this.ModelDetailPages.setProperty("/Causalizzazione/", {});
//
//                        this.AjaxCaller("model/guasti.json", this.ModelDetailPages, "/Causalizzazione/", true);
//
//                        this.getView().setModel(this.ModelDetailPages, "GeneralModel");
//                    }
             
//             var aColumnData = [{
//                 columnId: "prova1"
//             },{
//                 columnId: "prova2"
//             },{
//                 columnId: "prova3"
//             }];
//             var aData = [{
//                 prova1: "ciao",
//                 prova2: "ciao",
//                 prova3: "ciaone"
//                 
//             }];
//             var oTable = new sap.m.Table({});
//             var oModel = new JSONModel();
//             oModel.setData({columns: aColumnData,
//                             rows: aData});


//        }

    });


});


