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
                            if (row.hierarchy === 0) {
                                
                                for (var j=0; j<that.getColumns().length; j++) {
                                    that.getRows()[i].getCells()[j].addStyleClass("Background0");
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


