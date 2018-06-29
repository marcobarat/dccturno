sap.ui.define([
    'sap/ui/model/json/JSONModel'
], function (JSONModel) {
    return {
        exp: null,
// FUNZIONI TEMPORALI 
        roundTo: function (value, decimalpositions) {
            var i = value * Math.pow(10, decimalpositions);
            i = Math.round(i);
            return i / Math.pow(10, decimalpositions);
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
            string_hours = this.StringTime(hours);
            string_mins = this.StringTime(mins);
            return (string_hours + ":" + string_mins);
        },
        StringTime: function (val) {
            if (val < 10) {
                return  ('0' + String(val));
            } else {
                return  String(val);
            }
        },
        InvertStringTime: function (time) {
            var array = time.split("-");
            return array[2] + "/" + array[1] + "/" + array[0];
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
            for (var iter in data.fermi) {
                start = new Date(data.fermi[iter].inizio);
                end = new Date(data.fermi[iter].fine);
                millisec_diff.push(end - start);
                data.fermi[iter].inizio = this.DateToStandard(start);
                data.fermi[iter].fine = this.DateToStandard(end);
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
                data.fermi[i].intervallo = arrayGaps[i];
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
        RecursiveJSONTimeConversion: function (json) {
            for (var key in json) {
                if (typeof json[key] === "object") {
                    json[key] = this.RecursiveJSONTimeConversion(json[key]);
                } else {
                    if (key === "data") {
                        json[key] = this.InvertStringTime(json[key]);
                    }
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
            var top = '<root>';
            var bottom = '</root>';
            var parameters = '<caso>' + obj.caso + '</caso>' +
                    '<logId>' + obj.logId + '</logId>' +
                    '<batchId>' + obj.batchId + '</batchId>' +
                    '<dataFine>' + obj.dataFine + '</dataFine>' +
                    '<dataInizio>' + obj.dataInizio + '</dataInizio>' +
                    '<causaleId>' + obj.causaleId + '</causaleId>';
            return top + parameters + bottom;
        },
        createXMLBatch: function (obj) {
            var top = '<root>';
            var bottom = '</root>';
            var parameters = '<pianoDiConfezionamentoId>' + obj.pianodiconfezionamento + '</pianoDiConfezionamentoId>' +
                    '<lineaId>' + obj.lineaId + '</lineaId>';
            if (obj.batchId) {
                parameters += '<batchId>' + obj.batchId + '</batchId>';
            } else {
                parameters += '<batchId/>';
            }
//            parameters += '<SKUCodiceInterno>' + obj.SKUCodiceInterno + '</SKUCodiceInterno>';
            parameters += '<SKUCodiceInterno></SKUCodiceInterno>';
            parameters += '<formatoProduttivo>' + obj.formatoProduttivo + '</formatoProduttivo>' +
                    '<grammatura>' + obj.grammatura + '</grammatura>' +
                    '<sequenza>' + obj.sequenza + '</sequenza>' +
                    '<tipologia>' + obj.tipologia + '</tipologia>' +
                    '<destinazione>' + obj.destinazione + '</destinazione>' +
                    '<qliTeo>' + obj.quintali + '</qliTeo>' +
                    '<cartoniTeo>' + obj.cartoni + '</cartoniTeo>' +
                    '<oreTeo>' + obj.ore + '</oreTeo>';
            parameters = parameters.replace('+', '%2B');
            return top + parameters + bottom;
        },
        createXMLDestinazione: function (obj) {
            var top = '<root><pianoDiConfezionamentoId/>';
            var bottom = '<sequenza/> <qliTeo/><cartoniTeo/><oreTeo/></root>';
            var parameters = '<lineaId>' + obj.lineaID + '</lineaId>';
//            parameters += '<SKUCodiceInterno>' + obj.SKUCodiceInterno + '</SKUCodiceInterno>';
            parameters += '<SKUCodiceInterno></SKUCodiceInterno>';
            parameters += '<formatoProduttivo>' + obj.formatoProduttivo + '</formatoProduttivo>' +
                    '<grammatura>' + obj.grammatura + '</grammatura>' +
                    '<tipologia>' + obj.tipologia + '</tipologia>';
            return top + parameters + bottom;
        }

    };
});
