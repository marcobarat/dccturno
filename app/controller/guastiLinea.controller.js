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
                        oModel.setData(that.guasti);
                        that.guasti = that.addTimeGaps(that.guasti);
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
                if (oText === "Modifica Causale Fermo"){
                    this.creaFinestraModificaCausale(oText);
                }
            },
            
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
            onConfermaCambio: function(oEvent){
                var oText = oEvent.getSource().getParent().getTitle();
                var selected_key = oEvent.getSource().getParent().getContent()[0].getItems()[2].getItems()[1].getItems()[0].getSelectedKey();
                if (oText === "Modifica Causale Fermo") {
                    for (var i in this.guasti.guasti) {
                        if (this.guasti.guasti[i] === this.binded_row) {
                            var causa = this.takeCausaById(selected_key);
                            this.guasti.guasti[i].causa = causa;
                            this.getView().setModel(this.guasti, "guasti");
                            break;
                        }
                    }
                }
                this.oDialog.destroy();
            },
            takeCausaByid: function(selected_key){
                var causa = "";
                for (var i in this.menuJSON.cause) {
                    if (this.menuJSON.cause[i].id === parseInt(selected_key, 10)){
                        causa = this.menuJSON.cause[i].fermo;
                        break;
                    }
                }
                return causa;
            }
            
            
            
            
        
            

 


    });
});

