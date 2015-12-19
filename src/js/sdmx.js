define("sdmx", ["require", "exports"], function (require, exports) {
    var SdmxIO = (function () {
        function SdmxIO() {
        }
        SdmxIO.getLocale = function () {
            return SdmxIO.LOCALE;
        };
        SdmxIO.isSanitiseNames = function () {
            return SdmxIO.SANITISE_NAMES;
        };
        SdmxIO.parseStructure = function (s) {
            alert(SdmxIO.PARSER.length);
            for (var i = 0; i < SdmxIO.PARSER.length; i++) {
                if (SdmxIO.PARSER[i].canParse(s)) {
                    return SdmxIO.PARSER[i].parseStructure(s);
                }
                else {
                    alert("not my type");
                }
            }
            return null;
        };
        SdmxIO.registerParserProvider = function (p) {
            alert('register');
            SdmxIO.PARSER.push(p);
        };
        SdmxIO.LOCALE = "en";
        SdmxIO.SANITISE_NAMES = false;
        SdmxIO.PARSER = [];
        return SdmxIO;
    })();
    exports.SdmxIO = SdmxIO;
});

//# sourceMappingURL=sdmx.js.map
