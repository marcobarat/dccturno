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
//                       that.menuJSON.cause.splice(0, 0, {id:"-1", fermo:""});
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
            onReturnToReport: function(){
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Report");
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
                var split_id = row_id.split("-");
                this.row_binded = this.getView().getModel("guasti").getData().guasti[parseInt(split_id[2],10)];
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
            onConfermaCambio: function(oEvent){
                var oText = this.getView().byId("title").getText();
                var i;
                var oModel = new JSONModel();
                var stringa_inizio, stringa_fine, selected_key, causale;
                switch (oText) {
                    case "Modifica Causale Fermo":
                            selected_key = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getSelectedKey();
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
                            stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
                            stringa_fine = sap.ui.getCore().byId("Fine").getValue();                       
                            if (stringa_inizio !== "" || stringa_fine!==""){
                                if (stringa_inizio === ""){
                                    stringa_inizio = this.row_binded.inizio;
                                }
                                if (stringa_fine === ""){
                                    stringa_fine = this.row_binded.fine;
                                }
                                var secondi_inizio = this.fromStringToSeconds(stringa_inizio);
                                var secondi_fine = this.fromStringToSeconds(stringa_fine);                                 
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
                    case "Fraziona Causale di Fermo":
                        var binded_inizio = this.row_binded.inizio;
                        stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
                        stringa_fine = sap.ui.getCore().byId("Fine").getValue();
                        var binded_fine = this.row_binded.fine;
                        var binded_causale = this.row_binded.causa;
                        selected_key = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        causale = this.takeCausaById(selected_key);
                        i = this.findIndex(this.guasti.guasti, this.row_binded);
                        //il terzo parametro mi serve per decidere sesettare o no il modello (così da poterlo settare solo alla fine e poter riusare le funzioni anche per azioni successive
                        this.removeGuasto(this.guasti, i, false);
                        this.addGuasto(this.guasti, binded_inizio, stringa_inizio, binded_causale, false);
                        this.addGuasto(this.guasti, stringa_inizio, stringa_fine, causale, false);
                        this.addGuasto(this.guasti, stringa_fine, binded_fine, binded_causale, true);
                        break;
                    case "Elimina Fermo":
                        i = this.findIndex(this.guasti.guasti, this.row_binded);
                        this.removeGuasto(this.guasti, i, true);
                        break;
                    case "Inserisci Fermo":
                        stringa_inizio = sap.ui.getCore().byId("Inizio").getValue();
                        stringa_fine = sap.ui.getCore().byId("Fine").getValue();
                        selected_key = sap.ui.getCore().byId("selectionMenu").getSelectedKey();
                        causale = this.takeCausaById(selected_key);
                        this.addGuasto(this.guasti, stringa_inizio, stringa_fine, causale, true);
                        break;
                }
                this.oDialog.destroy();
            },
            onClose: function(){
                var id_dialog = this.oDialog.getId();
                sap.ui.getCore().byId(id_dialog).destroy();
            },
    
//MODIFICA CAUSALE DIALOG
            creaFinestraModificaCausale: function(text){
                var oView = this.getView();
                this.oDialog = oView.byId("modificaGuasti");
                if (!this.oDialog) {
                   this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                   oView.addDependent(this.oDialog);
                }
                var oTitle = oView.byId("title");
                oTitle.setText(text);
//                this.oDialog.setTitle(text);
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
//MODIFICA TEMPI DIALOG
            creaFinestraModificaTempi: function(text){
                var oView = this.getView();
                this.oDialog = sap.ui.xmlfragment(oView.getId(), "myapp.view.modificaGuasti", this);
                oView.addDependent(this.oDialog);
                
//                var oButton = oView.byId("confermaModificheButton");
//                oButton.setEnabled(false);
                var oTitle = oView.byId("title");
                oTitle.setText(text);                
//                this.oDialog.setTitle(text);
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
                    id: "Fine"
//                    change: this.onCheckValidity.bind(this)
                });    
                oTextInizio = new sap.m.TimePicker({
                    value: this.row_binded.inizio,
                    id: "Inizio"
//                    change: this.onCheckValidity.bind(this)
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
                var oTitle = oView.byId("title");
                oTitle.setText(text);                
//              this.oDialog.setTitle(text);
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
//ELIMINAZIONE DIALOG 
            creaFinestraEliminazione: function(text){
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
                if (this.row_binded.causa === ""){
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
            creaFinestraInserimento: function(text){
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
                    change:this.onCheckValiditySimple.bind(this),
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
                    change:this.onCheckValiditySimple.bind(this),
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
            onCheckValiditySimple: function(){
                var oView = this.getView();
                var oButton = oView.byId("confermaModificheButton");                
                if (sap.ui.getCore().byId("Inizio").getValue()!=="" && sap.ui.getCore().byId("Fine").getValue()!==""){
                    var secondi_inizio = this.fromStringToSeconds(sap.ui.getCore().byId("Inizio").getValue());
                    var secondi_fine = this.fromStringToSeconds(sap.ui.getCore().byId("Fine").getValue());
                    var intervallo = secondi_fine-secondi_inizio;
                    if (intervallo>0){
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
            findIndex: function(array, obj){
                for (var i in array){
                    if (this.isObjectEquivalent(array[i], obj)){
                        return i; 
                    }
                }
                return -1;
            },
            removeGuasto: function(JSONObject, index, flag){
                var aProps = Object.getOwnPropertyNames(JSONObject);
                var array = JSONObject[aProps[1]];
                array.splice(index, 1);
                if  (flag){
                    var oModel = new JSONModel();
                    oModel.setData(JSONObject);
                    this.getView().setModel(oModel, "guasti");                    
                }
            },
            addGuasto: function(JSONObject, inizio, fine, causale, flag){
                var aProps = Object.getOwnPropertyNames(JSONObject);
                var array = JSONObject[aProps[1]];
                var secondi_intervallo = 1000*(this.fromStringToSeconds(fine)-this.fromStringToSeconds(inizio));
                if (secondi_intervallo !==0){
                var obj = {};
                obj.inizio = inizio;
                obj.fine = fine;
                obj.causa = causale;
                obj.intervallo = this.MillisecsToStandard(secondi_intervallo);
                array.push(obj);
                }
                if (flag){
                    var oModel = new JSONModel();
                    oModel.setData(JSONObject);
                    this.getView().setModel(oModel, "guasti");                      
                }
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
            takeIdByBindedCausa: function(causa){
                for (var i in this.menuJSON.cause) {
                    if (this.menuJSON.cause[i].fermo === causa){
                        return this.menuJSON.cause[i].id;
                    }
                }
                return -1;
            }

            
            
            
        
            

 


    });
});

