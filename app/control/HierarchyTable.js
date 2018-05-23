sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/table/TreeTable"],
        function (Control, TreeTable) {
            "use strict";

            return TreeTable.extend("myapp.control.HierarchyTable", {

                renderer: {},

                onAfterRendering: function () {
                    this.expandToLevel(3);
                    var that = this;
                    setTimeout (function(){
                        var num = that.getBinding("rows").getLength();
                    for (var i=0; i<num; i++){
                            var row = that.getBinding("rows").getContextByIndex(i).getObject();
                            var rowhtml = jQuery.sap.byId(that.getRows()[i].getId());
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
                                    rowhtml.addClass("righeOverOut");
                                    break;
                            }
                            for (var j=1; j<that.getColumns().length; j++){
                                var cellhtml = rowhtml.children()[j].children[0];
                                switch (row.hierarchy) {
                                    case 1:
                                        cellhtml.classList.add("Lv1");
                                        break;
                                    case 2:
                                        cellhtml.classList.add("Lv2");
                                        break;
                                    case 3:
                                        cellhtml.classList.add("Lv3");
                                        if ( j===5 || j===6 || j===7){
//                                            cellhtml.classList.add("handPointer");
                                            cellhtml.parentElement.classList.add("handPointer");
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            }
                        
                        }
                    }, 0);
//                        for (var i=0; i<num; i++){
//                            var row = that.getBinding("rows").getContextByIndex(i).getObject();
////                            if (row.hierarchy === 0) {}
////                                case 1:
////                                    row.addStyleClass("Background1");
////                                    break;
////                                default:
////                                    break;
//
//                        
//                        }
//                    }, 0);
                    if (sap.ui.table.TreeTable.prototype.onAfterRendering) {
                        sap.ui.table.TreeTable.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
                    }
                    }
                });
//                    var that = this;
//                    setTimeout(function () {
//                        var num = that.getBinding("rows").getLength();
//                        var temp;
//                        for (var i = num - 1; i >= 0; i--) {
//                            temp = that.getBinding("rows").getContextByIndex(i).getObject();
//                            if (typeof temp !== "undefined") {
//                                if (temp.expand === "0") {
//                                    that.collapse(i);
//                                }
//                            }
//                        }
//                    }, 0);
            });


