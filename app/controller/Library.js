sap.ui.define([], function () {
    return {
        minutesToStandard: function (val) {
            var hours = Math.floor(val / 60);
            val -= hours * 60;
            var mins = val;
            var string_hours, string_mins;
            string_hours = this.stringTime(hours);
            string_mins = this.stringTime(mins);
            return (string_hours + ":" + string_mins);
        },
        stringTime: function (val) {
            if (val < 10) {
                return  ('0' + String(val));
            } else {
                return  String(val);
            }
        },
        standardToMinutes: function (string) {
            return parseInt(string.split(":")[1], 10) + parseInt(string.split(":")[0], 10) * 60;
        },
        RemoveClosingButtons: function () {
            var tabContainer = this.getView().byId("TabContainer");
            var n_tabs = tabContainer.getAggregation("_tabStrip").getItems().length;
            var oTabStrip = tabContainer.getAggregation("_tabStrip");
            var oItems = oTabStrip.getItems();
            for (var i = 0; i < n_tabs; i++) {
                var oCloseButton = oItems[i].getAggregation("_closeButton");
                oCloseButton.setVisible(false);
            }
            tabContainer.getAggregation("_tabStrip").getAggregation("_select").setVisible(false);
        },
        AjaxCallerVoid: function (address, Func) {
            var req = jQuery.ajax({
                url: address,
                async: true
            });
            req.always(Func);
        },
        AjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "json",
                async: true,
                success: successFunc,
                error: errorFunc
            });
        },
        SyncAjaxCallerVoid: function (address, Func) {
            var req = jQuery.ajax({
                url: address,
                async: false
            });
            req.always(Func);
        },
        SyncAjaxCallerData: function (addressOfJSON, successFunc, errorFunc) {
            jQuery.ajax({
                url: addressOfJSON,
                method: "GET",
                dataType: "json",
                async: false,
                success: successFunc,
                error: errorFunc
            });
        }
    };
});