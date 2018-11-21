sap.ui.define([
    "sap/ui/core/Control",
    "sap/m/Label",
    "sap/ui/table/Table"],
        function (Control, Label, Table) {
            "use strict";

            return Table.extend("myapp.control.CustomTableAlarms", {

                renderer: {},

                onAfterRendering: function () {
                    var classes = ["isAlarm", "isWarning"];
                    for (var i = 0;i < this.getRows().length; i++) {
                        
                    }
                    if (sap.ui.table.Table.prototype.onAfterRendering) {
                        sap.ui.table.Table.prototype.onAfterRendering.apply(this, arguments); //run the super class's method first
                    }
                }
            });
        });