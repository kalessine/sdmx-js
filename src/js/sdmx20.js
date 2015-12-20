define("sdmx20", ["require", "exports", "sax", "message", "sdmx", "parseXml"], function (require, exports, sax, message, sdmx, parseXml) {
    var Sdmx20StructureParser = (function () {
        function Sdmx20StructureParser() {
        }
        Sdmx20StructureParser.prototype.getVersionIdentifier = function () {
            return 2.1;
        };
        Sdmx20StructureParser.prototype.canParse = function (input) {
            if (input == null)
                return false;
            if (this.isStructure(input))
                return true;
            if (this.isData(input))
                return true;
        };
        Sdmx20StructureParser.prototype.isStructure = function (input) {
            if (input.indexOf("Structure") != -1 && input.indexOf("http://www.SDMX.org/resources/SDMXML/schemas/v2_0/message") != -1) {
                return true;
            }
            else
                return false;
        };
        Sdmx20StructureParser.prototype.isData = function (header) {
            return false;
        };
        Sdmx20StructureParser.prototype.isMetadata = function (header) {
            return false;
        };
        Sdmx20StructureParser.prototype.parseStructure = function (input) {
            var srt = new Sdmx20StructureReaderTools(input);
            return srt.getStructureType();
        };
        Sdmx20StructureParser.prototype.parseData = function (input) {
            var opts = {};
            var parser = sax.parser(/*strict=*/ true, /*SaxOptions*/ opts);
            parser.onerror = function (e) {
                // an error happened.
            };
            parser.ontext = function (t) {
                // got some text.  t is the string of text.
            };
            parser.onopentag = function (node) {
                // opened a tag.  node has "name" and "attributes"
                console.log("open:" + node);
            };
            parser.onclosetag = function (e) {
                console.log("close:" + e);
            };
            parser.onattribute = function (attr) {
                // an attribute.  attr has "name" and "value"
            };
            parser.onend = function () {
                // parser stream is done, and ready to have more stuff written to it.
            };
            parser.write(input).close();
            return null;
        };
        return Sdmx20StructureParser;
    })();
    exports.Sdmx20StructureParser = Sdmx20StructureParser;
    var Sdmx20StructureReaderTools = (function () {
        function Sdmx20StructureReaderTools(s) {
            this.struct = null;
            var dom = parseXml.parseXml(s);
            this.struct = this.toStructureType(dom.documentElement);
        }
        Sdmx20StructureReaderTools.prototype.toStructureType = function (structure) {
            this.struct = new message.StructureType();
            var childNodes = structure.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                alert(childNodes[i].nodeName);
            }
            this.toHeader(this.findNodeName("Header", childNodes));
            this.toCodelists(this.findNodeName("Codelists", childNodes));
            this.toConcepts(this.findNodeName("Concepts", childNodes));
            this.toKeyFamilies(this.findNodeName("KeyFamilies", childNodes));
            return this.struct;
        };
        Sdmx20StructureReaderTools.prototype.toHeader = function (headerNode) {
            return null;
        };
        Sdmx20StructureReaderTools.prototype.toCodelists = function (codelistsNode) {
            return null;
        };
        Sdmx20StructureReaderTools.prototype.toConcepts = function (conceptsNode) {
            return null;
        };
        Sdmx20StructureReaderTools.prototype.toKeyFamilies = function (keyFamiliesNode) {
            return null;
        };
        Sdmx20StructureReaderTools.prototype.getStructureType = function () {
            return this.struct;
        };
        Sdmx20StructureReaderTools.prototype.myLoop = function (x) {
            var i, y, xLen, txt;
            txt = "";
            x = x.childNodes;
            xLen = x.length;
            for (i = 0; i < xLen; i++) {
                y = x[i];
                if (y.nodeType != 3) {
                    if (y.childNodes[0] != undefined) {
                        txt += this.myLoop(y);
                    }
                }
                else {
                    txt += y.nodeValue + "<br>";
                }
            }
            return txt;
        };
        Sdmx20StructureReaderTools.prototype.findNodeName = function (s, childNodes) {
            for (var i = 0; i < childNodes.length; i++) {
                var nn = childNodes[i].nodeName;
                if (nn.indexOf(s) != -1)
                    return childNodes[i];
            }
            return null;
        };
        return Sdmx20StructureReaderTools;
    })();
    exports.Sdmx20StructureReaderTools = Sdmx20StructureReaderTools;
    sdmx.SdmxIO.registerParserProvider(new Sdmx20StructureParser());
});

//# sourceMappingURL=sdmx20.js.map
