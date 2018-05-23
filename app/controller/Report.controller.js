sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/json/JSONModel'
], function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("myapp.controller.Report", {
            minValues: [],
            piano: null,
            pianoPath: null,
            onInit: function(){
                var oModel = new JSONModel();
                var that = this;
                $.ajax({
                   type: "GET",
                   url: "model/OEE.json",
                   dataType: "json",
                   success: function(oData){
                       oModel.setData(oData);
                       that.RecursivePropertyAdder(oModel.getData().ReportOEE.Confezionamenti[0], "hierarchy", 0);
                       setTimeout(that.setWorstValues(oModel.getData().ReportOEE.Confezionamenti[0], "OEE"), 0);
                       setTimeout(that.setWorstValues(oModel.getData().ReportOEE.Confezionamenti[0], "disponibilitàOEE"), 0);
                       setTimeout(that.setWorstValues(oModel.getData().ReportOEE.Confezionamenti[0], "produttivitàOEE"), 0);
                       setTimeout(that.setWorstValues(oModel.getData().ReportOEE.Confezionamenti[0], "qualitàOEE"), 0);
                       setTimeout(that.setHighestValues(oModel.getData().ReportOEE.Confezionamenti[0], "dispFermate"), 0);
                       setTimeout(that.setHighestValues(oModel.getData().ReportOEE.Confezionamenti[0], "dispSetup"), 0);
                       setTimeout(that.setHighestValues(oModel.getData().ReportOEE.Confezionamenti[0], "prodCadRidotta"), 0);
                       setTimeout(that.setHighestValues(oModel.getData().ReportOEE.Confezionamenti[0], "prodMFermate"), 0);
                       setTimeout(that.setHighestValues(oModel.getData().ReportOEE.Confezionamenti[0], "qualitàScarti"), 0);
                       setTimeout(that.setHighestValues(oModel.getData().ReportOEE.Confezionamenti[0], "qualitàRilavor"), 0);
                     }
                });
                
                this.getView().setModel(oModel, "ReportOEE");
                this.getView().byId("ComponentiOEE").setHeaderSpan([3,1,1]);
                this.getView().byId("ComponentiPerdita").setHeaderSpan([9,3,1]);
                this.getView().byId("ComponentiProduttivita").setHeaderSpan([9,3,1]);
                this.getView().byId("ComponentiQualita").setHeaderSpan([9,3,1]); 
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.getRoute("Report").attachPatternMatched(this._onObjectMatched, this);
            },
            _onObjectMatched: function(oEvent){
                this.pianoPath = oEvent.getParameter("arguments").pianoPath;
                var num_confez = parseInt(oEvent.getParameter("arguments").pianoPath, 10);
                var oModelTurni = this.getOwnerComponent().getModel("turni");
                var oTitle = this.getView().byId("ReportTitle");
                var that = this;
                if (!oModelTurni){
                    $.ajax({
                        type: "GET",
                        url: "model/pianidiconf.json",
                        dataType: "json",
                        success: function(oData){
                            that.piano = oData.pianidiconfezionamento[num_confez];
                            oTitle.setText(that.piano.data + "    ---    " + that.piano.turno);
                            oTitle.addStyleClass("customTextTitle");
                        }
                    });
                } else {
                    this.piano = oModelTurni.getData().pianidiconfezionamento[num_confez];
                    oTitle.setText(this.piano.data + "    ---    " + this.piano.turno);
                    oTitle.addStyleClass("customTextTitle");
                }
                
            
            },
            RecursivePropertyAdder: function(bck, prop_name, i){
            for (var key in bck) {
                if (typeof bck[key] === "object") {
                    if (typeof bck.length === "undefined"){
                            bck[key] = this.RecursivePropertyAdder(bck[key], prop_name, i+1);
                    } else {
                            bck[key] = this.RecursivePropertyAdder(bck[key], prop_name, i);
                    }
                } 
            }
            if (typeof bck.length === "undefined"){
                bck[prop_name] = i;
            }
            return bck;
                
            },
            
//ricambio i colori delle righe quando faccio il collapse o espando la treetable   (richiama la funziona impostata all'inizio nella mia custom table)         
            onToggleOpenState: function(){
                    var oTable = this.getView().byId("TreeTableReport");
                    var num = oTable.getRows().length;
                    for (var i=0; i<num; i++){
                            var rowhtml = jQuery.sap.byId(oTable.getRows()[i].getId())[0];
                            if (rowhtml.classList.contains("Background0")){
                                rowhtml.classList.remove("Background0");
                            }
                            if (rowhtml.classList.contains("Background1")){
                                rowhtml.classList.remove("Background1");
                            }
                            if (rowhtml.classList.contains("Background2")){
                                rowhtml.classList.remove("Background2");
                            }                      
                    }
                    setTimeout (function(){
                    num = oTable.getBinding("rows").getLength();
                    for (var i=0; i<num; i++){
                            var row = oTable.getBinding("rows").getContextByIndex(i).getObject();
                            var rowhtml = jQuery.sap.byId(oTable.getRows()[i].getId());
                            switch (row.hierarchy) {
                                case 0:
                                    rowhtml.addClass("Background0");
                                    break;
                                case 1:
                                    rowhtml.addClass("Background1");
                                    break;
                                case 2:
                                    rowhtml.addClass("Background2");
                                    break;                                    
                                default:
                                    break;
                            }
                        
                        }
                    }, 0);                
            },
//RICERCO I 3 VALORI PIU' BASSI (O PIU' ALTI) DI OGNI COLONNA E SETTO LA PROPRIETA' RED CHE MI SERVE PER QUANDO RICHIAMO IL CONTROLLO CUSTOM TEXTHIERARCHYTABLE
            setWorstValues: function(bck, property){
                this.minValues = [];
                this.takeAllElements(bck, property);
                this.minValues.sort(function(a, b){return a-b;});
                this.setJSONWorstValues(bck, property, this.minValues[0], this.minValues[1], this.minValues[2]);
                return;
            },
            setHighestValues: function(bck, property){
                this.minValues = [];
                this.takeAllElements(bck, property);
                this.minValues.sort(function(a, b){return b-a;});
                this.setJSONWorstValues(bck, property, this.minValues[0], this.minValues[1], this.minValues[2]);
                return;
            },            
            takeAllElements: function(bck, property){
                var numero;
                for (var key in bck){
                    if (typeof bck[key] === "object"){
                        bck[key] = this.takeAllElements(bck[key], property);
                    }
                }
                if (bck.hierarchy === 3){
                     if (bck[property].endsWith("%")) {
                        numero = parseInt(bck[property].slice(0 , 2), 10);
                     } else {
                        numero = parseInt(bck[property], 10);
                     }
                     this.minValues.push(numero);
                }
                return bck;
            },
            
            setJSONWorstValues: function(bck, property, a, b, c){
                var numero;
                for (var key in bck){
                    if (typeof bck[key] === "object"){
                        bck[key] = this.setJSONWorstValues(bck[key], property, a, b, c);
                    }
                }
                if (!bck.length){
                    if (!bck.red){
                        bck.red = {};
                    }
                    bck.red[property] = false; 
                }
                if (bck.hierarchy === 3){
                     if (bck[property].endsWith("%")) {
                        numero = parseInt(bck[property].slice(0 , 2), 10);
                     } else {
                        numero = parseInt(bck[property], 10);
                     }
                     if (numero === a || numero === b || numero === c){
                        bck.red[property] = true; 
                     }
                }                
                return bck;
            },
//DEFINISCO L'EVENTO PER QUANDO CLICCO SU DETERMINATE CELLE (QUELLE DELLE COLONNE DEL GRUPPO DISPONIBILITA')

            LinkClick: function (event) {
                var clicked_row = event.getParameters().rowBindingContext.getObject();
                var index_column = parseInt(event.getParameters().columnIndex, 10);
                var index_row = parseInt(event.getParameters().rowIndex, 10);
                var row_html;
                if (clicked_row.hierarchy === 3 && (index_column === 5 || index_column === 6 || index_column === 7)) {
                    for (var i=index_row-1; i>=0; i--){
                        row_html = event.getSource().getRows()[i]; 
                        if (row_html._bHasChildren){
                            break;
                        }
                    }
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("guastidilinea",
                                  {
                                    pianoPath: this.pianoPath,
                                    guastiPath: row_html.getCells()[0].getText() 
                                  });
                }                
            },
            
            onBackNav: function(){
                var that = this;
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("managePianoGrey", {pianoPath: that.pianoPath});
            }
        
            

 


    });
});


