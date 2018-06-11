sap.ui.define([
    'sap/ui/model/json/JSONModel'
], function (JSONModel) {
    return {
        exp: null,
// FUNZIONI TEMPORALI 
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
        DateToStandard: function (date) {
            var hours = this.StringTime(date.getHours());
            var mins = this.StringTime(date.getMinutes());
            var secs = this.StringTime(date.getSeconds());
            return (hours + ":" + mins + ":" + secs);
        },
        minutesToStandard: function (val) {
            var hours = Math.floor(val / 60);
            val -= hours * 60;
            var mins = val;
            var string_hours, string_mins;
            string_hours = this.stringTime(hours);
            string_mins = this.stringTime(mins);
            return (string_hours + ":" + string_mins);
        },
        StringTime: function (val) {
            if (val < 10) {
                return  ('0' + String(val));
            } else {
                return  String(val);
            }
        },
        standardToMinutes: function (string) {
            return parseInt(string.split(":")[1], 10) + parseInt(string.split(":")[0], 10) * 60;
        },
        fromStandardToDate: function (data, ora) {
            var array_data = data.split("/");
            return array_data[2] + "-" + array_data[1] + "-" + array_data[0] + "T" + ora;
        },
// FUNZIONI PER LA SUDDIVISIONE DEI GUASTI IN CAUSALIZZATI E NON


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
        RemoveClosingButtons: function (tab_id) {
            var tabContainer = this.getView().byId(tab_id);
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
        },
//FUNZIONI RICORSIVE PER LA TREETABLE        
        RecursiveJSONComparison: function (std, bck, arrayName) {
            for (var key in std) {
                if (typeof std[key] === "object") {
                    bck[key] = this.RecursiveJSONComparison(std[key], bck[key], arrayName);
                } else {
                    if (key === "value") {
                        if (bck[key] !== std[key] && bck.expand !== 3) {
                            bck.expand = 2;
                        }
                    }
                }
            }
            return bck;
        },
        RecursiveParentExpansion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    this.exp = 0;
                    json[key] = this.RecursiveJSONExpansionFinder(json[key]);
                    if (typeof json[key].expand !== "undefined" && json[key].expand === 0) {
                        json[key].expand = this.exp;
                    }
                    json[key] = this.RecursiveParentExpansion(json[key]);
                }
            }
            return json;
        },
        RecursiveJSONExpansionFinder: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONExpansionFinder(json[key]);
                } else {
                    if (key === "expand") {
                        if (json[key] > 0) {
                            this.exp = 1;
                        }
                    }
                }
            }
            return json;
        },

//CREAZIONE DEI FILE XML PER LA PARTE DI BACKEND
        createXMLFermo: function (obj) {
            var top = '<?xml version="1.0" encoding="UTF-8"?><root>';
            var bottom = '</root>';
            var parameters = '<caso>' + obj.caso + '</caso>' +
                    '<logId>' + obj.logId + '</logId>' +
                    '<batchId>' + obj.batchId + '</batchId>' +
                    '<dataFine>' + obj.dataFine + '</dataFine>' +
                    '<dataInizio>' + obj.dataInizio + '</dataInizio>';
            return top + parameters + bottom;
        }
    };
});
