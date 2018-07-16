sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/table/TreeTable"],
        function (Control, TreeTable) {
            "use strict";
            return TreeTable.extend("myapp.control.HierarchyTable", {

                renderer: {},
                onAfterRendering: function () {
                    // CSS DELL'HEADER DELLA TREETABLE
//                    var col_html;
//                    var col_array = this.getColumns();
//                    col_html = jQuery.sap.byId(col_array[2].getId());
//                    col_html.addClass("noBorderRight");
//                    
                    if (jQuery.sap.byId(this.getRows()[0].getId())[0] !== undefined) {
                        var cell_html;
                        var numero = this.getRows().length;
                        for (var k = 0; k < numero; k++) {
                            var row_html = jQuery.sap.byId(this.getRows()[k].getId())[0];
                            if (row_html.classList.contains("Background0")) {
                                row_html.classList.remove("Background0");
                            }
                            if (row_html.classList.contains("Background1")) {
                                row_html.classList.remove("Background1");
                            }
                            if (row_html.classList.contains("Background2")) {
                                row_html.classList.remove("Background2");
                            }
                            if (row_html.classList.contains("righeOverOut")) {
                                row_html.classList.remove("righeOverOut");
                            }

                            for (var j = 1; j < this.getColumns().length; j++) {
                                row_html = jQuery.sap.byId(this.getRows()[k].getId());
                                cell_html = row_html.children()[j].children[0];
                                if (cell_html.classList.contains("Lv1")) {
                                    cell_html.classList.remove("Lv1");
                                }
                                if (cell_html.classList.contains("Lv2")) {
                                    cell_html.classList.remove("Lv2");
                                }
                                if (cell_html.classList.contains("Lv3")) {
                                    cell_html.classList.remove("Lv3");
                                }

                                if (j === 5 || j === 6 || j === 7) {
                                    cell_html.parentElement.classList.remove("handPointer");
                                }
                            }
                        }
                    }


                    this.expandToLevel(3);
                    var that = this;
                    setTimeout(function () {
                        var row, rowhtml, cellhtml;
                        var i, j;
                        var num = that.getBinding("rows").getLength();
                        for (i = 0; i < num; i++) {
                            row = that.getBinding("rows").getContextByIndex(i).getObject();
                            rowhtml = jQuery.sap.byId(that.getRows()[i].getId());
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
                            for (j = 1; j < that.getColumns().length; j++) {
                                cellhtml = rowhtml.children()[j].children[0];
                                switch (row.hierarchy) {
                                    case 1:
                                        cellhtml.classList.add("Lv1");
                                        break;
                                    case 2:
                                        cellhtml.classList.add("Lv2");
                                        break;
                                    case 3:
                                        cellhtml.classList.add("Lv3");
                                        if (j === 5 || j === 6 || j === 7) {
                                            cellhtml.parentElement.classList.add("handPointer");
                                        }
                                        break;
                                    default:
                                        break;
                                }
                                if (j === 2 || j === 3 || j === 5 || j === 6 || j === 8 || j === 9 || j === 11 || j === 12 || j === 13) {
                                    rowhtml.children()[j].classList.add("mysapUiTableCol");
                                }
                            }

                        }

                        for (i = num; i < that.getVisibleRowCount(); i++) {
                            rowhtml = jQuery.sap.byId(that.getRows()[i].getId());
                            rowhtml.addClass("righeOverOut");
                            for (j = 0; j < that.getColumns().length; j++) {
                                rowhtml.children()[j].classList.add("mysapUiTableCol");
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


