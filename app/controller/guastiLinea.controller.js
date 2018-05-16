sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("myapp.controller.guastiLinea", {
            linea: "",
            menuJSON: {},
            row_binded: {},
            guasti: {},
            oDialog: null,
            onInit: function(){
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("guastidilinea").attachPatternMatched(this._onObjectMatched, this); 
                var that = this;
                this.menuJSON.cause = [];
                var model = new JSONModel();
                $.ajax({
                   type: "GET",
                   url: "model/JSON_FermoTestiNew.json",
                   dataType: "json",
                   success: function(oData){
                       that.takeAllCause(oData);
                       model.setData(that.menuJSON);
                     }
                   });
                this.getView().setModel(model, "cause");
                
            },
            
            _onObjectMatched: function (oEvent){
                this.linea = oEvent.getParameter("arguments").guastiPath;
                var oModel = new JSONModel();
                var that = this;
                $.ajax({
                   type: "GET",
                   url: "model/guasti_linee.json",
                   dataType: "json",
                   success: function(oData){
                       //da rimpiazzare con parametrizzazione ajax (o comunque in base a come sarà la transazione)
                        for (var i=0; i<oData.GuastiLinee.length; i++){
                        if (oData.GuastiLinee[i].nome === that.linea){
                            that.guasti = oData.GuastiLinee[i];
                            break;
                            }
                        }
                        that.guasti = that.addTimeGaps(that.guasti);
                        oModel.setData(that.guasti);
                     }
                   });
                this.getView().setModel(oModel, "guasti");                
            },
            
            takeAllCause: function(bck){
                for (var key in bck){
                    if (typeof bck[key] === "object"){
                        bck[key] = this.takeAllCause(bck[key]);
                    }
                }
                if (bck.fermo !== undefined){
                    this.menuJSON.cause.push(bck);
                }
                return bck;
            }, 
            
//FORMATTAZIONE DEI DATI TEMPORALI
            addTimeGaps: function (data) {
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
//GESTIONE DEL TASTO CHE VIENE PREMUTO -> GENERO IL MENU CON LE VOCI PER LA MODIFICA/GESTIONE DEI GUASTI
            handlePressOpenMenuCausalizzazione: function (oEvent) {
                var oButton = oEvent.getSource();
                var row_id = oEvent.getSource().getParent().getId();
                this.row_binded = this.getView().getModel("guasti").getData().guasti[parseInt(row_id.slice(row_id.length-1),10)];
                // create menu only once
                if (!this._menu) {
                    this._menu = sap.ui.xmlfragment(
                            "myapp.view.MenuCausalizzazione",
                            this
                            );
                    this.getView().addDependent(this._menu);

                }
                var eDock = sap.ui.core.Popup.Dock;
//                var oModel = new JSONModel();
//                oModel.setData(this.menuJSON);
//                this._menu.setModel(oModel, "menu");
                this._menu.open(this._bKeyboard, oButton, eDock.EndTop, eDock.BeginBottom, oButton);
//                this._menu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
            },


//GESTIONE DEL MENU DI MODIFICA GUASTI
            modificaGuasti: function(oEvent){
                var oText = oEvent.getParameter("item").getText();
                switch (oText) {
                case "Modifica Causale Fermo":
                    this.creaFinestraModificaCausale(oText);
                    break;
                case "Modifica Inizio/Fine del Fermo":
                    this.creaFinestraModificaTempi(oText);
                    break;
                case "Frazione Causale di Fermo":
                    this.creaFinestraFrazionamento(oText);
                }

            },
            onConfermaCambio: function(oEvent){
                var oText = oEvent.getSource().getParent().getTitle();
                var i;
                var oModel = new JSONModel();
                switch (oText) {
                    case "Modifica Causale Fermo":
                            var selected_key = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getSelectedKey();
                            for (i in this.guasti.guasti) {
                                if (this.isObjectEquivalent(this.guasti.guasti[i], this.row_binded)) {
                                    var causa = this.takeCausaById(selected_key);
                                    this.guasti.guasti[i].causa = causa;
                                    oModel.setData(this.guasti);
                                    this.getView().setModel(oModel, "guasti");
                                    break;
                                }
                            }
                            break;
                    case "Modifica Inizio/Fine del Fermo":
                            var stringa_inizio = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getItems()[0].getItems()[1].getValue();
                            var stringa_fine = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getItems()[1].getItems()[1].getValue();                       
                            if (stringa_inizio !== "" || stringa_fine!==""){
                                if (stringa_inizio === ""){
                                    stringa_inizio = this.row_binded.inizio;
                                }
                                if (stringa_fine === ""){
                                    stringa_fine = this.row_binded.fine;
                                }
                                var array_inizio = stringa_inizio.split(":");
                                var array_fine = stringa_fine.split(":");
                                var secondi_inizio = parseInt(array_inizio[0], 10)*60*60 + parseInt(array_inizio[1], 10)*60 + parseInt(array_inizio[2], 10);
                                var secondi_fine = parseInt(array_fine[0], 10)*60*60 + parseInt(array_fine[1], 10)*60 + parseInt(array_fine[2], 10);                                 
                                if (secondi_fine-secondi_inizio>0){
                                    var stringa_intervallo = this.MillisecsToStandard(1000*(secondi_fine-secondi_inizio));
                                    for (i in this.guasti.guasti) {
                                        if (this.isObjectEquivalent(this.guasti.guasti[i], this.row_binded)) {
                                                this.guasti.guasti[i].inizio = stringa_inizio;
                                                this.guasti.guasti[i].fine = stringa_fine;
                                                this.guasti.guasti[i].intervallo = stringa_intervallo;
                                                oModel = new JSONModel();
                                                oModel.setData(this.guasti);
                                                this.getView().setModel(oModel, "guasti");
                                                break;
                                        }
                                    }
                                }
                            }
                            break;
                }
                this.oDialog.destroy();
            },
    
//MODIFICA CAUSALE DIALOG
            creaFinestraModificaCausale: function(text){
                var oView = this.getView();
                this.oDialog = oView.byId("modificaGuasti");
                if (!this.oDialog) {
                   this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                   oView.addDependent(this.oDialog);
                }
                this.oDialog.setTitle(text);
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
                    autoAdjustWidth:true,
                    id: "selectionMenu"
                });
                var oItemSelectTemplate = new sap.ui.core.Item({
                          key:"{cause>id}",
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
            takeCausaById: function(selected_key){
                var causa = "";
                for (var i in this.menuJSON.cause) {
                    if (this.menuJSON.cause[i].id === selected_key){
                        causa = this.menuJSON.cause[i].fermo;
                        break;
                    }
                }
                return causa;
            },  
            isObjectEquivalent: function(obj1, obj2){
                var aProps = Object.getOwnPropertyNames(obj1);
                var bProps = Object.getOwnPropertyNames(obj1);
                if (aProps.length !== bProps.length){
                    return false;
                }
                for (var key in obj1){
                    if (obj1[key] !== obj2[key]){
                        return false;
                    }
                }
                return true;
            },
//MODIFICA TEMPI DIALOG
            creaFinestraModificaTempi: function(text){
                var oView = this.getView();
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                oView.addDependent(this.oDialog);
                
                this.oDialog.setTitle(text);
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
                    text:this.row_binded.inizio
                });
                oText2.addStyleClass("size1");
                oText2.addStyleClass("sapUiSmallMarginEnd");
                oText2.addStyleClass("sapUiTinyMarginTop");
                oText3.addStyleClass("size1");
                oText3.addStyleClass("sapUiSmallMarginEnd");
                oText3.addStyleClass("sapUiTinyMarginTop");
                oTextInizio.addStyleClass("size1");
                oTextInizio.addStyleClass("tempoBox");
                oTextFine.addStyleClass("size1");
                oTextFine.addStyleClass("tempoBox");
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
                    
                });    
                oTextInizio = new sap.m.TimePicker({
                    
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
            creaFinestraFrazionamento: function(text){
                var oView = this.getView();
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                oView.addDependent(this.oDialog);
                //title e top box
                this.oDialog.setTitle(text);
                var oButton = oView.byId("confermaModificheButton");
                oButton.setEnabled(false);
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
                    change:this.onCheckValidity.bind(this),
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
                    autoAdjustWidth:true,
                    id: "selectionMenu"
                });
                var oItemSelectTemplate = new sap.ui.core.Item({
                          key:"{cause>id}",
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
                    change:this.onCheckValidity.bind(this),
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
            onCheckValidity: function(){
                var oView = this.getView();
                var oButton = oView.byId("confermaModificheButton");                
                if (sap.ui.getCore().byId("Inizio").getValue()!=="" && sap.ui.getCore().byId("Fine").getValue()!==""){
                    var secondi_inizio_row = this.fromStringToSeconds(this.row_binded.inizio);
                    var secondi_fine_row = this.fromStringToSeconds(this.row_binded.fine);
                    var secondi_inizio = this.fromStringToSeconds(sap.ui.getCore().byId("Inizio").getValue());
                    var secondi_fine = this.fromStringToSeconds(sap.ui.getCore().byId("Fine").getValue());
                    var intervallo_inizio = secondi_inizio-secondi_inizio_row;
                    var intervallo_fine = secondi_fine_row-secondi_fine;
                    if ( (intervallo_inizio>0 && intervallo_fine>=0 && secondi_inizio<secondi_fine) || (intervallo_inizio>=0 && intervallo_fine>0 && secondi_inizio<secondi_fine)){
                        oButton.setEnabled(true);
                    } else {
                        oButton.setEnabled(false);
                    }
                } else {
                    oButton.setEnabled(false);
                }
            },            
            fromStringToSeconds: function(stringa){
                var array_stringa = stringa.split(":");
                return  parseInt(array_stringa[0], 10)*60*60 + parseInt(array_stringa[1], 10)*60 + parseInt(array_stringa[2], 10);
            }
            
            
            
        
            

 


    });
});

